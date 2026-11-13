-- Shadollar Cakes and Treats / Baking-hub
-- Initial Supabase schema. Run in Supabase Dashboard > SQL Editor.
-- Payment integration intentionally omitted.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('customer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum
    ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.fulfilment_method as enum ('delivery', 'pickup');
exception when duplicate_object then null; end $$;

-- User profile. New signups are always customers; promote the owner to admin manually.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= 0),
  image_url text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  customer_name text not null,
  customer_phone text not null,
  delivery_method public.fulfilment_method not null,
  delivery_address text,
  requested_fulfilment_at timestamptz,
  customer_note text,
  status public.order_status not null default 'pending',
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  currency text not null default 'NGN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_address_required check (
    delivery_method <> 'delivery' or nullif(trim(delivery_address), '') is not null
  )
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12,2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_enquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  email text,
  phone text,
  event_date date,
  enquiry_type text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Keep updated_at current.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();

-- Create a customer profile whenever Supabase Auth creates a user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- SECURITY DEFINER avoids profile-policy recursion when checking the admin role.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'::public.app_role
  );
$$;

-- Place an order using current database prices, not prices supplied by the browser.
-- Expected items JSON: [{"product_id":"uuid","quantity":2}, ...]
create or replace function public.place_order(
  p_customer_name text,
  p_customer_phone text,
  p_delivery_method public.fulfilment_method,
  p_delivery_address text,
  p_requested_fulfilment_at timestamptz,
  p_customer_note text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_subtotal numeric(12,2) := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_delivery_fee numeric(12,2) := 0;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to place an order.';
  end if;
  if nullif(trim(p_customer_name), '') is null
     or nullif(trim(p_customer_phone), '') is null then
    raise exception 'Customer name and phone are required.';
  end if;
  if p_delivery_method = 'delivery'
     and nullif(trim(p_delivery_address), '') is null then
    raise exception 'A delivery address is required.';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your order must contain at least one product.';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity is null or v_quantity < 1 or v_quantity > 100 then
      raise exception 'Each product quantity must be between 1 and 100.';
    end if;

    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid
      and is_active = true and is_available = true;

    if not found then
      raise exception 'One of the selected products is unavailable.';
    end if;
    if v_product.stock_quantity is not null and v_product.stock_quantity < v_quantity then
      raise exception 'There is not enough stock for %.', v_product.name;
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
  end loop;

  insert into public.orders (
    user_id, customer_name, customer_phone, delivery_method,
    delivery_address, requested_fulfilment_at, customer_note,
    subtotal, delivery_fee, total
  ) values (
    v_user_id, trim(p_customer_name), trim(p_customer_phone), p_delivery_method,
    nullif(trim(p_delivery_address), ''), p_requested_fulfilment_at,
    nullif(trim(p_customer_note), ''), v_subtotal, v_delivery_fee,
    v_subtotal + v_delivery_fee
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    select * into v_product from public.products
    where id = (v_item ->> 'product_id')::uuid
      and is_active = true and is_available = true;

    insert into public.order_items (
      order_id, product_id, product_name, unit_price, quantity
    ) values (
      v_order_id, v_product.id, v_product.name, v_product.price, v_quantity
    );

    if v_product.stock_quantity is not null then
      update public.products
      set stock_quantity = stock_quantity - v_quantity
      where id = v_product.id;
    end if;
  end loop;

  return v_order_id;
end;
$$;

revoke all on function public.place_order(text,text,public.fulfilment_method,text,timestamptz,text,jsonb) from public;
grant execute on function public.place_order(text,text,public.fulfilment_method,text,timestamptz,text,jsonb) to authenticated;

-- Enable Row Level Security on every application table.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.customer_reviews enable row level security;
alter table public.customer_enquiries enable row level security;

-- Profiles: customers see/update their own profile; admins can manage all profiles.
drop policy if exists "Profiles are viewable by owner or admin" on public.profiles;
create policy "Profiles are viewable by owner or admin" on public.profiles
for select to authenticated using (id = (select auth.uid()) or public.is_admin());
drop policy if exists "Customers update own profile" on public.profiles;
create policy "Customers update own profile" on public.profiles
for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()) and role = 'customer');
drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Admins manage profiles" on public.profiles
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Public storefront reads active categories/products/images. Admins manage catalogue.
drop policy if exists "Public reads active categories" on public.categories;
create policy "Public reads active categories" on public.categories
for select to anon, authenticated using (is_active = true or public.is_admin());
drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads active products" on public.products;
create policy "Public reads active products" on public.products
for select to anon, authenticated using (is_active = true or public.is_admin());
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads images for active products" on public.product_images;
create policy "Public reads images for active products" on public.product_images
for select to anon, authenticated using (
  exists (select 1 from public.products p where p.id = product_id and (p.is_active = true or public.is_admin()))
);
drop policy if exists "Admins manage product images" on public.product_images;
create policy "Admins manage product images" on public.product_images
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Orders are created only through place_order(); customers can read their own orders.
drop policy if exists "Customers and admins read orders" on public.orders;
create policy "Customers and admins read orders" on public.orders
for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders" on public.orders
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Customers and admins read order items" on public.order_items;
create policy "Customers and admins read order items" on public.order_items
for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id
    and (o.user_id = (select auth.uid()) or public.is_admin()))
);
drop policy if exists "Admins manage order items" on public.order_items;
create policy "Admins manage order items" on public.order_items
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Reviews: public can read published reviews; signed-in customers can submit their own.
drop policy if exists "Public reads published reviews" on public.customer_reviews;
create policy "Public reads published reviews" on public.customer_reviews
for select to anon, authenticated using (is_published = true or user_id = (select auth.uid()) or public.is_admin());
drop policy if exists "Customers submit reviews" on public.customer_reviews;
create policy "Customers submit reviews" on public.customer_reviews
for insert to authenticated with check (user_id = (select auth.uid()) and is_published = false);
drop policy if exists "Admins manage reviews" on public.customer_reviews;
create policy "Admins manage reviews" on public.customer_reviews
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Enquiries: public visitors may submit; only admins can read/manage.
drop policy if exists "Anyone can submit enquiries" on public.customer_enquiries;
create policy "Anyone can submit enquiries" on public.customer_enquiries
for insert to anon, authenticated with check (
  user_id is null or user_id = (select auth.uid())
);
drop policy if exists "Admins manage enquiries" on public.customer_enquiries;
create policy "Admins manage enquiries" on public.customer_enquiries
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Product image storage bucket. Files are public to display on the storefront;
-- only admins can upload, replace or delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images" on storage.objects
for select to anon, authenticated using (bucket_id = 'product-images');
drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images" on storage.objects
for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images" on storage.objects
for update to authenticated using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images" on storage.objects
for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- Optional starter categories. Safe to run more than once.
insert into public.categories (name, slug, sort_order) values
  ('Birthday Cakes', 'birthday-cakes', 1),
  ('Wedding Cakes', 'wedding-cakes', 2),
  ('Cupcakes', 'cupcakes', 3),
  ('Small Chops', 'small-chops', 4),
  ('Chin Chin', 'chin-chin', 5),
  ('Doughnuts', 'doughnuts', 6),
  ('Pastries', 'pastries', 7),
  ('Catering Services', 'catering-services', 8),
  ('Event Packages', 'event-packages', 9),
  ('Drinks & Refreshments', 'drinks-refreshments', 10)
on conflict (slug) do nothing;

-- IMPORTANT: after creating your account on the website, promote that account:
-- update public.profiles set role = 'admin' where id = 'YOUR_AUTH_USER_UUID';
