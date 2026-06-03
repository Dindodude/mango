# Mango Preorder Management System

Full-stack Next.js preorder system for seasonal mango batches. Customers do not need accounts. Admins use a server-only email/password stored in environment variables.

## Features

- Public landing, preorder, cart, checkout, and success pages
- E-transfer confirmation flow with simple customer language
- Supabase-backed orders, order items, batches, products, admin users, reports
- Database RPC for checkout so totals, costs, profits, and order numbers are generated server-side
- Per-batch order numbers like `JUN-W1-2026-001`
- Admin dashboard, product management, batch management, order management, detail view, reports, CSV exports
- Direct admin login using secure HTTP-only session cookies
- RLS enabled on every table
- No inventory tracking, no stock limits, no stock deductions

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=choose-a-secure-password
ADMIN_SESSION_SECRET=use-a-long-random-secret
ADMIN_ROLE=owner
```

3. In Supabase SQL Editor, run:

```text
supabase/schema.sql
supabase/seed.sql
```

4. Admin login is controlled by `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, and `ADMIN_ROLE`. You do not need Supabase Auth for admin login in this version.

5. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase Notes

- RLS is enabled for `batches`, `products`, `orders`, `order_items`, `admin_users`, and `reports`.
- Public users can read active batch/product information.
- Public checkout uses `create_public_preorder(...)`, a security-definer database function.
- Public users cannot read orders, cost, profit, admin notes, or dashboard data.
- Admin pages require the direct admin session cookie. Admin database reads/writes use the Supabase service role key on the server only.
- Only one batch can be active because of a partial unique index.

## Deployment to Vercel

1. Push this project to GitHub.
2. Import the repository in Vercel.
3. Add the same environment variables from `.env.example`.
4. Deploy.
5. Open `/admin/login` and sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Customer Flow

1. Customer selects items and quantities.
2. Customer reviews cart.
3. Customer sends e-transfer to `idreesrah0@gmail.com`.
4. Customer confirms payment and submits preorder.
5. Order is saved with payment status `Payment Claimed by Customer`.
6. Admin verifies payment and updates order status.
