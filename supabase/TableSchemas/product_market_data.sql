create table public.product_market_data (
  id uuid not null default gen_random_uuid (),
  product_id uuid not null,
  market_id uuid not null,
  price numeric(12, 2) null,
  currency text not null,
  stock_quantity integer not null default 0,
  low_stock_threshold integer not null default 0,
  is_active boolean not null default true,
  loyverse_item_id text null,
  external_sku text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  cost_price numeric(12, 2) null,
  constraint product_market_data_pkey primary key (id),
  constraint product_market_data_loyverse_item_id_unique unique (loyverse_item_id),
  constraint product_market_data_product_market_unique unique (product_id, market_id),
  constraint product_market_data_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint product_market_data_market_id_fkey foreign KEY (market_id) references markets (id) on delete CASCADE,
  constraint product_market_data_stock_non_negative check ((stock_quantity >= 0)),
  constraint product_market_data_currency_not_blank check (
    (
      length(
        TRIM(
          both
          from
            currency
        )
      ) > 0
    )
  ),
  constraint product_market_data_low_stock_non_negative check ((low_stock_threshold >= 0)),
  constraint product_market_data_price_non_negative check (
    (
      (price is null)
      or (price >= (0)::numeric)
    )
  ),
  constraint product_market_data_cost_price_non_negative check (
    (
      (cost_price is null)
      or (cost_price >= (0)::numeric)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_product_market_data_product_id on public.product_market_data using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_product_market_data_market_id on public.product_market_data using btree (market_id) TABLESPACE pg_default;

create index IF not exists idx_product_market_data_market_active on public.product_market_data using btree (market_id, is_active) TABLESPACE pg_default;

create index IF not exists idx_product_market_data_stock on public.product_market_data using btree (stock_quantity) TABLESPACE pg_default;

create trigger trg_product_market_data_updated_at BEFORE
update on product_market_data for EACH row
execute FUNCTION set_updated_at ();