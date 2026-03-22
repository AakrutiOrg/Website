-- =========================================
-- ADD COST PRICE TO MARKETS
-- =========================================

begin;

alter table public.product_market_data
add column if not exists cost_price numeric(12,2);

alter table public.product_market_data
add constraint product_market_data_cost_price_non_negative
    check (cost_price is null or cost_price >= 0);

-- Also update the view to include cost_price
drop view if exists public.product_catalog_market_view;

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
  pmd.cost_price,
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

commit;
