import Image from "next/image";
import Link from "next/link";

import { getCategories } from "@/services/categories/get-categories";

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
  const categories = await getCategories();

  return (
    <>
      {/* ── Hero ── */}
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
            The Art of Crafings            
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-base leading-7 text-warm-400 sm:text-lg">
            Each piece tells a story of generations. Explore our curated
            collection of authentically crafted brass artifacts and patchworks from the different parts
            of India.
          </p>

          <Link
            href="#collections"
            className="inline-flex items-center gap-2 border border-brass-500 px-8 py-3 text-sm font-medium uppercase tracking-[0.15em] text-brass-300 transition-all duration-200 hover:bg-brass-500 hover:text-warm-900"
          >
            Explore Collections
          </Link>

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

      {/* ── Collections ── */}
      <section id="collections" className="bg-warm-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
          {/* Section heading */}
          <div className="mb-14 text-center">
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
                      {category.description ||
                        "Explore our curated collection."}
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
      </section>

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
