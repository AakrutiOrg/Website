"use client";

import Link from "next/link";

import { formatCurrency } from "@/lib/utils";
import type { Category } from "@/types/category";
import type { MarketAwareProduct } from "@/types/product";

interface CategorySliderProps {
  category: Category;
  products: MarketAwareProduct[];
}

export function CategorySlider({ category, products }: CategorySliderProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Category header ── */}
      <div className="relative overflow-hidden bg-warm-900">
        <div className="bg-craft-texture absolute inset-0 opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-warm-900 via-warm-900/97 to-warm-800" />

        <div className="relative mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
          <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:py-10 lg:py-12">
            <div>
              <nav aria-label="Breadcrumb" className="mb-4">
                <ol className="flex items-center gap-2 text-xs text-warm-500">
                  <li>
                    <Link href="/" className="transition-colors hover:text-brass-300">
                      Home
                    </Link>
                  </li>
                  <li aria-hidden="true">›</li>
                  <li className="text-warm-300">{category.name}</li>
                </ol>
              </nav>

              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brass-400">
                Collection
              </p>
              <h1 className="font-heading text-3xl font-bold text-warm-50 sm:text-4xl lg:text-5xl">
                {category.name}
              </h1>
              {category.description && (
                <p className="mt-3 max-w-xl text-sm leading-6 text-warm-400 sm:text-base sm:leading-7">
                  {category.description}
                </p>
              )}
            </div>

            {/* Piece count badge */}
            <div className="shrink-0">
              <div className="inline-flex items-center gap-2 border border-warm-700 px-4 py-2">
                <span className="text-sm text-brass-400">✦</span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-warm-300">
                  {products.length} {products.length === 1 ? "Treasure" : "Treasures"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Products grid ── */}
      <div className="py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
          {products.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Link
                  key={product.product_id}
                  href={`/categories/${product.category_slug}/${product.slug}`}
                  className="group flex flex-col overflow-hidden border border-warm-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brass-200 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-warm-50">
                    {product.primary_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={product.primary_image_url}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="bg-craft-texture flex h-full w-full items-center justify-center">
                        <span className="text-2xl text-brass-200" aria-hidden="true">✦</span>
                      </div>
                    )}

                    {/* Brass corner accents */}
                    <div className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-brass-400" />
                    <div className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-brass-400" />
                    <div className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-brass-400" />
                    <div className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-brass-400" />
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-heading mb-1.5 text-lg font-semibold text-warm-900">
                      {product.name}
                    </h3>
                    <p className="mb-3 text-sm font-bold text-brass-600">
                      {product.price !== null
                        ? formatCurrency(product.price, product.market_currency)
                        : "Price TBD"}
                    </p>
                    {product.short_description && (
                      <p className="flex-1 line-clamp-2 text-sm leading-6 text-warm-500">
                        {product.short_description}
                      </p>
                    )}
                    <div className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-brass-600 transition-all group-hover:gap-3 group-hover:text-brass-500">
                      <span>View Product</span>
                      <span aria-hidden="true">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 border border-dashed border-warm-200 bg-warm-50 py-16 text-center">
              <span className="text-2xl text-brass-300" aria-hidden="true">✦</span>
              <p className="text-sm text-warm-500">
                Treasures for this collection are being added. Please check back soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
