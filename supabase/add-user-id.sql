-- CloudRig — link reservations to authenticated users
-- user_id is nullable so guest bookings still work.

alter table public.reservations
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists reservations_user_id_idx on public.reservations (user_id);
