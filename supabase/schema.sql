create extension if not exists pgcrypto;

create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  batch_code text not null unique,
  batch_name text not null,
  start_date date not null,
  cutoff_date date not null,
  expected_arrival_date date not null,
  status text not null check (status in ('Draft', 'Active', 'Closed', 'Completed')),
  created_at timestamptz not null default now()
);

create unique index if not exists one_active_batch on public.batches ((status)) where status = 'Active';

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null check (category in ('Pakistani Mango', 'Indian Mango', 'Fruit', 'Other')),
  selling_price numeric(10,2) not null check (selling_price >= 0),
  cost_price numeric(10,2) not null check (cost_price >= 0),
  profit_per_unit numeric(10,2) generated always as (selling_price - cost_price) stored,
  image_url text,
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id),
  order_sequence integer not null,
  order_number text not null unique,
  customer_name text not null,
  phone text not null,
  notes text,
  subtotal_amount numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  total_cost numeric(10,2) not null default 0,
  total_profit numeric(10,2) not null default 0,
  payment_status text not null check (payment_status in ('Awaiting Payment', 'Payment Claimed by Customer', 'Payment Verified', 'Payment Issue', 'Refunded')),
  order_status text not null check (order_status in ('Submitted', 'Confirmed', 'Ready for Pickup', 'Completed', 'Cancelled')),
  payment_reference_notes text,
  admin_notes text,
  created_at timestamptz not null default now(),
  unique (batch_id, order_sequence)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  quantity integer not null check (quantity > 0),
  unit_selling_price_snapshot numeric(10,2) not null,
  unit_cost_price_snapshot numeric(10,2) not null,
  line_total numeric(10,2) not null,
  line_cost numeric(10,2) not null,
  line_profit numeric(10,2) not null
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('owner', 'admin', 'staff')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  report_type text not null,
  filters jsonb not null default '{}'::jsonb,
  generated_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid() and active = true
  );
$$;

create or replace function public.admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.admin_users
  where user_id = auth.uid() and active = true
  limit 1;
$$;

create or replace function public.create_public_preorder(
  customer_name_input text,
  phone_input text,
  notes_input text,
  items_input jsonb
)
returns table(order_id uuid, order_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  active_batch public.batches%rowtype;
  next_sequence integer;
  new_order_id uuid;
  new_order_number text;
  subtotal numeric(10,2);
  total_cost_value numeric(10,2);
  item_count integer;
  matched_count integer;
begin
  select * into active_batch
  from public.batches
  where status = 'Active'
  limit 1;

  if active_batch.id is null then
    raise exception 'Preorders are currently closed. Please check back later.';
  end if;

  select count(*) into item_count from jsonb_to_recordset(items_input) as x(product_id uuid, quantity integer);
  if item_count = 0 then
    raise exception 'Cart is empty.';
  end if;

  create temporary table preorder_lines on commit drop as
  select
    p.id as product_id,
    p.name,
    p.selling_price,
    p.cost_price,
    x.quantity::integer as quantity
  from jsonb_to_recordset(items_input) as x(product_id uuid, quantity integer)
  join public.products p on p.id = x.product_id
  where p.active = true and x.quantity::integer > 0;

  select count(*) into matched_count from preorder_lines;
  if matched_count <> item_count then
    raise exception 'One or more preorder items are unavailable.';
  end if;

  select
    coalesce(sum(selling_price * quantity), 0),
    coalesce(sum(cost_price * quantity), 0)
  into subtotal, total_cost_value
  from preorder_lines;

  perform pg_advisory_xact_lock(hashtext(active_batch.id::text));
  select coalesce(max(order_sequence), 0) + 1
  into next_sequence
  from public.orders
  where batch_id = active_batch.id;

  new_order_number := active_batch.batch_code || '-' || lpad(next_sequence::text, 3, '0');

  insert into public.orders (
    batch_id,
    order_sequence,
    order_number,
    customer_name,
    phone,
    notes,
    subtotal_amount,
    total_amount,
    total_cost,
    total_profit,
    payment_status,
    order_status
  )
  values (
    active_batch.id,
    next_sequence,
    new_order_number,
    left(regexp_replace(customer_name_input, '[<>]', '', 'g'), 120),
    left(regexp_replace(phone_input, '[<>]', '', 'g'), 30),
    nullif(left(regexp_replace(coalesce(notes_input, ''), '[<>]', '', 'g'), 500), ''),
    subtotal,
    subtotal,
    total_cost_value,
    subtotal - total_cost_value,
    'Payment Claimed by Customer',
    'Submitted'
  )
  returning id into new_order_id;

  insert into public.order_items (
    order_id,
    product_id,
    product_name_snapshot,
    quantity,
    unit_selling_price_snapshot,
    unit_cost_price_snapshot,
    line_total,
    line_cost,
    line_profit
  )
  select
    new_order_id,
    product_id,
    name,
    quantity,
    selling_price,
    cost_price,
    selling_price * quantity,
    cost_price * quantity,
    (selling_price - cost_price) * quantity
  from preorder_lines;

  return query select new_order_id, new_order_number;
end;
$$;

alter table public.batches enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.admin_users enable row level security;
alter table public.reports enable row level security;

drop policy if exists "Public reads active batches" on public.batches;
create policy "Public reads active batches" on public.batches for select using (status = 'Active' or public.is_admin());

drop policy if exists "Admins manage batches" on public.batches;
create policy "Admins manage batches" on public.batches for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads active products" on public.products;
create policy "Public reads active products" on public.products for select using (active = true or public.is_admin());

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage order items" on public.order_items;
create policy "Admins manage order items" on public.order_items for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins view admin users" on public.admin_users;
create policy "Admins view admin users" on public.admin_users for select using (public.is_admin());

drop policy if exists "Owners manage admin users" on public.admin_users;
create policy "Owners manage admin users" on public.admin_users for all using (public.admin_role() = 'owner') with check (public.admin_role() = 'owner');

drop policy if exists "Admins manage reports" on public.reports;
create policy "Admins manage reports" on public.reports for all using (public.is_admin()) with check (public.is_admin());

grant execute on function public.create_public_preorder(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_role() to authenticated;
