import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/types";

type CategoryWithProducts = {
  category: Category | null;
  products: Product[];
};

export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryWithProducts> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id, name, slug, description, image_url, sort_order, is_active")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (categoryError) {
      throw new Error(`Failed to fetch category: ${categoryError.message}`);
    }

    if (!category) {
      return {
        category: null,
        products: [],
      };
    }

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(
        "id, name, slug, description, image_url, price, category_id, is_active",
      )
      .eq("category_id", category.id)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    return {
      category: category satisfies Category,
      products: products satisfies Product[],
    };
  } catch {
    return {
      category: null,
      products: [],
    };
  }
}
