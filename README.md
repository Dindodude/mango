# Mango Preorder Management System

Full-stack Next.js preorder system for seasonal mango batches. Customers do not need accounts. Admins use a server-only email/password stored in environment variables.

## Features

- Public landing, preorder, cart, checkout, and success pages
- E-transfer confirmation flow with simple customer language
- Supabase-backed orders, order items, batches, products, admin users, reports
- Server-side checkout so totals, costs, profits, and order numbers are generated safely before saving to Supabase
- Automatic customer emails for order received and payment verified confirmations using Resend
- Per-batch order numbers like `JUN-W1-2026-001`
- Admin dashboard, product management, batch management, order management, supplier summaries, pickup lists, reports, CSV exports
- Direct admin login using secure HTTP-only session cookies and a hashed password
- Security headers, admin rate limiting, and admin audit logs
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
ADMIN_PASSWORD_HASH=pbkdf2_sha256$310000$replace-with-salt$replace-with-hash
ADMIN_SESSION_SECRET=use-a-long-random-secret
ADMIN_ROLE=owner
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=Mango Preorders <orders@yourdomain.com>
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
```

Use the base Supabase project URL only, for example `https://abcxyz.supabase.co`. Do not paste a REST endpoint like `/rest/v1`.

Generate `ADMIN_PASSWORD_HASH` locally:

```bash
npm run hash-admin-password
```

Paste only the generated hash into Vercel or `.env.local`. Do not commit real `.env` files, passwords, service role keys, or Supabase secrets to GitHub.

For email, create a Resend API key and add it as `RESEND_API_KEY`. Set `EMAIL_FROM` to a verified sender/domain in Resend. If Resend is not configured, orders still save, but email errors are recorded for admin review.

Customer accounts use Supabase Auth email/password. In Supabase Auth settings, keep email confirmation enabled and add your deployed domain to the allowed redirect URLs. Include:

```
https://your-vercel-domain.vercel.app/auth/callback
```

3. In Supabase SQL Editor, run:

```text
supabase/schema.sql
supabase/seed.sql
```

4. Admin login is controlled by `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, and `ADMIN_ROLE`. You do not need Supabase Auth for admin login in this version.

5. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase Notes

- RLS is enabled for `batches`, `products`, `orders`, `order_items`, `admin_users`, `reports`, `admin_login_attempts`, and `admin_audit_logs`.
- Public users can read active batch/product information.
- Public checkout submits to a protected server action. The backend recalculates totals, costs, profits, and order numbers before saving with the Supabase service role key.
- Checkout stores customer email for order confirmations.
- Public users cannot read orders, cost, profit, admin notes, or dashboard data.
- Admin pages require the direct admin session cookie. Admin database reads/writes use the Supabase service role key on the server only.
- Only one batch can be active because of a partial unique index.
- There are no file uploads, AI actions, webhooks, public staging dashboards, or customer accounts in this app. If those features are added later, add specific security controls for them before launch.
- Configure backups and monitoring in Supabase/Vercel for production. Code cannot replace a backup/restore plan.

## Deployment to Vercel

1. Push this project to GitHub.
2. Import the repository in Vercel.
3. Add the same environment variables from `.env.example`.
4. Deploy.
5. Open `/admin/login` and sign in with `ADMIN_EMAIL` and the original password used to generate `ADMIN_PASSWORD_HASH`.
6. After schema changes, rerun `supabase/schema.sql` in Supabase SQL Editor before testing checkout.

## Customer Flow

1. Customer selects items and quantities.
2. Customer reviews cart.
3. Customer sends e-transfer to `idreesrah0@gmail.com`.
4. Customer confirms payment and submits preorder.
5. Order is saved with payment status `Payment Claimed by Customer`.
6. Admin verifies payment and updates order status.
