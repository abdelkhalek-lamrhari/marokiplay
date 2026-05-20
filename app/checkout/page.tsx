"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CreditCard, Lock, Zap, ChevronLeft, Shield, CheckCircle2,
  Clock, User, Mail, Calendar, AlertTriangle
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { type PerformanceTier } from "@/lib/store";

function CheckoutForm() {
  const router = useRouter();
  const sp = useSearchParams();

  const machineId = sp.get("machineId") ?? "";
  const machineName = sp.get("machineName") ?? "";
  const machineTier = (sp.get("machineTier") ?? "Pro") as PerformanceTier;
  const pricePerHour = Number(sp.get("pricePerHour") ?? 0);
  const slot = sp.get("slot") ?? "";
  const duration = Number(sp.get("duration") ?? 1);
  const totalPrice = Number(sp.get("totalPrice") ?? 0);
  const userName = sp.get("userName") ?? "";
  const userEmail = sp.get("userEmail") ?? "";
  const reservationDate = sp.get("date") ?? new Date().toISOString().split("T")[0];

  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", holder: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"form" | "processing" | "done">("form");
  const [slotTaken, setSlotTaken] = useState(false);
  const inFlight = useRef(false);

  // Re-check on mount: if the user lingered and the slot was booked meanwhile, warn before they fill the card.
  useEffect(() => {
    if (!machineId || !slot) return;
    fetch(`/api/machines/${machineId}/booked-slots?date=${reservationDate}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((slots: string[]) => {
        if (slots.includes(slot)) setSlotTaken(true);
      })
      .catch((err) => console.error("[checkout] slot recheck failed:", err));
  }, [machineId, slot, reservationDate]);

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const rawNumber = card.number.replace(/\s/g, "");
    if (rawNumber.length < 16) newErrors.number = "Enter a valid 16-digit card number";
    if (!card.expiry || card.expiry.length < 5) newErrors.expiry = "Enter a valid expiry date";
    if (!card.cvv || card.cvv.length < 3) newErrors.cvv = "Enter a valid CVV";
    if (!card.holder.trim()) newErrors.holder = "Cardholder name is required";
    return newErrors;
  };

  const handlePay = async () => {
    // Synchronous guard against double-submit. React's disabled prop updates async,
    // so two rapid clicks can both pass the disabled check before state commits.
    if (inFlight.current) return;
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    inFlight.current = true;
    setStep("processing");
    setProcessing(true);

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2500));

    try {
      const last4 = card.number.replace(/\s/g, "").slice(-4);

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machineId,
          machineName,
          machineTier,
          userName,
          userEmail,
          date: reservationDate,
          timeSlot: slot,
          duration,
          totalPrice,
          paymentMethod: "card",
          cardLast4: last4,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create reservation");
      }

      const reservation = await res.json();

      setStep("done");
      setTimeout(() => {
        router.push(
          `/confirmation?id=${reservation.id}&name=${encodeURIComponent(userName)}&machine=${encodeURIComponent(machineName)}&slot=${slot}&duration=${duration}&total=${totalPrice}&email=${encodeURIComponent(userEmail)}`
        );
      }, 1500);
    } catch (err) {
      console.error("[v0] Reservation creation failed:", err);
      setStep("form");
      setProcessing(false);
      inFlight.current = false; // allow retry after a real error
      const msg = err instanceof Error ? err.message : "Reservation failed. Please try again.";
      if (msg.toLowerCase().includes("already booked")) {
        setSlotTaken(true);
      } else {
        setErrors({ number: msg });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16">
        {/* Breadcrumb */}
        <div className="border-b border-border/50 px-4 sm:px-6 py-3 bg-surface-1/30">
          <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Link href={`/machines/${machineId}`} className="hover:text-foreground flex items-center gap-1 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-foreground font-bold" style={{ fontFamily: "var(--font-orbitron)" }}>Checkout</span>
          </div>
        </div>

        {/* Processing overlay */}
        {(step === "processing" || step === "done") && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-spin border-t-primary" />
                <div className="absolute inset-3 rounded-full border-2 border-primary/20 animate-spin border-b-primary" style={{ animationDuration: "1.5s" }} />
                {step === "done" ? (
                  <CheckCircle2 className="absolute inset-0 m-auto w-8 h-8 text-primary" />
                ) : (
                  <Lock className="absolute inset-0 m-auto w-8 h-8 text-primary" />
                )}
              </div>
              <h2 className="text-xl font-black tracking-widest neon-text-cyan" style={{ fontFamily: "var(--font-orbitron)" }}>
                {step === "done" ? "PAYMENT CONFIRMED" : "PROCESSING PAYMENT"}
              </h2>
              <p className="text-muted-foreground text-sm mt-2">
                {step === "done" ? "Redirecting to confirmation..." : "Securing your transaction..."}
              </p>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          {slotTaken && (
            <div className="mb-6 p-4 rounded-sm border border-red-400/40 bg-red-400/10 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-bold text-red-400 mb-1" style={{ fontFamily: "var(--font-orbitron)" }}>
                  SLOT NO LONGER AVAILABLE
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Someone else just booked {machineName} at {slot}. Please pick a different time slot.
                </p>
                <Link
                  href={`/machines/${machineId}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-400/20 border border-red-400/40 text-red-400 text-xs font-bold tracking-widest uppercase rounded-sm hover:bg-red-400/30 transition-colors"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Pick another slot
                </Link>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Payment Form */}
            <div className="lg:col-span-3">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-widest" style={{ fontFamily: "var(--font-orbitron)" }}>
                    SECURE CHECKOUT
                  </h1>
                  <p className="text-xs text-muted-foreground">256-bit SSL encrypted transaction (Simulation)</p>
                </div>
              </div>

              {/* Payment visual */}
              <div className="relative h-40 rounded-sm overflow-hidden border border-border/50 mb-8">
                <Image src="/images/payment-visual.jpg" alt="Secure payment" fill className="object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
                <div className="absolute inset-0 flex items-center px-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold tracking-widest uppercase text-primary" style={{ fontFamily: "var(--font-orbitron)" }}>
                        Simulation Mode
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">No real transactions. Use any test card numbers.</p>
                  </div>
                </div>
              </div>

              {/* Card Form */}
              <div className="card-gaming rounded-sm p-6">
                <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-5" style={{ fontFamily: "var(--font-orbitron)" }}>
                  Card Details
                </h3>
                <div className="space-y-4">
                  {/* Card Number */}
                  <div>
                    <label className="block text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5">
                      Card Number
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={card.number}
                        onChange={(e) => { setCard({ ...card, number: formatCardNumber(e.target.value) }); setErrors({ ...errors, number: "" }); }}
                        className="w-full bg-input border border-border rounded-sm pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono"
                      />
                    </div>
                    {errors.number && <p className="text-xs text-red-400 mt-1">{errors.number}</p>}
                  </div>

                  {/* Expiry + CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={card.expiry}
                        onChange={(e) => { setCard({ ...card, expiry: formatExpiry(e.target.value) }); setErrors({ ...errors, expiry: "" }); }}
                        className="w-full bg-input border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono"
                      />
                      {errors.expiry && <p className="text-xs text-red-400 mt-1">{errors.expiry}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        maxLength={4}
                        value={card.cvv}
                        onChange={(e) => { setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }); setErrors({ ...errors, cvv: "" }); }}
                        className="w-full bg-input border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono"
                      />
                      {errors.cvv && <p className="text-xs text-red-400 mt-1">{errors.cvv}</p>}
                    </div>
                  </div>

                  {/* Cardholder */}
                  <div>
                    <label className="block text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5">
                      Cardholder Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Full name on card"
                        value={card.holder}
                        onChange={(e) => { setCard({ ...card, holder: e.target.value }); setErrors({ ...errors, holder: "" }); }}
                        className="w-full bg-input border border-border rounded-sm pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    {errors.holder && <p className="text-xs text-red-400 mt-1">{errors.holder}</p>}
                  </div>
                </div>

                <button
                  onClick={handlePay}
                  disabled={processing || slotTaken}
                  className="mt-6 w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground text-sm font-black tracking-widest uppercase rounded-sm neon-glow-cyan hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  <Lock className="w-4 h-4" />
                  {slotTaken ? "Slot Unavailable" : `Pay $${totalPrice} — Confirm Reservation`}
                </button>

                <div className="flex items-center justify-center gap-4 mt-4">
                  {["VISA", "MC", "AMEX", "PAYPAL"].map((brand) => (
                    <span key={brand} className="text-xs text-muted-foreground/60 font-bold">{brand}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="card-gaming rounded-sm p-6 sticky top-24">
                <h3
                  className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-5"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  Reservation Summary
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3 pb-4 border-b border-border/50">
                    <div className="w-8 h-8 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-foreground" style={{ fontFamily: "var(--font-orbitron)" }}>
                        {machineName}
                      </div>
                      <div className="text-xs text-muted-foreground">{machineTier} Tier</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Player:</span>
                      <span className="text-foreground font-semibold ml-auto">{userName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground truncate text-xs">{userEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Time Slot:</span>
                      <span className="text-foreground font-semibold ml-auto">{slot}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="text-foreground font-semibold ml-auto">{duration}h</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Session rate</span>
                    <span>${pricePerHour}/hr</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Duration</span>
                    <span>{duration}h</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Platform fee</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="font-bold text-sm">Total</span>
                    <span className="text-xl font-black text-primary neon-text-cyan" style={{ fontFamily: "var(--font-orbitron)" }}>
                      ${totalPrice}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-sm">
                  <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground">Simulation only — no real charges</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  );
}
