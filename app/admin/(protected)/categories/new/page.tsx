import Link from "next/link";
import { CategoryForm } from "@/components/admin/category-form";

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/categories"
            className="text-sm font-medium text-warm-500 hover:text-warm-900"
          >
            &larr; Back to Categories
          </Link>
        </div>
        <h2 className="font-heading text-2xl font-semibold text-warm-900">
          New Category
        </h2>
      </div>

      <div className="max-w-2xl">
        <CategoryForm />
      </div>
    </div>
  );
}
