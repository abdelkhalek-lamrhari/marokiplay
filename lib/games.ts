import type { PerformanceTier } from "@/lib/store";

export type GameTag = "trending" | "popular" | "new" | "esports" | "free";
export type GameCategory =
  | "FPS"
  | "RPG"
  | "MOBA"
  | "Action"
  | "Battle Royale"
  | "Strategy"
  | "Sports"
  | "Adventure"
  | "Indie";

export interface Game {
  id: string;
  title: string;
  category: GameCategory;
  tags: GameTag[];
  recommendedTier: PerformanceTier;
  image: string;
  description: string;
  trendingRank?: number;
}

// Steam header image pattern. These URLs are public and stable.
const steam = (appid: number) =>
  `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;

export const GAMES: Game[] = [
  {
    id: "marvel-rivals",
    title: "Marvel Rivals",
    category: "FPS",
    tags: ["trending", "new", "free"],
    recommendedTier: "Pro",
    image: steam(2767030),
    description: "6v6 super-powered hero shooter from NetEase. Wreck destructible Marvel maps with iconic heroes.",
    trendingRank: 1,
  },
  {
    id: "path-of-exile-2",
    title: "Path of Exile 2",
    category: "RPG",
    tags: ["trending", "new"],
    recommendedTier: "Pro",
    image: steam(2694490),
    description: "Brutal next-gen ARPG with seven acts of cross-class skill gem combinations.",
    trendingRank: 2,
  },
  {
    id: "black-myth-wukong",
    title: "Black Myth: Wukong",
    category: "Action",
    tags: ["trending", "popular"],
    recommendedTier: "Pro",
    image: steam(2358720),
    description: "Action-RPG retelling of Journey to the West with shape-shifting combat.",
    trendingRank: 3,
  },
  {
    id: "helldivers-2",
    title: "Helldivers 2",
    category: "Action",
    tags: ["trending", "popular"],
    recommendedTier: "Pro",
    image: steam(553850),
    description: "Co-op third-person shooter. Spread managed democracy across the galaxy.",
    trendingRank: 4,
  },
  {
    id: "palworld",
    title: "Palworld",
    category: "Adventure",
    tags: ["trending"],
    recommendedTier: "Standard",
    image: steam(1623730),
    description: "Open-world survival crafting with creature collection and base building.",
    trendingRank: 5,
  },
  {
    id: "cs2",
    title: "Counter-Strike 2",
    category: "FPS",
    tags: ["popular", "esports", "free"],
    recommendedTier: "Standard",
    image: steam(730),
    description: "The world's most competitive 5v5 tactical shooter. Sub-tick networking + Source 2.",
  },
  {
    id: "dota-2",
    title: "Dota 2",
    category: "MOBA",
    tags: ["popular", "esports", "free"],
    recommendedTier: "Standard",
    image: steam(570),
    description: "The deepest MOBA. 124 heroes. Million-dollar tournaments.",
  },
  {
    id: "apex-legends",
    title: "Apex Legends",
    category: "Battle Royale",
    tags: ["popular", "esports", "free"],
    recommendedTier: "Standard",
    image: steam(1172470),
    description: "Hero shooter battle royale with squad-based movement and abilities.",
  },
  {
    id: "elden-ring",
    title: "Elden Ring",
    category: "RPG",
    tags: ["popular"],
    recommendedTier: "Pro",
    image: steam(1245620),
    description: "FromSoftware's open-world Soulslike. Tarnished arise.",
  },
  {
    id: "cyberpunk-2077",
    title: "Cyberpunk 2077",
    category: "RPG",
    tags: ["popular"],
    recommendedTier: "Pro",
    image: steam(1091500),
    description: "Open-world action-RPG in Night City. Phantom Liberty expansion included.",
  },
  {
    id: "baldurs-gate-3",
    title: "Baldur's Gate 3",
    category: "RPG",
    tags: ["popular"],
    recommendedTier: "Pro",
    image: steam(1086940),
    description: "Turn-based party RPG by Larian. The 2023 GOTY.",
  },
  {
    id: "witcher-3",
    title: "The Witcher 3: Wild Hunt",
    category: "RPG",
    tags: ["popular"],
    recommendedTier: "Standard",
    image: steam(292030),
    description: "Geralt's open-world masterpiece. Next-gen update included.",
  },
  {
    id: "rdr2",
    title: "Red Dead Redemption 2",
    category: "Adventure",
    tags: ["popular"],
    recommendedTier: "Pro",
    image: steam(1174180),
    description: "Rockstar's western epic. Arthur Morgan's story remains untouchable.",
  },
  {
    id: "gta-v",
    title: "Grand Theft Auto V",
    category: "Action",
    tags: ["popular"],
    recommendedTier: "Standard",
    image: steam(271590),
    description: "Open-world Los Santos chaos. Online + story modes.",
  },
  {
    id: "hogwarts-legacy",
    title: "Hogwarts Legacy",
    category: "RPG",
    tags: ["popular"],
    recommendedTier: "Pro",
    image: steam(990080),
    description: "Open-world wizarding-school RPG set in the 1800s.",
  },
  {
    id: "sea-of-thieves",
    title: "Sea of Thieves",
    category: "Adventure",
    tags: ["popular"],
    recommendedTier: "Standard",
    image: steam(1172620),
    description: "Co-op pirate sandbox. Sail, plunder, betray your friends.",
  },
  {
    id: "stardew-valley",
    title: "Stardew Valley",
    category: "Indie",
    tags: ["popular"],
    recommendedTier: "Standard",
    image: steam(413150),
    description: "Cozy farming RPG. Time will not save you from your turnips.",
  },
  {
    id: "hollow-knight",
    title: "Hollow Knight",
    category: "Indie",
    tags: ["popular"],
    recommendedTier: "Standard",
    image: steam(367520),
    description: "Hand-drawn Metroidvania of haunting beauty and brutal precision.",
  },
];
