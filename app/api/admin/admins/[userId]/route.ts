import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

// DELETE — revoke admin from a user.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const { userId } = await params;

  // Safety: can't revoke yourself (avoids the only-admin-locks-self-out footgun).
  if (userId === check.userId) {
    return NextResponse.json({ error: "You cannot revoke your own admin access" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("admin_users").delete().eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
