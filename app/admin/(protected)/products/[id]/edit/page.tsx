import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImageGallery } from "@/components/admin/product-image-gallery";
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

  const [categories, markets, { data: product }, { data: images }, { data: marketData }] = await Promise.all([
    getCategories(),
    getMarkets(),
    supabase.from("products").select("*").eq("id", id).single(),
    supabase.from("product_images").select("*").eq("product_id", id).order("created_at", { ascending: true }),
    supabase.from("product_market_data").select("*").eq("product_id", id)
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6 flex flex-col gap-6">
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

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-6 rounded-2xl border border-warm-200 shadow-sm space-y-4">
             <h3 className="font-semibold text-warm-900 font-heading">Product Details</h3>
             <ProductForm product={product} categories={categories} markets={markets} marketData={marketData || []} />
          </section>
        </div>
        
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-2xl border border-warm-200 shadow-sm space-y-4">
             <h3 className="font-semibold text-warm-900 font-heading">Product Gallery</h3>
             <p className="text-sm text-warm-500 mb-4">Upload and manage images. The primary image is shown on your store listing.</p>
             <ProductImageGallery productId={id} images={images || []} />
          </section>
        </div>
      </div>
    </div>
  );
}
