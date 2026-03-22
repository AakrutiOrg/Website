import { createClient } from "@/lib/supabase/server";
import type { Market } from "@/types/market";

export async function getMarkets(): Promise<Market[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("markets")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch markets:", error);
    return [];
  }

  return data as Market[];
}
