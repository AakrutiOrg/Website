import { createClient } from "@/lib/supabase/server";
import { getCurrentMarket } from "@/lib/market/resolve-market";
import type { MarketAwareProduct } from "@/types/product";

export async function getMarketAwareProducts(marketCodeOverride?: string): Promise<MarketAwareProduct[]> {
  const market = await getCurrentMarket(marketCodeOverride);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_catalog_market_view")
    .select("*")
    .eq("market_id", market.id);

  if (error) {
    console.error("Error fetching market aware products:", error);
    return [];
  }

  return (data as MarketAwareProduct[]).map((p) => ({
    ...p,
    primary_image_url: p.primary_image_url
      ? supabase.storage.from("product-images").getPublicUrl(p.primary_image_url).data.publicUrl
      : null,
  }));
}

export async function getMarketAwareProductBySlug(slug: string, marketCodeOverride?: string): Promise<MarketAwareProduct | null> {
  const market = await getCurrentMarket(marketCodeOverride);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_catalog_market_view")
    .select("*")
    .eq("market_id", market.id)
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching market aware product by slug:", error);
    return null;
  }

  const product = data as MarketAwareProduct;
  return {
    ...product,
    primary_image_url: product.primary_image_url
      ? supabase.storage.from("product-images").getPublicUrl(product.primary_image_url).data.publicUrl
      : null,
  };
}
