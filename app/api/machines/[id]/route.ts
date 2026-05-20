import { NextRequest, NextResponse } from "next/server";
import { getMachine } from "@/lib/machines";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { mapMachineRow } from "@/lib/store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const machine = await getMachine(id);

  if (!machine) {
    return NextResponse.json({ error: "Machine not found" }, { status: 404 });
  }
  return NextResponse.json(machine);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  const passthrough = ["name", "tier", "cpu", "gpu", "ram", "storage", "status", "image", "description", "features", "availability", "platforms", "latency"] as const;
  for (const key of passthrough) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  if (body.pricePerHour !== undefined) updates.price_per_hour = body.pricePerHour;
  if (body.ipAddress !== undefined) updates.ip_address = body.ipAddress || null;
  if (body.connectionInstructions !== undefined) updates.connection_instructions = body.connectionInstructions || null;
  if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("machines")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Update failed" }, { status: 500 });
  }
  return NextResponse.json(mapMachineRow(data));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("machines").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
