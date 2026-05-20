-- CloudRig — full overlap-prevention setup with conflict cleanup.
-- Safe to re-run; all steps are idempotent.

-- 1. Extension required for the exclusion constraint.
create extension if not exists btree_gist;

-- 2. Add the generated range column.
alter table public.reservations
  add column if not exists slot_range int4range
  generated always as (
    int4range(
      (split_part(time_slot, ':', 1))::int,
      (split_part(time_slot, ':', 1))::int + duration
    )
  ) stored;

-- 3. Cancel the later-created reservation in each overlapping pair so the
--    constraint can be added without conflict.
update public.reservations r
set status = 'cancelled'
where r.status <> 'cancelled'
  and exists (
    select 1
    from public.reservations other
    where other.id <> r.id
      and other.status <> 'cancelled'
      and other.machine_id = r.machine_id
      and other.date = r.date
      and other.slot_range && r.slot_range
      and other.created_at < r.created_at
  );

-- 4. Create the exclusion constraint.
alter table public.reservations
  drop constraint if exists reservations_no_overlap;

alter table public.reservations
  add constraint reservations_no_overlap
  exclude using gist (
    machine_id with =,
    date with =,
    slot_range with &&
  ) where (status <> 'cancelled');
