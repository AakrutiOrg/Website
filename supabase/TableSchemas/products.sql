create table public.products (
  id uuid not null default gen_random_uuid (),
  category_id uuid not null,
  name text not null,
  slug text not null,
  short_description text null,
  description text null,
  base_price numeric(12, 2) null,
  sku text null,
  material text null,
  art_type text not null,
  is_framed boolean not null default false,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  attributes jsonb null,
  constraint products_pkey primary key (id),
  constraint products_sku_key unique (sku),
  constraint products_slug_key unique (slug),
  constraint products_category_id_fkey foreign KEY (category_id) references categories (id) on delete RESTRICT,
  constraint products_art_type_valid check (
    (
      art_type = any (
        array[
          'brass_framed'::text,
          'brass_non_framed'::text,
          'fabric_patchwork'::text
        ]
      )
    )
  ),
  constraint products_slug_not_blank check (
    (
      length(
        TRIM(
          both
          from
            slug
        )
      ) > 0
    )
  ),
  constraint products_attributes_size_unit_check check (
    (
      (attributes is null)
      or (
        (jsonb_typeof(attributes) = 'object'::text)
        and (
          (not (attributes ? 'size_unit'::text))
          or (
            (attributes ->> 'size_unit'::text) = any (array['inch'::text, 'cm'::text])
          )
        )
      )
    )
  ),
  constraint products_base_price_non_negative check (
    (
      (base_price is null)
      or (base_price >= (0)::numeric)
    )
  ),
  constraint products_name_not_blank check (
    (
      length(
        TRIM(
          both
          from
            name
        )
      ) > 0
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_products_category_id on public.products using btree (category_id) TABLESPACE pg_default;

create index IF not exists idx_products_is_active on public.products using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_products_is_featured on public.products using btree (is_featured) TABLESPACE pg_default;

create index IF not exists idx_products_art_type on public.products using btree (art_type) TABLESPACE pg_default;

create index IF not exists idx_products_name on public.products using btree (name) TABLESPACE pg_default;

create trigger set_products_updated_at BEFORE
update on products for EACH row
execute FUNCTION set_updated_at ();

create trigger trg_products_updated_at BEFORE
update on products for EACH row
execute FUNCTION set_updated_at ();