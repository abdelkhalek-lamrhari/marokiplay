"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Zap, Mail, Clock, Calendar, User, ChevronRight, Download } from "lucide-react";
import { Navbar } from "@/components/navbar";

function ConfirmationContent() {
  const sp = useSearchParams();
  const reservationId = sp.get("id") ?? "";
  const name = sp.get("name") ?? "Player";
  const machine = sp.get("machine") ?? "Gaming Machine";
  const slot = sp.get("slot") ?? "—";
  const duration = sp.get("duration") ?? "1";
  const total = sp.get("total") ?? "0";
  const email = sp.get("email") ?? "";

  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  const reservationCode = reservationId || `CR-${Math.random().toString(36).toUpperCase().slice(2, 8)}`;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          {/* Success Icon */}
          <div
            className={`text-center mb-10 transition-all duration-700 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse-glow" />
              <div className="absolute inset-2 rounded-full border border-primary/20" />
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-green-400/30 bg-green-400/10 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase text-green-400" style={{ fontFamily: "var(--font-orbitron)" }}>
                Reservation Confirmed
              </span>
            </div>

            <h1
              className="text-3xl sm:text-4xl font-black tracking-tight mb-3"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              YOU&apos;RE ALL SET,{" "}
              <span className="neon-text-cyan">{name.split(" ")[0].toUpperCase()}</span>!
            </h1>
            <p className="text-muted-foreground">
              Your reservation has been confirmed. Check your email at{" "}
              <span className="text-foreground font-semibold">{email}</span> for details.
            </p>
          </div>

          {/* Reservation Card */}
          <div
            className={`card-gaming rounded-sm overflow-hidden mb-6 transition-all duration-700 delay-200 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            {/* Header */}
            <div className="bg-primary/10 border-b border-primary/20 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Reservation Code</div>
                  <div className="text-lg font-black text-primary" style={{ fontFamily: "var(--font-orbitron)" }}>
                    {reservationCode}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="text-sm font-bold text-yellow-400" style={{ fontFamily: "var(--font-orbitron)" }}>
                  PENDING APPROVAL
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Machine</div>
                    <div className="font-black text-foreground" style={{ fontFamily: "var(--font-orbitron)" }}>{machine}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                      <User className="w-3 h-3" /> Player
                    </div>
                    <div className="font-semibold text-foreground">{name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email
                    </div>
                    <div className="font-semibold text-foreground text-sm break-all">{email}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Date
                    </div>
                    <div className="font-semibold text-foreground text-sm">{today}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Time Slot
                    </div>
                    <div className="font-black text-foreground" style={{ fontFamily: "var(--font-orbitron)" }}>{slot}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Duration</div>
                    <div className="font-black text-foreground" style={{ fontFamily: "var(--font-orbitron)" }}>
                      {duration} hour{Number(duration) > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">Total Charged</div>
                  <div className="text-xs text-muted-foreground">(Simulated — no real charge)</div>
                </div>
                <div className="text-3xl font-black text-primary neon-text-cyan" style={{ fontFamily: "var(--font-orbitron)" }}>
                  ${total}
                </div>
              </div>
            </div>
          </div>

          {/* What happens next */}
          <div
            className={`card-gaming rounded-sm p-6 mb-8 transition-all duration-700 delay-300 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <h3
              className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-4"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              What Happens Next
            </h3>
            <div className="space-y-3">
              {[
                { num: "01", text: "Admin reviews and approves your reservation" },
                { num: "02", text: `Your session starts at ${slot} — log in to MaRoKiPlay to access your machine` },
                { num: "03", text: "Game at maximum settings for your full booked duration" },
                { num: "04", text: "Session ends automatically — your data is securely wiped" },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-3">
                  <span className="text-xs font-black text-primary/50 shrink-0 mt-0.5" style={{ fontFamily: "var(--font-orbitron)" }}>
                    {step.num}
                  </span>
                  <span className="text-sm text-muted-foreground">{step.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div
            className={`flex flex-col sm:flex-row gap-3 transition-all duration-700 delay-400 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <Link
              href="/machines"
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground text-sm font-black tracking-widest uppercase rounded-sm neon-glow-cyan hover:opacity-90 transition-opacity"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              <Zap className="w-4 h-4" />
              Book Another Rig
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/admin"
              className="flex-1 flex items-center justify-center gap-2 py-4 border border-border hover:border-primary/50 text-sm font-bold tracking-widest uppercase rounded-sm transition-colors"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              View Admin Panel
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
