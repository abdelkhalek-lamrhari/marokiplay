-- CloudRig — prevent double-booking
-- Adds a partial unique index on (machine_id, date, time_slot) for active reservations.
-- Cancelled reservations are excluded so a freed slot can be re-booked.

create unique index if not exists reservations_no_double_book
  on public.reservations (machine_id, date, time_slot)
  where status <> 'cancelled';
