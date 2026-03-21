"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase/browser";
import { createCategory, updateCategory } from "@/lib/actions/category-actions";
import type { Category } from "@/types";

type CategoryFormProps = {
  category?: Category;
};

export function CategoryForm({ category }: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(category?.image_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!category;

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
      // We don't revoke the object URL immediately so the preview stays up
    } else {
      setPreviewImage(category?.image_url || null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      // 1. Check if we need to upload a new image
      const file = fileInputRef.current?.files?.[0];
      
      if (file) {
        if (!file.type.startsWith("image/")) {
          throw new Error("Please select a valid image file.");
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Image must be smaller than 5MB.");
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("category-images")
          .upload(fileName, file, { cacheControl: "3600", upsert: false });

        if (uploadError) {
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }

        const publicUrl = supabase.storage.from("category-images").getPublicUrl(fileName).data.publicUrl;
        formData.set("image_url", publicUrl);
      } else if (category?.image_url) {
        // Carry over existing image if no new one was provided
        formData.set("image_url", category.image_url);
      }

      // 2. Transact with the server action
      if (isEditing) {
        await updateCategory(category.id, formData);
      } else {
        await createCategory(formData);
      }

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
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
          <span className="text-sm font-medium text-warm-800">Category Name</span>
          <input
            type="text"
            name="name"
            defaultValue={category?.name}
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
            defaultValue={category?.slug}
            required
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            title="Only lowercase letters, numbers, and hyphens"
            className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
          />
        </label>

        {/* Sort Order */}
        <label className="block space-y-2">
          <span className="text-sm font-medium text-warm-800">Sort Order</span>
          <input
            type="number"
            name="sort_order"
            defaultValue={category?.sort_order ?? 0}
            required
            className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
          />
        </label>
        
        {/* Is Active */}
        <label className="flex items-center gap-3 pt-8 pb-4">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={category ? category.is_active : true}
            className="h-5 w-5 rounded border-warm-300 text-brass-600 focus:ring-brass-500"
          />
          <span className="text-sm font-medium text-warm-800">Active (visible in store)</span>
        </label>
      </div>

      {/* Description */}
      <label className="block space-y-2">
        <span className="text-sm font-medium text-warm-800">Description</span>
        <textarea
          name="description"
          defaultValue={category?.description || ""}
          rows={3}
          className="w-full resize-y rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
        />
      </label>

      {/* Image Upload Area */}
      <div className="space-y-4 pt-4 border-t border-warm-100">
        <h3 className="font-semibold text-warm-900 font-heading">Category Image</h3>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex-1 w-full space-y-3">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-warm-800">Browse Image (Local)</span>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="w-full rounded-xl border border-warm-200 bg-white px-4 py-2 text-sm text-warm-900 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-warm-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-warm-700 hover:file:bg-warm-200"
              />
            </label>
            <p className="text-xs text-warm-500">
              Select a cover photo for this category. The image will be safely uploaded to Supabase upon clicking save.
            </p>
          </div>
          
          <div className="h-32 w-48 shrink-0 overflow-hidden rounded-xl border border-warm-200 bg-warm-50 flex items-center justify-center">
            {previewImage ? (
               // eslint-disable-next-line @next/next/no-img-element
              <img src={previewImage} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-warm-400">No Image</span>
            )}
          </div>
        </div>
      </div>

      <div className="pt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-warm-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-warm-800 disabled:cursor-not-allowed disabled:bg-warm-400"
        >
          {isSubmitting ? "Saving & Uploading..." : isEditing ? "Update Category" : "Create Category"}
        </button>
      </div>
    </form>
  );
}
