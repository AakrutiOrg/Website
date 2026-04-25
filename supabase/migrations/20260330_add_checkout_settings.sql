begin;

create table if not exists public.checkout_settings (
  id text primary key default 'default',
  order_notification_emails text[] not null default '{}',
  order_email_template text not null default E'New order enquiry from {{customer_name}}\n\nOrder ID: {{order_id}}\nEmail: {{customer_email}}\nPhone: {{customer_phone}}\nShipping address:\n{{shipping_address}}\n\nItems:\n{{order_lines}}\n\nTotal items: {{total_items}}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  bank_account_details text,
  admin_bcc_email text,

  constraint checkout_settings_singleton_check check (id = 'default')
);

create trigger trg_checkout_settings_updated_at
before update on public.checkout_settings
for each row
execute function public.set_updated_at();

insert into public.checkout_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.checkout_settings enable row level security;

create policy "Admins can manage checkout settings"
on public.checkout_settings
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

commit;
