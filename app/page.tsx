import { getCategories } from "@/services/categories/get-categories";
import { getMarketAwareProducts } from "@/services/products/get-market-aware-catalog";

import { HomeSlider } from "./_components/home-slider";

export default async function Home() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getMarketAwareProducts(),
  ]);

  const treasures = [
    ...products.filter((product) => product.is_featured),
    ...products.filter((product) => !product.is_featured),
  ].slice(0, 5);

  return <HomeSlider categories={categories} treasures={treasures} />;
}
