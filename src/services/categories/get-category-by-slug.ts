import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentMarket } from "@/lib/market/resolve-market";
import type { Category } from "@/types";
import type { MarketAwareProduct } from "@/types/product";

export type CategoryWithMarketProducts = {
  category: Category | null;
  products: MarketAwareProduct[];
};

export async function getCategoryBySlug(
  slug: string,
  marketCodeOverride?: string
): Promise<CategoryWithMarketProducts> {
  try {
    const supabase = await createSupabaseServerClient();
    const market = await getCurrentMarket(marketCodeOverride);

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
      .from("product_catalog_market_view")
      .select("*")
      .eq("category_id", category.id)
      .eq("market_id", market.id)
      .eq("market_active", true)
      .order("name", { ascending: true });

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    return {
      category: category as Category,
      products: (products as MarketAwareProduct[]).map((p) => ({
        ...p,
        primary_image_url: p.primary_image_url
          ? supabase.storage.from("product-images").getPublicUrl(p.primary_image_url).data.publicUrl
          : null,
      })),
    };
  } catch (error) {
    console.error(error);
    return {
      category: null,
      products: [],
    };
  }
}
