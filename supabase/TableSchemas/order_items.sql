create table public.order_items (
  id uuid not null default gen_random_uuid (),
  order_db_id uuid not null,
  product_id uuid null,
  product_name_snapshot text not null,
  product_slug_snapshot text null,
  unit_price_snapshot numeric(12, 2) null,
  quantity integer not null,
  selected_variant_json jsonb null,
  created_at timestamp with time zone not null default now(),
  constraint order_items_pkey primary key (id),
  constraint order_items_order_db_id_fkey foreign KEY (order_db_id) references orders (id) on delete CASCADE,
  constraint order_items_product_id_fkey foreign KEY (product_id) references products (id) on delete set null,
  constraint order_items_product_name_not_blank check (
    (
      length(
        TRIM(
          both
          from
            product_name_snapshot
        )
      ) > 0
    )
  ),
  constraint order_items_quantity_positive check ((quantity > 0)),
  constraint order_items_unit_price_non_negative check (
    (
      (unit_price_snapshot is null)
      or (unit_price_snapshot >= (0)::numeric)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_order_items_order_db_id on public.order_items using btree (order_db_id) TABLESPACE pg_default;

create index IF not exists idx_order_items_product_id on public.order_items using btree (product_id) TABLESPACE pg_default;