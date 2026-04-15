create table public.inventory_events (
  id uuid not null default gen_random_uuid (),
  source text not null,
  external_event_id text null,
  product_id uuid null,
  product_market_data_id uuid null,
  market_id uuid null,
  quantity_delta integer not null default 0,
  change_type text not null,
  raw_payload jsonb null,
  processed_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  constraint inventory_events_pkey primary key (id),
  constraint inventory_events_market_id_fkey foreign KEY (market_id) references markets (id) on delete set null,
  constraint inventory_events_product_id_fkey foreign KEY (product_id) references products (id) on delete set null,
  constraint inventory_events_product_market_data_id_fkey foreign KEY (product_market_data_id) references product_market_data (id) on delete set null,
  constraint inventory_events_change_type_not_blank check (
    (
      length(
        TRIM(
          both
          from
            change_type
        )
      ) > 0
    )
  ),
  constraint inventory_events_source_not_blank check (
    (
      length(
        TRIM(
          both
          from
            source
        )
      ) > 0
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_inventory_events_market_id on public.inventory_events using btree (market_id) TABLESPACE pg_default;

create index IF not exists idx_inventory_events_product_id on public.inventory_events using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_inventory_events_external_event_id on public.inventory_events using btree (external_event_id) TABLESPACE pg_default;