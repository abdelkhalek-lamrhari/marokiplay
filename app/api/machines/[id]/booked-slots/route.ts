import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Returns every hourly slot blocked by active reservations for this machine on this date.
// A reservation at 09:00 with duration=2 blocks BOTH "09:00" and "10:00".
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const date = req.nextUrl.searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "date query param required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("time_slot, duration")
    .eq("machine_id", id)
    .eq("date", date)
    .neq("status", "cancelled");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const blocked = new Set<string>();
  for (const r of data ?? []) {
    const [hStr, mStr] = (r.time_slot as string).split(":");
    const startHour = parseInt(hStr, 10);
    const minute = mStr ?? "00";
    const duration = Number(r.duration);
    if (!Number.isFinite(startHour) || !Number.isFinite(duration)) continue;
    for (let i = 0; i < duration; i++) {
      const h = startHour + i;
      blocked.add(`${String(h).padStart(2, "0")}:${minute}`);
    }
  }
  return NextResponse.json(Array.from(blocked));
}
