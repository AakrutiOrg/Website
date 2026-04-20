alter table public.orders
  add column if not exists sale_channel text not null default 'online',
  add column if not exists payment_method text,
  add column if not exists payment_status text not null default 'pending',
  add column if not exists payment_provider text,
  add column if not exists payment_reference text,
  add column if not exists paid_at timestamptz;

update public.orders
set sale_channel = 'online'
where sale_channel is distinct from 'online'
  and sale_channel is null;

update public.orders
set payment_status = 'pending'
where payment_status is null;

alter table public.orders
  drop constraint if exists orders_sale_channel_valid,
  drop constraint if exists orders_payment_method_valid,
  drop constraint if exists orders_payment_status_valid;

alter table public.orders
  add constraint orders_sale_channel_valid
    check (sale_channel in ('online', 'pos')),
  add constraint orders_payment_method_valid
    check (payment_method is null or payment_method in ('cash', 'sumup_solo', 'bank_transfer')),
  add constraint orders_payment_status_valid
    check (payment_status in ('pending', 'paid', 'failed'));

create index if not exists idx_orders_sale_channel on public.orders using btree (sale_channel);
create index if not exists idx_orders_payment_status on public.orders using btree (payment_status);
create index if not exists idx_orders_paid_at on public.orders using btree (paid_at desc);
