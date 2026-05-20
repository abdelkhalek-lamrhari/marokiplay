"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function ProfileForm({ initialName, email }: { initialName: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [savingName, setSavingName] = useState(false);
  const [pwd, setPwd] = useState({ next: "", confirm: "" });
  const [changingPwd, setChangingPwd] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveName = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSavingName(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ data: { name: name.trim() } });
    setSavingName(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
    router.refresh();
  };

  const changePassword = async () => {
    if (pwd.next.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (pwd.next !== pwd.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setChangingPwd(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    setChangingPwd(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPwd({ next: "", confirm: "" });
    toast.success("Password updated");
  };

  const deleteAccount = async () => {
    if (!confirm("Permanently delete your account? Your reservations will remain but be unlinked.")) return;
    setDeleting(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to delete account");
      return;
    }
    toast.success("Account deleted");
    // Sign out client-side and go home.
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Email (read-only) */}
      <div className="card-gaming rounded-sm p-5">
        <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3" style={{ fontFamily: "var(--font-orbitron)" }}>
          Email
        </h2>
        <div className="text-sm text-foreground font-mono">{email}</div>
        <p className="text-xs text-muted-foreground mt-2">Email changes are not supported yet — contact support if you need to change it.</p>
      </div>

      {/* Name */}
      <div className="card-gaming rounded-sm p-5">
        <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3" style={{ fontFamily: "var(--font-orbitron)" }}>
          Display name
        </h2>
        <div className="relative mb-3">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-input border border-border rounded-sm pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary"
            placeholder="Your name"
          />
        </div>
        <button
          onClick={saveName}
          disabled={savingName || name === initialName}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold tracking-widest uppercase rounded-sm neon-glow-cyan hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          <Save className="w-3.5 h-3.5" /> {savingName ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Password */}
      <div className="card-gaming rounded-sm p-5 space-y-3">
        <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground" style={{ fontFamily: "var(--font-orbitron)" }}>
          Change password
        </h2>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="password"
            value={pwd.next}
            onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
            placeholder="New password (min 6 chars)"
            className="w-full bg-input border border-border rounded-sm pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary"
            autoComplete="new-password"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="password"
            value={pwd.confirm}
            onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
            placeholder="Confirm new password"
            className="w-full bg-input border border-border rounded-sm pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary"
            autoComplete="new-password"
          />
        </div>
        <button
          onClick={changePassword}
          disabled={changingPwd || !pwd.next || !pwd.confirm}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold tracking-widest uppercase rounded-sm neon-glow-cyan hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          <Lock className="w-3.5 h-3.5" /> {changingPwd ? "Updating…" : "Update password"}
        </button>
      </div>

      {/* Danger zone */}
      <div className="rounded-sm p-5 border border-red-400/30 bg-red-400/5">
        <h2 className="text-xs font-bold tracking-widest uppercase text-red-400 mb-2" style={{ fontFamily: "var(--font-orbitron)" }}>
          Danger zone
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Deletes your account permanently. Past reservations stay in the system but are unlinked.
        </p>
        <button
          onClick={deleteAccount}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 bg-red-400/10 border border-red-400/30 text-red-400 text-xs font-bold tracking-widest uppercase rounded-sm hover:bg-red-400/20 transition-colors disabled:opacity-50"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          <Trash2 className="w-3.5 h-3.5" /> {deleting ? "Deleting…" : "Delete account"}
        </button>
      </div>
    </div>
  );
}
