"use client";

import { useCallback, useEffect, useMemo, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Zap, Cpu, HardDrive, MemoryStick, Clock, Calendar, ChevronLeft,
  User, Mail, ChevronRight, CheckCircle2
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { TIER_COLORS, type GamingMachine } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { GAMES } from "@/lib/games";
import { Gamepad2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { toast } from "sonner";

const DURATIONS = [1, 2, 3, 4, 6, 8];

const todayYmd = () => new Date().toISOString().split("T")[0];
const ymd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const formatDateHuman = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
};

export default function MachineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const sp = useSearchParams();
  const forGameId = sp.get("for");
  const forGame = useMemo(() => GAMES.find((g) => g.id === forGameId) ?? null, [forGameId]);
  const [machine, setMachine] = useState<GamingMachine | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const [selectedDate, setSelectedDate] = useState<string>(todayYmd());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [duration, setDuration] = useState(1);
  const [form, setForm] = useState({ name: "", email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchBookedSlots = useCallback(async () => {
    const res = await fetch(`/api/machines/${id}/booked-slots?date=${selectedDate}`);
    return res.ok ? ((await res.json()) as string[]) : [];
  }, [id, selectedDate]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/machines/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetchBookedSlots(),
    ])
      .then(([m, slots]: [GamingMachine | null, string[]]) => {
        setMachine(m);
        setBookedSlots(slots);
      })
      .catch((err) => console.error("[machine] load failed:", err))
      .finally(() => setLoading(false));
  }, [id, fetchBookedSlots]);

  // Refetch booked slots when the selected date changes.
  useEffect(() => {
    setSelectedSlot(null);
    fetchBookedSlots().then(setBookedSlots).catch(() => {});
  }, [selectedDate, fetchBookedSlots]);

  // Prefill name + email if the user is logged in.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata ?? {};
        setForm((f) => ({
          name: f.name || (meta.name as string) || "",
          email: f.email || data.user!.email || "",
        }));
      }
    });
  }, []);

  // Refresh booked-slots every 15s so the slot grid stays fresh while user fills the form.
  // If the selected slot gets booked by someone else, auto-deselect and warn.
  useEffect(() => {
    const tick = async () => {
      try {
        const slots = await fetchBookedSlots();
        setBookedSlots(slots);
        if (selectedSlot && slots.includes(selectedSlot)) {
          setSelectedSlot(null);
          setErrors((e) => ({ ...e, slot: "That slot was just taken — please pick another." }));
        }
      } catch (err) {
        console.error("[machine] poll failed:", err);
      }
    };
    const interval = setInterval(tick, 15000);
    return () => clearInterval(interval);
  }, [fetchBookedSlots, selectedSlot]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-black mb-4" style={{ fontFamily: "var(--font-orbitron)" }}>Machine Not Found</h1>
          <Link href="/machines" className="text-primary hover:opacity-80">Back to Machines</Link>
        </div>
      </div>
    );
  }

  const isAvailable = machine.status === "available";
  const totalPrice = machine.pricePerHour * duration;
  const isToday = selectedDate === todayYmd();
  const currentHour = new Date().getHours();

  const isSlotPast = (slot: string) => {
    if (!isToday) return false;
    const [hStr] = slot.split(":");
    return parseInt(hStr, 10) <= currentHour;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email address";
    if (!selectedSlot) {
      newErrors.slot = "Please select a time slot";
    } else {
      const [hStr, mStr] = selectedSlot.split(":");
      const startHour = parseInt(hStr, 10);
      const minute = mStr ?? "00";
      for (let i = 0; i < duration; i++) {
        const h = String(startHour + i).padStart(2, "0");
        if (bookedSlots.includes(`${h}:${minute}`)) {
          newErrors.slot = "Your session would overlap a booked slot — pick a shorter duration or another slot.";
          break;
        }
      }
    }
    return newErrors;
  };

  const handleProceed = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const query = new URLSearchParams({
      machineId: machine.id,
      machineName: machine.name,
      machineTier: machine.tier,
      pricePerHour: machine.pricePerHour.toString(),
      slot: selectedSlot!,
      duration: duration.toString(),
      totalPrice: totalPrice.toString(),
      userName: form.name,
      userEmail: form.email,
      date: selectedDate,
    });
    if (forGame) {
      query.set("gameId", forGame.id);
      query.set("gameTitle", forGame.title);
    }
    router.push(`/checkout?${query.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16">
        {/* Breadcrumb */}
        <div className="border-b border-border/50 px-4 sm:px-6 py-3 bg-surface-1/30">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/machines" className="hover:text-foreground flex items-center gap-1 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" /> Machines
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-bold" style={{ fontFamily: "var(--font-orbitron)" }}>{machine.name}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Machine Details */}
            <div>
              {/* Machine Image */}
              <div className="relative h-72 sm:h-96 rounded-sm overflow-hidden mb-6 border border-border/50">
                <Image src={machine.image} alt={machine.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span
                    className={`px-2 py-0.5 text-xs font-bold tracking-widest uppercase border rounded-sm ${TIER_COLORS[machine.tier]}`}
                    style={{ fontFamily: "var(--font-orbitron)" }}
                  >
                    {machine.tier}
                  </span>
                </div>
                <div className="absolute bottom-4 right-4">
                  <div className="bg-background/80 backdrop-blur-sm border border-primary/30 rounded-sm px-3 py-2">
                    <span className="text-2xl font-black text-primary neon-text-cyan" style={{ fontFamily: "var(--font-orbitron)" }}>
                      ${machine.pricePerHour}
                    </span>
                    <span className="text-sm text-muted-foreground">/hr</span>
                  </div>
                </div>
              </div>

              {/* Machine Info */}
              <div className="mb-6">
                <h1
                  className="text-3xl font-black tracking-widest mb-2"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  {machine.name}
                </h1>
                <p className="text-muted-foreground leading-relaxed mb-4">{machine.description}</p>

                {/* Status */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border text-sm font-bold ${
                  isAvailable
                    ? "border-green-400/30 bg-green-400/10 text-green-400"
                    : "border-red-400/30 bg-red-400/10 text-red-400"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isAvailable ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                  {machine.status === "available" ? "Available for Reservation" : machine.status === "booked" ? "Currently Booked" : "Under Maintenance"}
                </div>
              </div>

              {/* Specs */}
              <div className="card-gaming rounded-sm p-5 mb-6">
                <h3
                  className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-4"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  Specifications
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: Cpu, label: "Processor", value: machine.cpu },
                    { icon: Zap, label: "Graphics", value: machine.gpu },
                    { icon: MemoryStick, label: "Memory", value: machine.ram },
                    { icon: HardDrive, label: "Storage", value: machine.storage },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-sm border border-border flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">{label}</div>
                        <div className="text-sm font-semibold text-foreground">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-2">
                {machine.features.map((f) => (
                  <div key={f} className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 rounded-sm bg-primary/5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Reservation Form */}
            <div>
              <div className="card-gaming rounded-sm p-6 sticky top-24">
                <h2
                  className="text-xl font-black tracking-widest mb-6 neon-text-cyan"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  RESERVE THIS RIG
                </h2>

                {forGame && (
                  <div className="mb-5 px-3 py-2 rounded-sm border border-primary/30 bg-primary/5 flex items-center gap-2">
                    <Gamepad2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground">Playing:</span>
                    <span className="text-xs font-bold text-foreground truncate">{forGame.title}</span>
                  </div>
                )}

                {!isAvailable ? (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground mb-4">This machine is currently unavailable.</div>
                    <Link
                      href="/machines"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-xs font-bold tracking-widest uppercase rounded-sm"
                      style={{ fontFamily: "var(--font-orbitron)" }}
                    >
                      Browse Other Machines
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Your Info */}
                    <div>
                      <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3" style={{ fontFamily: "var(--font-orbitron)" }}>
                        Your Information
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Full Name"
                              value={form.name}
                              onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: "" }); }}
                              className="w-full bg-input border border-border rounded-sm pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                            />
                          </div>
                          {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                        </div>
                        <div>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="email"
                              placeholder="Email Address"
                              value={form.email}
                              onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: "" }); }}
                              className="w-full bg-input border border-border rounded-sm pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                            />
                          </div>
                          {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Date Picker */}
                    <div>
                      <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-orbitron)" }}>
                        <Calendar className="w-3.5 h-3.5" /> Select Date
                      </h3>
                      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <button
                            className="w-full flex items-center justify-between px-4 py-3 bg-input border border-border rounded-sm text-sm text-foreground hover:border-primary/50 transition-colors"
                          >
                            <span>{formatDateHuman(selectedDate)}</span>
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={new Date(selectedDate + "T00:00:00")}
                            onSelect={(d) => {
                              if (d) {
                                setSelectedDate(ymd(d));
                                setDatePickerOpen(false);
                              }
                            }}
                            disabled={(d) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const max = new Date(today);
                              max.setDate(max.getDate() + 30);
                              return d < today || d > max;
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Time Slot */}
                    <div>
                      <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-orbitron)" }}>
                        <Clock className="w-3.5 h-3.5" /> Select Time Slot
                      </h3>
                      <div className="grid grid-cols-4 gap-2">
                        {machine.availability.map((slot) => {
                          const isBooked = bookedSlots.includes(slot);
                          const isPast = isSlotPast(slot);
                          const disabled = isBooked || isPast;
                          return (
                            <button
                              key={slot}
                              disabled={disabled}
                              onClick={() => { setSelectedSlot(slot); setErrors({ ...errors, slot: "" }); }}
                              title={isPast ? "This slot has already passed" : isBooked ? "Already booked" : undefined}
                              className={`py-2 text-xs font-bold rounded-sm border transition-all ${
                                disabled
                                  ? "border-border/30 text-muted-foreground/40 cursor-not-allowed line-through"
                                  : selectedSlot === slot
                                  ? "border-primary bg-primary/10 text-primary neon-border-cyan"
                                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                              }`}
                              style={{ fontFamily: "var(--font-orbitron)" }}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                      {errors.slot && <p className="text-xs text-red-400 mt-1">{errors.slot}</p>}
                    </div>

                    {/* Duration */}
                    <div>
                      <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-orbitron)" }}>
                        <Clock className="w-3.5 h-3.5" /> Session Duration
                      </h3>
                      <div className="grid grid-cols-6 gap-2">
                        {DURATIONS.map((d) => {
                          // Disable durations that would overlap a blocked hour.
                          // E.g. if 14:00 is selected and 15:00 is booked, 2h+ are disabled.
                          let durationConflicts = false;
                          if (selectedSlot) {
                            const [hStr, mStr] = selectedSlot.split(":");
                            const startHour = parseInt(hStr, 10);
                            const minute = mStr ?? "00";
                            for (let i = 0; i < d; i++) {
                              const h = String(startHour + i).padStart(2, "0");
                              if (bookedSlots.includes(`${h}:${minute}`)) {
                                durationConflicts = true;
                                break;
                              }
                            }
                          }
                          return (
                            <button
                              key={d}
                              disabled={durationConflicts}
                              onClick={() => setDuration(d)}
                              className={`py-2 text-xs font-bold rounded-sm border transition-all ${
                                durationConflicts
                                  ? "border-border/30 text-muted-foreground/40 cursor-not-allowed"
                                  : duration === d
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                              }`}
                              style={{ fontFamily: "var(--font-orbitron)" }}
                            >
                              {d}h
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Price Summary */}
                    <div className="border-t border-border pt-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>${machine.pricePerHour}/hr × {duration} hour{duration > 1 ? "s" : ""}</span>
                        <span>${totalPrice}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">Total</span>
                        <span className="text-xl font-black text-primary neon-text-cyan" style={{ fontFamily: "var(--font-orbitron)" }}>
                          ${totalPrice}
                        </span>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleProceed}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground text-sm font-bold tracking-widest uppercase rounded-sm neon-glow-cyan hover:opacity-90 transition-opacity"
                      style={{ fontFamily: "var(--font-orbitron)" }}
                    >
                      <Zap className="w-4 h-4" />
                      Proceed to Payment
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
