"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { formatCurrency } from "@/lib/utils";
import type { Category } from "@/types/category";
import type { MarketAwareProduct } from "@/types/product";

function OrnamentalDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="h-px flex-1 bg-brass-300" />
      <span className="text-brass-400" aria-hidden="true">
        &#10022;
      </span>
      <div className="h-px flex-1 bg-brass-300" />
    </div>
  );
}

interface HomeSliderProps {
  categories: Category[];
  treasures: MarketAwareProduct[];
}

export function HomeSlider({ categories, treasures }: HomeSliderProps) {
  const [page, setPage] = useState<"hero" | "collections">("hero");
  const [treasureIndex, setTreasureIndex] = useState(0);

  useEffect(() => {
    if (treasures.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setTreasureIndex((current) => (current + 1) % treasures.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, [treasures]);

  useEffect(() => {
    if (treasureIndex >= treasures.length) {
      setTreasureIndex(0);
    }
  }, [treasureIndex, treasures.length]);

  const activeTreasure = treasures[treasureIndex] ?? null;

  const showPreviousTreasure = () => {
    setTreasureIndex((current) => (current - 1 + treasures.length) % treasures.length);
  };

  const showNextTreasure = () => {
    setTreasureIndex((current) => (current + 1) % treasures.length);
  };

  return (
    <div className="relative overflow-hidden">
      <div
        className="flex items-start transition-transform duration-700 ease-in-out will-change-transform"
        style={{ transform: page === "hero" ? "translateX(0)" : "translateX(-100%)" }}
      >
        <div className="min-w-full bg-warm-900">
          <section className="relative overflow-hidden bg-warm-900 py-12 sm:py-14 lg:py-16">
            <div className="bg-craft-texture absolute inset-0 opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-warm-900 via-warm-900/96 to-warm-800" />

            <div className="absolute left-6 top-6 h-8 w-8 border-l-2 border-t-2 border-brass-400/60 sm:left-10 sm:top-10" />
            <div className="absolute right-6 top-6 h-8 w-8 border-r-2 border-t-2 border-brass-400/60 sm:right-10 sm:top-10" />
            <div className="absolute bottom-6 left-6 h-8 w-8 border-b-2 border-l-2 border-brass-400/60 sm:bottom-10 sm:left-10" />
            <div className="absolute bottom-6 right-6 h-8 w-8 border-b-2 border-r-2 border-brass-400/60 sm:bottom-10 sm:right-10" />

            <div className="relative mx-auto flex max-w-4xl flex-col items-center justify-center px-6 text-center sm:px-10 lg:px-12">
              <div className="mb-4 flex flex-col items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Aakruti"
                  width={180}
                  height={180}
                  className="h-20 w-auto drop-shadow-2xl sm:h-24 lg:h-28"
                  priority
                />
                <div className="flex items-center gap-5">
                  <div className="h-px w-14 bg-brass-500 sm:w-20" />
                  <p className="font-[family-name:var(--font-great-vibes)] text-2xl text-warm-200 sm:text-3xl lg:text-4xl">
                    Shaping your Abode
                  </p>
                  <div className="h-px w-14 bg-brass-500 sm:w-20" />
                </div>
              </div>

              <p className="mb-2 text-xs font-medium uppercase tracking-[0.35em] text-brass-400">
                Est. 2025 · Handcrafted with Pride
              </p>

              <h1 className="font-heading mb-3 text-4xl font-bold leading-tight tracking-tight text-warm-50 sm:text-5xl lg:text-6xl">
                The Art of Craftings
              </h1>

              <p className="mx-auto mb-6 max-w-xl text-base leading-7 text-warm-300 sm:text-lg">
                Each piece tells a story of generations. Explore our curated
                collection of authentically crafted brass artifacts and patchworks from the
                different parts of India.
              </p>

              <button
                onClick={() => setPage("collections")}
                className="cursor-pointer inline-flex items-center gap-2 border border-brass-400 px-8 py-3 text-sm font-medium uppercase tracking-[0.15em] text-brass-300 backdrop-blur-sm transition-all duration-200 hover:border-brass-500 hover:bg-brass-500 hover:text-warm-900"
              >
                Explore all Treasures
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </section>

          {activeTreasure && (
            <section className="bg-warm-50 py-14 sm:py-18">
              <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-12">
                <div className="relative overflow-hidden border border-warm-200 bg-white shadow-sm">
                  <div className="relative h-[320px] bg-warm-100 sm:h-[420px]">
                    {activeTreasure.primary_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={activeTreasure.primary_image_url}
                        alt={activeTreasure.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="bg-craft-texture h-full w-full" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-warm-900/35 via-transparent to-transparent" />
                    <div className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-brass-400" />
                    <div className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-brass-400" />
                    <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-brass-400" />
                    <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-brass-400" />
                  </div>
                </div>

                <div className="max-w-xl">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-medium uppercase tracking-[0.35em] text-brass-600">
                      Our Precious Treasures
                    </p>
                    {treasures.length > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={showPreviousTreasure}
                          className="cursor-pointer inline-flex h-10 w-10 items-center justify-center border border-warm-300 text-warm-700 transition-colors hover:border-brass-400 hover:text-brass-600"
                          aria-label="Previous treasure"
                        >
                          &larr;
                        </button>
                        <button
                          type="button"
                          onClick={showNextTreasure}
                          className="cursor-pointer inline-flex h-10 w-10 items-center justify-center border border-warm-300 text-warm-700 transition-colors hover:border-brass-400 hover:text-brass-600"
                          aria-label="Next treasure"
                        >
                          &rarr;
                        </button>
                      </div>
                    )}
                  </div>

                  <h2 className="font-heading mt-3 text-3xl font-bold text-warm-900 sm:text-4xl">
                    {activeTreasure.name}
                  </h2>
                  <p className="mt-3 text-sm uppercase tracking-[0.2em] text-warm-500">
                    {activeTreasure.category_name}
                  </p>
                  {activeTreasure.price !== null && (
                    <p className="mt-5 text-lg font-semibold text-brass-600">
                      {formatCurrency(activeTreasure.price, activeTreasure.market_currency)}
                    </p>
                  )}
                  <p className="mt-5 text-base leading-8 text-warm-600 sm:text-lg">
                    {activeTreasure.short_description ||
                      "A featured handcrafted piece from our latest curation, chosen for its artistry and timeless character."}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <Link
                      href={`/categories/${activeTreasure.category_slug}/${activeTreasure.slug}`}
                      className="inline-flex items-center gap-2 border border-brass-500 bg-brass-500 px-7 py-3 text-sm font-medium uppercase tracking-[0.15em] text-warm-900 transition-colors hover:border-brass-400 hover:bg-brass-400"
                    >
                      View Product
                      <span aria-hidden="true">&rarr;</span>
                    </Link>
                    <Link
                      href={`/categories/${activeTreasure.category_slug}`}
                      className="inline-flex items-center gap-2 border border-warm-300 bg-white px-7 py-3 text-sm font-medium uppercase tracking-[0.15em] text-warm-700 transition-colors hover:border-brass-400 hover:bg-brass-50 hover:text-brass-600"
                    >
                      Explore Category
                      <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>

                  {treasures.length > 1 && (
                    <div className="mt-8 flex items-center gap-3">
                      {treasures.map((treasure, index) => (
                        <button
                          key={treasure.product_id}
                          type="button"
                          onClick={() => setTreasureIndex(index)}
                          className={`cursor-pointer h-2.5 transition-all ${index === treasureIndex ? "w-10 bg-brass-500" : "w-2.5 bg-warm-300 hover:bg-brass-300"
                            }`}
                          aria-label={`Show treasure ${index + 1}: ${treasure.name}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="min-w-full bg-warm-50 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
            <div className="mb-14 text-center">
              <button
                onClick={() => setPage("hero")}
                className="mb-6 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-brass-600 transition-colors hover:text-brass-500"
              >
                <span aria-hidden="true">&larr;</span>
                Back
              </button>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-brass-600">
                Our Collections
              </p>
              <h2 className="font-heading text-3xl font-bold text-warm-900 sm:text-4xl">
                Shop by Category
              </h2>
              <OrnamentalDivider className="mx-auto mt-6 max-w-xs" />
            </div>

            {categories.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="group flex flex-col overflow-hidden border border-warm-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brass-300 hover:shadow-md"
                  >
                    <div className="relative h-48 overflow-hidden bg-warm-100">
                      {category.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-warm-100">
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 text-brass-300">
                              <div className="h-px w-8 bg-brass-200" />
                              <span className="text-xl" aria-hidden="true">
                                &#10022;
                              </span>
                              <div className="h-px w-8 bg-brass-200" />
                            </div>
                            <span className="font-heading text-xs uppercase tracking-[0.25em] text-brass-400">
                              {category.name}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-brass-400" />
                      <div className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-brass-400" />
                      <div className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-brass-400" />
                      <div className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-brass-400" />
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h2 className="font-heading mb-2 text-xl font-semibold text-warm-900">
                        {category.name}
                      </h2>
                      <p className="mb-4 flex-1 text-sm leading-6 text-warm-600">
                        {category.description || "Explore our curated collection."}
                      </p>
                      <div className="flex items-center gap-2 text-sm font-medium text-brass-600 transition-colors group-hover:text-brass-500">
                        <span>Explore Collection</span>
                        <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
                          &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 border border-dashed border-warm-300 bg-white py-16 text-center">
                <span className="text-2xl text-brass-300" aria-hidden="true">
                  &#10022;
                </span>
                <p className="text-sm text-warm-500">
                  Our collections are being curated. Please check back soon.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

