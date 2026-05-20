-- CloudRig — prevent overlapping reservations
-- The previous unique index only caught identical (machine_id, date, time_slot) rows.
-- That misses the case where 09:00 dur=2 and 10:00 dur=1 both exist (they overlap at 10:00).
-- This adds a Postgres EXCLUDE constraint that catches any time-range overlap.

create extension if not exists btree_gist;

-- Generated column: int4range covering [start_hour, start_hour + duration).
-- E.g. time_slot='09:00' duration=2 → int4range(9, 11) covers hours 9 and 10.
alter table public.reservations
  add column if not exists slot_range int4range
  generated always as (
    int4range(
      (split_part(time_slot, ':', 1))::int,
      (split_part(time_slot, ':', 1))::int + duration
    )
  ) stored;

-- Exclusion constraint: no two non-cancelled reservations on the same machine+date
-- may have overlapping slot_range values.
alter table public.reservations
  drop constraint if exists reservations_no_overlap;

alter table public.reservations
  add constraint reservations_no_overlap
  exclude using gist (
    machine_id with =,
    date with =,
    slot_range with &&
  ) where (status <> 'cancelled');
