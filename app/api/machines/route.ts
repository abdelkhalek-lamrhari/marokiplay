import { NextRequest, NextResponse } from "next/server";
import { getMachines } from "@/lib/machines";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { mapMachineRow } from "@/lib/store";

export async function GET() {
  const machines = await getMachines();
  return NextResponse.json(machines);
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const body = await req.json();

  const required = ["id", "name", "tier", "cpu", "gpu", "ram", "storage", "pricePerHour", "image", "description", "latency"];
  for (const key of required) {
    if (body[key] === undefined || body[key] === null || body[key] === "") {
      return NextResponse.json({ error: `Missing field: ${key}` }, { status: 400 });
    }
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("machines")
    .insert({
      id: body.id,
      name: body.name,
      tier: body.tier,
      cpu: body.cpu,
      gpu: body.gpu,
      ram: body.ram,
      storage: body.storage,
      status: body.status ?? "available",
      price_per_hour: body.pricePerHour,
      image: body.image,
      description: body.description,
      features: body.features ?? [],
      availability: body.availability ?? [],
      platforms: body.platforms ?? [],
      latency: body.latency,
      ip_address: body.ipAddress ?? null,
      connection_instructions: body.connectionInstructions ?? null,
      sort_order: body.sortOrder ?? 999,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A machine with that ID already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(mapMachineRow(data), { status: 201 });
}
