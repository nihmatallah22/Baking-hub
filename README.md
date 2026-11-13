# Baking-hub — Shadollar Cakes and Treats

Online storefront and ordering platform for a catering and baking business.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase Auth, PostgreSQL and Storage
- Vercel deployment
- Payments are intentionally not integrated yet.

## Environment setup
1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. In Supabase Project Settings → API, copy the Project URL and publishable/anon key into:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Keep `.env.local` out of Git. Never expose a service-role key in browser code.

## Database setup
1. Open Supabase Dashboard → SQL Editor.
2. Open `supabase/schema.sql` from this repository.
3. Paste the full SQL and run it.
4. Create your first website account, then find its UUID under Authentication → Users.
5. Run this in SQL Editor, replacing the placeholder:
   `update public.profiles set role = 'admin' where id = 'YOUR_AUTH_USER_UUID';`

The SQL creates profiles, categories, products, product images, orders, order items, reviews and enquiries; enables RLS; creates the public `product-images` storage bucket; and seeds starter categories.

## Local development
After the Next.js application files and dependencies are added:
```bash
npm install
npm run dev
```

## Deploy
Import this repository into Vercel, add the same environment variables in Project Settings → Environment Variables, then deploy.

## Current scope
Customer storefront, accounts, catalogue management, cart/checkout and admin order management are the planned build. Payment gateway integration is deferred until the business chooses a provider.
