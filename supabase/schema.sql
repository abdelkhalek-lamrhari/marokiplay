-- CloudRig — Supabase schema
-- Run this in the Supabase SQL Editor after creating a new project.

create extension if not exists "pgcrypto";

create table if not exists public.reservations (
  id              uuid primary key default gen_random_uuid(),
  machine_id      text not null,
  machine_name    text not null,
  machine_tier    text not null,
  user_name       text not null,
  user_email      text not null,
  date            text not null,
  time_slot       text not null,
  duration        integer not null check (duration > 0),
  total_price     numeric(10,2) not null check (total_price >= 0),
  status          text not null default 'pending'
                  check (status in ('pending','approved','completed','cancelled')),
  payment_method  text default 'card',
  card_last4      text,
  created_at      timestamptz not null default now()
);

create index if not exists reservations_created_at_idx on public.reservations (created_at desc);
create index if not exists reservations_status_idx     on public.reservations (status);
create index if not exists reservations_machine_id_idx on public.reservations (machine_id);
create index if not exists reservations_user_email_idx on public.reservations (user_email);

-- Row Level Security
-- The app currently uses the anon key for all reads/writes (no auth yet),
-- so we allow anon access. Tighten this once auth is wired up.
alter table public.reservations enable row level security;

drop policy if exists "anon can read reservations"   on public.reservations;
drop policy if exists "anon can insert reservations" on public.reservations;
drop policy if exists "anon can update reservations" on public.reservations;

create policy "anon can read reservations"
  on public.reservations for select
  to anon, authenticated
  using (true);

create policy "anon can insert reservations"
  on public.reservations for insert
  to anon, authenticated
  with check (true);

create policy "anon can update reservations"
  on public.reservations for update
  to anon, authenticated
  using (true)
  with check (true);
