-- CloudRig — RLS tightening
-- Run this AFTER deploying the code changes that migrate admin operations to the service role.
-- The service role bypasses RLS, so admin keeps working. Anon clients are restricted as below.

-- ===== RESERVATIONS =====
-- Drop the old wide-open policies.
drop policy if exists "anon can read reservations"   on public.reservations;
drop policy if exists "anon can insert reservations" on public.reservations;
drop policy if exists "anon can update reservations" on public.reservations;

-- SELECT: users see only their own reservations. (Admin reads via service role and bypasses RLS.)
create policy "users read own reservations"
  on public.reservations for select
  to anon, authenticated
  using (user_id = auth.uid());

-- INSERT: anyone can create a reservation (guests with null user_id, or logged-in users).
-- If user_id is set, it MUST match the authenticated user. Guests must leave it null.
create policy "anyone can create reservations"
  on public.reservations for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

-- UPDATE: users can update only their own reservation, and only to cancel it.
create policy "users can cancel own reservations"
  on public.reservations for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and status = 'cancelled');

-- ===== MACHINES =====
-- Drop the old wide-open policies.
drop policy if exists "anon can read machines"   on public.machines;
drop policy if exists "anon can write machines"  on public.machines;
drop policy if exists "anon can update machines" on public.machines;
drop policy if exists "anon can delete machines" on public.machines;

-- SELECT: everyone can read the machine list (public catalog).
-- Admin still reads via service role; that's fine, it bypasses RLS.
create policy "anyone can read machines"
  on public.machines for select
  to anon, authenticated
  using (true);

-- INSERT/UPDATE/DELETE: blocked for anon and authenticated.
-- All admin writes go through the service role from server routes.
-- (No policies added means anon/authenticated cannot write.)
