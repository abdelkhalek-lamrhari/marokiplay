"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Zap, Filter, ChevronRight, Cpu, HardDrive, MemoryStick, Smartphone, Monitor, Signal, Gamepad2, X } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { TIER_COLORS, TIER_RANK, type GamingMachine, type PerformanceTier, type MachineStatus, type Platform } from "@/lib/store";
import { type Game } from "@/lib/games";

const TIERS: PerformanceTier[] = ["Ultra", "Elite", "Pro", "Standard"];
const STATUSES: MachineStatus[] = ["available", "booked", "maintenance"];
const PLATFORMS: Platform[] = ["PC", "Mobile", "Both"];

export default function MachinesPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    }>
      <MachinesPage />
    </Suspense>
  );
}

function MachinesPage() {
  const sp = useSearchParams();
  const forGameId = sp.get("for");

  const [forGame, setForGame] = useState<Game | null>(null);
  const [machines, setMachines] = useState<GamingMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<PerformanceTier | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<MachineStatus | "all">("all");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | "all">("all");

  useEffect(() => {
    fetch("/api/machines")
      .then((r) => r.json())
      .then((data: GamingMachine[]) => setMachines(data))
      .catch((err) => console.error("[machines] load failed:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!forGameId) { setForGame(null); return; }
    fetch(`/api/games/${forGameId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((g: Game | null) => setForGame(g))
      .catch((err) => console.error("[machines] game load failed:", err));
  }, [forGameId]);

  const filtered = machines.filter((m) => {
    if (selectedTier !== "all" && m.tier !== selectedTier) return false;
    if (selectedStatus !== "all" && m.status !== selectedStatus) return false;
    if (selectedPlatform !== "all" && !m.platforms.includes(selectedPlatform)) return false;
    if (forGame) {
      // Must (1) meet the tier and (2) have the game actually installed.
      if (TIER_RANK[m.tier] < TIER_RANK[forGame.recommendedTier]) return false;
      if (!m.installedGames.includes(forGame.id)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-16">
        {forGame && (
          <div className="border-b border-primary/30 bg-primary/5 px-4 sm:px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
              <Gamepad2 className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-muted-foreground">Booking for:</span>{" "}
                <span className="text-sm font-bold text-foreground">{forGame.title}</span>{" "}
                <span className="text-xs text-muted-foreground">— showing rigs with this game installed that meet {forGame.recommendedTier} tier or better</span>
              </div>
              <Link
                href="/machines"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                title="Clear game context"
              >
                <X className="w-3 h-3" /> Clear
              </Link>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="relative border-b border-border/50 py-16 px-4 sm:px-6 overflow-hidden">
          <div className="scanline absolute inset-0 opacity-20 pointer-events-none" />
          <div className="max-w-7xl mx-auto relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-primary/30 bg-primary/5 mb-6">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold tracking-widest uppercase text-primary" style={{ fontFamily: "var(--font-orbitron)" }}>
                Available Rigs
              </span>
            </div>
            <h1
              className="text-4xl sm:text-5xl font-black tracking-tight mb-3"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              CHOOSE YOUR <span className="neon-text-cyan">MACHINE</span>
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Select from our fleet of elite gaming machines. Filter by performance tier or availability.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b border-border/50 px-4 sm:px-6 py-4 bg-surface-1/30">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground" style={{ fontFamily: "var(--font-orbitron)" }}>
                Filters
              </span>
            </div>

            {/* Tier Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Tier:</span>
              {(["all", ...TIERS] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`px-3 py-1 text-xs font-bold tracking-widest uppercase rounded-sm border transition-all ${
                    selectedTier === tier
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                  }`}
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  {tier === "all" ? "All" : tier}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Status:</span>
              {(["all", ...STATUSES] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1 text-xs font-bold tracking-widest uppercase rounded-sm border transition-all ${
                    selectedStatus === status
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                  }`}
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  {status === "all" ? "All" : status}
                </button>
              ))}
            </div>

            {/* Platform Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Platform:</span>
              {(["all", ...PLATFORMS] as const).map((platform) => (
                <button
                  key={platform}
                  onClick={() => setSelectedPlatform(platform)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold tracking-widest uppercase rounded-sm border transition-all ${
                    selectedPlatform === platform
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                  }`}
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  {platform === "Mobile" && <Smartphone className="w-3 h-3" />}
                  {platform === "PC" && <Monitor className="w-3 h-3" />}
                  {platform === "all" ? "All" : platform}
                </button>
              ))}
            </div>

            <div className="ml-auto text-xs text-muted-foreground">
              <span className="text-foreground font-bold">{filtered.length}</span> machines
            </div>
          </div>
        </div>

        {/* Machine Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          {loading ? (
            <div className="text-center py-24">
              <p className="text-muted-foreground">Loading machines…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-muted-foreground">No machines match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((machine) => {
                const isAvailable = machine.status === "available";
                return (
                  <div
                    key={machine.id}
                    className={`card-gaming rounded-sm overflow-hidden ${!isAvailable ? "opacity-60" : ""}`}
                  >
                    {/* Image */}
                    <div className="relative h-56 overflow-hidden">
                      <Image
                        src={machine.image}
                        alt={machine.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold tracking-widest uppercase border rounded-sm ${TIER_COLORS[machine.tier]}`}
                          style={{ fontFamily: "var(--font-orbitron)" }}
                        >
                          {machine.tier}
                        </span>
                        {machine.platforms.map((p) => (
                          <span
                            key={p}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold border rounded-sm bg-background/70 border-border text-muted-foreground"
                          >
                            {p === "Mobile" ? <Smartphone className="w-2.5 h-2.5" /> : <Monitor className="w-2.5 h-2.5" />}
                            {p}
                          </span>
                        ))}
                      </div>
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded-sm border ${
                            machine.status === "available"
                              ? "bg-green-400/20 text-green-400 border-green-400/30"
                              : machine.status === "booked"
                              ? "bg-red-400/20 text-red-400 border-red-400/30"
                              : "bg-yellow-400/20 text-yellow-400 border-yellow-400/30"
                          }`}
                        >
                          {machine.status === "available" ? "Available" : machine.status === "booked" ? "Booked" : "Maintenance"}
                        </span>
                      </div>

                      {/* Price overlay */}
                      <div className="absolute bottom-3 right-3">
                        <div className="bg-background/80 backdrop-blur-sm border border-border rounded-sm px-2 py-1">
                          <span className="text-lg font-black text-primary" style={{ fontFamily: "var(--font-orbitron)" }}>
                            ${machine.pricePerHour}
                          </span>
                          <span className="text-xs text-muted-foreground">/hr</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3
                        className="text-lg font-black tracking-widest mb-1"
                        style={{ fontFamily: "var(--font-orbitron)" }}
                      >
                        {machine.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                        {machine.description}
                      </p>

                      {/* Specs */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Cpu className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                          <span className="truncate">{machine.cpu}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Zap className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                          <span className="truncate">{machine.gpu}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MemoryStick className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                          <span>{machine.ram}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <HardDrive className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                          <span>{machine.storage}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Signal className="w-3.5 h-3.5 text-green-400/80 shrink-0" />
                          <span className="text-green-400 font-bold">{machine.latency} latency</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {machine.features.map((f) => (
                          <span
                            key={f}
                            className="px-2 py-0.5 text-xs border border-border/50 text-muted-foreground rounded-sm"
                          >
                            {f}
                          </span>
                        ))}
                      </div>

                      {/* CTA */}
                      {isAvailable ? (
                        <Link
                          href={forGame ? `/machines/${machine.id}?for=${forGame.id}` : `/machines/${machine.id}`}
                          className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground text-xs font-bold tracking-widest uppercase rounded-sm neon-glow-cyan hover:opacity-90 transition-opacity"
                          style={{ fontFamily: "var(--font-orbitron)" }}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Reserve This Rig
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="flex items-center justify-center gap-2 w-full py-3 border border-border text-xs font-bold tracking-widest uppercase rounded-sm text-muted-foreground cursor-not-allowed"
                          style={{ fontFamily: "var(--font-orbitron)" }}
                        >
                          {machine.status === "booked" ? "Currently Booked" : "Under Maintenance"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
