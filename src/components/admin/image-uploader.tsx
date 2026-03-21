"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/browser";
import { addProductImage } from "@/lib/actions/product-image-actions";

type ImageUploaderProps = {
  productId: string;
};

export function ImageUploader({ productId }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError("Image must be smaller than 5MB.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      await addProductImage(productId, fileName);
      
      // Reset input
      event.target.value = "";
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-200 bg-warm-50 py-10 transition hover:bg-warm-100 opacity-60 hover:opacity-100">
        <span className="text-sm font-medium text-warm-700">
          {isUploading ? "Uploading..." : "Click to upload an image"}
        </span>
        <span className="mt-1 text-xs text-warm-500">
          PNG, JPG, GIF up to 5MB
        </span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>
    </div>
  );
}
