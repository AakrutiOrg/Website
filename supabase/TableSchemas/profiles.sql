create table public.profiles (
  id uuid not null,
  email text null,
  role text not null default 'customer'::text,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_role_check check (
    (
      role = any (array['admin'::text, 'customer'::text])
    )
  )
) TABLESPACE pg_default;

create trigger set_profiles_updated_at BEFORE
update on profiles for EACH row
execute FUNCTION set_updated_at ();