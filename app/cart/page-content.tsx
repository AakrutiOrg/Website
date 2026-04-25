"use client";

import Link from "next/link";

import { useCart } from "@/components/providers/cart-provider";
import { formatCurrency } from "@/lib/utils";

export function CartPageContent() {
  const { items, totalAmount, totalItems, updateQuantity, removeItem, clearCart } = useCart();

  return (
    <div className="min-h-screen bg-white">
      {/* Compact page header */}
      <div className="border-b border-warm-100 bg-warm-50">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
          <div className="flex items-center justify-between py-4 sm:py-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-brass-600">
                Your Selection
              </p>
              <h1 className="font-heading text-xl font-bold text-warm-900 sm:text-2xl">
                Treasures in Cart
                {totalItems > 0 && (
                  <span className="ml-2 text-sm font-normal text-warm-400">
                    ({totalItems} {totalItems === 1 ? "item" : "items"})
                  </span>
                )}
              </h1>
            </div>
            <Link
              href="/#collections"
              className="text-[11px] font-semibold uppercase tracking-[0.15em] text-brass-600 transition-colors hover:text-brass-500"
            >
              ← Continue Browsing
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
        {items.length === 0 ? (
          <div className="border border-dashed border-warm-200 bg-warm-50 px-8 py-14 text-center">
            <span className="text-2xl text-brass-300" aria-hidden="true">✦</span>
            <h2 className="font-heading mt-4 text-2xl font-bold text-warm-900">
              Your cart is empty
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-warm-500">
              Explore our Treasures and add the pieces you love.
            </p>
            <Link
              href="/#collections"
              className="mt-6 inline-flex items-center gap-2 bg-brass-500 px-7 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-warm-900 transition-colors hover:bg-brass-400"
            >
              Browse all Treasures
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] lg:grid-cols-[1.15fr_0.85fr]">
            {/* Cart items */}
            <div className="space-y-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="grid grid-cols-[80px_1fr] gap-4 border border-warm-100 bg-white p-4 sm:grid-cols-[100px_1fr]"
                >
                  <div className="overflow-hidden bg-warm-50">
                    <div className="aspect-square">
                      {item.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="bg-craft-texture h-full w-full" />
                      )}
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/categories/${item.categorySlug}/${item.slug}`}
                        className="font-heading text-base font-semibold leading-5 text-warm-900 transition-colors hover:text-brass-600 sm:text-lg"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-warm-400 transition-colors hover:text-red-500"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-brass-600">
                          {item.price !== null
                            ? formatCurrency(item.price, item.currency)
                            : "Price TBD"}
                        </p>
                        {(item.size || item.color) && (
                          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-warm-500">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.color && <span>Color: {item.color}</span>}
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <div className="inline-flex items-center border border-warm-200 bg-warm-50">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="inline-flex h-8 w-8 items-center justify-center text-warm-700 transition-colors hover:bg-warm-100"
                            aria-label={`Decrease quantity for ${item.name}`}
                          >
                            −
                          </button>
                          <span className="inline-flex min-w-8 items-center justify-center text-sm font-medium text-warm-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="inline-flex h-8 w-8 items-center justify-center text-warm-700 transition-colors hover:bg-warm-100"
                            aria-label={`Increase quantity for ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                        <p className="min-w-14 text-right text-sm font-semibold text-warm-900">
                          {(item.price ?? 0) > 0
                            ? formatCurrency((item.price ?? 0) * item.quantity, item.currency)
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Summary sidebar */}
            <aside className="h-fit border border-warm-100 bg-white p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brass-600">
                Summary
              </p>
              <h2 className="font-heading mt-1.5 text-xl font-bold text-warm-900">
                Cart Total
              </h2>

              <div className="mt-5 space-y-2.5 border-y border-warm-100 py-4">
                <div className="flex items-center justify-between text-sm text-warm-600">
                  <span>Items</span>
                  <span className="font-medium text-warm-900">{totalItems}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-warm-600">Estimated total</span>
                  <span className="text-base font-bold text-brass-600">
                    {items[0] ? formatCurrency(totalAmount, items[0].currency) : "TBD"}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-warm-500">
                Stored locally in your browser. Prices confirmed at checkout. UK shipping only.
              </p>

              <div className="mt-5 flex flex-col gap-2">
                <Link
                  href="/checkout"
                  className="inline-flex items-center justify-center gap-2 bg-warm-900 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-warm-800"
                >
                  Proceed to Checkout
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/#collections"
                  className="inline-flex items-center justify-center gap-2 bg-brass-500 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-warm-900 transition-colors hover:bg-brass-400"
                >
                  Browse all Treasures
                  <span aria-hidden="true">→</span>
                </Link>
                <button
                  type="button"
                  onClick={clearCart}
                  className="inline-flex items-center justify-center gap-2 border border-warm-200 px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.15em] text-warm-500 transition-colors hover:border-red-200 hover:text-red-500"
                >
                  Clear Cart
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
