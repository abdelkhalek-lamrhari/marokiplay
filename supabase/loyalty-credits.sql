-- MaRoKiPlay — loyalty credits
-- Users earn 10% cashback (in credits) on every completed reservation.
-- Credits are denominated in USD (numeric, 2 decimals). 1 credit = $1.
-- Requires public.users from supabase/users-table.sql.

-- 1) Balance column on users (running balance for fast reads).
alter table public.users
  add column if not exists credits numeric(10,2) not null default 0;

-- 2) Track how much credit was applied to each reservation.
alter table public.reservations
  add column if not exists credits_applied numeric(10,2) not null default 0;

-- 3) Append-only ledger for audit + transaction history.
create table if not exists public.credit_transactions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  amount         numeric(10,2) not null,        -- positive = earned, negative = redeemed
  reason         text not null,                 -- 'booking_completed' | 'redeemed' | 'admin_grant'
  reservation_id uuid references public.reservations(id) on delete set null,
  created_at     timestamptz not null default now()
);

create index if not exists credit_tx_user_idx on public.credit_transactions (user_id, created_at desc);

alter table public.credit_transactions enable row level security;
drop policy if exists "users read own transactions" on public.credit_transactions;
create policy "users read own transactions"
  on public.credit_transactions for select
  to authenticated
  using (user_id = auth.uid());
-- Writes happen via SECURITY DEFINER functions or service role only.

-- 4) Trigger: award credits when a reservation flips to 'completed'.
create or replace function public.award_completion_credits()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  earned numeric(10,2);
begin
  if new.user_id is null then return new; end if;
  earned := round((new.total_price * 0.10)::numeric, 2);
  if earned <= 0 then return new; end if;

  insert into public.credit_transactions (user_id, amount, reason, reservation_id)
  values (new.user_id, earned, 'booking_completed', new.id);

  update public.users set credits = credits + earned where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists on_reservation_completed on public.reservations;
create trigger on_reservation_completed
  after update of status on public.reservations
  for each row
  when (new.status = 'completed' and old.status is distinct from 'completed')
  execute function public.award_completion_credits();

-- 5) Atomic redeem RPC (used by POST /api/reservations).
--    Locks the user row, checks balance, decrements, logs transaction.
create or replace function public.redeem_credits(
  p_user_id        uuid,
  p_amount         numeric,
  p_reservation_id uuid
)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  current_balance numeric;
begin
  if p_amount <= 0 then return 0; end if;

  select credits into current_balance
    from public.users
    where id = p_user_id
    for update;

  if current_balance is null then raise exception 'user not found'; end if;
  if p_amount > current_balance then raise exception 'insufficient credits'; end if;

  update public.users set credits = credits - p_amount where id = p_user_id;
  insert into public.credit_transactions (user_id, amount, reason, reservation_id)
  values (p_user_id, -p_amount, 'redeemed', p_reservation_id);

  return current_balance - p_amount;
end;
$$;

grant execute on function public.redeem_credits(uuid, numeric, uuid) to authenticated, service_role;

-- 6) Backfill: award credits for any already-completed reservations linked to a user.
do $$
declare
  r record;
  earned numeric(10,2);
begin
  for r in
    select id, user_id, total_price
    from public.reservations
    where status = 'completed'
      and user_id is not null
      and not exists (
        select 1 from public.credit_transactions ct
        where ct.reservation_id = reservations.id and ct.reason = 'booking_completed'
      )
  loop
    earned := round((r.total_price * 0.10)::numeric, 2);
    if earned > 0 then
      insert into public.credit_transactions (user_id, amount, reason, reservation_id)
      values (r.user_id, earned, 'booking_completed', r.id);
      update public.users set credits = credits + earned where id = r.user_id;
    end if;
  end loop;
end $$;

-- 7) Sanity check
select
  (select count(*) from public.credit_transactions) as transactions,
  (select coalesce(sum(credits), 0) from public.users) as total_outstanding_credits;
