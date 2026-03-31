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

  if (!size) {
    return "Made to artisan proportions";
  }

  return `${size} ${sizeUnit === "cm" ? "cm" : "inch"}`;
}

function formatMaterial(product: { material: string | null; attributes: ProductAttributes | null }) {
  return product.attributes?.material || product.material || "Handcrafted mixed medium";
}

function formatFrameStyle(product: { is_framed: boolean; attributes: ProductAttributes | null }) {
  if (product.attributes?.frame_style === "framed") {
    return "Framed";
  }

  if (product.attributes?.frame_style === "non_framed") {
    return "Non-Framed";
  }

  return product.is_framed ? "Framed" : "Non-Framed";
}

function getCartSize(attributes: ProductAttributes | null) {
  const size = attributes?.size ?? null;

  if (!size) {
    return null;
  }

  return `${size} ${attributes?.size_unit === "cm" ? "cm" : "inch"}`;
}

function formatArtType(artType: string) {
  switch (artType) {
    case "brass_framed":
      return "Brass Framed";
    case "brass_non_framed":
      return "Brass Non-Framed";
    case "fabric_patchwork":
      return "Fabric Patchwork";
    default:
      return artType.replaceAll("_", " ");
  }
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
    <div className="bg-warm-50">
      <section className="relative overflow-hidden bg-warm-900 py-14 sm:py-16 lg:py-20">
        <div className="bg-craft-texture absolute inset-0 opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-warm-900 via-warm-900/95 to-warm-800" />

        <div className="relative mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-warm-400">
              <li>
                <Link href="/" className="transition-colors hover:text-brass-300">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">&rsaquo;</li>
              <li>
                <Link
                  href={`/categories/${category.slug}`}
                  className="transition-colors hover:text-brass-300"
                >
                  {category.name}
                </Link>
              </li>
              <li aria-hidden="true">&rsaquo;</li>
              <li className="text-warm-100">{product.name}</li>
            </ol>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="space-y-4">
              <ProductImageViewer images={galleryImages} productName={product.name} />
            </div>

            <div className="text-warm-50">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-brass-400">
                Our Precious Treasures
              </p>
              <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
                {product.name}
              </h1>
              <p className="mt-4 text-sm uppercase tracking-[0.22em] text-warm-400">
                {category.name}
              </p>

              <div className="mt-8 grid gap-4 border-y border-warm-700/70 py-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-brass-400">Price</p>
                  <p className="mt-2 text-lg font-semibold text-brass-200">
                    {product.price !== null
                      ? formatCurrency(product.price, product.market_currency)
                      : "Price TBD"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-brass-400">Art Type</p>
                  <p className="mt-2 text-base font-medium text-warm-100">
                    {formatArtType(product.art_type)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-brass-400">Material</p>
                  <p className="mt-2 text-base font-medium text-warm-100">
                    {formatMaterial(product)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-brass-400">Size</p>
                  <p className="mt-2 text-base font-medium text-warm-100">
                    {formatSize(product.attributes)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-brass-400">Color</p>
                  <p className="mt-2 text-base font-medium text-warm-100">
                    {product.attributes?.color || "Natural artisan palette"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-brass-400">Frame Style</p>
                  <p className="mt-2 text-base font-medium text-warm-100">
                    {formatFrameStyle(product)}
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-5">
                {product.short_description && (
                  <p className="text-lg leading-8 text-warm-200">{product.short_description}</p>
                )}
                <p className="text-base leading-8 text-warm-300">
                  {product.description ||
                    "Crafted with care and rooted in tradition, this piece brings timeless artistry into contemporary living spaces."}
                </p>
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href={`/categories/${category.slug}`}
                  className="inline-flex items-center gap-2 border border-brass-500 bg-brass-500 px-7 py-3 text-sm font-medium uppercase tracking-[0.15em] text-warm-900 transition-colors hover:border-brass-400 hover:bg-brass-400"
                >
                  Back to Collection
                  <span aria-hidden="true">&rarr;</span>
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 border border-warm-600 px-7 py-3 text-sm font-medium uppercase tracking-[0.15em] text-warm-200 transition-colors hover:border-brass-400 hover:bg-warm-50/10 hover:text-brass-200"
                >
                  Continue Browsing
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>

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
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
            <div className="mb-10 border-b border-warm-200 pb-6">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-brass-600">
                More to Explore
              </p>
              <h2 className="font-heading mt-2 text-3xl font-bold text-warm-900 sm:text-4xl">
                Related Treasures
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.product_id}
                  href={`/categories/${relatedProduct.category_slug}/${relatedProduct.slug}`}
                  className="group flex flex-col overflow-hidden border border-warm-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brass-300 hover:shadow-md"
                >
                  <div className="relative h-56 overflow-hidden bg-warm-100">
                    {relatedProduct.primary_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={relatedProduct.primary_image_url}
                        alt={relatedProduct.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="bg-craft-texture h-full w-full" />
                    )}
                    <div className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-brass-400" />
                    <div className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-brass-400" />
                    <div className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-brass-400" />
                    <div className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-brass-400" />
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-heading mb-2 text-xl font-semibold text-warm-900">
                      {relatedProduct.name}
                    </h3>
                    <p className="mb-3 text-sm font-semibold text-brass-600">
                      {relatedProduct.price !== null
                        ? formatCurrency(relatedProduct.price, relatedProduct.market_currency)
                        : "Price TBD"}
                    </p>
                    <p className="flex-1 text-sm leading-6 text-warm-600">
                      {relatedProduct.short_description || "Discover another handcrafted piece from this collection."}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm font-medium text-brass-600 transition-colors group-hover:text-brass-500">
                      <span>View Product</span>
                      <span aria-hidden="true">&rarr;</span>
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


