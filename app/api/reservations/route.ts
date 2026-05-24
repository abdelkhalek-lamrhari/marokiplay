import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/7iyigfjf8k4wf4dprqy9mrrg75uxq9w1";

// GET — admin reads all reservations. Requires admin role.
export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST — create a new reservation + fire webhook
export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    machineId,
    machineName,
    machineTier,
    userName,
    userEmail,
    date,
    timeSlot,
    duration,
    totalPrice,
    paymentMethod,
    cardLast4,
    gameId,
    gameTitle,
    creditsApplied,
  } = body;

  const creditsToRedeem = Math.max(0, Number(creditsApplied) || 0);

  // Validate required fields
  if (!machineId || !machineName || !userName || !userEmail || !date || !timeSlot || !duration || totalPrice === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Reject bookings whose start time is already in the past.
  const reqStartHour = parseInt(String(timeSlot).split(":")[0], 10);
  if (Number.isFinite(reqStartHour)) {
    const now = new Date();
    const reqStart = new Date(`${date}T${String(reqStartHour).padStart(2, "0")}:00:00`);
    if (reqStart.getTime() <= now.getTime()) {
      return NextResponse.json(
        { error: "That time slot is already in the past." },
        { status: 400 }
      );
    }
  }

  const supabase = await createClient();

  // Attach user_id from session if the requester is logged in. Guests stay null.
  const { data: { user } } = await supabase.auth.getUser();

  // Pre-check for overlap with existing non-cancelled reservations on same machine + date.
  // The DB EXCLUDE constraint is the source of truth, but checking first lets us return
  // a clean 409 without a roundtrip through a Postgres exclusion_violation error.
  const newStartHour = parseInt(String(timeSlot).split(":")[0], 10);
  const newEndHour = newStartHour + Number(duration);
  if (Number.isFinite(newStartHour) && Number.isFinite(newEndHour)) {
    const { data: existing } = await supabase
      .from("reservations")
      .select("time_slot, duration")
      .eq("machine_id", machineId)
      .eq("date", date)
      .neq("status", "cancelled");

    const overlaps = (existing ?? []).some((r) => {
      const exStart = parseInt(String(r.time_slot).split(":")[0], 10);
      const exEnd = exStart + Number(r.duration);
      return newStartHour < exEnd && newEndHour > exStart;
    });
    if (overlaps) {
      return NextResponse.json(
        { error: "That time slot is already booked. Please pick another." },
        { status: 409 }
      );
    }
  }

  // If credits are being redeemed, user must be logged in and have enough balance.
  if (creditsToRedeem > 0) {
    if (!user) {
      return NextResponse.json({ error: "Sign in to use credits" }, { status: 401 });
    }
    if (creditsToRedeem > Number(totalPrice)) {
      return NextResponse.json({ error: "Credits cannot exceed booking total" }, { status: 400 });
    }
  }

  const insertPayload = {
    machine_id: machineId,
    machine_name: machineName,
    machine_tier: machineTier,
    user_name: userName,
    user_email: userEmail,
    date,
    time_slot: timeSlot,
    duration,
    total_price: totalPrice,
    status: "pending",
    payment_method: paymentMethod ?? "card",
    card_last4: cardLast4 ?? null,
    user_id: user?.id ?? null,
    game_id: gameId ?? null,
    game_title: gameTitle ?? null,
    credits_applied: creditsToRedeem,
  };

  // Build webhook payload (reservation ID not yet known — use a pre-resolved placeholder,
  // the real ID will be the one returned by Supabase after insert)
  const webhookPayload = {
    machine_id: machineId,
    machine_name: machineName,
    machine_tier: machineTier,
    user_name: userName,
    user_email: userEmail,
    date,
    time_slot: timeSlot,
    duration,
    total_price: totalPrice,
    status: "pending",
    payment_method: paymentMethod ?? "card",
    card_last4: cardLast4 ?? null,
  };

  // Fire Supabase insert and Make.com webhook simultaneously
  console.log("[v0] Firing webhook to Make.com:", MAKE_WEBHOOK_URL);
  console.log("[v0] Webhook payload:", webhookPayload);

  const [dbResult, webhookResult] = await Promise.allSettled([
    supabase.from("reservations").insert(insertPayload).select().single(),
    fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    }),
  ]);

  if (dbResult.status === "rejected" || (dbResult.status === "fulfilled" && dbResult.value.error)) {
    const code = dbResult.status === "fulfilled" ? dbResult.value.error?.code : undefined;
    // 23505 = unique_violation (legacy exact-slot index), 23P01 = exclusion_violation (overlap)
    if (code === "23505" || code === "23P01") {
      return NextResponse.json(
        { error: "That time slot is already booked. Please pick another." },
        { status: 409 }
      );
    }
    const msg = dbResult.status === "rejected"
      ? String(dbResult.reason)
      : dbResult.value.error!.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (webhookResult.status === "rejected") {
    console.error("[v0] Make.com webhook failed:", webhookResult.reason);
  } else if (webhookResult.status === "fulfilled") {
    const webhookRes = webhookResult.value as Response;
    console.log("[v0] Make.com webhook response status:", webhookRes.status);
    console.log("[v0] Make.com webhook response ok:", webhookRes.ok);
    const webhookText = await webhookRes.text();
    console.log("[v0] Make.com webhook response body:", webhookText);
  }

  const data = dbResult.value.data!;

  // Redeem credits atomically via the RPC. If it fails, roll back the reservation.
  if (creditsToRedeem > 0 && user) {
    const { error: rpcError } = await supabase.rpc("redeem_credits", {
      p_user_id: user.id,
      p_amount: creditsToRedeem,
      p_reservation_id: data.id,
    });
    if (rpcError) {
      await supabase.from("reservations").delete().eq("id", data.id);
      return NextResponse.json(
        { error: rpcError.message || "Failed to redeem credits" },
        { status: 400 }
      );
    }
  }

  return NextResponse.json(data, { status: 201 });
}
