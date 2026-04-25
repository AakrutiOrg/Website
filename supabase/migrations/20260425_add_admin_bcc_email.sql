begin;

alter table public.checkout_settings
add column if not exists admin_bcc_email text;

commit;
