import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_RESCHEDULES = 2;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { date, timeSlot } = await req.json();

  if (!date || !timeSlot) {
    return NextResponse.json({ error: "date and timeSlot required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing, error: fetchError } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !existing) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (existing.status === "completed" || existing.status === "cancelled") {
    return NextResponse.json(
      { error: `Cannot reschedule a ${existing.status} reservation` },
      { status: 400 }
    );
  }
  if ((existing.reschedule_count ?? 0) >= MAX_RESCHEDULES) {
    return NextResponse.json(
      { error: `You've already used all ${MAX_RESCHEDULES} reschedules for this reservation.` },
      { status: 400 }
    );
  }

  // Reject past times.
  const startHour = parseInt(String(timeSlot).split(":")[0], 10);
  const reqStart = new Date(`${date}T${String(startHour).padStart(2, "0")}:00:00`);
  if (Number.isFinite(startHour) && reqStart.getTime() <= Date.now()) {
    return NextResponse.json({ error: "That time is already in the past." }, { status: 400 });
  }

  // Pre-check overlap (DB exclusion constraint is the authoritative source of truth).
  const newEndHour = startHour + Number(existing.duration);
  if (Number.isFinite(startHour) && Number.isFinite(newEndHour)) {
    const { data: othersOnDay } = await supabase
      .from("reservations")
      .select("id, time_slot, duration")
      .eq("machine_id", existing.machine_id)
      .eq("date", date)
      .neq("status", "cancelled")
      .neq("id", id);

    const overlaps = (othersOnDay ?? []).some((r) => {
      const exStart = parseInt(String(r.time_slot).split(":")[0], 10);
      const exEnd = exStart + Number(r.duration);
      return startHour < exEnd && newEndHour > exStart;
    });
    if (overlaps) {
      return NextResponse.json(
        { error: "That time slot is already booked. Please pick another." },
        { status: 409 }
      );
    }
  }

  const { data, error } = await supabase
    .from("reservations")
    .update({
      date,
      time_slot: timeSlot,
      reschedule_count: (existing.reschedule_count ?? 0) + 1,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23P01" || error.code === "23505") {
      return NextResponse.json(
        { error: "That time slot is already booked. Please pick another." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
