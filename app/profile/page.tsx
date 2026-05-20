import { redirect } from "next/navigation";
import { UserCircle } from "lucide-react";
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

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <ProfileForm initialName={name} email={user.email ?? ""} />
        </div>
      </main>
    </div>
  );
}
