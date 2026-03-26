import { notFound } from "next/navigation";

import { getCategoryBySlug } from "@/services/categories/get-category-by-slug";
import { CategorySlider } from "../../_components/category-slider";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ market?: string }>;
};

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { market } = await searchParams;
  const { category, products } = await getCategoryBySlug(slug, market);

  if (!category) {
    notFound();
  }

  return <CategorySlider category={category} products={products} />;
}
