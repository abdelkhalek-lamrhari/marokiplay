-- MaRoKiPlay — seed demo bookings for May 16–22, 2026
-- 7 machines × 7 days × 10 hourly slots = 490 reservations
-- Moroccan demo users, all with @gmail.com emails.

-- 1) Expand each machine's availability so the UI shows the booked slots.
update public.machines
set availability = array[
  '09:00','10:00','11:00','12:00','13:00',
  '14:00','15:00','16:00','17:00','18:00',
  '19:00','20:00','21:00','22:00'
];

-- 2) Idempotency: clear any prior demo seed rows in this date range
--    (guest bookings only — real user bookings stay untouched).
delete from public.reservations
where date between '2026-05-16' and '2026-05-22'
  and user_id is null
  and (user_email like '%@gmail.com' or user_email like '%@example.com');

-- 3) Generate demo reservations.
do $$
declare
  m record;
  d date;
  hr int;
  user_idx int := 0;
  names text[] := array[
    'Mohammed El Amrani','Fatima Bennani','Youssef Tazi','Aisha Alaoui','Omar Idrissi',
    'Khadija Cherkaoui','Karim Berrada','Salma Benjelloun','Hamza Bouhsira','Sara Chraibi',
    'Ayoub Fassi','Yasmine Hassani','Khalid Lahlou','Imane Mansouri','Yassine Naciri',
    'Nadia Sebti','Mehdi Saadi','Houda Tahri','Rachid Lamrhari','Latifa Zahra',
    'Said Belkadi','Samira Bouchareb','Hicham El Khattabi','Souad El Mouden','Adil Filali',
    'Naima Ghazali','Bilal Hadioui','Karima Jalal','Ismail Kettani','Wafa Lemrini',
    'Anas Marrakchi','Hajar Nejjar','Othmane Ouazzani','Asma Qadiri','Soufiane Rifai',
    'Ikram Senhaji','Abdellah Touhami','Lina Yacoubi','Reda Zniber','Soukaina Boukhari'
  ];
  picked_name text;
  picked_email text;
  rand_status text;
  rand_card text;
  rng numeric;
begin
  for m in select id, name, tier, price_per_hour from public.machines loop
    for d in select generate_series('2026-05-16'::date, '2026-05-22'::date, '1 day'::interval)::date loop
      for hr in 9..18 loop  -- 10 slots: 09:00 through 18:00
        picked_name := names[1 + (user_idx % array_length(names, 1))];
        picked_email := lower(replace(picked_name, ' ', '.')) || '@gmail.com';
        rand_card := lpad((random() * 9999)::int::text, 4, '0');

        rng := random();
        if rng < 0.70 then
          rand_status := 'completed';
        elsif rng < 0.88 then
          rand_status := 'cancelled';
        elsif rng < 0.97 then
          rand_status := 'approved';
        else
          rand_status := 'pending';
        end if;

        -- Skip slots that already collide with an existing non-cancelled booking
        -- (catches both the unique index and the exclusion constraint).
        begin
          insert into public.reservations (
            machine_id, machine_name, machine_tier,
            user_name, user_email, date, time_slot,
            duration, total_price, status, payment_method, card_last4
          ) values (
            m.id, m.name, m.tier,
            picked_name, picked_email,
            d::text, lpad(hr::text, 2, '0') || ':00',
            1, m.price_per_hour, rand_status, 'card', rand_card
          );
        exception
          when unique_violation then null;
          when exclusion_violation then null;
        end;

        user_idx := user_idx + 1;
      end loop;
    end loop;
  end loop;
end $$;

-- 4) Sanity-check counts.
select
  (select count(*) from public.reservations where date between '2026-05-16' and '2026-05-22') as total_seeded,
  (select count(*) from public.reservations where date between '2026-05-16' and '2026-05-22' and status = 'completed') as completed,
  (select count(*) from public.reservations where date between '2026-05-16' and '2026-05-22' and status = 'cancelled') as cancelled,
  (select count(*) from public.reservations where date between '2026-05-16' and '2026-05-22' and status = 'approved')  as approved,
  (select count(*) from public.reservations where date between '2026-05-16' and '2026-05-22' and status = 'pending')   as pending;
