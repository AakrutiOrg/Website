begin;

with raw_items (
  handle,
  sku,
  name,
  raw_category,
  raw_description,
  cost_price_raw,
  barcode,
  track_stock,
  available_for_sale,
  market_price_raw,
  market_stock_raw,
  low_stock_raw
) as (
  values
    ('8-leafed-gajanan-8x8', '8-LYF-GAJ-8-8', '8 Leafed Gajanan 8x8', '', '', '16.80', '8-LYF-GAJ-8-8', 'Y', 'Y', '30.99', '1.000', '0.000'),
    ('artistic-kamadhenu-10x10', 'ART-KAM-10-10', 'Artistic Kamadhenu 10x10', 'Framed Articles-Brass', '', '21.84', 'ART-KAM-10-10', 'Y', 'Y', '43.99', '0.000', '0.000'),
    ('auspicious-gajanan-12x12', 'AUS-GAJ-12-12', 'Auspicious Gajanan 12x12', 'Framed Articles-Brass', '', '26.88', 'AUS-GAJ-12-12', 'Y', 'Y', '45.99', '0.000', '0.000'),
    ('auspicious-gajanan-on-leaf-10x10', 'AUS-GAJ-LYF-10-10', 'Auspicious Gajanan on Leaf 10x10', 'Framed Articles-Brass', '', '18.90', 'AUS-GAJ-LYF-10-10', 'Y', 'Y', '34.99', '0.000', '0.000'),
    ('gajanan-and-maa-laxmi-on-peeta', '10005', 'Gajanan and Maa Laxmi on Peeta', 'Non-Framed Articles- Brass', '', '17.00', '', 'N', 'Y', '28.99', '', ''),
    ('gajanan-on-peeta', '10003', 'Gajanan On Peeta', 'Non-Framed Articles- Brass', '', '8.50', '', 'N', 'Y', '15.99', '', ''),
    ('grace-of-kathakalli-12x12', 'GRC-OF-KAT-12-12', 'Grace of Kathakalli 12x12', 'Framed Articles-Brass', '', '25.20', 'GRC-OF-KAT-12-12', 'Y', 'Y', '45.99', '1.000', '0.000'),
    ('gracious-peacock', '10011', 'Gracious Peacock', 'Framed Articles-Brass', '', '0.00', '', 'Y', 'Y', '49.99', '1.000', '0.000'),
    ('hanging-diyas', '10001', 'Hanging Diyas (pair)', 'Non-Framed Articles- Brass', '', '30.00', '', 'Y', 'Y', '44.99', '1.000', '0.000'),
    ('idol-with-dwarpal', '10008', 'Idol with Dwarpal', 'Non-Framed Articles- Brass', '', '19.15', '', 'N', 'Y', '35.99', '', ''),
    ('idols-with-elephants', '10009', 'Idols with Elephants', 'Non-Framed Articles- Brass', '', '27.45', '', 'N', 'Y', '45.99', '', ''),
    ('kamadhenu', 'KAMADHENU-0-0', 'Kamadhenu', 'Non-Framed Articles- Brass', '', '23.10', '', 'Y', 'Y', '38.99', '1.000', '0.000'),
    ('kamadhenu-10x10', 'KAM-10-10', 'Kamadhenu 10x10', 'Framed Articles-Brass', '', '16.80', 'KAM-10-10', 'Y', 'Y', '39.99', '1.000', '1.000'),
    ('maa-laxmi-on-peeta', '10004', 'Maa Laxmi on Peeta', 'Non-Framed Articles- Brass', '', '8.50', '', 'N', 'Y', '15.99', '', ''),
    ('miniature-dance-art', '10000', 'Miniature Dance Art', '', '', '7.00', '', 'Y', 'Y', '11.99', '1.000', '0.000'),
    ('min-duo', 'MIN-DUO', 'Miniature Duo', 'Non-Framed Articles- Brass', '', '4.70', 'MIN-DUO', 'Y', 'Y', '10.99', '2.000', '0.000'),
    ('miniatures-trio', 'MIN-TRIO', 'Miniatures Trio', 'Non-Framed Articles- Brass', '<p>Laxmi, Ganesha and Saraswati</p>', '7.06', 'MIN-TRIO', 'Y', 'Y', '13.99', '1.000', '0.000'),
    ('music-of-tribals-10x16', 'MUS-OF-TRI-10-16', 'Music of Tribals 10x16', 'Framed Articles-Brass', '', '25.20', 'MUS-OF-TRI-10-16', 'Y', 'Y', '45.99', '1.000', '0.000'),
    ('ornamental-gajanan', '10010', 'Ornamental Gajanan', 'Framed Articles-Brass', '', '0.00', '', 'Y', 'Y', '45.99', '1.000', '1.000'),
    ('pair-of-elephants---light', '10007', 'Pair of Elephants - Light', 'Non-Framed Articles- Brass', '', '15.81', '', 'Y', 'Y', '28.99', '1.000', ''),
    ('pair-of-elephants---solid', '10006', 'Pair of Elephants - Solid', 'Non-Framed Articles- Brass', '', '29.93', '', 'Y', 'Y', '45.99', '1.000', ''),
    ('patch-work-wall-hangings', '10002', 'Patch work wall hangings', 'Patch Works', '', '12.85', '', 'Y', 'Y', '21.99', '8.000', '0.000'),
    ('sacred-lotus-8x8', 'SCD-LOT-8-8', 'Sacred Lotus 8x8', 'Framed Articles-Brass', '', '9.66', 'SCD-LOT-8-8', 'Y', 'Y', '24.99', '2.000', '0.000'),
    ('soul-of-buddha-10x10', 'SOL-OF-BUD-10-10', 'Soul of Buddha 10x10', 'Framed Articles-Brass', '', '16.80', 'SOL-OF-BUD-10-10', 'Y', 'Y', '39.99', '1.000', '1.000'),
    ('spirit-of-maa-durga-12x12', 'SPR-MAA-DRG-12-12', 'Spirit of Maa Durga 12x12', 'Framed Articles-Brass', '', '28.00', 'SPR-MAA-DRG-12-12', 'Y', 'Y', '49.99', '4.000', '1.000'),
    ('spirit-of-maa-durga-8x8', 'SPR-MAA-DRG-8-8', 'Spirit of Maa Durga 8x8', 'Framed Articles-Brass', '', '9.66', 'SPR-MAA-DRG-8-8', 'Y', 'Y', '25.99', '1.000', '0.000'),
    ('spirit-of-maa-durga-with-lotus-10x22', 'SPR-MAA-DRG-LOT-10-22', 'Spirit of Maa Durga with Lotus 10x22', 'Framed Articles-Brass', '', '35.28', 'SPR-MAA-DRG-LOT-10-22', 'Y', 'Y', '62.99', '3.000', '0.000'),
    ('tree-of-life-10x16', 'TRE-OF-LIFE-10-16', 'Tree of Life 10x16', 'Framed Articles-Brass', '', '25.20', 'TRE-OF-LIFE-10-16', 'Y', 'Y', '49.99', '3.000', '0.000'),
    ('tree-of-life', 'TRE-OF-LIFE-12-12', 'Tree of Life 12x12', 'Framed Articles-Brass', '<p>Tree of Life</p>', '26.88', 'TRE-OF-LIFE-12-12', 'Y', 'Y', '49.99', '1.000', '0.000')
),
normalized_items as (
  select
    handle as slug,
    sku,
    name,
    case
      when raw_category = 'Framed Articles-Brass' then 'Framed Articles-Brass'
      when raw_category = 'Non-Framed Articles- Brass' then 'Non-Framed Articles-Brass'
      when raw_category = 'Patch Works' then 'Patch Works'
      when raw_category = '' and name ~* '\d+x\d+' then 'Framed Articles-Brass'
      when raw_category = '' and name ilike '%miniature%' then 'Non-Framed Articles-Brass'
      else 'Imported Products'
    end as category_name,
    case
      when raw_category = 'Framed Articles-Brass' then 'framed-articles-brass'
      when raw_category = 'Non-Framed Articles- Brass' then 'non-framed-articles-brass'
      when raw_category = 'Patch Works' then 'patch-works'
      when raw_category = '' and name ~* '\d+x\d+' then 'framed-articles-brass'
      when raw_category = '' and name ilike '%miniature%' then 'non-framed-articles-brass'
      else 'imported-products'
    end as category_slug,
    case
      when raw_category = 'Patch Works' then 'fabric_patchwork'
      when raw_category = 'Framed Articles-Brass' then 'brass_framed'
      when raw_category = 'Non-Framed Articles- Brass' then 'brass_non_framed'
      when raw_category = '' and name ~* '\d+x\d+' then 'brass_framed'
      else 'brass_non_framed'
    end as art_type,
    case
      when raw_category = 'Patch Works' then 'fabric'
      else 'brass'
    end as material,
    case
      when raw_category = 'Framed Articles-Brass' then true
      when raw_category = 'Patch Works' then false
      when raw_category = '' and name ~* '\d+x\d+' then true
      else false
    end as is_framed,
    nullif(trim(regexp_replace(raw_description, '<[^>]+>', '', 'g')), '') as description,
    nullif(market_price_raw, '')::numeric(12,2) as base_price,
    nullif(cost_price_raw, '')::numeric(12,2) as cost_price,
    nullif(barcode, '') as external_sku,
    available_for_sale = 'Y' as is_active,
    coalesce(nullif(market_stock_raw, '')::numeric, 0)::integer as stock_quantity,
    coalesce(nullif(low_stock_raw, '')::numeric, 0)::integer as low_stock_threshold,
    case
      when regexp_match(name, '(\d+x\d+)') is not null then
        jsonb_build_object(
          'size', (regexp_match(name, '(\d+x\d+)'))[1],
          'size_unit', 'inch',
          'material', case when raw_category = 'Patch Works' then 'fabric' else 'brass' end,
          'frame_style', case
            when raw_category = 'Framed Articles-Brass' then 'framed'
            when raw_category = '' and name ~* '\d+x\d+' then 'framed'
            else 'non_framed'
          end
        )
      else
        jsonb_build_object(
          'material', case when raw_category = 'Patch Works' then 'fabric' else 'brass' end,
          'frame_style', case
            when raw_category = 'Framed Articles-Brass' then 'framed'
            when raw_category = '' and name ~* '\d+x\d+' then 'framed'
            else 'non_framed'
          end
        )
    end as attributes
  from raw_items
),
upsert_categories as (
  insert into public.categories (
    name,
    slug,
    is_active
  )
  select distinct
    category_name,
    category_slug,
    true
  from normalized_items
  on conflict (slug) do update
  set
    name = excluded.name,
    is_active = excluded.is_active,
    updated_at = now()
  returning id, slug
),
resolved_categories as (
  select id, slug
  from upsert_categories
  union
  select c.id, c.slug
  from public.categories c
  where c.slug in (select distinct category_slug from normalized_items)
),
upsert_products as (
  insert into public.products (
    category_id,
    name,
    slug,
    short_description,
    description,
    base_price,
    sku,
    material,
    art_type,
    is_framed,
    is_featured,
    is_active,
    attributes
  )
  select
    c.id as category_id,
    i.name,
    i.slug,
    null as short_description,
    i.description,
    i.base_price,
    i.sku,
    i.material,
    i.art_type,
    i.is_framed,
    false as is_featured,
    i.is_active,
    i.attributes
  from normalized_items i
  join resolved_categories c
    on c.slug = i.category_slug
  on conflict (slug) do update
  set
    category_id = excluded.category_id,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    base_price = excluded.base_price,
    sku = excluded.sku,
    material = excluded.material,
    art_type = excluded.art_type,
    is_framed = excluded.is_framed,
    is_active = excluded.is_active,
    attributes = excluded.attributes,
    updated_at = now()
  returning id, slug
),
uk_market as (
  select id, currency
  from public.markets
  where code = 'UK'
  limit 1
)
insert into public.product_market_data (
  product_id,
  market_id,
  price,
  currency,
  stock_quantity,
  low_stock_threshold,
  is_active,
  external_sku,
  cost_price
)
select
  p.id as product_id,
  m.id as market_id,
  i.base_price as price,
  m.currency,
  i.stock_quantity,
  i.low_stock_threshold,
  i.is_active,
  i.external_sku,
  i.cost_price
from normalized_items i
join upsert_products p
  on p.slug = i.slug
cross join uk_market m
on conflict (product_id, market_id) do update
set
  price = excluded.price,
  currency = excluded.currency,
  stock_quantity = excluded.stock_quantity,
  low_stock_threshold = excluded.low_stock_threshold,
  is_active = excluded.is_active,
  external_sku = excluded.external_sku,
  cost_price = excluded.cost_price,
  updated_at = now();

commit;

-- Assumptions applied while matching Loyverse data to Aakruti schema:
-- 1. '8 Leafed Gajanan 8x8' was treated as framed brass because the product name carries a framed-style size.
-- 2. 'Miniature Dance Art' was treated as non-framed brass because it is a miniature item with no framed category in the export.
-- 3. Blank/unchecked stock values from Loyverse were imported as 0 because Aakruti requires explicit stock quantities.
