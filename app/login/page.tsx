"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Zap, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      toast.error(error.message);
      return;
    }
    toast.success("Logged in");
    router.push("/machines");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Zap className="w-8 h-8 text-primary mx-auto mb-3" />
            <h1 className="text-3xl font-black tracking-widest mb-2" style={{ fontFamily: "var(--font-orbitron)" }}>
              WELCOME <span className="neon-text-cyan">BACK</span>
            </h1>
            <p className="text-sm text-muted-foreground">Log in to manage your reservations</p>
          </div>

          <form onSubmit={handleSubmit} className="card-gaming rounded-sm p-6 space-y-4">
            {error && (
              <div className="px-3 py-2 bg-red-400/10 border border-red-400/30 text-red-400 text-xs rounded-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5" style={{ fontFamily: "var(--font-orbitron)" }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-input border border-border rounded-sm pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5" style={{ fontFamily: "var(--font-orbitron)" }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-input border border-border rounded-sm pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground text-sm font-bold tracking-widest uppercase rounded-sm neon-glow-cyan hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              {submitting ? "Signing in…" : "Log In"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:opacity-80 font-bold">Sign up</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
