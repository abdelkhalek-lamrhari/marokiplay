import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  return NextResponse.json({ ok: true });
}
