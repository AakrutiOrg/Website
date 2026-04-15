create table public.categories (
  id uuid not null default gen_random_uuid (),
  name text not null,
  slug text not null,
  description text null,
  image_url text null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint categories_pkey primary key (id),
  constraint categories_slug_key unique (slug),
  constraint categories_name_not_blank check (
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
  constraint categories_slug_not_blank check (
    (
      length(
        TRIM(
          both
          from
            slug
        )
      ) > 0
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_categories_is_active on public.categories using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_categories_sort_order on public.categories using btree (sort_order) TABLESPACE pg_default;

create trigger set_categories_updated_at BEFORE
update on categories for EACH row
execute FUNCTION set_updated_at ();

create trigger trg_categories_updated_at BEFORE
update on categories for EACH row
execute FUNCTION set_updated_at ();