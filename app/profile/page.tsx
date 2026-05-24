import { redirect } from "next/navigation";
import { UserCircle, Coins } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = (user.user_metadata?.name as string) ?? "";

  // Pull credit balance + recent transactions for the loyalty section.
  const { data: userRow } = await supabase
    .from("users")
    .select("credits")
    .eq("id", user.id)
    .maybeSingle();
  const credits = Number(userRow?.credits ?? 0);

  const { data: txRows } = await supabase
    .from("credit_transactions")
    .select("id, amount, reason, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);
  const transactions = txRows ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16">
        <div className="border-b border-border/50 py-12 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <div className="w-12 h-12 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-widest" style={{ fontFamily: "var(--font-orbitron)" }}>
                MY <span className="neon-text-cyan">PROFILE</span>
              </h1>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-6">
          {/* Loyalty Credits */}
          <div className="rounded-sm p-5 border border-yellow-400/30 bg-yellow-400/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest uppercase text-yellow-400 flex items-center gap-2" style={{ fontFamily: "var(--font-orbitron)" }}>
                <Coins className="w-4 h-4" /> Loyalty credits
              </h2>
              <div className="text-3xl font-black text-yellow-400" style={{ fontFamily: "var(--font-orbitron)" }}>
                ${credits.toFixed(2)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Earn 10% back as credits on every completed reservation. Redeem during checkout to discount future bookings.
            </p>
            {transactions.length === 0 ? (
              <div className="text-xs text-muted-foreground italic">No activity yet — complete a session to start earning.</div>
            ) : (
              <div className="space-y-1.5">
                <div className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-2" style={{ fontFamily: "var(--font-orbitron)" }}>
                  Recent activity
                </div>
                {transactions.map((tx) => {
                  const amt = Number(tx.amount);
                  const earned = amt >= 0;
                  return (
                    <div key={tx.id as string} className="flex items-center justify-between text-xs py-1 border-b border-yellow-400/10 last:border-0">
                      <div>
                        <span className={earned ? "text-yellow-400" : "text-muted-foreground"}>
                          {tx.reason === "booking_completed" ? "Earned from booking" : tx.reason === "redeemed" ? "Redeemed at checkout" : tx.reason}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          {new Date(tx.created_at as string).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`font-mono font-bold ${earned ? "text-yellow-400" : "text-red-400"}`}>
                        {earned ? "+" : ""}${amt.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <ProfileForm initialName={name} email={user.email ?? ""} />
        </div>
      </main>
    </div>
  );
}
