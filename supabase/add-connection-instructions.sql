-- CloudRig — add connection_instructions to machines
-- Free-form text shown to the user on /my-reservations once their reservation is approved.
-- Useful for: port numbers, launcher URLs, login credentials, special setup notes.

alter table public.machines
  add column if not exists connection_instructions text;
