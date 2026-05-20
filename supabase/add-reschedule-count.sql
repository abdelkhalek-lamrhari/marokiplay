-- CloudRig — track reschedules per reservation
-- Users are allowed at most 2 reschedules per reservation.

alter table public.reservations
  add column if not exists reschedule_count integer not null default 0;
