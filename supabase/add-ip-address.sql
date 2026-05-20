-- CloudRig — add ip_address column to machines
-- Nullable so existing rows don't break; admin can fill in via the editor.

alter table public.machines
  add column if not exists ip_address text;
