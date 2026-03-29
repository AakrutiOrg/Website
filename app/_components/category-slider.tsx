"use client";

import Link from "next/link";
import { useState } from "react";

import { formatCurrency } from "@/lib/utils";
import type { Category } from "@/types/category";
import type { MarketAwareProduct } from "@/types/product";

interface CategorySliderProps {
  category: Category;
  products: MarketAwareProduct[];
}

export function CategorySlider({ category, products }: CategorySliderProps) {
  const [panel, setPanel] = useState<"hero" | "products">("hero");

  return (
    <div className="relative overflow-hidden">
      <div
        className="flex transition-transform duration-700 ease-in-out will-change-transform"
        style={{ transform: panel === "hero" ? "translateX(0)" : "translateX(-100%)" }}
      >
        {/* â”€â”€ Panel 1: Category Hero â”€â”€ */}
        <div className="min-w-full bg-warm-900 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-10">
              <ol className="flex items-center gap-2 text-sm text-warm-500">
                <li>
                  <Link href="/" className="transition-colors hover:text-brass-300">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">&rsaquo;</li>
                <li className="text-warm-300">{category.name}</li>
              </ol>
            </nav>

            <div className="mb-5 flex items-center gap-3">
              <div className="h-px w-8 bg-brass-700" />
              <span className="text-brass-500" aria-hidden="true">
                &#10022;
              </span>
            </div>

            <h1 className="font-heading text-3xl font-bold text-warm-50 sm:text-4xl lg:text-5xl">
              {category.name}
            </h1>

            {category.description && (
              <p className="mt-4 max-w-2xl text-base leading-7 text-warm-400 sm:text-lg">
                {category.description}
              </p>
            )}

            <div className="mt-10">
              <button
                onClick={() => setPanel("products")}
                className="inline-flex items-center gap-2 border border-brass-500 px-8 py-3 text-sm font-medium uppercase tracking-[0.15em] text-brass-300 transition-all duration-200 hover:bg-brass-500 hover:text-warm-900"
              >
                View {products.length} {products.length === 1 ? "Piece" : "Pieces"}
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>

            {/* Category image preview strip */}
            {category.image_url && (
              <div className="mt-12 overflow-hidden">
                <div className="relative h-48 w-full sm:h-64">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="h-full w-full object-cover brightness-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-warm-900/70 to-transparent" />
                  <div className="absolute left-4 top-4 h-5 w-5 border-l-2 border-t-2 border-brass-400" />
                  <div className="absolute right-4 top-4 h-5 w-5 border-r-2 border-t-2 border-brass-400" />
                  <div className="absolute bottom-4 left-4 h-5 w-5 border-b-2 border-l-2 border-brass-400" />
                  <div className="absolute bottom-4 right-4 h-5 w-5 border-b-2 border-r-2 border-brass-400" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* â”€â”€ Panel 2: Products Grid â”€â”€ */}
        <div className="min-w-full bg-warm-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
            {/* Section header */}
            <div className="mb-10 border-b border-warm-200 pb-6">
              <button
                onClick={() => setPanel("hero")}
                className="mb-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-brass-600 transition-colors hover:text-brass-500"
              >
                <span aria-hidden="true">&larr;</span>
                {category.name}
              </button>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-brass-600">
                Collection
              </p>
              <h2 className="font-heading mt-1 text-2xl font-bold text-warm-900 sm:text-3xl">
                {products.length} {products.length === 1 ? "Piece" : "Pieces"} Available
              </h2>
            </div>

            {products.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <Link
                    key={product.product_id}
                    href={`/categories/${product.category_slug}/${product.slug}`}
                    className="group flex flex-col overflow-hidden border border-warm-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brass-300 hover:shadow-md"
                  >
                    {/* Product image */}
                    <div className="relative h-56 overflow-hidden bg-warm-100">
                      {product.primary_image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={product.primary_image_url}
                          alt={product.name}
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
                              Aakruti
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

                    {/* Product info */}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-heading mb-1 text-lg font-semibold text-warm-900">
                        {product.name}
                      </h3>
                      <p className="mb-3 text-sm font-semibold text-brass-600">
                        {product.price !== null
                          ? formatCurrency(product.price, product.market_currency)
                          : "Price TBD"}
                      </p>
                      {product.short_description && (
                        <p className="flex-1 text-sm leading-6 text-warm-600">
                          {product.short_description}
                        </p>
                      )}
                      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-brass-600 transition-colors group-hover:text-brass-500">
                        <span>View Product</span>
                        <span aria-hidden="true">&rarr;</span>
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
                  Products for this collection are being added. Please check back soon.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

