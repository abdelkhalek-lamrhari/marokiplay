-- CloudRig — machines table + seed
-- Run this in the Supabase SQL Editor.

create table if not exists public.machines (
  id              text primary key,
  name            text not null,
  tier            text not null check (tier in ('Ultra','Elite','Pro','Standard')),
  cpu             text not null,
  gpu             text not null,
  ram             text not null,
  storage         text not null,
  status          text not null default 'available'
                  check (status in ('available','booked','maintenance')),
  price_per_hour  numeric(10,2) not null check (price_per_hour >= 0),
  image           text not null,
  description     text not null,
  features        text[] not null default '{}',
  availability    text[] not null default '{}',
  platforms       text[] not null default '{}',
  latency         text not null,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists machines_status_idx on public.machines (status);
create index if not exists machines_tier_idx   on public.machines (tier);

alter table public.machines enable row level security;

drop policy if exists "anon can read machines"   on public.machines;
drop policy if exists "anon can write machines"  on public.machines;
drop policy if exists "anon can update machines" on public.machines;
drop policy if exists "anon can delete machines" on public.machines;

create policy "anon can read machines"
  on public.machines for select
  to anon, authenticated
  using (true);

-- Keep writes open for now (no auth yet); tighten once admin auth is wired up.
create policy "anon can write machines"
  on public.machines for insert
  to anon, authenticated
  with check (true);

create policy "anon can update machines"
  on public.machines for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "anon can delete machines"
  on public.machines for delete
  to anon, authenticated
  using (true);

-- Seed data
insert into public.machines (id, name, tier, cpu, gpu, ram, storage, status, price_per_hour, image, description, features, availability, platforms, latency, sort_order)
values
  ('titan-x','TITAN X','Ultra','Intel Core i9-14900K','NVIDIA RTX 4090 24GB','64GB DDR5 6400MHz','4TB NVMe PCIe 5.0','available',25,'/images/machine-titan.jpg',
    'The ultimate gaming powerhouse. Experience 4K/8K gaming at maximum settings with zero compromises.',
    array['8K Gaming Ready','240Hz Support','Ray Tracing Ultra','DLSS 3.5'],
    array['09:00','10:00','11:00','14:00','15:00','16:00','19:00','20:00'],
    array['PC','Mobile'], '<5ms', 1),

  ('phantom-pro','PHANTOM PRO','Elite','AMD Ryzen 9 7950X3D','NVIDIA RTX 4080 Super','32GB DDR5 5600MHz','2TB NVMe PCIe 4.0','available',18,'/images/machine-phantom.jpg',
    'Elite performance for competitive gaming and content creation. Dominate every frame.',
    array['4K/144Hz Gaming','VR Ready','Ray Tracing High','DLSS 3.0'],
    array['08:00','10:00','13:00','15:00','17:00','20:00','21:00'],
    array['PC','Mobile'], '<8ms', 2),

  ('nova-elite','NOVA ELITE','Pro','Intel Core i7-14700K','NVIDIA RTX 4070 Ti','32GB DDR5 5200MHz','2TB NVMe PCIe 4.0','available',14,'/images/machine-nova.jpg',
    'Professional-grade gaming rig for serious players. High performance at a competitive price.',
    array['1440p/165Hz Gaming','VR Compatible','Ray Tracing Medium','DLSS 2.0'],
    array['09:00','11:00','12:00','14:00','16:00','18:00','21:00'],
    array['PC','Mobile'], '<10ms', 3),

  ('apex-ultra','APEX ULTRA','Ultra','Intel Core i9-14900KS','NVIDIA RTX 4090 Ti OC','128GB DDR5 7200MHz','8TB NVMe RAID','booked',35,'/images/machine-apex.jpg',
    'The apex predator of gaming machines. Built for those who demand absolute maximum performance.',
    array['8K/120Hz Gaming','AI Upscaling','Ray Tracing Ultra+','DLSS 4.0'],
    array['12:00','13:00','17:00','18:00','22:00'],
    array['PC','Mobile'], '<5ms', 4),

  ('eclipse-mini','ECLIPSE MINI','Pro','AMD Ryzen 7 7800X3D','AMD RX 7900 XTX','32GB DDR5 5600MHz','1TB NVMe PCIe 4.0','available',12,'/images/machine-eclipse.jpg',
    'Compact powerhouse with AMD might. Small form factor, massive performance.',
    array['1440p/144Hz Gaming','FreeSync Premium','Compact Design','Efficient Cooling'],
    array['08:00','09:00','11:00','13:00','15:00','17:00','19:00'],
    array['PC','Mobile'], '<12ms', 5),

  ('storm-4k','STORM 4K','Elite','AMD Ryzen 9 7900X','NVIDIA RTX 4080 16GB','32GB DDR5 6000MHz','2TB NVMe PCIe 5.0','maintenance',16,'/images/machine-storm.jpg',
    'Storm through any game at 4K. Balanced performance and value for the discerning gamer.',
    array['4K/120Hz Gaming','G-Sync Compatible','Ray Tracing High','DLSS 3.0'],
    array['10:00','14:00','16:00','20:00'],
    array['PC','Mobile'], '<8ms', 6),

  ('lite-mobile','LITE MOBILE','Standard','Intel Core i5-13600K','NVIDIA GTX 1660 Super','16GB DDR4 3200MHz','512GB NVMe SSD','available',1,'/images/machine-lite.jpg',
    'Perfect entry-level cloud gaming experience optimized for mobile. Play PPSSPP, retro titles, and lightweight games at ultra-low latency for just $1/hr.',
    array['Mobile Optimized','1080p/60fps','Low Latency Stream','PPSSPP Ready'],
    array['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'],
    array['Mobile'], '<15ms', 7)
on conflict (id) do nothing;
