-- CloudRig — admin role table
-- Replaces the PIN-only model. A user is admin iff their user_id is in this table.

create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Users can only read their own admin row. Used to answer "am I admin?" without
-- exposing the full list of admins to unauthorized callers.
drop policy if exists "users can read own admin row" on public.admin_users;
create policy "users can read own admin row"
  on public.admin_users for select
  to authenticated
  using (user_id = auth.uid());

-- Writes go through service role only.

-- Grant yourself admin (replace the email if needed).
insert into public.admin_users (user_id)
select id from auth.users where email = 'saad.zoubir@proton.me'
on conflict (user_id) do nothing;
