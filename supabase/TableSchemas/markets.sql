create table public.markets (
  id uuid not null default gen_random_uuid (),
  name text not null,
  code text not null,
  currency text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint markets_pkey primary key (id),
  constraint markets_code_key unique (code),
  constraint markets_code_not_blank check (
    (
      length(
        TRIM(
          both
          from
            code
        )
      ) > 0
    )
  ),
  constraint markets_currency_not_blank check (
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
  constraint markets_name_not_blank check (
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

create index IF not exists idx_markets_is_active on public.markets using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_markets_sort_order on public.markets using btree (sort_order) TABLESPACE pg_default;

create trigger trg_markets_updated_at BEFORE
update on markets for EACH row
execute FUNCTION set_updated_at ();