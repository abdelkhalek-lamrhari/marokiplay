"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Server, X, Copy, CalendarClock, Gamepad2, Coins } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { STATUS_COLORS, TIER_COLORS, type PerformanceTier, type ReservationStatus } from "@/lib/store";

const MAX_RESCHEDULES = 2;

type Reservation = {
  id: string;
  machineId: string;
  machineName: string;
  machineTier: string;
  date: string;
  timeSlot: string;
  duration: number;
  totalPrice: number;
  status: string;
  rescheduleCount: number;
  gameTitle: string | null;
  creditsApplied: number;
};

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
    weekday: "short", month: "short", day: "numeric",
  });
};

export function ReservationCard({
  reservation,
  ipAddress,
  connectionInstructions,
  machineAvailability,
}: {
  reservation: Reservation;
  ipAddress: string | null;
  connectionInstructions: string | null;
  machineAvailability: string[];
}) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const status = reservation.status as ReservationStatus;
  const tier = reservation.machineTier as PerformanceTier;
  const isActive = status === "pending" || status === "approved";
  const isApproved = status === "approved";
  const reschedulesLeft = MAX_RESCHEDULES - reservation.rescheduleCount;
  const canReschedule = isActive && reschedulesLeft > 0;

  const handleCancel = async () => {
    if (!confirm("Cancel this reservation? This cannot be undone.")) return;
    setCancelling(true);
    const res = await fetch(`/api/reservations/${reservation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    setCancelling(false);
    if (res.ok) {
      toast.success("Reservation cancelled");
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to cancel");
    }
  };

  const copyIp = () => {
    if (!ipAddress) return;
    navigator.clipboard.writeText(ipAddress);
    toast.success("IP copied to clipboard");
  };

  return (
    <div className="card-gaming rounded-sm p-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-40">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-black text-sm" style={{ fontFamily: "var(--font-orbitron)" }}>{reservation.machineName}</span>
            <span className={`px-2 py-0.5 text-xs font-bold border rounded-sm ${TIER_COLORS[tier]}`}>{tier}</span>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {reservation.date}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {reservation.timeSlot} · {reservation.duration}h</span>
            {reservation.gameTitle && (
              <span className="flex items-center gap-1 text-primary"><Gamepad2 className="w-3 h-3" /> {reservation.gameTitle}</span>
            )}
            {reservation.creditsApplied > 0 && (
              <span className="flex items-center gap-1 text-yellow-400"><Coins className="w-3 h-3" /> ${Number(reservation.creditsApplied).toFixed(2)} credits used</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="font-black text-primary text-sm" style={{ fontFamily: "var(--font-orbitron)" }}>${reservation.totalPrice}</div>
          <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-bold border rounded-sm ${STATUS_COLORS[status]}`}>{status}</span>
        </div>
      </div>

      {isApproved && ipAddress && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-3">
            <Server className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5" style={{ fontFamily: "var(--font-orbitron)" }}>
                Connect to your rig
              </div>
              <div className="text-sm font-mono text-foreground truncate">{ipAddress}</div>
            </div>
            <button
              onClick={copyIp}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 bg-primary/5 text-primary text-xs font-bold tracking-widest uppercase rounded-sm hover:bg-primary/10 transition-colors"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
          {connectionInstructions && (
            <div className="mt-3 p-3 rounded-sm border border-border bg-surface-1/30">
              <div className="text-xs text-muted-foreground tracking-widest uppercase mb-1" style={{ fontFamily: "var(--font-orbitron)" }}>
                Setup instructions
              </div>
              <pre className="text-xs text-foreground font-mono whitespace-pre-wrap break-words">{connectionInstructions}</pre>
            </div>
          )}
        </div>
      )}

      {isApproved && !ipAddress && (
        <div className="mt-3 pt-3 border-t border-border/50 text-xs text-yellow-400/80">
          Connection details pending — contact support if not provided shortly.
        </div>
      )}

      {status === "pending" && (
        <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
          Waiting for admin approval. IP address will appear here once approved.
        </div>
      )}

      {isActive && (
        <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            Reschedules used: <span className="text-foreground font-bold">{reservation.rescheduleCount} / {MAX_RESCHEDULES}</span>
          </span>
          <div className="flex gap-2">
            {canReschedule && (
              <button
                onClick={() => setRescheduleOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 bg-primary/5 text-primary text-xs font-bold tracking-widest uppercase rounded-sm hover:bg-primary/10 transition-colors"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                <CalendarClock className="w-3 h-3" /> Reschedule
              </button>
            )}
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-400/30 bg-red-400/5 text-red-400 text-xs font-bold tracking-widest uppercase rounded-sm hover:bg-red-400/10 transition-colors disabled:opacity-50"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              <X className="w-3 h-3" /> {cancelling ? "Cancelling…" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {rescheduleOpen && (
        <RescheduleModal
          reservation={reservation}
          machineAvailability={machineAvailability}
          onClose={() => setRescheduleOpen(false)}
          onSuccess={() => {
            setRescheduleOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function RescheduleModal({
  reservation,
  machineAvailability,
  onClose,
  onSuccess,
}: {
  reservation: Reservation;
  machineAvailability: string[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [newDate, setNewDate] = useState(reservation.date);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [newSlot, setNewSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isToday = newDate === todayYmd();
  const currentHour = new Date().getHours();

  useEffect(() => {
    let active = true;
    setLoadingSlots(true);
    setNewSlot(null);
    fetch(`/api/machines/${reservation.machineId}/booked-slots?date=${newDate}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((slots: string[]) => {
        if (active) setBookedSlots(slots);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => { active = false; };
  }, [reservation.machineId, newDate]);

  const isSlotBlocked = (slot: string) => {
    if (isToday) {
      const h = parseInt(slot.split(":")[0], 10);
      if (h <= currentHour) return "past";
    }
    // The slot is "covered" if any hour from start to start+duration overlaps a booked range.
    const startHour = parseInt(slot.split(":")[0], 10);
    for (let i = 0; i < reservation.duration; i++) {
      const h = String(startHour + i).padStart(2, "0");
      if (bookedSlots.includes(`${h}:00`)) {
        // Allow if it's the existing reservation's own current slot on the unchanged date
        if (newDate === reservation.date && i === 0 && slot === reservation.timeSlot) return null;
        return "booked";
      }
    }
    return null;
  };

  const submit = async () => {
    if (!newSlot) {
      toast.error("Pick a new time slot first");
      return;
    }
    if (newDate === reservation.date && newSlot === reservation.timeSlot) {
      toast.error("That's the same time as before");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/reservations/${reservation.id}/reschedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, timeSlot: newSlot }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to reschedule");
      return;
    }
    toast.success("Reservation rescheduled");
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm px-4 py-8 overflow-y-auto">
      <div className="card-gaming rounded-sm w-full max-w-lg my-auto">
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <h3 className="text-sm font-black tracking-widest" style={{ fontFamily: "var(--font-orbitron)" }}>
            RESCHEDULE — {reservation.machineName}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div className="text-xs text-muted-foreground">
            Current: <span className="text-foreground font-bold">{reservation.date} at {reservation.timeSlot}</span> for {reservation.duration}h.
            Duration stays the same when rescheduling.
          </div>

          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-muted-foreground mb-2" style={{ fontFamily: "var(--font-orbitron)" }}>
              New date
            </label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <button className="w-full flex items-center justify-between px-4 py-3 bg-input border border-border rounded-sm text-sm text-foreground hover:border-primary/50 transition-colors">
                  <span>{formatDateHuman(newDate)}</span>
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={new Date(newDate + "T00:00:00")}
                  onSelect={(d) => {
                    if (d) {
                      setNewDate(ymd(d));
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

          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-muted-foreground mb-2" style={{ fontFamily: "var(--font-orbitron)" }}>
              New time slot
            </label>
            {loadingSlots ? (
              <div className="text-xs text-muted-foreground">Loading availability…</div>
            ) : machineAvailability.length === 0 ? (
              <div className="text-xs text-muted-foreground">No slots configured for this machine.</div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {machineAvailability.map((slot) => {
                  const blockedReason = isSlotBlocked(slot);
                  const disabled = !!blockedReason;
                  return (
                    <button
                      key={slot}
                      disabled={disabled}
                      onClick={() => setNewSlot(slot)}
                      title={blockedReason === "past" ? "Already passed" : blockedReason === "booked" ? "Already booked" : undefined}
                      className={`py-2 text-xs font-bold rounded-sm border transition-all ${
                        disabled
                          ? "border-border/30 text-muted-foreground/40 cursor-not-allowed line-through"
                          : newSlot === slot
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
            )}
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-border/50">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-border text-muted-foreground text-xs font-bold tracking-widest uppercase rounded-sm hover:text-foreground transition-colors"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !newSlot}
            className="flex-1 py-3 bg-primary text-primary-foreground text-xs font-bold tracking-widest uppercase rounded-sm neon-glow-cyan hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            {submitting ? "Saving…" : "Confirm reschedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
