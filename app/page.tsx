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

  return (
    <>
      <HomeSlider categories={categories} treasures={treasures} />

      <section className="bg-warm-100 pt-0 pb-16 sm:pb-20">
        <div className="mx-auto max-w-3xl px-6 pt-10 text-center sm:px-10 sm:pt-12">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-brass-600">
            Our Promise
          </p>
          <h2 className="font-heading mb-6 text-3xl font-bold text-warm-900 sm:text-4xl">
            Tradition Meets Craftsmanship
          </h2>
          <p className="text-base leading-8 text-warm-600 sm:text-lg">
            Every Aakruti piece is crafted by skilled artisans who have inherited
            the ancient techniques of brass work and patch work, passed down through
            generations. We bring these timeless treasures to your home.
          </p>
        </div>
      </section>
    </>
  );
}
