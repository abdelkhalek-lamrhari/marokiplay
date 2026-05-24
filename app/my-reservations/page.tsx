import { redirect } from "next/navigation";
import Link from "next/link";
import { Zap, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { ReservationCard } from "./reservation-card";

export default async function MyReservationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: reservations } = await supabase
    .from("reservations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = reservations ?? [];
  const machineIds = Array.from(new Set(rows.map((r) => r.machine_id as string)));
  const machineMap = new Map<string, {
    ip_address: string | null;
    image: string | null;
    connection_instructions: string | null;
    availability: string[];
  }>();
  if (machineIds.length > 0) {
    const { data: machines } = await supabase
      .from("machines")
      .select("id, ip_address, image, connection_instructions, availability")
      .in("id", machineIds);
    for (const m of machines ?? []) {
      machineMap.set(m.id as string, {
        ip_address: m.ip_address ?? null,
        image: m.image ?? null,
        connection_instructions: m.connection_instructions ?? null,
        availability: (m.availability as string[]) ?? [],
      });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16">
        <div className="border-b border-border/50 py-12 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-black tracking-widest mb-2" style={{ fontFamily: "var(--font-orbitron)" }}>
              MY <span className="neon-text-cyan">RESERVATIONS</span>
            </h1>
            <p className="text-muted-foreground text-sm">Signed in as {user.email}</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          {rows.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">You don&apos;t have any reservations yet.</p>
              <Link
                href="/machines"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-xs font-bold tracking-widest uppercase rounded-sm neon-glow-cyan"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                <Zap className="w-3.5 h-3.5" /> Browse Machines <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => {
                const machine = machineMap.get(r.machine_id as string);
                return (
                  <ReservationCard
                    key={r.id as string}
                    reservation={{
                      id: r.id as string,
                      machineId: r.machine_id as string,
                      machineName: r.machine_name as string,
                      machineTier: r.machine_tier as string,
                      date: r.date as string,
                      timeSlot: r.time_slot as string,
                      duration: r.duration as number,
                      totalPrice: r.total_price as number,
                      status: r.status as string,
                      rescheduleCount: (r.reschedule_count as number) ?? 0,
                      gameTitle: (r.game_title as string | null) ?? null,
                      creditsApplied: Number(r.credits_applied ?? 0),
                    }}
                    ipAddress={machine?.ip_address ?? null}
                    connectionInstructions={machine?.connection_instructions ?? null}
                    machineAvailability={machine?.availability ?? []}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
