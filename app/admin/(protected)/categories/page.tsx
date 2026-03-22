import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold text-warm-900">
          Categories
        </h2>
        <Link
          href="/admin/categories/new"
          className="rounded-xl bg-brass-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brass-700"
        >
          Add Category
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-warm-200 bg-white shadow-sm">
        <ul className="divide-y divide-warm-100">
          {(categories || []).length === 0 ? (
            <li className="p-6 text-center text-sm text-warm-500">
              No categories found. Click "Add Category" to create one.
            </li>
          ) : (
            categories?.map((category) => (
              <li key={category.id} className="flex items-center justify-between p-6 hover:bg-warm-50/50">
                <div className="flex items-center gap-4">
                  {category.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="h-12 w-12 rounded-lg object-cover bg-warm-100"
                    />
                  ) : (
                    <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-warm-100 text-xs text-warm-500">
                      N/A
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-warm-900">{category.name}</h3>
                    <div className="mt-1 flex items-center gap-3 text-sm text-warm-500">
                      <span className="font-mono text-xs opacity-75">{category.slug}</span>
                      <span>&bull;</span>
                      <span>Order: {category.sort_order}</span>
                      {!category.is_active && (
                        <>
                          <span>&bull;</span>
                          <span className="text-red-600 font-medium">Inactive</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/admin/categories/${category.id}/edit`}
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
