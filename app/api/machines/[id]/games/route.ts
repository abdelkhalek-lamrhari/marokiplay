import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

// PUT — replace the set of installed games on a machine (admin only).
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const { id } = await params;
  const body = await req.json();
  const gameIds: string[] = Array.isArray(body.gameIds) ? body.gameIds : [];

  const supabase = createAdminClient();

  // Delete the current install rows, then insert the new set.
  // Cheap for the size we deal with (≤ a few dozen rows per machine).
  const { error: delError } = await supabase
    .from("machine_games")
    .delete()
    .eq("machine_id", id);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  if (gameIds.length > 0) {
    const rows = gameIds.map((game_id) => ({ machine_id: id, game_id }));
    const { error: insError } = await supabase.from("machine_games").insert(rows);
    if (insError) return NextResponse.json({ error: insError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, installed: gameIds.length });
}
