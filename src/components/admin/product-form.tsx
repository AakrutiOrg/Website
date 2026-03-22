"use client";

import { useState } from "react";

import { createProduct, updateProduct } from "@/lib/actions/product-actions";
import type { Category, Product } from "@/types";

type ProductFormProps = {
  product?: Product;
  categories: Category[];
};

export function ProductForm({ product, categories }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!product;

  async function action(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    try {
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

  return (
    <form
      action={action}
      className="space-y-6 rounded-2xl border border-warm-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

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

        {/* Price */}
        <label className="block space-y-2">
          <span className="text-sm font-medium text-warm-800">Price (USD)</span>
          <input
            type="number"
            name="price"
            step="0.01"
            min="0"
            defaultValue={product ? (product.price / 100).toFixed(2) : ""}
            required
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

      {/* Description */}
      <label className="block space-y-2">
        <span className="text-sm font-medium text-warm-800">Description</span>
        <textarea
          name="description"
          defaultValue={product?.description || ""}
          rows={4}
          className="w-full resize-y rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
        />
      </label>

      {/* Image URL */}
      <label className="block space-y-2">
        <span className="text-sm font-medium text-warm-800">Image URL</span>
        <input
          type="url"
          name="image_url"
          defaultValue={product?.image_url || ""}
          className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
        />
      </label>

      {/* Is Active */}
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={product ? product.is_active : true}
          className="h-5 w-5 rounded border-warm-300 text-brass-600 focus:ring-brass-500"
        />
        <span className="text-sm font-medium text-warm-800">Active (visible in store)</span>
      </label>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-warm-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-warm-800 disabled:cursor-not-allowed disabled:bg-warm-400"
        >
          {isSubmitting ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
        </button>
      </div>
    </form>
  );
}
