import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Window: user can start the session from 5 min before slot start through end-of-session.
const START_LEAD_MS = 5 * 60 * 1000;

// Override via CENTRAL_WEBHOOK_URL env var; defaults to the production webhook.
const WEBHOOK_URL = process.env.CENTRAL_WEBHOOK_URL ?? "https://api.carbonmaroc.store/webhook";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { pin } = await req.json();

  if (!pin || typeof pin !== "string" || !pin.trim()) {
    return NextResponse.json({ error: "PIN is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch reservation + machine in parallel.
  const { data: r, error: rErr } = await supabase
    .from("reservations")
    .select("user_id, machine_id, status, date, time_slot, duration")
    .eq("id", id)
    .single();
  if (rErr || !r) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  if (r.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (r.status !== "approved") {
    return NextResponse.json({ error: `Reservation must be approved to start (current: ${r.status})` }, { status: 400 });
  }

  // Time window check (server-side authoritative).
  const startHour = parseInt(String(r.time_slot).split(":")[0], 10);
  const start = new Date(`${r.date}T${String(startHour).padStart(2, "0")}:00:00`);
  const end = new Date(start.getTime() + Number(r.duration) * 60 * 60 * 1000);
  const earliest = new Date(start.getTime() - START_LEAD_MS);
  const now = new Date();
  if (now < earliest) {
    return NextResponse.json({ error: "Your reservation hasn't started yet" }, { status: 400 });
  }
  if (now > end) {
    return NextResponse.json({ error: "Your reservation window has ended" }, { status: 400 });
  }

  // Look up the rig IP and the user's phone.
  const [machineRes, userRes] = await Promise.all([
    supabase.from("machines").select("ip_address").eq("id", r.machine_id).single(),
    supabase.from("users").select("phone_number").eq("id", user.id).maybeSingle(),
  ]);

  const ipAddress = machineRes.data?.ip_address as string | null;
  const phoneNumber = (userRes.data?.phone_number as string | null) ?? null;

  if (!ipAddress) {
    return NextResponse.json({ error: "This rig has no IP configured. Contact support." }, { status: 500 });
  }
  if (!phoneNumber) {
    return NextResponse.json({ error: "Add a phone number to your profile first." }, { status: 400 });
  }

  // Forward to the central PC webhook.
  try {
    const webhookRes = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ip_address: ipAddress,
        phone_number: phoneNumber,
        pin: pin.trim(),
      }),
    });

    if (!webhookRes.ok) {
      const text = await webhookRes.text().catch(() => "");
      console.error("[start] webhook failed", webhookRes.status, text);
      return NextResponse.json(
        { error: `Central PC rejected the request (${webhookRes.status})` },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[start] webhook fetch error:", err);
    return NextResponse.json({ error: "Could not reach the central PC" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
