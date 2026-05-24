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
  trendingRank: number | null;
}

export function mapGameRow(row: Record<string, unknown>): Game {
  return {
    id: row.id as string,
    title: row.title as string,
    category: row.category as GameCategory,
    tags: ((row.tags as string[]) ?? []) as GameTag[],
    recommendedTier: row.recommended_tier as PerformanceTier,
    image: row.image as string,
    description: row.description as string,
    trendingRank: (row.trending_rank as number | null) ?? null,
  };
}
