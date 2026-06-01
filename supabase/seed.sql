insert into public.batches (batch_code, batch_name, start_date, cutoff_date, expected_arrival_date, status)
values ('JUN-W1-2026', 'June Week 1 Preorder', '2026-06-01', '2026-06-07', '2026-06-12', 'Active')
on conflict (batch_code) do nothing;

insert into public.products (name, description, category, selling_price, cost_price, image_url, active, display_order)
values
  ('Sindhri Mango Box', 'Sweet Pakistani mango box.', 'Pakistani Mango', 45.00, 32.00, 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=900&q=85', true, 1),
  ('Anwar Ratol Mango Box', 'Fragrant premium mango box.', 'Pakistani Mango', 55.00, 39.00, 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=900&q=85', true, 2),
  ('Alphonso Mango Box', 'Indian mango box for preorder.', 'Indian Mango', 60.00, 44.00, 'https://images.unsplash.com/photo-1519096845289-95806ee03a1a?auto=format&fit=crop&w=900&q=85', true, 3),
  ('Jamun 1 kg', 'Seasonal fruit preorder.', 'Fruit', 18.00, 11.00, null, true, 4)
on conflict do nothing;

-- After creating a user in Supabase Auth, approve them as an admin:
-- insert into public.admin_users (user_id, email, role, active)
-- values ('AUTH_USER_UUID_HERE', 'owner@example.com', 'owner', true);
