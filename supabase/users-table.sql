-- MaRoKiPlay — public.users table mirroring auth.users
-- Auto-synced via triggers. Existing auth.users are backfilled.

-- 1) Schema
create table if not exists public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);

-- 2) Backfill any existing auth.users rows
insert into public.users (id, email, display_name, created_at)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'name', u.email),
  u.created_at
from auth.users u
on conflict (id) do nothing;

-- 3) Trigger: create matching row on new signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Trigger: keep email + name in sync on update
create or replace function public.handle_user_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.users
  set email = new.email,
      display_name = coalesce(new.raw_user_meta_data->>'name', display_name),
      updated_at = now()
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function public.handle_user_update();

-- 5) RLS — users see/update only their own row.
--    Admin reads via service role and bypasses these.
alter table public.users enable row level security;

drop policy if exists "users read own row"   on public.users;
drop policy if exists "users update own row" on public.users;

create policy "users read own row"
  on public.users for select
  to authenticated
  using (id = auth.uid());

create policy "users update own row"
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- 6) Sanity check
select
  (select count(*) from auth.users)   as auth_users_count,
  (select count(*) from public.users) as public_users_count;
