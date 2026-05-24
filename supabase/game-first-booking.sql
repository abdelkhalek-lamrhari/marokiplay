-- MaRoKiPlay — game-first booking
-- Optional game context on reservations so we can show "Playing: X" everywhere.

alter table public.reservations
  add column if not exists game_id    text,
  add column if not exists game_title text;

create index if not exists reservations_game_id_idx on public.reservations (game_id);
