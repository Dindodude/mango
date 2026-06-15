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
  success_token text,
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

alter table public.orders add column if not exists success_token text;
create unique index if not exists orders_success_token_key on public.orders (success_token) where success_token is not null;

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

create table if not exists public.admin_login_attempts (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null,
  success boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists admin_login_attempts_key_created_idx
  on public.admin_login_attempts (key_hash, created_at desc);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_idx
  on public.admin_audit_logs (created_at desc);

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

drop function if exists public.create_public_preorder(text, text, text, jsonb);

alter table public.batches enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.admin_users enable row level security;
alter table public.reports enable row level security;
alter table public.admin_login_attempts enable row level security;
alter table public.admin_audit_logs enable row level security;

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

drop policy if exists "Admins manage login attempts" on public.admin_login_attempts;
create policy "Admins manage login attempts" on public.admin_login_attempts for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins view audit logs" on public.admin_audit_logs;
create policy "Admins view audit logs" on public.admin_audit_logs for select using (public.is_admin());

drop policy if exists "Owners manage audit logs" on public.admin_audit_logs;
create policy "Owners manage audit logs" on public.admin_audit_logs for all using (public.admin_role() = 'owner') with check (public.admin_role() = 'owner');

grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_role() to authenticated;
