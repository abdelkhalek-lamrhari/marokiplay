"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Zap, ChevronRight, Phone } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setInfo("");

    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email";
    const phone = form.phone.trim();
    if (!phone) newErrors.phone = "Phone number is required";
    else if (!/^\+?[0-9\s-]{8,20}$/.test(phone)) newErrors.phone = "Use international format, e.g. +212600000000";
    if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { data: { name: form.name.trim(), phone_number: phone } },
    });
    setSubmitting(false);

    if (error) {
      setErrors({ email: error.message });
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Account created");
      router.push("/machines");
      router.refresh();
    } else {
      setInfo("Check your email to confirm your account, then log in.");
      toast.info("Check your email to confirm your account");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Zap className="w-8 h-8 text-primary mx-auto mb-3" />
            <h1 className="text-3xl font-black tracking-widest mb-2" style={{ fontFamily: "var(--font-orbitron)" }}>
              CREATE <span className="neon-text-cyan">ACCOUNT</span>
            </h1>
            <p className="text-sm text-muted-foreground">Sign up to track your reservations</p>
          </div>

          <form onSubmit={handleSubmit} className="card-gaming rounded-sm p-6 space-y-4">
            {info && (
              <div className="px-3 py-2 bg-green-400/10 border border-green-400/30 text-green-400 text-xs rounded-sm">
                {info}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5" style={{ fontFamily: "var(--font-orbitron)" }}>
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-input border border-border rounded-sm pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  placeholder="Your name"
                />
              </div>
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>

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
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1.5" style={{ fontFamily: "var(--font-orbitron)" }}>
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-input border border-border rounded-sm pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  placeholder="+212600000000"
                  autoComplete="tel"
                />
              </div>
              {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
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
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground text-sm font-bold tracking-widest uppercase rounded-sm neon-glow-cyan hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              {submitting ? "Creating…" : "Sign Up"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:opacity-80 font-bold">Log in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
