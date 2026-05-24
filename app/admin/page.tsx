"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Zap, Shield, Users, Calendar, TrendingUp, CheckCircle2, XCircle,
  Clock, Search, Filter, RefreshCw, Cpu, Activity, DollarSign,
  ChevronDown, AlertTriangle, Plus, Trash2, Pencil, X, BarChart3
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie
} from "recharts";
import {
  STATUS_COLORS, TIER_COLORS,
  type GamingMachine, type MachineStatus, type PerformanceTier, type Platform,
  type Reservation, type ReservationStatus
} from "@/lib/store";
import { type Game } from "@/lib/games";

type MachineFormState = {
  id: string;
  name: string;
  tier: PerformanceTier;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  status: MachineStatus;
  pricePerHour: string;
  image: string;
  description: string;
  features: string;
  availability: string;
  platforms: string;
  latency: string;
  ipAddress: string;
  connectionInstructions: string;
};

const emptyMachineForm: MachineFormState = {
  id: "", name: "", tier: "Pro", cpu: "", gpu: "", ram: "", storage: "",
  status: "available", pricePerHour: "", image: "/images/machine-titan.jpg",
  description: "", features: "", availability: "", platforms: "PC", latency: "<10ms",
  ipAddress: "", connectionInstructions: "",
};

type TabType = "overview" | "analytics" | "reservations" | "machines" | "admins";

type AdminEntry = { userId: string; email: string; grantedAt: string };

type AuthState = "checking" | "anon" | "not_admin" | "admin";

export default function AdminPage() {
  const [authState, setAuthState] = useState<AuthState>("checking");

  // Verify admin role from the user's session on mount.
  useEffect(() => {
    fetch("/api/admin/verify").then(async (r) => {
      if (r.ok) {
        setAuthState("admin");
      } else if (r.status === 401) {
        setAuthState("anon");
      } else {
        setAuthState("not_admin");
      }
    }).catch(() => setAuthState("anon"));
  }, []);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [machines, setMachines] = useState<GamingMachine[]>([]);
  const [tab, setTab] = useState<TabType>("overview");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [machineForm, setMachineForm] = useState<MachineFormState>(emptyMachineForm);
  const [machineFormError, setMachineFormError] = useState("");
  const [savingMachine, setSavingMachine] = useState(false);
  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [grantingAdmin, setGrantingAdmin] = useState(false);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [installedGameIds, setInstalledGameIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const adminHeaders = useCallback(
    () => ({ "Content-Type": "application/json" }),
    []
  );

  const loadReservations = useCallback(async () => {
    try {
      const res = await fetch("/api/reservations");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      // Map snake_case DB columns to camelCase for compatibility
      setReservations(
        data.map((r: Record<string, unknown>) => ({
          id: r.id,
          machineId: r.machine_id,
          machineName: r.machine_name,
          machineTier: r.machine_tier,
          userName: r.user_name,
          userEmail: r.user_email,
          date: r.date,
          timeSlot: r.time_slot,
          duration: r.duration,
          totalPrice: r.total_price,
          status: r.status,
          createdAt: r.created_at,
          paymentMethod: r.payment_method,
          cardLast4: r.card_last4,
        }))
      );
    } catch (err) {
      console.error("[v0] Failed to load reservations:", err);
    }
  }, []);

  const loadMachines = useCallback(async () => {
    try {
      const res = await fetch("/api/machines");
      if (!res.ok) throw new Error("Failed to load");
      const data: GamingMachine[] = await res.json();
      setMachines(data);
    } catch (err) {
      console.error("[v0] Failed to load machines:", err);
    }
  }, []);

  const loadGames = useCallback(async () => {
    try {
      const res = await fetch("/api/games");
      if (!res.ok) throw new Error("Failed to load games");
      setAllGames(await res.json());
    } catch (err) {
      console.error("[admin] failed to load games:", err);
    }
  }, []);

  const loadAdmins = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/admins");
      if (!res.ok) throw new Error("Failed to load admins");
      const data: AdminEntry[] = await res.json();
      setAdmins(data);
    } catch (err) {
      console.error("[admin] failed to load admins:", err);
    }
  }, []);

  useEffect(() => {
    if (authState === "admin") {
      loadReservations();
      loadMachines();
      loadAdmins();
      loadGames();
    }
  }, [authState, loadReservations, loadMachines, loadAdmins, loadGames]);

  const grantAdmin = async () => {
    const email = newAdminEmail.trim();
    if (!email) return;
    setGrantingAdmin(true);
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ email }),
    });
    setGrantingAdmin(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to grant admin");
      return;
    }
    toast.success(`${email} is now admin`);
    setNewAdminEmail("");
    await loadAdmins();
  };

  const revokeAdmin = async (entry: AdminEntry) => {
    if (!confirm(`Revoke admin from ${entry.email}?`)) return;
    const res = await fetch(`/api/admin/admins/${entry.userId}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to revoke");
      return;
    }
    toast.success(`Revoked admin from ${entry.email}`);
    await loadAdmins();
  };

  const handleStatusChange = async (id: string, status: ReservationStatus) => {
    const res = await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(`Reservation ${status}`);
      loadReservations();
    } else {
      toast.error("Failed to update reservation");
    }
  };

  const openCreateMachine = () => {
    setEditorMode("create");
    setMachineForm(emptyMachineForm);
    setInstalledGameIds(new Set());
    setMachineFormError("");
    setEditorOpen(true);
  };

  const openEditMachine = (m: GamingMachine) => {
    setEditorMode("edit");
    setInstalledGameIds(new Set(m.installedGames));
    setMachineForm({
      id: m.id,
      name: m.name,
      tier: m.tier,
      cpu: m.cpu,
      gpu: m.gpu,
      ram: m.ram,
      storage: m.storage,
      status: m.status,
      pricePerHour: String(m.pricePerHour),
      image: m.image,
      description: m.description,
      features: m.features.join(", "),
      availability: m.availability.join(", "),
      platforms: m.platforms.join(", "),
      latency: m.latency,
      ipAddress: m.ipAddress ?? "",
      connectionInstructions: m.connectionInstructions ?? "",
    });
    setMachineFormError("");
    setEditorOpen(true);
  };

  const splitCsv = (s: string) => s.split(",").map((v) => v.trim()).filter(Boolean);

  const saveMachine = async () => {
    setMachineFormError("");
    if (!machineForm.id.trim() || !machineForm.name.trim()) {
      setMachineFormError("ID and name are required");
      return;
    }
    const price = Number(machineForm.pricePerHour);
    if (!Number.isFinite(price) || price < 0) {
      setMachineFormError("Price must be a non-negative number");
      return;
    }

    const payload = {
      id: machineForm.id.trim(),
      name: machineForm.name.trim(),
      tier: machineForm.tier,
      cpu: machineForm.cpu.trim(),
      gpu: machineForm.gpu.trim(),
      ram: machineForm.ram.trim(),
      storage: machineForm.storage.trim(),
      status: machineForm.status,
      pricePerHour: price,
      image: machineForm.image.trim(),
      description: machineForm.description.trim(),
      features: splitCsv(machineForm.features),
      availability: splitCsv(machineForm.availability),
      platforms: splitCsv(machineForm.platforms) as Platform[],
      latency: machineForm.latency.trim(),
      ipAddress: machineForm.ipAddress.trim() || null,
      connectionInstructions: machineForm.connectionInstructions.trim() || null,
    };

    setSavingMachine(true);
    try {
      const url = editorMode === "create" ? "/api/machines" : `/api/machines/${payload.id}`;
      const method = editorMode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: adminHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save");
      }

      // Persist installed-games selection.
      const installRes = await fetch(`/api/machines/${payload.id}/games`, {
        method: "PUT",
        headers: adminHeaders(),
        body: JSON.stringify({ gameIds: Array.from(installedGameIds) }),
      });
      if (!installRes.ok) {
        const err = await installRes.json().catch(() => ({}));
        throw new Error(err.error ?? "Saved machine but failed to update installed games");
      }

      toast.success(editorMode === "create" ? "Machine created" : "Machine updated");
      setEditorOpen(false);
      await loadMachines();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      setMachineFormError(msg);
      toast.error(msg);
    } finally {
      setSavingMachine(false);
    }
  };

  const deleteMachine = async (id: string) => {
    if (!confirm(`Delete machine "${id}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/machines/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(`Delete failed: ${err.error ?? "unknown error"}`);
      return;
    }
    toast.success("Machine deleted");
    await loadMachines();
  };

  const cycleMachineStatus = async (m: GamingMachine) => {
    const order: MachineStatus[] = ["available", "booked", "maintenance"];
    const next = order[(order.indexOf(m.status) + 1) % order.length];
    const res = await fetch(`/api/machines/${m.id}`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(`Status change failed: ${err.error ?? "unknown error"}`);
      return;
    }
    toast.success(`Status set to ${next}`);
    await loadMachines();
  };


  const filtered = reservations.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.userName.toLowerCase().includes(q) || r.userEmail.toLowerCase().includes(q) || r.machineName.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === "pending").length,
    approved: reservations.filter((r) => r.status === "approved").length,
    completed: reservations.filter((r) => r.status === "completed").length,
    revenue: reservations.filter((r) => r.status !== "cancelled").reduce((s, r) => s + r.totalPrice, 0),
  };

  // ----- Analytics -----
  const analytics = useMemo(() => {
    const valid = reservations.filter((r) => r.status !== "cancelled");
    const now = new Date();
    const ymdToday = now.toISOString().split("T")[0];
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();

    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday-start week
    const weekStartYmd = startOfWeek.toISOString().split("T")[0];

    const parseYmd = (s: string) => {
      const [y, m, d] = s.split("-").map(Number);
      return { y, m: m - 1, d };
    };

    let todayRev = 0, weekRev = 0, monthRev = 0, yearRev = 0, allRev = 0;
    let todayCount = 0, weekCount = 0, monthCount = 0, yearCount = 0;
    const daily = new Map<string, number>();
    const monthly = new Map<string, number>();
    const yearly = new Map<string, number>();
    const byMachine = new Map<string, { name: string; revenue: number; count: number }>();

    for (const r of valid) {
      const { y, m } = parseYmd(r.date);
      const price = Number(r.totalPrice);
      allRev += price;
      if (r.date === ymdToday) { todayRev += price; todayCount++; }
      if (r.date >= weekStartYmd && r.date <= ymdToday) { weekRev += price; weekCount++; }
      if (y === thisYear && m === thisMonth) { monthRev += price; monthCount++; }
      if (y === thisYear) { yearRev += price; yearCount++; }

      daily.set(r.date, (daily.get(r.date) ?? 0) + price);
      const monthKey = `${y}-${String(m + 1).padStart(2, "0")}`;
      monthly.set(monthKey, (monthly.get(monthKey) ?? 0) + price);
      yearly.set(String(y), (yearly.get(String(y)) ?? 0) + price);

      const existing = byMachine.get(r.machineId);
      byMachine.set(r.machineId, {
        name: r.machineName,
        revenue: (existing?.revenue ?? 0) + price,
        count: (existing?.count ?? 0) + 1,
      });
    }

    // Last 30 days, oldest → newest
    const dailySeries: { date: string; label: string; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailySeries.push({
        date: key,
        label: `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`,
        revenue: Math.round(((daily.get(key) ?? 0)) * 100) / 100,
      });
    }

    // Last 12 months, oldest → newest
    const monthlySeries: { key: string; label: string; revenue: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlySeries.push({
        key,
        label: d.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
        revenue: Math.round(((monthly.get(key) ?? 0)) * 100) / 100,
      });
    }

    const yearlySeries = Array.from(yearly.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, revenue]) => ({ year, revenue: Math.round(revenue * 100) / 100 }));

    const machineSeries = Array.from(byMachine.values())
      .sort((a, b) => b.revenue - a.revenue);

    const statusBreakdown = [
      { name: "pending",   value: reservations.filter((r) => r.status === "pending").length,   fill: "#facc15" },
      { name: "approved",  value: reservations.filter((r) => r.status === "approved").length,  fill: "#22d3ee" },
      { name: "completed", value: reservations.filter((r) => r.status === "completed").length, fill: "#4ade80" },
      { name: "cancelled", value: reservations.filter((r) => r.status === "cancelled").length, fill: "#f87171" },
    ].filter((s) => s.value > 0);

    const avgBookingValue = valid.length > 0 ? allRev / valid.length : 0;
    const totalHoursBooked = valid.reduce((s, r) => s + Number(r.duration), 0);

    return {
      kpis: {
        today: { revenue: todayRev, count: todayCount },
        week: { revenue: weekRev, count: weekCount },
        month: { revenue: monthRev, count: monthCount },
        year: { revenue: yearRev, count: yearCount },
        all: { revenue: allRev, count: valid.length },
        avgBookingValue,
        totalHoursBooked,
      },
      dailySeries,
      monthlySeries,
      yearlySeries,
      machineSeries,
      statusBreakdown,
    };
  }, [reservations]);

  // Auth gate
  if (authState === "checking") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-muted-foreground">Verifying…</p>
      </div>
    );
  }

  if (authState === "anon") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex w-16 h-16 rounded-sm border border-primary/30 bg-primary/10 items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black tracking-widest neon-text-cyan mb-2" style={{ fontFamily: "var(--font-orbitron)" }}>
            ADMIN ACCESS
          </h1>
          <p className="text-muted-foreground text-sm mb-6">You must be signed in to access the admin panel.</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground text-sm font-bold tracking-widest uppercase rounded-sm neon-glow-cyan"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (authState === "not_admin") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex w-16 h-16 rounded-sm border border-red-400/30 bg-red-400/10 items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-black tracking-widest mb-2 text-red-400" style={{ fontFamily: "var(--font-orbitron)" }}>
            ACCESS DENIED
          </h1>
          <p className="text-muted-foreground text-sm mb-6">Your account doesn&apos;t have admin privileges.</p>
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to MaRoKiPlay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Admin Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-black tracking-widest text-lg" style={{ fontFamily: "var(--font-orbitron)" }}>
              <span className="neon-text-cyan">MAROKI</span>PLAY ADMIN
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadReservations}
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-primary/30 bg-primary/5 text-xs font-bold text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              System Online
            </span>
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-widest uppercase" style={{ fontFamily: "var(--font-orbitron)" }}>
              Exit
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-16 max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* Dashboard header visual */}
        <div className="relative h-40 rounded-sm overflow-hidden mb-8 border border-border/50">
          <Image src="/images/admin-visual.jpg" alt="Admin dashboard" fill className="object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/40" />
          <div className="absolute inset-0 flex items-center px-8">
            <div>
              <h1 className="text-3xl font-black tracking-widest mb-1" style={{ fontFamily: "var(--font-orbitron)" }}>
                CONTROL <span className="neon-text-cyan">PANEL</span>
              </h1>
              <p className="text-muted-foreground text-sm">Manage reservations, machines, and platform activity</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Reservations", value: stats.total, icon: Calendar, color: "text-primary" },
            { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-yellow-400" },
            { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-cyan-400" },
            { label: "Completed", value: stats.completed, icon: TrendingUp, color: "text-green-400" },
            { label: "Total Revenue", value: `$${stats.revenue}`, icon: DollarSign, color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="card-gaming rounded-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">{s.label}</span>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className={`text-2xl font-black ${s.color}`} style={{ fontFamily: "var(--font-orbitron)" }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6">
          {(["overview", "analytics", "reservations", "machines", "admins"] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-xs font-bold tracking-widest uppercase border-b-2 transition-colors -mb-px ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Reservations */}
            <div className="card-gaming rounded-sm">
              <div className="p-5 border-b border-border/50">
                <h3 className="text-sm font-black tracking-widest" style={{ fontFamily: "var(--font-orbitron)" }}>
                  Recent Reservations
                </h3>
              </div>
              <div className="divide-y divide-border/30">
                {reservations.slice(0, 5).map((r) => (
                  <div key={r.id} className="p-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{r.userName}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.machineName} · {r.timeSlot}</div>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 text-xs font-bold border rounded-sm ${STATUS_COLORS[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Machine Status */}
            <div className="card-gaming rounded-sm">
              <div className="p-5 border-b border-border/50">
                <h3 className="text-sm font-black tracking-widest" style={{ fontFamily: "var(--font-orbitron)" }}>
                  Machine Fleet Status
                </h3>
              </div>
              <div className="divide-y divide-border/30">
                {machines.map((m) => (
                  <div key={m.id} className="p-4 flex items-center gap-4">
                    <div className="relative w-12 h-10 rounded-sm overflow-hidden shrink-0 border border-border/50">
                      <Image src={m.image} alt={m.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-xs truncate" style={{ fontFamily: "var(--font-orbitron)" }}>{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.gpu}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`w-2 h-2 rounded-full ${
                        m.status === "available" ? "bg-green-400" : m.status === "booked" ? "bg-red-400" : "bg-yellow-400"
                      }`} />
                      <span className={`text-xs font-bold ${TIER_COLORS[m.tier].split(" ")[0]}`}>
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {tab === "analytics" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <KpiCard label="Today" revenue={analytics.kpis.today.revenue} count={analytics.kpis.today.count} accent="text-cyan-400" />
              <KpiCard label="This Week" revenue={analytics.kpis.week.revenue} count={analytics.kpis.week.count} accent="text-cyan-400" />
              <KpiCard label="This Month" revenue={analytics.kpis.month.revenue} count={analytics.kpis.month.count} accent="text-primary" />
              <KpiCard label="This Year" revenue={analytics.kpis.year.revenue} count={analytics.kpis.year.count} accent="text-yellow-400" />
              <KpiCard label="All Time" revenue={analytics.kpis.all.revenue} count={analytics.kpis.all.count} accent="text-green-400" />
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="card-gaming rounded-sm p-4">
                <div className="text-xs text-muted-foreground tracking-widest uppercase mb-1" style={{ fontFamily: "var(--font-orbitron)" }}>Avg booking value</div>
                <div className="text-2xl font-black text-primary" style={{ fontFamily: "var(--font-orbitron)" }}>
                  ${analytics.kpis.avgBookingValue.toFixed(2)}
                </div>
              </div>
              <div className="card-gaming rounded-sm p-4">
                <div className="text-xs text-muted-foreground tracking-widest uppercase mb-1" style={{ fontFamily: "var(--font-orbitron)" }}>Total hours booked</div>
                <div className="text-2xl font-black text-foreground" style={{ fontFamily: "var(--font-orbitron)" }}>
                  {analytics.kpis.totalHoursBooked}h
                </div>
              </div>
              <div className="card-gaming rounded-sm p-4">
                <div className="text-xs text-muted-foreground tracking-widest uppercase mb-1" style={{ fontFamily: "var(--font-orbitron)" }}>Active reservations</div>
                <div className="text-2xl font-black text-foreground" style={{ fontFamily: "var(--font-orbitron)" }}>
                  {analytics.kpis.all.count}
                </div>
              </div>
            </div>

            {/* Daily Revenue (last 30 days) */}
            <div className="card-gaming rounded-sm p-5">
              <h3 className="text-sm font-black tracking-widest mb-4" style={{ fontFamily: "var(--font-orbitron)" }}>
                DAILY REVENUE <span className="text-muted-foreground font-normal text-xs">— last 30 days</span>
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={analytics.dailySeries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} interval={Math.floor(analytics.dailySeries.length / 10)} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 2 }}
                    labelStyle={{ color: "#94a3b8" }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Revenue (last 12 months) */}
            <div className="card-gaming rounded-sm p-5">
              <h3 className="text-sm font-black tracking-widest mb-4" style={{ fontFamily: "var(--font-orbitron)" }}>
                MONTHLY REVENUE <span className="text-muted-foreground font-normal text-xs">— last 12 months</span>
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.monthlySeries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 2 }}
                    labelStyle={{ color: "#94a3b8" }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#22d3ee" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Yearly + Status side-by-side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card-gaming rounded-sm p-5">
                <h3 className="text-sm font-black tracking-widest mb-4" style={{ fontFamily: "var(--font-orbitron)" }}>
                  YEARLY REVENUE
                </h3>
                {analytics.yearlySeries.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-10">No data yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={analytics.yearlySeries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 2 }}
                        labelStyle={{ color: "#94a3b8" }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                      />
                      <Bar dataKey="revenue" fill="#facc15" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="card-gaming rounded-sm p-5">
                <h3 className="text-sm font-black tracking-widest mb-4" style={{ fontFamily: "var(--font-orbitron)" }}>
                  RESERVATION STATUS
                </h3>
                {analytics.statusBreakdown.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-10">No data yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={analytics.statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                        {analytics.statusBreakdown.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 2 }}
                        labelStyle={{ color: "#94a3b8" }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Revenue by machine */}
            <div className="card-gaming rounded-sm">
              <div className="p-5 border-b border-border/50">
                <h3 className="text-sm font-black tracking-widest" style={{ fontFamily: "var(--font-orbitron)" }}>
                  REVENUE BY MACHINE
                </h3>
              </div>
              {analytics.machineSeries.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground text-sm">No data yet.</div>
              ) : (
                <div className="divide-y divide-border/30">
                  {analytics.machineSeries.map((m, i) => {
                    const max = analytics.machineSeries[0].revenue || 1;
                    const pct = (m.revenue / max) * 100;
                    return (
                      <div key={m.name + i} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-black text-sm" style={{ fontFamily: "var(--font-orbitron)" }}>{m.name}</div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-muted-foreground">{m.count} {m.count === 1 ? "booking" : "bookings"}</span>
                            <span className="font-black text-primary text-sm" style={{ fontFamily: "var(--font-orbitron)" }}>${m.revenue.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-surface-2 rounded-sm overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reservations Tab */}
        {tab === "reservations" && (
          <div>
            {/* Search + Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, email, machine..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-input border border-border rounded-sm pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(["all", "pending", "approved", "completed", "cancelled"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-2 text-xs font-bold tracking-widest uppercase rounded-sm border transition-all ${
                      statusFilter === s
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-border/80"
                    }`}
                    style={{ fontFamily: "var(--font-orbitron)" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Reservations List */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">No reservations found.</div>
              ) : (
                filtered.map((r) => (
                  <div key={r.id} className="card-gaming rounded-sm overflow-hidden">
                    {/* Row */}
                    <div
                      className="p-4 flex flex-wrap gap-4 items-center cursor-pointer"
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    >
                      <div className="flex-1 min-w-40">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-sm">{r.userName}</div>
                          <span className={`px-2 py-0.5 text-xs font-bold border rounded-sm ${STATUS_COLORS[r.status]}`}>
                            {r.status}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{r.userEmail}</div>
                      </div>
                      <div className="min-w-32">
                        <div className="font-black text-xs" style={{ fontFamily: "var(--font-orbitron)" }}>{r.machineName}</div>
                        <div className="text-xs text-muted-foreground">{r.timeSlot} · {r.duration}h</div>
                      </div>
                      <div className="text-right min-w-20">
                        <div className="font-black text-primary text-sm" style={{ fontFamily: "var(--font-orbitron)" }}>${r.totalPrice}</div>
                        <div className="text-xs text-muted-foreground">{r.date}</div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === r.id ? "rotate-180" : ""}`} />
                    </div>

                    {/* Expanded */}
                    {expandedId === r.id && (
                      <div className="border-t border-border/50 p-4 bg-surface-1/30">
                        <div className="flex flex-wrap gap-4 items-start justify-between">
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div>ID: <span className="text-foreground font-mono">{r.id}</span></div>
                            <div>Machine Tier: <span className={`font-bold ${TIER_COLORS[r.machineTier].split(" ")[0]}`}>{r.machineTier}</span></div>
                            <div>Card: <span className="text-foreground">•••• {r.cardLast4}</span></div>
                            <div>Created: <span className="text-foreground">{new Date(r.createdAt).toLocaleString()}</span></div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {r.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(r.id, "approved")}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-xs font-bold tracking-widest uppercase rounded-sm hover:bg-cyan-400/20 transition-colors"
                                  style={{ fontFamily: "var(--font-orbitron)" }}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => handleStatusChange(r.id, "cancelled")}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-red-400/10 border border-red-400/30 text-red-400 text-xs font-bold tracking-widest uppercase rounded-sm hover:bg-red-400/20 transition-colors"
                                  style={{ fontFamily: "var(--font-orbitron)" }}
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Cancel
                                </button>
                              </>
                            )}
                            {r.status === "approved" && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(r.id, "completed")}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-green-400/10 border border-green-400/30 text-green-400 text-xs font-bold tracking-widest uppercase rounded-sm hover:bg-green-400/20 transition-colors"
                                  style={{ fontFamily: "var(--font-orbitron)" }}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                                </button>
                                <button
                                  onClick={() => handleStatusChange(r.id, "cancelled")}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-red-400/10 border border-red-400/30 text-red-400 text-xs font-bold tracking-widest uppercase rounded-sm hover:bg-red-400/20 transition-colors"
                                  style={{ fontFamily: "var(--font-orbitron)" }}
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Cancel
                                </button>
                              </>
                            )}
                            {(r.status === "completed" || r.status === "cancelled") && (
                              <span className="text-xs text-muted-foreground italic">No actions available</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Machines Tab */}
        {tab === "machines" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="text-xs text-muted-foreground">
                <span className="text-foreground font-bold">{machines.length}</span> machines in fleet
              </div>
              <button
                onClick={openCreateMachine}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold tracking-widest uppercase rounded-sm neon-glow-cyan hover:opacity-90 transition-opacity"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                <Plus className="w-3.5 h-3.5" /> Add Machine
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {machines.map((m) => {
              const machineReservations = reservations.filter((r) => r.machineId === m.id && r.status !== "cancelled");
              const revenue = machineReservations.reduce((s, r) => s + r.totalPrice, 0);

              return (
                <div key={m.id} className="card-gaming rounded-sm overflow-hidden">
                  <div className="relative h-40">
                    <Image src={m.image} alt={m.name} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold border rounded-sm ${TIER_COLORS[m.tier]}`}
                        style={{ fontFamily: "var(--font-orbitron)" }}
                      >
                        {m.tier}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => cycleMachineStatus(m)}
                        title="Click to cycle status"
                        className={`flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-sm border hover:opacity-80 transition-opacity ${
                          m.status === "available"
                            ? "bg-green-400/20 text-green-400 border-green-400/30"
                            : m.status === "booked"
                            ? "bg-red-400/20 text-red-400 border-red-400/30"
                            : "bg-yellow-400/20 text-yellow-400 border-yellow-400/30"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                          m.status === "available" ? "bg-green-400" : m.status === "booked" ? "bg-red-400" : "bg-yellow-400"
                        }`} />
                        {m.status}
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-black tracking-widest mb-1 text-sm" style={{ fontFamily: "var(--font-orbitron)" }}>
                      {m.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{m.gpu}</p>
                    <p className="text-xs text-muted-foreground mb-3 font-mono">
                      IP: {m.ipAddress ?? <span className="text-yellow-400/70">not set</span>}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-surface-2/50 rounded-sm p-2">
                        <div className="text-xs text-muted-foreground">Bookings</div>
                        <div className="font-black text-sm text-foreground" style={{ fontFamily: "var(--font-orbitron)" }}>
                          {machineReservations.length}
                        </div>
                      </div>
                      <div className="bg-surface-2/50 rounded-sm p-2">
                        <div className="text-xs text-muted-foreground">Rate</div>
                        <div className="font-black text-sm text-primary" style={{ fontFamily: "var(--font-orbitron)" }}>
                          ${m.pricePerHour}/h
                        </div>
                      </div>
                      <div className="bg-surface-2/50 rounded-sm p-2">
                        <div className="text-xs text-muted-foreground">Revenue</div>
                        <div className="font-black text-sm text-green-400" style={{ fontFamily: "var(--font-orbitron)" }}>
                          ${revenue}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => openEditMachine(m)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border text-muted-foreground text-xs font-bold tracking-widest uppercase rounded-sm hover:border-primary/50 hover:text-foreground transition-colors"
                        style={{ fontFamily: "var(--font-orbitron)" }}
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => deleteMachine(m.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-400/10 border border-red-400/30 text-red-400 text-xs font-bold tracking-widest uppercase rounded-sm hover:bg-red-400/20 transition-colors"
                        style={{ fontFamily: "var(--font-orbitron)" }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}

        {/* Admins Tab */}
        {tab === "admins" && (
          <div>
            <div className="card-gaming rounded-sm p-5 mb-6">
              <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3" style={{ fontFamily: "var(--font-orbitron)" }}>
                Grant admin by email
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                The user must already have a MaRoKiPlay account. They&apos;ll see the Admin panel next time they log in.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && grantAdmin()}
                  placeholder="user@example.com"
                  className="flex-1 bg-input border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <button
                  onClick={grantAdmin}
                  disabled={grantingAdmin || !newAdminEmail.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold tracking-widest uppercase rounded-sm neon-glow-cyan hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  <Plus className="w-3.5 h-3.5" /> {grantingAdmin ? "Granting…" : "Grant"}
                </button>
              </div>
            </div>

            <div className="card-gaming rounded-sm">
              <div className="p-5 border-b border-border/50 flex items-center justify-between">
                <h3 className="text-sm font-black tracking-widest" style={{ fontFamily: "var(--font-orbitron)" }}>
                  Current Admins
                </h3>
                <span className="text-xs text-muted-foreground">{admins.length} total</span>
              </div>
              <div className="divide-y divide-border/30">
                {admins.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">No admins yet.</div>
                ) : (
                  admins.map((a) => (
                    <div key={a.userId} className="p-4 flex items-center gap-4">
                      <Shield className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-foreground truncate">{a.email}</div>
                        <div className="text-xs text-muted-foreground">
                          Granted {new Date(a.grantedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => revokeAdmin(a)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-red-400/30 bg-red-400/5 text-red-400 text-xs font-bold tracking-widest uppercase rounded-sm hover:bg-red-400/10 transition-colors"
                        style={{ fontFamily: "var(--font-orbitron)" }}
                      >
                        <Trash2 className="w-3 h-3" /> Revoke
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Machine Editor Modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm px-4 py-8 overflow-y-auto">
          <div className="card-gaming rounded-sm w-full max-w-2xl my-auto">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h3 className="text-sm font-black tracking-widest" style={{ fontFamily: "var(--font-orbitron)" }}>
                {editorMode === "create" ? "ADD MACHINE" : `EDIT — ${machineForm.id}`}
              </h3>
              <button
                onClick={() => setEditorOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              {machineFormError && (
                <div className="px-3 py-2 bg-red-400/10 border border-red-400/30 text-red-400 text-xs rounded-sm">
                  {machineFormError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="ID (lowercase, no spaces)">
                  <input
                    type="text"
                    value={machineForm.id}
                    disabled={editorMode === "edit"}
                    onChange={(e) => setMachineForm({ ...machineForm, id: e.target.value })}
                    placeholder="titan-x"
                    className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                  />
                </Field>
                <Field label="Name">
                  <input
                    type="text"
                    value={machineForm.name}
                    onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })}
                    placeholder="TITAN X"
                    className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Tier">
                  <select
                    value={machineForm.tier}
                    onChange={(e) => setMachineForm({ ...machineForm, tier: e.target.value as PerformanceTier })}
                    className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    {(["Ultra", "Elite", "Pro", "Standard"] as PerformanceTier[]).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    value={machineForm.status}
                    onChange={(e) => setMachineForm({ ...machineForm, status: e.target.value as MachineStatus })}
                    className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    {(["available", "booked", "maintenance"] as MachineStatus[]).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Price/hr ($)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={machineForm.pricePerHour}
                    onChange={(e) => setMachineForm({ ...machineForm, pricePerHour: e.target.value })}
                    placeholder="25"
                    className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </Field>
              </div>

              <Field label="CPU">
                <input type="text" value={machineForm.cpu} onChange={(e) => setMachineForm({ ...machineForm, cpu: e.target.value })}
                  placeholder="Intel Core i9-14900K"
                  className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
              </Field>
              <Field label="GPU">
                <input type="text" value={machineForm.gpu} onChange={(e) => setMachineForm({ ...machineForm, gpu: e.target.value })}
                  placeholder="NVIDIA RTX 4090 24GB"
                  className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="RAM">
                  <input type="text" value={machineForm.ram} onChange={(e) => setMachineForm({ ...machineForm, ram: e.target.value })}
                    placeholder="64GB DDR5"
                    className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                </Field>
                <Field label="Storage">
                  <input type="text" value={machineForm.storage} onChange={(e) => setMachineForm({ ...machineForm, storage: e.target.value })}
                    placeholder="4TB NVMe"
                    className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Image path">
                  <input type="text" value={machineForm.image} onChange={(e) => setMachineForm({ ...machineForm, image: e.target.value })}
                    placeholder="/images/machine-titan.jpg"
                    className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                </Field>
                <Field label="Latency">
                  <input type="text" value={machineForm.latency} onChange={(e) => setMachineForm({ ...machineForm, latency: e.target.value })}
                    placeholder="<5ms"
                    className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                </Field>
              </div>
              <Field label="Description">
                <textarea value={machineForm.description} onChange={(e) => setMachineForm({ ...machineForm, description: e.target.value })}
                  rows={2}
                  className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none" />
              </Field>
              <Field label="Features (comma-separated)">
                <input type="text" value={machineForm.features} onChange={(e) => setMachineForm({ ...machineForm, features: e.target.value })}
                  placeholder="8K Gaming Ready, 240Hz Support, Ray Tracing Ultra"
                  className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
              </Field>
              <Field label="Availability slots (comma-separated, HH:MM)">
                <input type="text" value={machineForm.availability} onChange={(e) => setMachineForm({ ...machineForm, availability: e.target.value })}
                  placeholder="09:00, 10:00, 14:00, 19:00"
                  className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
              </Field>
              <Field label="Platforms (comma-separated: PC, Mobile, Both)">
                <input type="text" value={machineForm.platforms} onChange={(e) => setMachineForm({ ...machineForm, platforms: e.target.value })}
                  placeholder="PC, Mobile"
                  className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
              </Field>
              <Field label="IP Address (internal — shown to user after reservation)">
                <input type="text" value={machineForm.ipAddress} onChange={(e) => setMachineForm({ ...machineForm, ipAddress: e.target.value })}
                  placeholder="10.0.0.1"
                  className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono" />
              </Field>
              <Field label="Connection Instructions (port, login, launcher URL — shown after approval)">
                <textarea value={machineForm.connectionInstructions} onChange={(e) => setMachineForm({ ...machineForm, connectionInstructions: e.target.value })}
                  rows={3}
                  placeholder="Port: 3389&#10;Username: marokiplay&#10;Use Moonlight launcher with code: ABC123"
                  className="w-full bg-input border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono resize-none" />
              </Field>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground" style={{ fontFamily: "var(--font-orbitron)" }}>
                    Installed Games
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {installedGameIds.size} / {allGames.length} selected
                  </span>
                </div>
                <div className="flex gap-2 mb-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setInstalledGameIds(new Set(allGames.map((g) => g.id)))}
                    className="px-2 py-1 border border-border text-muted-foreground hover:text-foreground rounded-sm"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstalledGameIds(new Set())}
                    className="px-2 py-1 border border-border text-muted-foreground hover:text-foreground rounded-sm"
                  >
                    Clear
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-2 border border-border rounded-sm bg-input">
                  {allGames.length === 0 ? (
                    <div className="text-xs text-muted-foreground col-span-2">No games available. Run supabase/games-and-installs.sql first.</div>
                  ) : (
                    allGames.map((g) => {
                      const checked = installedGameIds.has(g.id);
                      return (
                        <label key={g.id} className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-surface-1/40 rounded-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = new Set(installedGameIds);
                              if (e.target.checked) next.add(g.id);
                              else next.delete(g.id);
                              setInstalledGameIds(next);
                            }}
                            className="accent-primary"
                          />
                          <span className="text-xs text-foreground truncate flex-1">{g.title}</span>
                          <span className={`text-xs font-bold ${TIER_COLORS[g.recommendedTier].split(" ")[0]}`}>
                            {g.recommendedTier[0]}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-border/50">
              <button
                onClick={() => setEditorOpen(false)}
                className="flex-1 py-3 border border-border text-muted-foreground text-xs font-bold tracking-widest uppercase rounded-sm hover:text-foreground transition-colors"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                Cancel
              </button>
              <button
                onClick={saveMachine}
                disabled={savingMachine}
                className="flex-1 py-3 bg-primary text-primary-foreground text-xs font-bold tracking-widest uppercase rounded-sm neon-glow-cyan hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                {savingMachine ? "Saving…" : editorMode === "create" ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, revenue, count, accent }: { label: string; revenue: number; count: number; accent: string }) {
  return (
    <div className="card-gaming rounded-sm p-4">
      <div className="text-xs text-muted-foreground tracking-widest uppercase mb-1" style={{ fontFamily: "var(--font-orbitron)" }}>
        {label}
      </div>
      <div className={`text-2xl font-black ${accent}`} style={{ fontFamily: "var(--font-orbitron)" }}>
        ${revenue.toFixed(2)}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">
        {count} {count === 1 ? "booking" : "bookings"}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5" style={{ fontFamily: "var(--font-orbitron)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
