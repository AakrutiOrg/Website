"use client";

import { useState, useRef } from "react";

import { createProduct, updateProduct } from "@/lib/actions/product-actions";
import { supabase } from "@/lib/supabase/browser";
import type { Category, Product } from "@/types";
import type { Market, ProductMarketData } from "@/types/market";

type ProductFormProps = {
  product?: Product;
  categories: Category[];
  markets: Market[];
  marketData?: ProductMarketData[];
};

export function ProductForm({ product, categories, markets, marketData = [] }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<{ file: File, url: string }[]>([]);
  const newIdRef = useRef(crypto.randomUUID());

  const isEditing = !!product;
  const targetProductId = isEditing ? product.id : newIdRef.current;

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check max limit (5)
    if (previewImages.length + files.length > 5) {
      setError("You can only upload a maximum of 5 images at once.");
      return;
    }

    const newPreviews = files.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));

    setPreviewImages(prev => [...prev, ...newPreviews]);
    setError(null);
  }

  function removePreview(index: number) {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  }

  async function action(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      let uploadedPaths: string[] = [];

      // Upload images natively from browser to bypass NextJS limits
      if (previewImages.length > 0) {
        for (const { file } of previewImages) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${targetProductId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(fileName, file, { cacheControl: "3600", upsert: false });

          if (uploadError) {
            throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          }

          uploadedPaths.push(fileName);
        }
      }

      formData.set("id", targetProductId);
      if (uploadedPaths.length > 0) {
        formData.set("new_images", JSON.stringify(uploadedPaths));
      }

      if (isEditing) {
        await updateProduct(product.id, formData);
      } else {
        await createProduct(formData);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  function getMarketData(marketId: string) {
    return marketData.find(m => m.market_id === marketId);
  }

  return (
    <>
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm transition-all">
          <div className="relative h-24 w-24 animate-pulse">
            <img src="/logo.png" alt="Aakruti Logo" className="h-full w-full object-contain drop-shadow-xl" />
          </div>
          <p className="mt-6 font-heading text-lg font-medium text-warm-900 animate-pulse">
            Processing Product Details...
          </p>
        </div>
      )}

      <form
        action={action}
        className="space-y-8 rounded-2xl border border-warm-200 bg-white p-6 shadow-sm sm:p-8"
      >
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Global Product Configuration */}
        <div className="space-y-6">
          <h3 className="font-semibold text-warm-900 font-heading border-b border-warm-100 pb-2">Global Settings</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Name */}
            <label className="block space-y-2">
              <span className="text-sm font-medium text-warm-800">Product Name</span>
              <input
                type="text"
                name="name"
                defaultValue={product?.name}
                required
                className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
              />
            </label>

            {/* Slug */}
            <label className="block space-y-2">
              <span className="text-sm font-medium text-warm-800">Slug (URL friendly)</span>
              <input
                type="text"
                name="slug"
                defaultValue={product?.slug}
                required
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                title="Only lowercase letters, numbers, and hyphens"
                className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
              />
            </label>

            {/* Base Price (Legacy) */}
            <label className="block space-y-2">
              <span className="text-sm font-medium text-warm-800">Base Price (Legacy Fallback)</span>
              <input
                type="number"
                name="base_price"
                step="0.01"
                min="0"
                defaultValue={product?.base_price ?? ""}
                className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
              />
            </label>

            {/* Category */}
            <label className="block space-y-2">
              <span className="text-sm font-medium text-warm-800">Category</span>
              <select
                name="category_id"
                defaultValue={product?.category_id || ""}
                required
                className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
              >
                <option value="" disabled>Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-warm-800">SKU</span>
              <input
                type="text"
                name="sku"
                defaultValue={product?.sku || ""}
                className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-warm-800">Art Type</span>
              <select
                name="art_type"
                defaultValue={product?.art_type || "brass_framed"}
                required
                className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition"
              >
                <option value="brass_framed">Brass Framed</option>
                <option value="brass_non_framed">Brass Non-Framed</option>
                <option value="fabric_patchwork">Fabric Patchwork</option>
              </select>
            </label>
          </div>

          {/* Short Description */}
          <label className="block space-y-2">
            <span className="text-sm font-medium text-warm-800">Short Description</span>
            <textarea
              name="short_description"
              defaultValue={product?.short_description || ""}
              rows={2}
              className="w-full resize-y rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
            />
          </label>

          {/* Description */}
          <label className="block space-y-2">
            <span className="text-sm font-medium text-warm-800">Full Description</span>
            <textarea
              name="description"
              defaultValue={product?.description || ""}
              rows={4}
              className="w-full resize-y rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
            />
          </label>

          {/* Global Active */}
          <label className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={product ? product.is_active : true}
              className="h-5 w-5 rounded border-warm-300 text-brass-600 focus:ring-brass-500"
            />
            <span className="text-sm font-medium text-warm-800">Product is active globally</span>
          </label>
        </div>

        {/* Market Specific Configuration */}
        <div className="space-y-6 pt-6 border-t border-warm-200">
          <h3 className="font-semibold text-warm-900 font-heading">Market Availability & Pricing</h3>
          <p className="text-sm text-warm-500 mb-6">Configure the product for each specific operating region.</p>

          {markets.map((market) => {
            const data = getMarketData(market.id);

            return (
              <div key={market.id} className="rounded-xl border border-warm-200 bg-warm-50 p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-warm-900 flex items-center gap-2">
                    <span className="text-xl leading-none">{market.code === 'IN' ? '🇮🇳' : market.code === 'UK' ? '🇬🇧' : '🌍'}</span>
                    {market.name} Market
                  </h4>
                  <label className="flex items-center gap-2">
                    <span className="text-xs font-medium text-warm-600">Active in Region</span>
                    <input
                      type="checkbox"
                      name={`market_${market.code}_is_active`}
                      defaultChecked={data ? data.is_active : false}
                      className="h-4 w-4 rounded border-warm-300 text-brass-600 focus:ring-brass-500"
                    />
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-warm-700">Price ({market.currency})</span>
                    <input
                      type="number"
                      step="0.01"
                      name={`market_${market.code}_price`}
                      defaultValue={data?.price ?? ""}
                      className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-900 outline-none transition focus:border-brass-500"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-warm-700">Stock Quantity</span>
                    <input
                      type="number"
                      name={`market_${market.code}_stock`}
                      defaultValue={data?.stock_quantity ?? 0}
                      className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-900 outline-none transition focus:border-brass-500"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-warm-700">Cost (Purchase)</span>
                    <input
                      type="number"
                      step="0.01"
                      name={`market_${market.code}_cost`}
                      defaultValue={data?.cost_price ?? ""}
                      className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-900 outline-none transition focus:border-brass-500"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-warm-700">External SKU</span>
                    <input
                      type="text"
                      name={`market_${market.code}_sku`}
                      defaultValue={data?.external_sku || ""}
                      className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-900 outline-none transition focus:border-brass-500"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {/* Image Upload Configuration */}
        <div className="space-y-6 pt-6 border-t border-warm-200">
          <h3 className="font-semibold text-warm-900 font-heading">Product Details & Imagery</h3>
          <p className="text-sm text-warm-500 mb-6">Upload up to 5 images for this product.</p>

          <div className="space-y-4">
            <label className="block">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-warm-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-xl file:border-0
                file:text-sm file:font-semibold
                file:bg-warm-100 file:text-warm-700
                hover:file:bg-warm-200 transition"
              />
            </label>

            {previewImages.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-4">
                {previewImages.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-warm-200 w-24 h-24">
                    <img src={img.url} alt="upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePreview(idx)}
                      className="cursor-pointer absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="text-xl">&times;</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-warm-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer rounded-xl bg-warm-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-warm-800 disabled:cursor-wait disabled:bg-warm-400"
          >
            {isSubmitting ? "Saving Config..." : isEditing ? "Update Product & Markets" : "Create Product & Markets"}
          </button>
        </div>
      </form>
    </>
  );
}
