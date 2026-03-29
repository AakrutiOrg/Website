"use client";

import Link from "next/link";

import { useCart } from "@/components/providers/cart-provider";
import { formatCurrency } from "@/lib/utils";

export function CartPageContent() {
  const { items, totalAmount, totalItems, updateQuantity, removeItem, clearCart } = useCart();

  return (
    <div className="bg-warm-50">
      <section className="relative overflow-hidden bg-warm-900 py-14 sm:py-16 lg:py-20">
        <div className="bg-craft-texture absolute inset-0 opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-warm-900 via-warm-900/95 to-warm-800" />

        <div className="relative mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-brass-400">
            Our Treasures will be Your's soon!
          </p>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-warm-50 sm:text-5xl">
            Treasures in your Cart
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-warm-300 sm:text-lg">
            Review your chosen treasures, adjust quantities, and keep track of your collection before checkout.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
          {items.length === 0 ? (
            <div className="border border-dashed border-warm-300 bg-white px-8 py-16 text-center shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-brass-600">
                Cart Empty
              </p>
              <h2 className="font-heading mt-3 text-3xl font-bold text-warm-900">
                Your cart is waiting for handcrafted treasures
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-warm-600">
                Explore all treasures and add pieces you love. They will appear here with quantity controls and totals.
              </p>
              <Link
                href="/?view=collections"
                className="mt-8 inline-flex items-center gap-2 border border-brass-500 bg-brass-500 px-7 py-3 text-sm font-medium uppercase tracking-[0.15em] text-warm-900 transition-colors hover:border-brass-400 hover:bg-brass-400"
              >
                Explore All Treasures
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="grid gap-5 border border-warm-200 bg-white p-5 shadow-sm sm:grid-cols-[140px_1fr]"
                  >
                    <div className="overflow-hidden bg-warm-100">
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

                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/categories/${item.categorySlug}/${item.slug}`}
                            className="font-heading text-2xl font-semibold text-warm-900 transition-colors hover:text-brass-600"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-2 text-sm font-semibold text-brass-600">
                            {item.price !== null
                              ? formatCurrency(item.price, item.currency)
                              : "Price TBD"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-sm font-medium uppercase tracking-[0.15em] text-warm-500 transition-colors hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="inline-flex items-center border border-warm-200 bg-warm-50">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="inline-flex h-11 w-11 items-center justify-center text-lg text-warm-900 transition-colors hover:bg-warm-100"
                            aria-label={`Decrease quantity for ${item.name}`}
                          >
                            -
                          </button>
                          <span className="inline-flex min-w-14 items-center justify-center text-base font-medium text-warm-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="inline-flex h-11 w-11 items-center justify-center text-lg text-warm-900 transition-colors hover:bg-warm-100"
                            aria-label={`Increase quantity for ${item.name}`}
                          >
                            +
                          </button>
                        </div>

                        <p className="text-base font-semibold text-warm-900">
                          {(item.price ?? 0) > 0
                            ? formatCurrency((item.price ?? 0) * item.quantity, item.currency)
                            : "Subtotal TBD"}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <aside className="h-fit border border-warm-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-brass-600">
                  Summary
                </p>
                <h2 className="font-heading mt-2 text-3xl font-bold text-warm-900">
                  Cart Total
                </h2>

                <div className="mt-8 space-y-4 border-y border-warm-200 py-6">
                  <div className="flex items-center justify-between text-sm text-warm-600">
                    <span>Total items</span>
                    <span className="font-medium text-warm-900">{totalItems}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-warm-600">
                    <span>Estimated total</span>
                    <span className="text-lg font-semibold text-brass-600">
                      {items[0] ? formatCurrency(totalAmount, items[0].currency) : "Price TBD"}
                    </span>
                  </div>
                </div>

                <p className="mt-6 text-sm leading-7 text-warm-500">
                  This cart is stored locally in your browser for now. It’s ready for the next checkout step whenever you want to add it.
                </p>

                <div className="mt-8 flex flex-col gap-3">
                  <Link
                    href="/?view=collections"
                    className="inline-flex items-center justify-center gap-2 border border-brass-500 bg-brass-500 px-7 py-3 text-sm font-medium uppercase tracking-[0.15em] text-warm-900 transition-colors hover:border-brass-400 hover:bg-brass-400"
                  >
                    Explore All Treasures
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="inline-flex items-center justify-center gap-2 border border-warm-300 px-7 py-3 text-sm font-medium uppercase tracking-[0.15em] text-warm-700 transition-colors hover:border-red-300 hover:text-red-600"
                  >
                    Clear Cart
                  </button>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
