import { getCategories } from "@/services/categories/get-categories";
import { getMarketAwareProducts } from "@/services/products/get-market-aware-catalog";

import { HomeSlider } from "./_components/home-slider";

function OrnamentalDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="h-px flex-1 bg-brass-300" />
      <span className="text-brass-400" aria-hidden="true">
        ◆
      </span>
      <div className="h-px flex-1 bg-brass-300" />
    </div>
  );
}

export default async function Home() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getMarketAwareProducts(),
  ]);

  const trendingProduct = products.find((p) => p.is_featured) ?? products[0] ?? null;

  return (
    <>
      <HomeSlider categories={categories} trendingProduct={trendingProduct} />

      {/* ── Brand promise ── */}
      <section className="bg-warm-100 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center sm:px-10">
          <OrnamentalDivider className="mx-auto mb-8 max-w-xs" />

          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-brass-600">
            Our Promise
          </p>
          <h2 className="font-heading mb-6 text-3xl font-bold text-warm-900 sm:text-4xl">
            Tradition Meets Craftsmanship
          </h2>
          <p className="text-base leading-8 text-warm-600 sm:text-lg">
            Every Aakruti piece is crafted by skilled artisans who have
            inherited the ancient techniques of brass work and patch work,
            passed down through generations. We bring these timeless treasures to your home.
          </p>

          <OrnamentalDivider className="mx-auto mt-8 max-w-xs" />
        </div>
      </section>
    </>
  );
}
