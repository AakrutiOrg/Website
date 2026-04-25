import Link from "next/link";
import { notFound } from "next/navigation";

import { formatCurrency } from "@/lib/utils";
import { getMarketAwareProductDetail } from "@/services/products/get-market-aware-product-detail";
import type { ProductAttributes } from "@/types";
import { AddToCartControls } from "./_components/add-to-cart-controls";
import { ProductImageViewer } from "./_components/product-image-viewer";

type ProductPageProps = {
  params: Promise<{ slug: string; productSlug: string }>;
  searchParams: Promise<{ market?: string }>;
};

function formatSize(attributes: ProductAttributes | null) {
  const size = attributes?.size ?? null;
  const sizeUnit = attributes?.size_unit ?? null;
  if (!size) return "Made to artisan proportions";
  return `${size} ${sizeUnit === "cm" ? "cm" : "inch"}`;
}

function formatMaterial(product: { material: string | null; attributes: ProductAttributes | null }) {
  return product.attributes?.material || product.material || "Handcrafted mixed medium";
}

function formatFrameStyle(product: { is_framed: boolean; attributes: ProductAttributes | null }) {
  if (product.attributes?.frame_style === "framed") return "Framed";
  if (product.attributes?.frame_style === "non_framed") return "Non-Framed";
  return product.is_framed ? "Framed" : "Non-Framed";
}

function getCartSize(attributes: ProductAttributes | null) {
  const size = attributes?.size ?? null;
  if (!size) return null;
  return `${size} ${attributes?.size_unit === "cm" ? "cm" : "inch"}`;
}

function formatArtType(artType: string) {
  switch (artType) {
    case "brass_framed": return "Brass Framed";
    case "brass_non_framed": return "Brass Non-Framed";
    case "fabric_patchwork": return "Fabric Patchwork";
    default: return artType.replaceAll("_", " ");
  }
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-warm-100 pb-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brass-600">{label}</p>
      <p className="mt-1 text-sm font-medium text-warm-800">{value}</p>
    </div>
  );
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug, productSlug } = await params;
  const { market } = await searchParams;
  const { category, product, images, relatedProducts } = await getMarketAwareProductDetail(
    slug,
    productSlug,
    market,
  );

  if (!product || !category) {
    notFound();
  }

  const galleryImages =
    images.length > 0
      ? images
      : product.primary_image_url
        ? [{ id: "primary", url: product.primary_image_url, is_primary: true }]
        : [];

  return (
    <div className="min-h-screen bg-white">
      {/* ── Compact breadcrumb bar ── */}
      <div className="border-b border-warm-100 bg-warm-50">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
          <nav aria-label="Breadcrumb" className="py-3.5">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-warm-500">
              <li>
                <Link href="/" className="transition-colors hover:text-brass-600">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-warm-300">›</li>
              <li>
                <Link
                  href={`/categories/${category.slug}`}
                  className="transition-colors hover:text-brass-600"
                >
                  {category.name}
                </Link>
              </li>
              <li aria-hidden="true" className="text-warm-300">›</li>
              <li className="font-medium text-warm-700">{product.name}</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* ── Product detail ── */}
      <div className="mx-auto max-w-6xl px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">

          {/* Image column — sticky on desktop */}
          <div className="md:sticky md:top-20">
            <ProductImageViewer images={galleryImages} productName={product.name} />
          </div>

          {/* Info column */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brass-600">
              Our Precious Treasures
            </p>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-warm-900 sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-warm-500">
              {category.name}
            </p>

            {/* Price */}
            <div className="mt-6 border-b border-warm-100 pb-6">
              {product.price !== null ? (
                <p className="text-3xl font-bold text-warm-900">
                  {formatCurrency(product.price, product.market_currency)}
                </p>
              ) : (
                <p className="text-xl text-warm-400">Price on request</p>
              )}
            </div>

            {/* Specs grid */}
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-0 border-b border-warm-100 pb-6">
              <SpecItem label="Art Type" value={formatArtType(product.art_type)} />
              <SpecItem label="Material" value={formatMaterial(product)} />
              <SpecItem label="Size" value={formatSize(product.attributes)} />
              <SpecItem label="Frame Style" value={formatFrameStyle(product)} />
              <SpecItem
                label="Color"
                value={product.attributes?.color || "Natural artisan palette"}
              />
            </div>

            {/* Description */}
            {(product.short_description || product.description) && (
              <div className="mt-6 space-y-2.5 border-b border-warm-100 pb-6">
                {product.short_description && (
                  <p className="text-base leading-6 text-warm-700">
                    {product.short_description}
                  </p>
                )}
                <p className="text-sm leading-6 text-warm-500">
                  {product.description ||
                    "Crafted with care and rooted in tradition, this piece brings timeless artistry into contemporary living spaces."}
                </p>
              </div>
            )}

            {/* Add to cart */}
            <AddToCartControls
              product={{
                id: product.product_id,
                name: product.name,
                slug: product.slug,
                categorySlug: product.category_slug,
                imageUrl: product.primary_image_url,
                price: product.price,
                currency: product.market_currency,
                stockQuantity: product.stock_quantity,
                size: getCartSize(product.attributes),
                color: product.attributes?.color ?? null,
              }}
            />

            {/* Navigation actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/categories/${category.slug}`}
                className="inline-flex items-center gap-2 border border-warm-200 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-warm-600 transition-all hover:border-brass-400 hover:text-brass-600"
              >
                <span aria-hidden="true">←</span>
                Back to {category.name}
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 border border-warm-200 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-warm-600 transition-all hover:border-brass-400 hover:text-brass-600"
              >
                Continue Browsing
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Related products — 4-col grid ── */}
      {relatedProducts.length > 0 && (
        <section className="border-t-2 border-brass-100 bg-white py-10 sm:py-12">
          <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-warm-100 pb-5">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.4em] text-brass-600">
                  More to Explore
                </p>
                <h2 className="font-heading text-xl font-bold text-warm-900 sm:text-2xl">
                  Related Treasures
                </h2>
              </div>
              <Link
                href={`/categories/${category.slug}`}
                className="shrink-0 text-[11px] font-bold uppercase tracking-[0.15em] text-brass-600 transition-colors hover:text-brass-500"
              >
                All in {category.name} →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((rp) => (
                <Link
                  key={rp.product_id}
                  href={`/categories/${rp.category_slug}/${rp.slug}`}
                  className="group flex flex-col overflow-hidden border border-warm-100 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-brass-200 hover:shadow-md"
                >
                  {/* Square image */}
                  <div className="relative aspect-square overflow-hidden bg-warm-50">
                    {rp.primary_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={rp.primary_image_url}
                        alt={rp.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="bg-craft-texture h-full w-full" />
                    )}
                    {/* Brass corners */}
                    <div className="absolute left-0 top-0 h-3.5 w-3.5 border-l-2 border-t-2 border-brass-400" />
                    <div className="absolute right-0 top-0 h-3.5 w-3.5 border-r-2 border-t-2 border-brass-400" />
                    <div className="absolute bottom-0 left-0 h-3.5 w-3.5 border-b-2 border-l-2 border-brass-400" />
                    <div className="absolute bottom-0 right-0 h-3.5 w-3.5 border-b-2 border-r-2 border-brass-400" />
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col p-3">
                    <h3 className="font-heading mb-1 text-xs font-semibold leading-5 text-warm-900 transition-colors group-hover:text-brass-700 sm:text-sm">
                      {rp.name}
                    </h3>
                    <p className="text-xs font-bold text-brass-600 sm:text-sm">
                      {rp.price !== null
                        ? formatCurrency(rp.price, rp.market_currency)
                        : "Price TBD"}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-warm-400 transition-all group-hover:gap-2 group-hover:text-brass-600">
                      <span>View</span>
                      <span aria-hidden="true">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
