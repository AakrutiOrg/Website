-- =========================================
-- AAKRUTI MULTI-MARKET SUPPORT
-- =========================================

begin;

-- -----------------------------------------
-- 1) MARKETS
-- -----------------------------------------
create table if not exists public.markets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  currency text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint markets_name_not_blank check (length(trim(name)) > 0),
  constraint markets_code_not_blank check (length(trim(code)) > 0),
  constraint markets_currency_not_blank check (length(trim(currency)) > 0)
);

create trigger trg_markets_updated_at
before update on public.markets
for each row
execute function public.set_updated_at();

create index if not exists idx_markets_is_active
  on public.markets (is_active);

create index if not exists idx_markets_sort_order
  on public.markets (sort_order);

-- -----------------------------------------
-- 2) PRODUCT MARKET DATA
-- one row per product per market
-- -----------------------------------------
create table if not exists public.product_market_data (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete cascade,

  price numeric(12,2),
  currency text not null,
  stock_quantity integer not null default 0,
  low_stock_threshold integer not null default 0,

  is_active boolean not null default true,
  loyverse_item_id text,
  external_sku text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint product_market_data_price_non_negative
    check (price is null or price >= 0),
  constraint product_market_data_stock_non_negative
    check (stock_quantity >= 0),
  constraint product_market_data_low_stock_non_negative
    check (low_stock_threshold >= 0),
  constraint product_market_data_currency_not_blank
    check (length(trim(currency)) > 0),

  constraint product_market_data_product_market_unique
    unique (product_id, market_id),

  constraint product_market_data_loyverse_item_id_unique
    unique (loyverse_item_id)
);

create trigger trg_product_market_data_updated_at
before update on public.product_market_data
for each row
execute function public.set_updated_at();

create index if not exists idx_product_market_data_product_id
  on public.product_market_data (product_id);

create index if not exists idx_product_market_data_market_id
  on public.product_market_data (market_id);

create index if not exists idx_product_market_data_market_active
  on public.product_market_data (market_id, is_active);

create index if not exists idx_product_market_data_stock
  on public.product_market_data (stock_quantity);

-- -----------------------------------------
-- 3) ORDERS: attach every order to a market
-- -----------------------------------------
alter table public.orders
add column if not exists market_id uuid references public.markets(id) on delete restrict;

create index if not exists idx_orders_market_id
  on public.orders (market_id);

-- -----------------------------------------
-- 4) OPTIONAL: inventory event log for future sync
-- useful for Loyverse/webhooks later
-- -----------------------------------------
create table if not exists public.inventory_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_event_id text,
  product_id uuid references public.products(id) on delete set null,
  product_market_data_id uuid references public.product_market_data(id) on delete set null,
  market_id uuid references public.markets(id) on delete set null,
  quantity_delta integer not null default 0,
  change_type text not null,
  raw_payload jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),

  constraint inventory_events_source_not_blank
    check (length(trim(source)) > 0),
  constraint inventory_events_change_type_not_blank
    check (length(trim(change_type)) > 0)
);

create index if not exists idx_inventory_events_market_id
  on public.inventory_events (market_id);

create index if not exists idx_inventory_events_product_id
  on public.inventory_events (product_id);

create index if not exists idx_inventory_events_external_event_id
  on public.inventory_events (external_event_id);

-- -----------------------------------------
-- 5) seed initial markets
-- -----------------------------------------
insert into public.markets (name, code, currency, sort_order)
values
  ('India', 'IN', 'INR', 1),
  ('United Kingdom', 'UK', 'GBP', 2)
on conflict (code) do update
set
  name = excluded.name,
  currency = excluded.currency,
  sort_order = excluded.sort_order;

-- -----------------------------------------
-- 6) backfill product_market_data for existing products
-- create IN and UK rows for all existing products
-- IN uses current base_price when present
-- UK starts null so you can fill separately
-- -----------------------------------------
insert into public.product_market_data (
  product_id,
  market_id,
  price,
  currency,
  stock_quantity,
  is_active
)
select
  p.id,
  m.id,
  case when m.code = 'IN' then p.base_price else null end as price,
  m.currency,
  0 as stock_quantity,
  p.is_active
from public.products p
cross join public.markets m
where m.code in ('IN', 'UK')
on conflict (product_id, market_id) do nothing;

-- -----------------------------------------
-- 7) optional helper view for market-aware catalog reads
-- -----------------------------------------
create or replace view public.product_catalog_market_view as
select
  p.id as product_id,
  p.category_id,
  c.name as category_name,
  c.slug as category_slug,
  p.name,
  p.slug,
  p.short_description,
  p.description,
  p.sku,
  p.material,
  p.art_type,
  p.is_framed,
  p.is_featured,
  p.created_at,
  p.updated_at,

  m.id as market_id,
  m.code as market_code,
  m.name as market_name,
  m.currency as market_currency,

  pmd.id as product_market_data_id,
  pmd.price,
  pmd.stock_quantity,
  pmd.low_stock_threshold,
  pmd.is_active as market_active,
  pmd.loyverse_item_id,
  pmd.external_sku,

  (
    select pi.image_url
    from public.product_images pi
    where pi.product_id = p.id
      and pi.is_primary = true
    order by pi.sort_order asc, pi.created_at asc
    limit 1
  ) as primary_image_url
from public.products p
join public.categories c on c.id = p.category_id
join public.product_market_data pmd on pmd.product_id = p.id
join public.markets m on m.id = pmd.market_id
where p.is_active = true
  and c.is_active = true;

-- -----------------------------------------
-- 8) RLS
-- -----------------------------------------
alter table public.markets enable row level security;
alter table public.product_market_data enable row level security;
alter table public.inventory_events enable row level security;

create policy "Public can read active markets"
on public.markets
for select
to anon, authenticated
using (is_active = true);

create policy "Public can read active product market data"
on public.product_market_data
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.products p
    where p.id = product_market_data.product_id
      and p.is_active = true
  )
  and exists (
    select 1
    from public.markets m
    where m.id = product_market_data.market_id
      and m.is_active = true
  )
);

-- no public write access to product_market_data or inventory_events
-- keep writes on the server side using secure auth / service role

commit;