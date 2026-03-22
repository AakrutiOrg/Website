import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CategoryForm } from "@/components/admin/category-form";

type EditCategoryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (!category) {
    notFound();
  }

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
          Edit Category
        </h2>
      </div>

      <div className="max-w-2xl">
         <CategoryForm category={category} />
      </div>
    </div>
  );
}
