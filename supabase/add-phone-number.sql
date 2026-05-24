-- MaRoKiPlay — add phone_number to users
-- Captured at signup, editable in profile. Used by the session-start webhook
-- so the central PC knows which user is connecting.

alter table public.users
  add column if not exists phone_number text;

-- Extend signup trigger to backfill phone_number from raw_user_meta_data.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, phone_number)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'phone_number'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Extend update trigger to keep phone_number in sync if changed via supabase.auth.updateUser.
create or replace function public.handle_user_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.users
  set email = new.email,
      display_name = coalesce(new.raw_user_meta_data->>'name', display_name),
      phone_number = coalesce(new.raw_user_meta_data->>'phone_number', phone_number),
      updated_at = now()
  where id = new.id;
  return new;
end;
$$;
