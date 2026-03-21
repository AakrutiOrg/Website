-- =========================================
-- AAKRUTI PHASE 1 SCHEMA
-- =========================================

-- Optional but recommended
create extension if not exists pgcrypto;

-- =========================================
-- UPDATED_AT HELPER
-- =========================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================
-- CATEGORIES
-- =========================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint categories_name_not_blank check (length(trim(name)) > 0),
  constraint categories_slug_not_blank check (length(trim(slug)) > 0)
);

create trigger trg_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

create index if not exists idx_categories_is_active
  on public.categories (is_active);

create index if not exists idx_categories_sort_order
  on public.categories (sort_order);

-- =========================================
-- PRODUCTS
-- =========================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  base_price numeric(12,2),
  sku text unique,
  material text,
  art_type text not null,
  is_framed boolean not null default false,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint products_name_not_blank check (length(trim(name)) > 0),
  constraint products_slug_not_blank check (length(trim(slug)) > 0),
  constraint products_base_price_non_negative check (base_price is null or base_price >= 0),
  constraint products_art_type_valid check (
    art_type in ('brass_framed', 'brass_non_framed', 'fabric_patchwork')
  )
);

create trigger trg_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create index if not exists idx_products_category_id
  on public.products (category_id);

create index if not exists idx_products_is_active
  on public.products (is_active);

create index if not exists idx_products_is_featured
  on public.products (is_featured);

create index if not exists idx_products_art_type
  on public.products (art_type);

create index if not exists idx_products_name
  on public.products (name);

-- =========================================
-- PRODUCT IMAGES
-- =========================================

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),

  constraint product_images_image_url_not_blank check (length(trim(image_url)) > 0)
);

create index if not exists idx_product_images_product_id
  on public.product_images (product_id);

create index if not exists idx_product_images_sort_order
  on public.product_images (sort_order);

create index if not exists idx_product_images_primary
  on public.product_images (product_id, is_primary);

-- Optional: ensure only one primary image per product
create unique index if not exists ux_product_images_one_primary_per_product
  on public.product_images (product_id)
  where is_primary = true;

-- =========================================
-- PRODUCT VARIANTS
-- Optional for frame size / size options / finish
-- =========================================

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  variant_type text not null,
  value text not null,
  price_adjustment numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint product_variants_name_not_blank check (length(trim(name)) > 0),
  constraint product_variants_type_not_blank check (length(trim(variant_type)) > 0),
  constraint product_variants_value_not_blank check (length(trim(value)) > 0)
);

create index if not exists idx_product_variants_product_id
  on public.product_variants (product_id);

create index if not exists idx_product_variants_is_active
  on public.product_variants (is_active);

-- =========================================
-- ORDERS
-- =========================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  customer_name text not null,
  phone text not null,
  email text,
  city text,
  state text,
  country text default 'India',
  address_line1 text,
  address_line2 text,
  postal_code text,
  notes text,
  status text not null default 'pending',
  subtotal numeric(12,2),
  total_items integer not null default 0,
  email_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint orders_customer_name_not_blank check (length(trim(customer_name)) > 0),
  constraint orders_phone_not_blank check (length(trim(phone)) > 0),
  constraint orders_total_items_non_negative check (total_items >= 0),
  constraint orders_subtotal_non_negative check (subtotal is null or subtotal >= 0),
  constraint orders_status_valid check (
    status in ('pending', 'confirmed', 'contacted', 'closed', 'cancelled')
  ),
  constraint orders_email_status_valid check (
    email_status in ('pending', 'sent', 'failed')
  )
);

create trigger trg_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

create index if not exists idx_orders_order_id
  on public.orders (order_id);

create index if not exists idx_orders_status
  on public.orders (status);

create index if not exists idx_orders_created_at
  on public.orders (created_at desc);

create index if not exists idx_orders_phone
  on public.orders (phone);

-- =========================================
-- ORDER ITEMS
-- Snapshot product data so old orders remain correct
-- =========================================

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_db_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  product_slug_snapshot text,
  unit_price_snapshot numeric(12,2),
  quantity integer not null,
  selected_variant_json jsonb,
  created_at timestamptz not null default now(),

  constraint order_items_product_name_not_blank check (length(trim(product_name_snapshot)) > 0),
  constraint order_items_unit_price_non_negative check (
    unit_price_snapshot is null or unit_price_snapshot >= 0
  ),
  constraint order_items_quantity_positive check (quantity > 0)
);

create index if not exists idx_order_items_order_db_id
  on public.order_items (order_db_id);

create index if not exists idx_order_items_product_id
  on public.order_items (product_id);

-- =========================================
-- OPTIONAL VIEW FOR PRODUCT LISTING
-- Handy for frontend queries
-- =========================================

create or replace view public.product_catalog_view as
select
  p.id,
  p.category_id,
  c.name as category_name,
  c.slug as category_slug,
  p.name,
  p.slug,
  p.short_description,
  p.description,
  p.base_price,
  p.sku,
  p.material,
  p.art_type,
  p.is_framed,
  p.is_featured,
  p.is_active,
  p.created_at,
  p.updated_at,
  (
    select pi.image_url
    from public.product_images pi
    where pi.product_id = p.id
    and pi.is_primary = true
    order by pi.sort_order asc, pi.created_at asc
    limit 1
  ) as primary_image_url
from public.products p
join public.categories c on c.id = p.category_id;

-- =========================================
-- ROW LEVEL SECURITY
-- =========================================

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Public read access for active catalog data
create policy "Public can read active categories"
on public.categories
for select
to anon, authenticated
using (is_active = true);

create policy "Public can read active products"
on public.products
for select
to anon, authenticated
using (is_active = true);

create policy "Public can read product images"
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_images.product_id
      and p.is_active = true
  )
);

create policy "Public can read active product variants"
on public.product_variants
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.products p
    where p.id = product_variants.product_id
      and p.is_active = true
  )
);

-- No public direct insert/update/delete on orders or order_items.
-- Use server-side code with service role key for order creation.

-- =========================================
-- OPTIONAL STORAGE BUCKET NOTE
-- =========================================
-- Create a bucket named: product-images
-- Keep files public for Phase 1 or use signed URLs later.