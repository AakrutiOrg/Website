import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminProductsPage() {
  const supabase = await createClient();

  // Fetch products with their categories
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      categories:category_id (name)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold text-warm-900">
          Products
        </h2>
        <Link
          href="/admin/products/new"
          className="rounded-xl bg-brass-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brass-700"
        >
          Add Product
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-warm-200 bg-white shadow-sm">
        <ul className="divide-y divide-warm-100">
          {(products || []).length === 0 ? (
            <li className="p-6 text-center text-sm text-warm-500">
              No products found. Click "Add Product" to create one.
            </li>
          ) : (
            products?.map((product) => (
              <li key={product.id} className="flex items-center justify-between p-6 hover:bg-warm-50/50">
                <div className="flex items-center gap-4">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-12 w-12 rounded-lg object-cover bg-warm-100"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-warm-100" />
                  )}
                  <div>
                    <p className="font-medium text-warm-900">{product.name}</p>
                    <div className="mt-1 flex items-center gap-3 text-sm text-warm-500">
                      <span>${(product.price / 100).toFixed(2)}</span>
                      <span>&bull;</span>
                      <span>{product.categories?.name || "Uncategorized"}</span>
                      {!product.is_active && (
                        <>
                          <span>&bull;</span>
                          <span className="text-red-600 font-medium">Inactive</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="rounded-lg border border-warm-200 px-3 py-1.5 text-sm font-medium text-warm-700 transition hover:border-brass-400 hover:text-brass-700"
                >
                  Edit
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
