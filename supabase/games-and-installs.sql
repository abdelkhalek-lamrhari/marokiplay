-- MaRoKiPlay — games catalog + per-rig install manifest
-- Adds public.games (catalog) and public.machine_games (junction).
-- Seeds the 18 hardcoded games and auto-installs them on every rig that meets the tier.

-- ===== Catalog table =====
create table if not exists public.games (
  id               text primary key,
  title            text not null,
  category         text not null,
  tags             text[] not null default '{}',
  recommended_tier text not null check (recommended_tier in ('Standard','Pro','Elite','Ultra')),
  image            text not null,
  description      text not null,
  trending_rank    integer,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now()
);

create index if not exists games_trending_idx on public.games (trending_rank);
create index if not exists games_tier_idx     on public.games (recommended_tier);

alter table public.games enable row level security;
drop policy if exists "anyone can read games" on public.games;
create policy "anyone can read games"
  on public.games for select
  to anon, authenticated
  using (true);
-- Writes: service role only.

-- ===== Junction table =====
create table if not exists public.machine_games (
  machine_id   text not null references public.machines(id) on delete cascade,
  game_id      text not null references public.games(id)    on delete cascade,
  installed_at timestamptz not null default now(),
  primary key (machine_id, game_id)
);

create index if not exists machine_games_game_idx on public.machine_games (game_id);

alter table public.machine_games enable row level security;
drop policy if exists "anyone can read machine_games" on public.machine_games;
create policy "anyone can read machine_games"
  on public.machine_games for select
  to anon, authenticated
  using (true);
-- Writes: service role only.

-- ===== Seed games =====
insert into public.games (id, title, category, tags, recommended_tier, image, description, trending_rank, sort_order) values
  ('marvel-rivals','Marvel Rivals','FPS',array['trending','new','free'],'Pro','https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/2767030/header.jpg','6v6 super-powered hero shooter from NetEase. Wreck destructible Marvel maps with iconic heroes.',1,1),
  ('path-of-exile-2','Path of Exile 2','RPG',array['trending','new'],'Pro','https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/2694490/header.jpg','Brutal next-gen ARPG with seven acts of cross-class skill gem combinations.',2,2),
  ('black-myth-wukong','Black Myth: Wukong','Action',array['trending','popular'],'Pro','https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/2358720/header.jpg','Action-RPG retelling of Journey to the West with shape-shifting combat.',3,3),
  ('helldivers-2','Helldivers 2','Action',array['trending','popular'],'Pro','https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/553850/header.jpg','Co-op third-person shooter. Spread managed democracy across the galaxy.',4,4),
  ('palworld','Palworld','Adventure',array['trending'],'Standard','https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1623730/header.jpg','Open-world survival crafting with creature collection and base building.',5,5),
  ('cs2','Counter-Strike 2','FPS',array['popular','esports','free'],'Standard','https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/730/header.jpg','The world''s most competitive 5v5 tactical shooter. Sub-tick networking + Source 2.',null,6),
  ('dota-2','Dota 2','MOBA',array['popular','esports','free'],'Standard','https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/570/header.jpg','The deepest MOBA. 124 heroes. Million-dollar tournaments.',null,7),
  ('apex-legends','Apex Legends','Battle Royale',array['popular','esports','free'],'Standard','https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1172470/header.jpg','Hero shooter battle royale with squad-based movement and abilities.',null,8),
  ('elden-ring','Elden Ring','RPG',array['popular'],'Pro','https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg','FromSoftware''s open-world Soulslike. Tarnished arise.',null,9),
  ('cyberpunk-2077','Cyberpunk 2077','RPG',array['popular'],'Pro','https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg','Open-world action-RPG in Night City. Phantom Liberty expansion included.',null,10),
  ('baldurs-gate-3','Baldur''s Gate 3','RPG',array['popular'],'Pro','https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1086940/header.jpg','Turn-based party RPG by Larian. The 2023 GOTY.',null,11),
  ('witcher-3','The Witcher 3: Wild Hunt','RPG',array['popular'],'Standard','https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/292030/header.jpg','Geralt''s open-world masterpiece. Next-gen update included.',null,12),
  ('rdr2','Red Dead Redemption 2','Adventure',array['popular'],'Pro','https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1174180/header.jpg','Rockstar''s western epic. Arthur Morgan''s story remains untouchable.',null,13),
  ('gta-v','Grand Theft Auto V','Action',array['popular'],'Standard','https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/271590/header.jpg','Open-world Los Santos chaos. Online + story modes.',null,14),
  ('hogwarts-legacy','Hogwarts Legacy','RPG',array['popular'],'Pro','https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/990080/header.jpg','Open-world wizarding-school RPG set in the 1800s.',null,15),
  ('sea-of-thieves','Sea of Thieves','Adventure',array['popular'],'Standard','https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1172620/header.jpg','Co-op pirate sandbox. Sail, plunder, betray your friends.',null,16),
  ('stardew-valley','Stardew Valley','Indie',array['popular'],'Standard','https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/413150/header.jpg','Cozy farming RPG. Time will not save you from your turnips.',null,17),
  ('hollow-knight','Hollow Knight','Indie',array['popular'],'Standard','https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/367520/header.jpg','Hand-drawn Metroidvania of haunting beauty and brutal precision.',null,18)
on conflict (id) do nothing;

-- ===== Auto-install: each game on every rig with tier >= game's recommended tier =====
insert into public.machine_games (machine_id, game_id)
select m.id, g.id
from public.machines m
cross join public.games g
where
  (case g.recommended_tier when 'Standard' then 1 when 'Pro' then 2 when 'Elite' then 3 when 'Ultra' then 4 end)
  <=
  (case m.tier             when 'Standard' then 1 when 'Pro' then 2 when 'Elite' then 3 when 'Ultra' then 4 end)
on conflict do nothing;

-- ===== Sanity check =====
select
  (select count(*) from public.games)          as games_total,
  (select count(*) from public.machine_games)  as installs_total;
