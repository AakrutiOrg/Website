"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { Category } from "@/types/category";
import type { MarketAwareProduct } from "@/types/product";

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

interface HomeSliderProps {
  categories: Category[];
  trendingProduct: MarketAwareProduct | null;
}

export function HomeSlider({ categories, trendingProduct }: HomeSliderProps) {
  const [page, setPage] = useState<"hero" | "collections">("hero");

  return (
    <div className="relative overflow-hidden">
      {/* Two-panel flex strip — slides left/right */}
      <div
        className="flex transition-transform duration-700 ease-in-out will-change-transform"
        style={{ transform: page === "hero" ? "translateX(0)" : "translateX(-100%)" }}
      >
        {/* ── Panel 1: Hero + Trending Banner ── */}
        <div className="min-w-full">
          {/* Hero */}
          <section className="relative overflow-hidden bg-warm-900">
            <div className="bg-craft-texture absolute inset-0 opacity-60" />

            <div className="relative mx-auto max-w-6xl px-6 pt-6 pb-24 text-center sm:px-10 sm:pt-8 sm:pb-32 lg:px-12 lg:pt-10 lg:pb-40">
              {/* Hero Logo + Punchline */}
              <div className="mb-10 flex flex-col items-center gap-5">
                <Image
                  src="/logo.png"
                  alt="Aakruti"
                  width={180}
                  height={180}
                  className="h-32 w-auto drop-shadow-2xl sm:h-36 lg:h-40"
                  priority
                />
                <div className="flex items-center gap-5">
                  <div className="h-px w-14 bg-brass-600 sm:w-20" />
                  <p className="font-[family-name:var(--font-great-vibes)] text-2xl text-warm-200 sm:text-3xl lg:text-4xl">
                    Shaping your Abode
                  </p>
                  <div className="h-px w-14 bg-brass-600 sm:w-20" />
                </div>
              </div>

              <p className="mb-4 text-xs font-medium uppercase tracking-[0.35em] text-brass-500">
                Est. 2025 &nbsp;·&nbsp; Handcrafted with Pride
              </p>

              <h1 className="font-heading mb-6 text-4xl font-bold leading-tight tracking-tight text-warm-50 sm:text-5xl lg:text-6xl">
                The Art of Craftings
              </h1>

              <p className="mx-auto mb-10 max-w-xl text-base leading-7 text-warm-400 sm:text-lg">
                Each piece tells a story of generations. Explore our curated
                collection of authentically crafted brass artifacts and patchworks from the different parts
                of India.
              </p>

              <button
                onClick={() => setPage("collections")}
                className="inline-flex items-center gap-2 border border-brass-500 px-8 py-3 text-sm font-medium uppercase tracking-[0.15em] text-brass-300 transition-all duration-200 hover:bg-brass-500 hover:text-warm-900"
              >
                Explore Collections
                <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
              </button>

              {/* Bottom ornament */}
              <div className="mt-14 flex items-center justify-center gap-4">
                <div className="h-px w-12 bg-brass-800" />
                <span className="text-brass-700" aria-hidden="true">
                  ◆
                </span>
                <div className="h-px w-12 bg-brass-800" />
              </div>
            </div>
          </section>

          {/* Trending Article Banner */}
          {trendingProduct && (
            <section className="bg-warm-900">
              <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
                <Link
                  href={`/categories/${trendingProduct.category_slug}/${trendingProduct.slug}`}
                  className="group relative block overflow-hidden"
                >
                  <div className="relative h-64 w-full overflow-hidden sm:h-80 lg:h-96">
                    {trendingProduct.primary_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={trendingProduct.primary_image_url}
                        alt={trendingProduct.name}
                        className="h-full w-full object-cover brightness-75 transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-warm-800">
                        <span className="text-4xl text-brass-600" aria-hidden="true">◆</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-warm-900/80 via-warm-900/20 to-transparent" />

                    <div className="absolute left-4 top-4 h-6 w-6 border-l-2 border-t-2 border-brass-400" />
                    <div className="absolute right-4 top-4 h-6 w-6 border-r-2 border-t-2 border-brass-400" />
                    <div className="absolute bottom-4 left-4 h-6 w-6 border-b-2 border-l-2 border-brass-400" />
                    <div className="absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-brass-400" />

                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                      <p className="mb-1 text-xs font-medium uppercase tracking-[0.3em] text-brass-400">
                        Trending Now
                      </p>
                      <h3 className="font-heading mb-2 text-2xl font-bold text-warm-50 sm:text-3xl">
                        {trendingProduct.name}
                      </h3>
                      {trendingProduct.short_description && (
                        <p className="mb-3 max-w-xl text-sm text-warm-300 line-clamp-2">
                          {trendingProduct.short_description}
                        </p>
                      )}
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-brass-300 transition-colors group-hover:text-brass-200">
                        View Article
                        <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            </section>
          )}
        </div>

        {/* ── Panel 2: Collections ── */}
        <div className="min-w-full bg-warm-50 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
            {/* Section heading */}
            <div className="mb-14 text-center">
              <button
                onClick={() => setPage("hero")}
                className="mb-6 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-brass-600 transition-colors hover:text-brass-500"
              >
                <span aria-hidden="true">←</span>
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
                    {/* Image / placeholder */}
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
                                ◆
                              </span>
                              <div className="h-px w-8 bg-brass-200" />
                            </div>
                            <span className="font-heading text-xs uppercase tracking-[0.25em] text-brass-400">
                              {category.name}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Brass corner accents */}
                      <div className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-brass-400" />
                      <div className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-brass-400" />
                      <div className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-brass-400" />
                      <div className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-brass-400" />
                    </div>

                    {/* Card body */}
                    <div className="flex flex-1 flex-col p-5">
                      <h2 className="font-heading mb-2 text-xl font-semibold text-warm-900">
                        {category.name}
                      </h2>
                      <p className="mb-4 flex-1 text-sm leading-6 text-warm-600">
                        {category.description || "Explore our curated collection."}
                      </p>
                      <div className="flex items-center gap-2 text-sm font-medium text-brass-600 transition-colors group-hover:text-brass-500">
                        <span>Explore Collection</span>
                        <span
                          className="transition-transform group-hover:translate-x-1"
                          aria-hidden="true"
                        >
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 border border-dashed border-warm-300 bg-white py-16 text-center">
                <span className="text-2xl text-brass-300" aria-hidden="true">
                  ◆
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
