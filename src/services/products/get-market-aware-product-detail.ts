import { createClient } from "@/lib/supabase/server";
import { getCurrentMarket } from "@/lib/market/resolve-market";
import type { Category } from "@/types/category";
import type { MarketAwareProduct } from "@/types/product";

export type ProductDetailImage = {
  id: string;
  url: string;
  is_primary: boolean;
};

export type MarketAwareProductDetail = {
  category: Category | null;
  product: MarketAwareProduct | null;
  images: ProductDetailImage[];
  relatedProducts: MarketAwareProduct[];
};

export async function getMarketAwareProductDetail(
  categorySlug: string,
  productSlug: string,
  marketCodeOverride?: string,
): Promise<MarketAwareProductDetail> {
  try {
    const supabase = await createClient();
    const market = await getCurrentMarket(marketCodeOverride);

    const { data: productData, error: productError } = await supabase
      .from("product_catalog_market_view")
      .select("*")
      .eq("market_id", market.id)
      .eq("market_active", true)
      .eq("category_slug", categorySlug)
      .eq("slug", productSlug)
      .maybeSingle();

    if (productError) {
      throw new Error(`Failed to fetch product: ${productError.message}`);
    }

    if (!productData) {
      return {
        category: null,
        product: null,
        images: [],
        relatedProducts: [],
      };
    }

    const product = productData as MarketAwareProduct;

    const [{ data: categoryData }, { data: imageRows, error: imageError }, { data: relatedRows, error: relatedError }] =
      await Promise.all([
        supabase
          .from("categories")
          .select("id, name, slug, description, image_url, sort_order, is_active")
          .eq("id", product.category_id)
          .eq("is_active", true)
          .maybeSingle(),
        supabase
          .from("product_images")
          .select("id, storage_path, is_primary")
          .eq("product_id", product.product_id)
          .order("is_primary", { ascending: false })
          .order("created_at", { ascending: true }),
        supabase
          .from("product_catalog_market_view")
          .select("*")
          .eq("market_id", market.id)
          .eq("market_active", true)
          .eq("category_id", product.category_id)
          .neq("product_id", product.product_id)
          .order("is_featured", { ascending: false })
          .order("name", { ascending: true })
          .limit(3),
      ]);

    if (imageError) {
      throw new Error(`Failed to fetch product images: ${imageError.message}`);
    }

    if (relatedError) {
      throw new Error(`Failed to fetch related products: ${relatedError.message}`);
    }

    const images = (imageRows ?? []).map((image) => ({
      id: image.id as string,
      is_primary: image.is_primary as boolean,
      url: supabase.storage.from("product-images").getPublicUrl(image.storage_path as string).data.publicUrl,
    }));

    const resolvedProduct = {
      ...product,
      primary_image_url: product.primary_image_url
        ? supabase.storage.from("product-images").getPublicUrl(product.primary_image_url).data.publicUrl
        : null,
    };

    const relatedProducts = (relatedRows as MarketAwareProduct[] | null ?? []).map((relatedProduct) => ({
      ...relatedProduct,
      primary_image_url: relatedProduct.primary_image_url
        ? supabase.storage.from("product-images").getPublicUrl(relatedProduct.primary_image_url).data.publicUrl
        : null,
    }));

    return {
      category: (categoryData as Category | null) ?? null,
      product: resolvedProduct,
      images,
      relatedProducts,
    };
  } catch (error) {
    console.error(error);
    return {
      category: null,
      product: null,
      images: [],
      relatedProducts: [],
    };
  }
}
