import { createClient } from "@/lib/supabase/server";
import { mapMachineRow, type GamingMachine } from "@/lib/store";

export async function getMachines(): Promise<GamingMachine[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machines")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[machines] fetch failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapMachineRow);
}

export async function getMachine(id: string): Promise<GamingMachine | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machines")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapMachineRow(data);
}
