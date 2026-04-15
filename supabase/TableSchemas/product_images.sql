create table public.product_images (
  id uuid not null default gen_random_uuid (),
  product_id uuid not null,
  storage_path text not null,
  alt_text text null,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint product_images_pkey primary key (id),
  constraint product_images_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint product_images_image_url_not_blank check (
    (
      length(
        TRIM(
          both
          from
            storage_path
        )
      ) > 0
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_product_images_product_id on public.product_images using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_product_images_sort_order on public.product_images using btree (sort_order) TABLESPACE pg_default;

create index IF not exists idx_product_images_primary on public.product_images using btree (product_id, is_primary) TABLESPACE pg_default;

create unique INDEX IF not exists ux_product_images_one_primary_per_product on public.product_images using btree (product_id) TABLESPACE pg_default
where
  (is_primary = true);

create trigger set_product_images_updated_at BEFORE
update on product_images for EACH row
execute FUNCTION set_updated_at ();