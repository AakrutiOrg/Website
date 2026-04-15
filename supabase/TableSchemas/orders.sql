create table public.orders (
  id uuid not null default gen_random_uuid (),
  order_id text not null,
  customer_name text not null,
  phone text not null,
  email text null,
  city text null,
  state text null,
  country text null default 'India'::text,
  address_line1 text null,
  address_line2 text null,
  postal_code text null,
  notes text null,
  status text not null default 'pending'::text,
  subtotal numeric(12, 2) null,
  total_items integer not null default 0,
  email_status text not null default 'pending'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  market_id uuid null,
  tracking_number text null,
  delivery_type text null,
  cancellation_reason text null,
  fulfilled_at timestamp with time zone null,
  cancelled_at timestamp with time zone null,
  shipping_company text null,
  tracking_url text null,
  invoice_sent_at timestamp with time zone null,
  discount_amount numeric null,
  discount_type text null,
  constraint orders_pkey primary key (id),
  constraint orders_order_id_key unique (order_id),
  constraint orders_market_id_fkey foreign KEY (market_id) references markets (id) on delete RESTRICT,
  constraint orders_phone_not_blank check (
    (
      length(
        TRIM(
          both
          from
            phone
        )
      ) > 0
    )
  ),
  constraint orders_status_valid check (
    (
      status = any (
        array[
          'pending'::text,
          'confirmed'::text,
          'contacted'::text,
          'fulfilled'::text,
          'closed'::text,
          'cancelled'::text
        ]
      )
    )
  ),
  constraint orders_subtotal_non_negative check (
    (
      (subtotal is null)
      or (subtotal >= (0)::numeric)
    )
  ),
  constraint orders_customer_name_not_blank check (
    (
      length(
        TRIM(
          both
          from
            customer_name
        )
      ) > 0
    )
  ),
  constraint orders_total_items_non_negative check ((total_items >= 0)),
  constraint orders_delivery_type_valid check (
    (
      (delivery_type is null)
      or (
        delivery_type = any (array['tracked'::text, 'home_delivery'::text])
      )
    )
  ),
  constraint orders_email_status_valid check (
    (
      email_status = any (
        array['pending'::text, 'sent'::text, 'failed'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_orders_order_id on public.orders using btree (order_id) TABLESPACE pg_default;

create index IF not exists idx_orders_status on public.orders using btree (status) TABLESPACE pg_default;

create index IF not exists idx_orders_created_at on public.orders using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_orders_phone on public.orders using btree (phone) TABLESPACE pg_default;

create index IF not exists idx_orders_market_id on public.orders using btree (market_id) TABLESPACE pg_default;

create trigger trg_orders_updated_at BEFORE
update on orders for EACH row
execute FUNCTION set_updated_at ();