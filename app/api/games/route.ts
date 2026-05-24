import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapGameRow } from "@/lib/games";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json((data ?? []).map(mapGameRow));
}
