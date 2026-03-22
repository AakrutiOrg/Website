import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { getCategories } from "@/services/categories/get-categories";
import { getMarkets } from "@/services/markets/get-markets";

export default async function NewProductPage() {
  const [categories, markets] = await Promise.all([
    getCategories(),
    getMarkets()
  ]);

  return (
    <div className="space-y-6">
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
          New Product
        </h2>
      </div>

      <ProductForm categories={categories} markets={markets} />
    </div>
  );
}
