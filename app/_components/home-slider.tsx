"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useCart } from "@/components/providers/cart-provider";
import { formatCurrency } from "@/lib/utils";
import type { Category } from "@/types/category";
import type { MarketAwareProduct } from "@/types/product";

interface HomeSliderProps {
  categories: Category[];
  treasures: MarketAwareProduct[];
}

export function HomeSlider({ categories, treasures }: HomeSliderProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [cartMessage, setCartMessage] = useState("");
  const { addItem } = useCart();

  useEffect(() => {
    if (treasures.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIdx((i) => (i + 1) % treasures.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [treasures.length]);

  const safeIdx = treasures.length > 0 ? activeIdx % treasures.length : 0;
  const active = treasures[safeIdx] ?? null;

  const handleAddToCart = () => {
    if (!active || active.stock_quantity <= 0) return;
    addItem({
      id: active.product_id,
      name: active.name,
      slug: active.slug,
      categorySlug: active.category_slug,
      imageUrl: active.primary_image_url,
      price: active.price,
      currency: active.market_currency,
      quantity: 1,
      stockQuantity: active.stock_quantity,
      size: active.attributes?.size
        ? `${active.attributes.size} ${active.attributes.size_unit === "cm" ? "cm" : "inch"}`
        : null,
      color: active.attributes?.color ?? null,
    });
    setCartMessage("Added to cart");
    window.setTimeout(() => setCartMessage(""), 2200);
  };

  return (
    <>
      {/* ── Hero: split brand left / product image right ── */}
      <section className="relative overflow-hidden bg-warm-900">
        <div className="bg-craft-texture absolute inset-0 opacity-10" />

        {/* Brass corner accents */}
        <div className="pointer-events-none absolute left-5 top-5 z-10 h-7 w-7 border-l-2 border-t-2 border-brass-400/40 sm:left-8 sm:top-8" />
        <div className="pointer-events-none absolute right-5 top-5 z-10 h-7 w-7 border-r-2 border-t-2 border-brass-400/40 sm:right-8 sm:top-8" />
        <div className="pointer-events-none absolute bottom-5 left-5 z-10 h-7 w-7 border-b-2 border-l-2 border-brass-400/40 sm:bottom-8 sm:left-8" />

        <div
          className={`relative mx-auto grid max-w-6xl ${active ? "md:grid-cols-[1.1fr_0.9fr]" : ""} md:min-h-[520px] lg:min-h-[600px]`}
        >
          {/* Left: Brand messaging */}
          <div className="flex flex-col justify-center px-6 py-12 sm:px-10 sm:py-14 md:py-16 lg:px-12 lg:py-24">
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.45em] text-brass-400">
              Est. 2025 &nbsp;·&nbsp; Handcrafted with Pride
            </p>

            <h1 className="font-heading mb-5 text-4xl font-bold leading-[1.08] tracking-tight text-warm-50 sm:text-5xl lg:text-[3.4rem]">
              The Art of<br />Craftings
            </h1>

            <p className="mb-8 max-w-sm text-sm leading-7 text-warm-400 sm:text-base sm:leading-8">
              Each piece tells a story of generations. Curated brass artifacts and
              patchworks from across India, crafted by skilled artisans.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="#collections"
                className="inline-flex items-center gap-2 bg-brass-500 px-7 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-warm-900 transition-all hover:bg-brass-400"
              >
                Browse all Treasures
                <span aria-hidden="true">→</span>
              </a>
              {active && (
                <Link
                  href={`/categories/${active.category_slug}/${active.slug}`}
                  className="inline-flex items-center gap-2 border border-warm-700 px-7 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-warm-300 transition-all hover:border-brass-500 hover:text-brass-300"
                >
                  Featured Treasure
                </Link>
              )}
            </div>

            {/* Mobile: active product info strip (hidden on tablet+, image panel takes over) */}
            {active && (
              <div className="mt-8 border-t border-warm-800 pt-6 md:hidden">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brass-500">
                  {active.category_name}
                </p>
                <div className="mt-2 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-heading text-lg font-semibold text-warm-100">
                      {active.name}
                    </p>
                    {active.price !== null && (
                      <p className="mt-0.5 text-sm font-semibold text-brass-300">
                        {formatCurrency(active.price, active.market_currency)}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/categories/${active.category_slug}/${active.slug}`}
                    className="shrink-0 bg-brass-500 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-warm-900 transition-all hover:bg-brass-400"
                  >
                    View →
                  </Link>
                </div>

                {/* Mobile dot nav */}
                {treasures.length > 1 && (
                  <div className="mt-4 flex items-center gap-2">
                    {treasures.map((t, i) => (
                      <button
                        key={t.product_id}
                        type="button"
                        onClick={() => setActiveIdx(i)}
                        className={`rounded-full transition-all ${i === safeIdx ? "h-1.5 w-7 bg-brass-400" : "h-1.5 w-1.5 bg-warm-600 hover:bg-warm-500"}`}
                        aria-label={`Show ${t.name}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Product image showcase (tablet + desktop) */}
          {active && (
            <div className="relative hidden overflow-hidden md:block">
              {/* Cycling product images */}
              {treasures.map((t, i) => (
                <div
                  key={t.product_id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === safeIdx ? "opacity-100" : "opacity-0"}`}
                >
                  {t.primary_image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={t.primary_image_url}
                      alt={t.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="bg-craft-texture h-full w-full" />
                  )}
                </div>
              ))}

              {/* Bottom gradient for overlay legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-warm-900 via-warm-900/25 to-transparent" />
              {/* Left edge vignette to blend into left column */}
              <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-warm-900 to-transparent" />

              {/* Product info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-brass-400">
                  {active.category_name}
                </p>
                <h2 className="font-heading mt-2 text-2xl font-bold text-white lg:text-3xl">
                  {active.name}
                </h2>
                {active.price !== null && (
                  <p className="mt-1.5 text-base font-semibold text-brass-300">
                    {formatCurrency(active.price, active.market_currency)}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <Link
                    href={`/categories/${active.category_slug}/${active.slug}`}
                    className="inline-flex items-center gap-2 bg-brass-500 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-warm-900 transition-all hover:bg-brass-400"
                  >
                    View Product
                  </Link>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={active.stock_quantity <= 0}
                    className="inline-flex items-center gap-2 border border-warm-600 px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.15em] text-warm-300 transition-all hover:border-brass-500 hover:text-brass-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {active.stock_quantity > 0 ? "Add to Cart" : "Sold Out"}
                  </button>
                </div>

                {cartMessage && (
                  <p className="mt-3 animate-[fade-in_400ms_ease] text-xs font-medium text-brass-400">
                    {cartMessage}
                  </p>
                )}
              </div>

              {/* Vertical dot navigation */}
              {treasures.length > 1 && (
                <div className="absolute right-5 top-1/2 flex -translate-y-1/2 flex-col gap-2.5">
                  {treasures.map((t, i) => (
                    <button
                      key={t.product_id}
                      type="button"
                      onClick={() => setActiveIdx(i)}
                      className={`rounded-full transition-all ${i === safeIdx ? "h-7 w-1.5 bg-brass-400" : "h-1.5 w-1.5 bg-white/35 hover:bg-white/65"}`}
                      aria-label={`Show ${t.name}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Collections grid ── */}
      <section id="collections" className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.4em] text-brass-600">
                Our Collections
              </p>
              <h2 className="font-heading text-2xl font-bold text-warm-900 sm:text-3xl">
                Shop by Treasure Category
              </h2>
            </div>
            <div className="hidden items-center gap-3 sm:flex" aria-hidden="true">
              <div className="h-px w-10 bg-brass-200" />
              <span className="text-sm text-brass-300">✦</span>
              <div className="h-px w-10 bg-brass-200" />
            </div>
          </div>

          {categories.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group relative overflow-hidden"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-warm-100">
                    {category.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="bg-craft-texture flex h-full w-full items-center justify-center">
                        <span className="font-heading text-xs uppercase tracking-[0.3em] text-brass-400">
                          {category.name}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-warm-900/78 via-warm-900/12 to-transparent transition-opacity duration-300 group-hover:from-warm-900/85" />

                    {/* Brass corner accents */}
                    <div className="absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-brass-400/70 transition-colors duration-300 group-hover:border-brass-300" />
                    <div className="absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-brass-400/70 transition-colors duration-300 group-hover:border-brass-300" />
                    <div className="absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-brass-400/70 transition-colors duration-300 group-hover:border-brass-300" />
                    <div className="absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-brass-400/70 transition-colors duration-300 group-hover:border-brass-300" />

                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="font-heading text-xl font-semibold text-white">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-warm-300/80">
                          {category.description}
                        </p>
                      )}
                      <div className="mt-2.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-brass-300 transition-all duration-200 group-hover:gap-3 group-hover:text-brass-200">
                        <span>Explore</span>
                        <span aria-hidden="true">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 border border-dashed border-warm-200 bg-warm-50 py-12 text-center">
              <span className="text-2xl text-brass-300" aria-hidden="true">✦</span>
              <p className="text-sm text-warm-500">
                Our collections are being curated. Please check back soon.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
