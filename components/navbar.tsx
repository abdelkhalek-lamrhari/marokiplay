"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Zap, Shield, LogOut, UserCircle, ChevronDown, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/machines", label: "Machines" },
  { href: "/games", label: "Games" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [credits, setCredits] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const loadUserExtras = async (currentUser: User | null) => {
      if (!currentUser) { setIsAdmin(false); setCredits(0); return; }
      const [adminRes, creditsRes] = await Promise.all([
        supabase.from("admin_users").select("user_id").eq("user_id", currentUser.id).maybeSingle(),
        supabase.from("users").select("credits").eq("id", currentUser.id).maybeSingle(),
      ]);
      setIsAdmin(!!adminRes.data);
      setCredits(Number(creditsRes.data?.credits ?? 0));
    };
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      loadUserExtras(data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      loadUserExtras(u);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const userInitial = user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-md bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Zap className="w-6 h-6 text-primary animate-pulse-glow" />
          </div>
          <span
            className="text-xl font-black tracking-widest neon-text-cyan"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            MAROKI<span className="text-foreground">PLAY</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-semibold tracking-widest uppercase transition-colors duration-200",
                pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <Link
              href="/my-reservations"
              className={cn(
                "text-sm font-semibold tracking-widest uppercase transition-colors duration-200",
                pathname === "/my-reservations"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              My Reservations
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-widest uppercase border border-border hover:border-primary/50 hover:text-primary rounded-sm transition-all duration-200"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}

          {user ? (
            <div className="relative">
              {credits > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 mr-2 text-xs font-bold border border-yellow-400/30 bg-yellow-400/10 text-yellow-400 rounded-sm" title={`${credits.toFixed(2)} credits available`}>
                  <Coins className="w-3 h-3" /> ${credits.toFixed(2)}
                </span>
              )}
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold tracking-widest uppercase border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 rounded-sm transition-colors"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                  {userInitial}
                </span>
                <span className="max-w-32 truncate">{user.email}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-sm shadow-lg overflow-hidden">
                  <Link
                    href="/my-reservations"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground hover:bg-surface-1/50 transition-colors"
                    style={{ fontFamily: "var(--font-orbitron)" }}
                  >
                    <UserCircle className="w-3.5 h-3.5" /> My Reservations
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground hover:bg-surface-1/50 transition-colors border-t border-border/50"
                    style={{ fontFamily: "var(--font-orbitron)" }}
                  >
                    <UserCircle className="w-3.5 h-3.5" /> Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-widest uppercase text-red-400 hover:bg-red-400/10 transition-colors"
                    style={{ fontFamily: "var(--font-orbitron)" }}
                  >
                    <LogOut className="w-3.5 h-3.5" /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground px-3 py-2 transition-colors"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-widest uppercase bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity neon-glow-cyan"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-card px-4 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "text-sm font-semibold tracking-widest uppercase py-2",
                pathname === link.href ? "text-primary" : "text-muted-foreground"
              )}
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <Link
              href="/my-reservations"
              onClick={() => setOpen(false)}
              className="text-sm font-semibold tracking-widest uppercase py-2 text-muted-foreground"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              My Reservations
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="text-sm font-semibold tracking-widest uppercase py-2 text-muted-foreground"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              Admin Panel
            </Link>
          )}
          {user ? (
            <button
              onClick={() => { setOpen(false); handleSignOut(); }}
              className="text-sm font-semibold tracking-widest uppercase py-2 text-red-400 text-left flex items-center gap-2"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              <LogOut className="w-4 h-4" /> Log Out ({user.email})
            </button>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="text-sm font-semibold tracking-widest uppercase py-2 text-muted-foreground"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                Log In
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground text-sm font-bold tracking-widest uppercase rounded-sm"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
