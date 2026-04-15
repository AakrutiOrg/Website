create table public.product_variants (
  id uuid not null default gen_random_uuid (),
  product_id uuid not null,
  name text not null,
  variant_type text not null,
  value text not null,
  price_adjustment numeric(12, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint product_variants_pkey primary key (id),
  constraint product_variants_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint product_variants_name_not_blank check (
    (
      length(
        TRIM(
          both
          from
            name
        )
      ) > 0
    )
  ),
  constraint product_variants_type_not_blank check (
    (
      length(
        TRIM(
          both
          from
            variant_type
        )
      ) > 0
    )
  ),
  constraint product_variants_value_not_blank check (
    (
      length(
        TRIM(
          both
          from
            value
        )
      ) > 0
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_product_variants_product_id on public.product_variants using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_product_variants_is_active on public.product_variants using btree (is_active) TABLESPACE pg_default;