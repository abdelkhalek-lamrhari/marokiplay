"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Flame, Gamepad2, Star, Trophy, Zap, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { type Game, type GameTag } from "@/lib/games";
import { TIER_COLORS } from "@/lib/store";

type FilterTag = "all" | GameTag;

const FILTERS: { value: FilterTag; label: string; icon: typeof Flame }[] = [
  { value: "all",      label: "All",      icon: Gamepad2 },
  { value: "trending", label: "Trending", icon: Flame },
  { value: "popular",  label: "Popular",  icon: Star },
  { value: "esports",  label: "Esports",  icon: Trophy },
  { value: "new",      label: "New",      icon: Zap },
  { value: "free",     label: "Free",     icon: Star },
];

export default function GamesPage() {
  const [filter, setFilter] = useState<FilterTag>("all");
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/games")
      .then((r) => r.json())
      .then((data: Game[]) => setAllGames(data))
      .catch((err) => console.error("[games] load failed:", err))
      .finally(() => setLoading(false));
  }, []);

  const games = useMemo(() => {
    let list = allGames;
    if (filter !== "all") list = list.filter((g) => g.tags.includes(filter));
    return [...list].sort((a, b) => {
      const aR = a.trendingRank ?? 999;
      const bR = b.trendingRank ?? 999;
      return aR - bR;
    });
  }, [filter, allGames]);

  const trendingTop = useMemo(
    () =>
      allGames
        .filter((g) => g.tags.includes("trending"))
        .sort((a, b) => (a.trendingRank ?? 999) - (b.trendingRank ?? 999))
        .slice(0, 5),
    [allGames]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="relative border-b border-border/50 py-16 px-4 sm:px-6 overflow-hidden">
          <div className="scanline absolute inset-0 opacity-20 pointer-events-none" />
          <div className="max-w-7xl mx-auto relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-primary/30 bg-primary/5 mb-6">
              <Gamepad2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold tracking-widest uppercase text-primary" style={{ fontFamily: "var(--font-orbitron)" }}>
                Game Library
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3" style={{ fontFamily: "var(--font-orbitron)" }}>
              PLAY ANY <span className="neon-text-cyan">GAME</span>
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Stream from our cloud rigs — no downloads, no installs. Reserve a machine and jump straight into the game of your choice.
            </p>
          </div>
        </section>

        {/* Trending top 5 strip */}
        {trendingTop.length > 0 && (
          <section className="border-b border-border/50 py-10 px-4 sm:px-6 bg-surface-1/30">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <Flame className="w-4 h-4 text-orange-400" />
                <h2 className="text-sm font-black tracking-widest uppercase" style={{ fontFamily: "var(--font-orbitron)" }}>
                  Trending Now
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {trendingTop.map((g, i) => (
                  <Link
                    key={g.id}
                    href={`/machines?for=${g.id}`}
                    className="relative aspect-[460/215] rounded-sm overflow-hidden border border-border/50 group hover:border-primary/50 transition-colors"
                  >
                    <Image
                      src={g.image}
                      alt={g.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(min-width: 1024px) 20vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                    <div className="absolute top-2 left-2 w-8 h-8 rounded-sm bg-orange-400/90 text-background flex items-center justify-center font-black text-sm" style={{ fontFamily: "var(--font-orbitron)" }}>
                      {i + 1}
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="text-xs font-black text-foreground tracking-wide truncate" style={{ fontFamily: "var(--font-orbitron)" }}>
                        {g.title}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="border-b border-border/50 px-4 sm:px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-2 items-center">
            {FILTERS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-widest uppercase rounded-sm border transition-all ${
                  filter === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                }`}
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
            <div className="ml-auto text-xs text-muted-foreground">
              <span className="text-foreground font-bold">{games.length}</span> {games.length === 1 ? "game" : "games"}
            </div>
          </div>
        </section>

        {/* Game grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          {loading ? (
            <div className="text-center py-24 text-muted-foreground">Loading games…</div>
          ) : games.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">No games match that filter.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {games.map((g) => (
                <div key={g.id} className="card-gaming rounded-sm overflow-hidden group flex flex-col">
                  <div className="relative aspect-[460/215] overflow-hidden">
                    <Image
                      src={g.image}
                      alt={g.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/70 to-transparent" />
                    <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
                      {g.tags.includes("trending") && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-bold bg-orange-400/20 text-orange-400 border border-orange-400/30 rounded-sm">
                          <Flame className="w-2.5 h-2.5" /> Trending
                        </span>
                      )}
                      {g.tags.includes("new") && (
                        <span className="px-1.5 py-0.5 text-xs font-bold bg-cyan-400/20 text-cyan-400 border border-cyan-400/30 rounded-sm">New</span>
                      )}
                      {g.tags.includes("free") && (
                        <span className="px-1.5 py-0.5 text-xs font-bold bg-green-400/20 text-green-400 border border-green-400/30 rounded-sm">Free to Play</span>
                      )}
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-0.5 text-xs font-bold tracking-widest uppercase border rounded-sm ${TIER_COLORS[g.recommendedTier]}`} style={{ fontFamily: "var(--font-orbitron)" }}>
                        {g.recommendedTier}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-sm font-black tracking-wide mb-1" style={{ fontFamily: "var(--font-orbitron)" }}>
                      {g.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">{g.category}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{g.description}</p>
                    <Link
                      href={`/machines?for=${g.id}`}
                      className="mt-auto inline-flex items-center justify-center gap-1.5 py-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold tracking-widest uppercase rounded-sm hover:bg-primary/20 transition-colors"
                      style={{ fontFamily: "var(--font-orbitron)" }}
                    >
                      <Zap className="w-3 h-3" /> Find a Rig <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
