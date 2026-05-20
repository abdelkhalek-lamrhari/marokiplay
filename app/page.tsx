import Link from "next/link";
import Image from "next/image";
import { Zap, Cpu, Shield, Clock, ChevronRight, Star, Smartphone, Signal, DollarSign, Monitor } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { TIER_COLORS } from "@/lib/store";
import { getMachines } from "@/lib/machines";

const stats = [
  { value: "99.9%", label: "Uptime" },
  { value: "<5ms", label: "Latency" },
  { value: "7+", label: "Gaming Rigs" },
  { value: "$1/hr", label: "Starting Price" },
];

const features = [
  {
    icon: Smartphone,
    title: "Play on Mobile",
    desc: "Stream from your phone just like PPSSPP. Full cloud gaming experience on any device, anywhere.",
  },
  {
    icon: Signal,
    title: "Ultra-Low Latency",
    desc: "Our optimized streaming infrastructure delivers latency as low as 5ms for a lag-free experience.",
  },
  {
    icon: DollarSign,
    title: "From $1 / Hour",
    desc: "Entry-level cloud gaming starting at just $1/hr. Premium rigs available for serious players.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    desc: "Your sessions are fully isolated. Data wiped after every reservation.",
  },
  {
    icon: Cpu,
    title: "Top-Tier Hardware",
    desc: "RTX 4090s, latest CPUs, and NVMe storage. Always the best hardware available.",
  },
  {
    icon: Clock,
    title: "Flexible Scheduling",
    desc: "Book from 1 to 8 hours. Cancel or reschedule up to 30 minutes before.",
  },
];

export default async function HomePage() {
  const machines = await getMachines();
  const featuredMachines = machines.filter((m) => m.status !== "maintenance").slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-bg.jpg"
            alt="Cloud gaming server room"
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        {/* Scanline overlay */}
        <div className="absolute inset-0 scanline opacity-30 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-primary/30 bg-primary/5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase text-primary" style={{ fontFamily: "var(--font-orbitron)" }}>
                Next-Gen Cloud Gaming
              </span>
            </div>

            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-6"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              <span className="text-foreground">RENT THE</span>
              <br />
              <span className="neon-text-cyan animate-flicker">ULTIMATE</span>
              <br />
              <span className="text-foreground">GAMING RIG</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-xl" style={{ fontFamily: "var(--font-rajdhani)" }}>
              Reserve elite cloud gaming machines by the hour — on PC or mobile, just like PPSSPP.
              Starting from <span className="text-primary font-bold">$1/hr</span> with ultra-low latency. RTX 4090 power, zero hardware investment.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/machines"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold tracking-widest uppercase text-sm rounded-sm neon-glow-cyan hover:opacity-90 transition-opacity"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                <Zap className="w-4 h-4" />
                Browse Machines
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-8 py-4 border border-border hover:border-primary/50 text-foreground font-bold tracking-widest uppercase text-sm rounded-sm transition-colors"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                Admin Panel
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-16 pt-8 border-t border-border/50">
              {stats.map((s) => (
                <div key={s.label}>
                  <div
                    className="text-2xl font-black neon-text-cyan"
                    style={{ fontFamily: "var(--font-orbitron)" }}
                  >
                    {s.value}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl sm:text-4xl font-black tracking-tight mb-4"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              WHY <span className="neon-text-cyan">MAROKIPLAY</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Professional gaming infrastructure, now available by the hour.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="card-gaming rounded-sm p-6 group"
              >
                <div className="w-10 h-10 rounded-sm border border-primary/30 bg-primary/10 flex items-center justify-center mb-4 group-hover:border-primary/70 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3
                  className="text-sm font-bold tracking-widest uppercase mb-2 text-foreground"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Gaming Section */}
      <section className="py-24 px-4 sm:px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-primary/30 bg-primary/5 mb-6">
                <Smartphone className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold tracking-widest uppercase text-primary" style={{ fontFamily: "var(--font-orbitron)" }}>
                  Mobile Gaming
                </span>
              </div>
              <h2
                className="text-3xl sm:text-4xl font-black tracking-tight mb-4"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                PLAY ON YOUR{" "}
                <span className="neon-text-cyan">PHONE</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6 max-w-md">
                Stream full cloud gaming sessions directly to your smartphone — just like PPSSPP but on powerful remote hardware. No downloads. No limits. Connect from anywhere with our low-latency streaming.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: Signal, label: "Ultra-Low Latency", value: "As low as 5ms" },
                  { icon: DollarSign, label: "Low-End Entry Price", value: "$1 per hour" },
                  { icon: Monitor, label: "All Platforms", value: "Mobile + PC" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4 p-3 rounded-sm border border-border/50 bg-surface-1/20">
                    <div className="w-8 h-8 rounded-sm border border-primary/30 bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-widest">{item.label}</div>
                      <div className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-orbitron)" }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/machines"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-bold tracking-widest uppercase text-xs rounded-sm neon-glow-cyan hover:opacity-90 transition-opacity"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Start Mobile Session
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Image */}
            <div className="relative">
              <div className="relative rounded-sm overflow-hidden border border-border/50 aspect-[4/3]">
                <Image
                  src="/images/mobile-gaming.jpg"
                  alt="Mobile cloud gaming on smartphone"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                {/* Floating stats */}
                <div className="absolute bottom-4 left-4 right-4 flex gap-3">
                  <div className="flex-1 bg-background/80 backdrop-blur-sm border border-primary/30 rounded-sm p-3 text-center">
                    <div className="text-lg font-black neon-text-cyan" style={{ fontFamily: "var(--font-orbitron)" }}>$1</div>
                    <div className="text-xs text-muted-foreground">/hr standard</div>
                  </div>
                  <div className="flex-1 bg-background/80 backdrop-blur-sm border border-green-400/30 rounded-sm p-3 text-center">
                    <div className="text-lg font-black text-green-400" style={{ fontFamily: "var(--font-orbitron)" }}>&lt;15ms</div>
                    <div className="text-xs text-muted-foreground">latency</div>
                  </div>
                  <div className="flex-1 bg-background/80 backdrop-blur-sm border border-border rounded-sm p-3 text-center">
                    <div className="text-lg font-black text-foreground" style={{ fontFamily: "var(--font-orbitron)" }}>1080p</div>
                    <div className="text-xs text-muted-foreground">stream quality</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Machines */}
      <section className="py-24 px-4 sm:px-6 bg-surface-1/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2
                className="text-3xl sm:text-4xl font-black tracking-tight mb-2"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                FEATURED <span className="neon-text-cyan">RIGS</span>
              </h2>
              <p className="text-muted-foreground">Top-performing machines available right now</p>
            </div>
            <Link
              href="/machines"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-bold text-primary hover:opacity-80 transition-opacity tracking-widest uppercase"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredMachines.map((machine) => (
              <Link
                key={machine.id}
                href={`/machines/${machine.id}`}
                className="card-gaming rounded-sm overflow-hidden group"
              >
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={machine.image}
                    alt={machine.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold tracking-widest uppercase border rounded-sm ${TIER_COLORS[machine.tier]}`}
                      style={{ fontFamily: "var(--font-orbitron)" }}
                    >
                      {machine.tier}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold uppercase rounded-sm ${
                        machine.status === "available"
                          ? "bg-green-400/20 text-green-400 border border-green-400/30"
                          : "bg-red-400/20 text-red-400 border border-red-400/30"
                      }`}
                    >
                      {machine.status === "available" ? "Available" : "Booked"}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3
                    className="text-lg font-black tracking-widest mb-1 text-foreground"
                    style={{ fontFamily: "var(--font-orbitron)" }}
                  >
                    {machine.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{machine.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-black text-primary" style={{ fontFamily: "var(--font-orbitron)" }}>
                        ${machine.pricePerHour}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">/hr</span>
                    </div>
                    <span className="text-xs font-bold text-primary tracking-widest uppercase flex items-center gap-1">
                      Reserve <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Link
              href="/machines"
              className="inline-flex items-center gap-2 px-6 py-3 border border-border text-sm font-bold tracking-widest uppercase rounded-sm hover:border-primary/50 transition-colors"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              View All Machines <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative rounded-sm border border-primary/30 p-12 overflow-hidden gradient-gaming">
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <h2
                className="text-3xl sm:text-4xl font-black tracking-tight mb-4"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                READY TO PLAY AT{" "}
                <span className="neon-text-cyan">MAX SETTINGS</span>?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Join thousands of gamers who have already discovered the power of cloud gaming.
                No expensive hardware. Just pure performance.
              </p>
              <Link
                href="/machines"
                className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground font-bold tracking-widest uppercase text-sm rounded-sm neon-glow-cyan hover:opacity-90 transition-opacity"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                <Zap className="w-4 h-4" />
                Start Your Session
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span
              className="text-lg font-black tracking-widest neon-text-cyan"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              MAROKI<span className="text-foreground">PLAY</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground tracking-wide">
            © 2026 MaRoKiPlay. Premium Cloud Gaming Platform. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/machines" className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-widest uppercase">
              Machines
            </Link>
            <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-widest uppercase">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
