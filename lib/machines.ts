import { createClient } from "@/lib/supabase/server";
import { mapMachineRow, type GamingMachine } from "@/lib/store";

// Try the embedded join first; if machine_games doesn't exist yet (e.g. pre-migration),
// fall back to a plain machines select so the rest of the app keeps working.
export async function getMachines(): Promise<GamingMachine[]> {
  const supabase = await createClient();
  let { data, error } = await supabase
    .from("machines")
    .select("*, machine_games(game_id)")
    .order("sort_order", { ascending: true });

  if (error) {
    const plain = await supabase
      .from("machines")
      .select("*")
      .order("sort_order", { ascending: true });
    data = plain.data;
    error = plain.error;
  }

  if (error) {
    console.error("[machines] fetch failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapMachineRow);
}

export async function getMachine(id: string): Promise<GamingMachine | null> {
  const supabase = await createClient();
  let { data, error } = await supabase
    .from("machines")
    .select("*, machine_games(game_id)")
    .eq("id", id)
    .single();

  if (error) {
    const plain = await supabase.from("machines").select("*").eq("id", id).single();
    data = plain.data;
    error = plain.error;
  }

  if (error || !data) return null;
  return mapMachineRow(data);
}
