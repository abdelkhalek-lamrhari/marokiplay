import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

// GET — list current admins (with their emails).
export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from("admin_users")
    .select("user_id, granted_at")
    .order("granted_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolve emails via the auth admin API.
  const result: { userId: string; email: string; grantedAt: string }[] = [];
  for (const row of rows ?? []) {
    const { data: userResp } = await supabase.auth.admin.getUserById(row.user_id as string);
    result.push({
      userId: row.user_id as string,
      email: userResp.user?.email ?? "(unknown)",
      grantedAt: row.granted_at as string,
    });
  }
  return NextResponse.json(result);
}

// POST — grant admin to a user by email.
export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  // Look up the user by email. auth.admin.listUsers paginates but for our small fleet, page 1 is fine.
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

  const match = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!match) {
    return NextResponse.json({ error: "No user with that email" }, { status: 404 });
  }

  const { error: insertError } = await supabase
    .from("admin_users")
    .insert({ user_id: match.id });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "User is already an admin" }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId: match.id, email: match.email }, { status: 201 });
}
