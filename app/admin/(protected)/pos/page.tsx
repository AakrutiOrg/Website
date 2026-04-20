import { AdminPosDashboard } from "@/components/admin/admin-pos-dashboard";
import { getOptionalSumUpEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Order, PosCatalogItem } from "@/types";

export default async function AdminPosPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: recentSales }] = await Promise.all([
    supabase
      .from("product_catalog_market_view")
      .select("product_id, name, slug, category_name, market_currency, price, stock_quantity, low_stock_threshold, primary_image_url")
      .eq("market_code", "UK")
      .order("name", { ascending: true }),
    supabase
      .from("orders")
      .select("*")
      .eq("sale_channel", "pos")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const catalog = ((products ?? []) as PosCatalogItem[])
    .filter((product) => product.price != null)
    .map((product) => ({
      ...product,
      primary_image_url: product.primary_image_url
        ? supabase.storage.from("product-images").getPublicUrl(product.primary_image_url).data.publicUrl
        : null,
    }));

  return (
    <AdminPosDashboard
      products={catalog}
      recentSales={(recentSales ?? []) as Order[]}
      sumUpConfigured={!!getOptionalSumUpEnv()}
    />
  );
}
