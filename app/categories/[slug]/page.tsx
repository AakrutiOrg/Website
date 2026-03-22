import Link from "next/link";
import { notFound } from "next/navigation";

import { getCategoryBySlug } from "@/services/categories/get-category-by-slug";
import { formatCurrency } from "@/lib/utils";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ market?: string }>;
};

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { market } = await searchParams;
  const { category, products } = await getCategoryBySlug(slug, market);

  if (!category) {
    notFound();
  }

  return (
    <>
      {/* ── Category hero ── */}
      <section className="bg-warm-900 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-10">
            <ol className="flex items-center gap-2 text-sm text-warm-500">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-brass-300"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li className="text-warm-300">{category.name}</li>
            </ol>
          </nav>

          <div className="mb-5 flex items-center gap-3">
            <div className="h-px w-8 bg-brass-700" />
            <span className="text-brass-500" aria-hidden="true">
              ◆
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
        </div>
      </section>

      {/* ── Products grid ── */}
      <section className="bg-warm-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
          {/* Section header */}
          <div className="mb-10 border-b border-warm-200 pb-6">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-brass-600">
              Collection
            </p>
            <h2 className="font-heading mt-1 text-2xl font-bold text-warm-900 sm:text-3xl">
              {products.length} {products.length === 1 ? "Piece" : "Pieces"}{" "}
              Available
            </h2>
          </div>

          {products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <article
                  key={product.product_id}
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
                              ◆
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
                      {product.price !== null ? formatCurrency(product.price, product.market_currency) : 'Price TBD'}
                    </p>
                    {product.short_description && (
                      <p className="flex-1 text-sm leading-6 text-warm-600">
                        {product.short_description}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 border border-dashed border-warm-300 bg-white py-16 text-center">
              <span className="text-2xl text-brass-300" aria-hidden="true">
                ◆
              </span>
              <p className="text-sm text-warm-500">
                Products for this collection are being added. Please check back
                soon.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
