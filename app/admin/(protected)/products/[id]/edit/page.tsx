import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { ProductImageGallery } from "@/components/admin/product-image-gallery";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/services/categories/get-categories";
import { getMarkets } from "@/services/markets/get-markets";

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    categories,
    markets,
    { data: product },
    { data: images },
    { data: marketData },
    { count: preciousCount },
  ] = await Promise.all([
    getCategories(),
    getMarkets(),
    supabase.from("products").select("*").eq("id", id).single(),
    supabase.from("product_images").select("*").eq("product_id", id).order("created_at", { ascending: true }),
    supabase.from("product_market_data").select("*").eq("product_id", id),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_featured", true),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="text-sm font-medium text-warm-500 hover:text-warm-900"
          >
            &larr; Back to Products
          </Link>
        </div>
        <h2 className="font-heading text-2xl font-semibold text-warm-900">
          Edit Product
        </h2>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-4 rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
            <h3 className="font-heading font-semibold text-warm-900">Product Details</h3>
            <ProductForm
              product={product}
              categories={categories}
              markets={markets}
              marketData={marketData || []}
              preciousCount={preciousCount ?? 0}
            />
          </section>
        </div>

        <div className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
            <h3 className="font-heading font-semibold text-warm-900">Product Gallery</h3>
            <p className="mb-4 text-sm text-warm-500">
              Upload and manage images. The primary image is shown on your store listing.
            </p>
            <ProductImageGallery productId={id} images={images || []} />
          </section>
        </div>
      </div>
    </div>
  );
}

