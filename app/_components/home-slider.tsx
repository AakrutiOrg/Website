"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useCart } from "@/components/providers/cart-provider";
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
  const searchParams = useSearchParams();
  const initialPage = searchParams.get("view") === "collections" ? "collections" : "hero";
  const [page, setPage] = useState<"hero" | "collections">(initialPage);
  const [treasureIndex, setTreasureIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [cartMessage, setCartMessage] = useState("");
  const marqueeViewportRef = useRef<HTMLDivElement | null>(null);
  const marqueeTrackRef = useRef<HTMLDivElement | null>(null);
  const marqueeItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const marqueeOffsetRef = useRef(0);
  const marqueePauseUntilRef = useRef(0);
  const marqueeSnapRef = useRef<{ from: number; to: number; start: number; duration: number } | null>(null);
  const { addItem } = useCart();

  const normalizeMarqueeOffset = (offset: number, singleWidth: number) => {
    if (singleWidth <= 0) {
      return offset;
    }

    let normalizedOffset = offset;

    while (normalizedOffset <= -singleWidth) {
      normalizedOffset += singleWidth;
    }

    while (normalizedOffset > 0) {
      normalizedOffset -= singleWidth;
    }

    return normalizedOffset;
  };

  const applyMarqueeOffset = (offset: number) => {
    if (marqueeTrackRef.current) {
      marqueeTrackRef.current.style.transform = `translate3d(${offset}px, 0, 0)`;
    }
  };

  useEffect(() => {
    if (treasures.length <= 1) {
      marqueeOffsetRef.current = 0;
      marqueeSnapRef.current = null;
      marqueePauseUntilRef.current = 0;
      applyMarqueeOffset(0);
      return;
    }

    const interval = window.setInterval(() => {
      setSlideDirection(1);
      setTreasureIndex((current) => (current + 1) % treasures.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, [treasures]);

  useEffect(() => {
    if (treasures.length <= 1) {
      return;
    }

    let animationFrameId = 0;
    let previousTimestamp = 0;

    const tick = (timestamp: number) => {
      const track = marqueeTrackRef.current;
      if (!track) {
        animationFrameId = window.requestAnimationFrame(tick);
        return;
      }

      const singleWidth = track.scrollWidth / 2;
      let nextOffset = marqueeOffsetRef.current;

      if (marqueeSnapRef.current) {
        const { from, to, start, duration } = marqueeSnapRef.current;
        const progress = Math.min((timestamp - start) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        nextOffset = from + (to - from) * easedProgress;

        if (progress >= 1) {
          marqueeSnapRef.current = null;
        }
      } else if (timestamp >= marqueePauseUntilRef.current) {
        if (previousTimestamp === 0) {
          previousTimestamp = timestamp;
        }

        const delta = timestamp - previousTimestamp;
        nextOffset -= (delta / 1000) * 68;
      }

      nextOffset = normalizeMarqueeOffset(nextOffset, singleWidth);
      marqueeOffsetRef.current = nextOffset;
      applyMarqueeOffset(nextOffset);
      previousTimestamp = timestamp;
      animationFrameId = window.requestAnimationFrame(tick);
    };

    animationFrameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [treasures.length]);
  const safeTreasureIndex = treasures.length > 0 ? treasureIndex % treasures.length : 0;
  const activeTreasure = treasures[safeTreasureIndex] ?? null;
  const marqueeTreasures = treasures.length > 0 ? [...treasures, ...treasures] : [];

  useEffect(() => {
    if (treasures.length <= 1) {
      return;
    }

    const viewport = marqueeViewportRef.current;
    const track = marqueeTrackRef.current;
    const activeButton = marqueeItemRefs.current[safeTreasureIndex];

    if (!viewport || !track || !activeButton) {
      return;
    }

    const singleWidth = track.scrollWidth / 2;
    const targetCenter = activeButton.offsetLeft + activeButton.offsetWidth / 2 + singleWidth;
    const targetOffset = normalizeMarqueeOffset((viewport.clientWidth / 2) - targetCenter, singleWidth);
    const now = performance.now();

    marqueeSnapRef.current = {
      from: marqueeOffsetRef.current,
      to: targetOffset,
      start: now,
      duration: 720,
    };
    marqueePauseUntilRef.current = now + 1220;
  }, [safeTreasureIndex, treasures.length]);

  const goToTreasure = (nextIndex: number) => {
    if (treasures.length === 0) {
      return;
    }

    if (nextIndex === safeTreasureIndex) {
      return;
    }

    setSlideDirection(nextIndex > safeTreasureIndex ? 1 : -1);
    setTreasureIndex(nextIndex);
  };

  const showPreviousTreasure = () => {
    setSlideDirection(-1);
    setTreasureIndex((current) => (current - 1 + treasures.length) % treasures.length);
  };

  const showNextTreasure = () => {
    setSlideDirection(1);
    setTreasureIndex((current) => (current + 1) % treasures.length);
  };

  const handleAddTreasureToCart = () => {
    if (!activeTreasure || activeTreasure.stock_quantity <= 0) {
      return;
    }

    addItem({
      id: activeTreasure.product_id,
      name: activeTreasure.name,
      slug: activeTreasure.slug,
      categorySlug: activeTreasure.category_slug,
      imageUrl: activeTreasure.primary_image_url,
      price: activeTreasure.price,
      currency: activeTreasure.market_currency,
      quantity: 1,
      stockQuantity: activeTreasure.stock_quantity,
      size: activeTreasure.attributes?.size
        ? `${activeTreasure.attributes.size} ${activeTreasure.attributes?.size_unit === "cm" ? "cm" : "inch"}`
        : null,
      color: activeTreasure.attributes?.color ?? null,
    });

    setCartMessage("1 item added to cart");
    window.setTimeout(() => setCartMessage(""), 2200);
  };

  return (
    <div className="relative overflow-hidden">
      <div className="relative">
        <div
          className={`w-full transition-all duration-700 ease-in-out will-change-transform ${
            page === "hero"
              ? "relative translate-x-0 opacity-100"
              : "pointer-events-none absolute inset-0 -translate-x-full opacity-0"
          }`}
        >
          <section className="relative overflow-hidden bg-warm-900 py-8 sm:py-10 md:py-12 lg:py-16">
            <div className="bg-craft-texture absolute inset-0 opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-warm-900 via-warm-900/96 to-warm-800" />

            <div className="absolute left-6 top-6 h-8 w-8 border-l-2 border-t-2 border-brass-400/60 sm:left-10 sm:top-10" />
            <div className="absolute right-6 top-6 h-8 w-8 border-r-2 border-t-2 border-brass-400/60 sm:right-10 sm:top-10" />
            <div className="absolute bottom-6 left-6 h-8 w-8 border-b-2 border-l-2 border-brass-400/60 sm:bottom-10 sm:left-10" />
            <div className="absolute bottom-6 right-6 h-8 w-8 border-b-2 border-r-2 border-brass-400/60 sm:bottom-10 sm:right-10" />

            <div className="relative mx-auto flex max-w-4xl flex-col items-center justify-center px-6 text-center sm:px-8 lg:px-12">
              <div className="mb-3 flex flex-col items-center gap-2.5 sm:gap-3">
                <Image
                  src="/logo.png"
                  alt="Aakruti"
                  width={180}
                  height={180}
                  className="h-16 w-auto drop-shadow-2xl sm:h-20 md:h-24 lg:h-28"
                  priority
                />
                <div className="flex items-center gap-3 sm:gap-5">
                  <div className="h-px w-10 bg-brass-500 sm:w-16 md:w-20" />
                  <p className="font-[family-name:var(--font-great-vibes)] text-xl text-warm-200 sm:text-2xl md:text-3xl lg:text-4xl">
                    Shaping your Abode
                  </p>
                  <div className="h-px w-10 bg-brass-500 sm:w-16 md:w-20" />
                </div>
              </div>

              <p className="mb-2 text-xs font-medium uppercase tracking-[0.35em] text-brass-400">
                Est. 2025 · Handcrafted with Pride
              </p>

              <h1 className="font-heading mb-3 text-3xl font-bold leading-tight tracking-tight text-warm-50 sm:text-4xl md:text-5xl lg:text-6xl">
                The Art of Craftings
              </h1>

              <p className="mx-auto mb-5 max-w-xl text-sm leading-7 text-warm-300 sm:text-base md:text-lg">
                Each piece tells a story of generations. Explore our curated
                collection of authentically crafted brass artifacts and patchworks from the
                different parts of India.
              </p>

              <button
                onClick={() => setPage("collections")}
                className="cursor-pointer inline-flex items-center gap-2 border border-brass-400 px-6 py-2.5 text-sm font-medium uppercase tracking-[0.15em] text-brass-300 backdrop-blur-sm transition-all duration-200 hover:border-brass-500 hover:bg-brass-500 hover:text-warm-900 sm:px-8 sm:py-3"
              >
                Explore all Treasures
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </section>

          {activeTreasure && (
            <section className="relative overflow-hidden bg-[linear-gradient(180deg,#faf5ef_0%,#fffaf4_55%,#f4eadb_100%)] pt-8 pb-5 sm:pt-10 sm:pb-6 md:pt-12 md:pb-8 lg:pt-16 lg:pb-10">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(195,143,63,0.14),transparent_65%)]" />
              <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
                <div className="mb-5 flex items-center justify-between gap-4 sm:mb-6">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.35em] text-brass-600">
                      Our Precious Treasures
                    </p>
                    <p className="mt-2 text-sm text-warm-500">
                      A rotating curation of standout handcrafted pieces.
                    </p>
                  </div>
                  {treasures.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={showPreviousTreasure}
                        className="cursor-pointer inline-flex h-11 w-11 items-center justify-center rounded-full border border-warm-300/80 bg-white/80 text-warm-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brass-400 hover:text-brass-600"
                        aria-label="Previous treasure"
                      >
                        &larr;
                      </button>
                      <button
                        type="button"
                        onClick={showNextTreasure}
                        className="cursor-pointer inline-flex h-11 w-11 items-center justify-center rounded-full border border-warm-300/80 bg-white/80 text-warm-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brass-400 hover:text-brass-600"
                        aria-label="Next treasure"
                      >
                        &rarr;
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid gap-5 md:grid-cols-[1.02fr_0.98fr] md:items-center lg:grid-cols-[1.12fr_0.88fr] lg:gap-8">
                  <div className="relative overflow-hidden rounded-[2rem] border border-brass-200/60 bg-white/75 p-3 shadow-[0_30px_80px_-40px_rgba(49,32,12,0.55)] backdrop-blur">
                    <div className="relative h-[240px] overflow-hidden rounded-[1.5rem] bg-warm-100 sm:h-[300px] md:h-[360px] lg:h-[460px]">
                      {treasures.map((treasure, index) => {
                        const isActive = index === safeTreasureIndex;

                        return (
                          <div
                            key={treasure.product_id}
                            className={`absolute inset-0 transition-all duration-700 ease-out ${isActive ? "translate-x-0 scale-100 opacity-100" : slideDirection < 0 ? "translate-x-6 scale-[1.02] opacity-0" : "-translate-x-6 scale-[1.02] opacity-0"}`}
                          >
                            {treasure.primary_image_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={treasure.primary_image_url}
                                alt={treasure.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="bg-craft-texture h-full w-full" />
                            )}
                          </div>
                        );
                      })}
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(36,24,10,0.04)_0%,rgba(36,24,10,0.12)_45%,rgba(36,24,10,0.58)_100%)]" />
                      <div className="absolute left-4 top-4 rounded-full border border-brass-300/70 bg-white/85 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.35em] text-brass-700 shadow-sm backdrop-blur">
                        Precious
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 lg:p-7">
                        <p className="text-xs uppercase tracking-[0.3em] text-brass-200">
                          {activeTreasure.category_name}
                        </p>
                        <h2 className="font-heading mt-2 text-2xl font-bold text-white sm:text-3xl lg:mt-3 lg:text-4xl">
                          {activeTreasure.name}
                        </h2>
                      </div>
                    </div>
                  </div>

                  <div className="max-w-xl md:max-w-none">
                    <div className="overflow-hidden rounded-[2rem] border border-warm-200/80 bg-white/80 p-5 shadow-[0_24px_60px_-36px_rgba(49,32,12,0.45)] backdrop-blur sm:p-6 lg:p-8">
                      <div
                        key={activeTreasure.product_id}
                        className="animate-[fade-in_700ms_ease]"
                      >
                        <p className="text-xs uppercase tracking-[0.24em] text-warm-500">
                          Curated spotlight
                        </p>
                        <h3 className="font-heading mt-3 text-2xl font-bold text-warm-900 sm:text-3xl lg:text-4xl">
                          {activeTreasure.name}
                        </h3>
                        {activeTreasure.price !== null && (
                          <p className="mt-4 text-lg font-semibold text-brass-600 sm:text-xl">
                            {formatCurrency(activeTreasure.price, activeTreasure.market_currency)}
                          </p>
                        )}
                        <p className="mt-4 text-sm leading-7 text-warm-600 sm:text-base md:text-[15px] lg:text-lg lg:leading-8">
                          {activeTreasure.short_description ||
                            "A featured handcrafted piece from our latest curation, chosen for its artistry and timeless character."}
                        </p>

                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                          <Link
                            href={`/categories/${activeTreasure.category_slug}/${activeTreasure.slug}`}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-brass-500 bg-brass-500 px-5 py-3 text-center text-sm font-medium uppercase tracking-[0.12em] text-warm-900 transition-colors hover:border-brass-400 hover:bg-brass-400"
                          >
                            View Product
                          </Link>
                          <button
                            type="button"
                            onClick={handleAddTreasureToCart}
                            disabled={activeTreasure.stock_quantity <= 0}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-warm-300 bg-white px-5 py-3 text-center text-sm font-medium uppercase tracking-[0.12em] text-warm-700 transition-colors hover:border-brass-400 hover:bg-brass-50 hover:text-brass-600 disabled:cursor-not-allowed disabled:border-warm-200 disabled:bg-warm-100 disabled:text-warm-400"
                          >
                            {activeTreasure.stock_quantity > 0 ? "Add to Cart" : "Out of Stock"}
                          </button>
                          <Link
                            href={`/categories/${activeTreasure.category_slug}`}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-warm-300 bg-white px-5 py-3 text-center text-sm font-medium uppercase tracking-[0.12em] text-warm-700 transition-colors hover:border-brass-400 hover:bg-brass-50 hover:text-brass-600"
                          >
                            Explore Category
                          </Link>
                        </div>

                        {cartMessage && (
                          <p className="mt-4 text-sm font-medium text-brass-600">{cartMessage}</p>
                        )}
                      </div>

                      {treasures.length > 1 && (
                        <div className="mt-6 flex items-center gap-3">
                          {treasures.map((treasure, index) => (
                            <button
                              key={treasure.product_id}
                              type="button"
                              onClick={() => goToTreasure(index)}
                              className={`cursor-pointer rounded-full transition-all ${index === safeTreasureIndex ? "h-2.5 w-12 bg-brass-500" : "h-2.5 w-2.5 bg-warm-300 hover:bg-brass-300"}`}
                              aria-label={`Show treasure ${index + 1}: ${treasure.name}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {treasures.length > 1 && (
                  <div
                    key={`${activeTreasure.product_id}-${safeTreasureIndex}`}
                    ref={marqueeViewportRef}
                    className={`mt-4 overflow-hidden rounded-full border border-brass-200/70 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur sm:mt-5 sm:px-4 sm:py-3 ${slideDirection > 0 ? "animate-[treasure-strip-in-right_700ms_ease]" : "animate-[treasure-strip-in-left_700ms_ease]"}`}
                  >
                    <div
                      ref={marqueeTrackRef}
                      className="flex min-w-max items-center gap-3 will-change-transform"
                    >
                      {marqueeTreasures.map((treasure, index) => (
                        <button
                          key={`${treasure.product_id}-${index}`}
                          ref={(node) => {
                            if (index < treasures.length) {
                              marqueeItemRefs.current[index] = node;
                            }
                          }}
                          type="button"
                          onClick={() => goToTreasure(index % treasures.length)}
                          className={`inline-flex items-center justify-center gap-3 rounded-full border px-4 py-2 text-center transition-all ${
                            index % treasures.length === safeTreasureIndex
                              ? "border-brass-400 bg-brass-50 text-brass-700 shadow-sm"
                              : "border-transparent bg-transparent text-warm-600 hover:border-warm-200 hover:bg-warm-50"
                          }`}
                        >
                          <span className="text-xs uppercase tracking-[0.22em] text-brass-500">
                            Precious
                          </span>
                          <span className="font-medium">{treasure.name}</span>
                          {treasure.price !== null && (
                            <span className="text-sm font-semibold text-brass-600">
                              {formatCurrency(treasure.price, treasure.market_currency)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <div
          className={`w-full transition-all duration-700 ease-in-out will-change-transform ${
            page === "collections"
              ? "relative translate-x-0 opacity-100"
              : "pointer-events-none absolute inset-0 translate-x-full opacity-0"
          }`}
        >
          <div className="min-w-full bg-warm-50 pt-8 pb-10 sm:pt-10 sm:pb-12 lg:pt-14 lg:pb-16">
          <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
            <div className="mb-8 text-center sm:mb-10 lg:mb-12">
              <button
                onClick={() => setPage("hero")}
                className="mb-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-brass-600 transition-colors hover:text-brass-500 sm:mb-6"
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
              <OrnamentalDivider className="mx-auto mt-4 max-w-xs sm:mt-6" />
            </div>

            {categories.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
              <div className="flex flex-col items-center gap-4 border border-dashed border-warm-300 bg-white py-10 text-center sm:py-16">
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
    </div>
  );
}

