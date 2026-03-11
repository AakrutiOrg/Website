import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, image_url, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data satisfies Category[];
  } catch {
    return [];
  }
}
