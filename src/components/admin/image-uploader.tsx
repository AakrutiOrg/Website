"use client";

import { useState } from "react";
import { uploadProductImage } from "@/lib/actions/product-image-actions";

type ImageUploaderProps = {
  productId: string;
};

export function ImageUploader({ productId }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError("Image must be smaller than 15MB.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setProgress(30);

    try {
      const formData = new FormData();
      formData.set("productId", productId);
      formData.set("image", file);
      setProgress(70);
      await uploadProductImage(formData);
      setProgress(100);

      event.target.value = "";
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs font-medium text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 text-xs font-bold text-red-800 hover:text-red-900 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <label className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-6 text-center transition-all duration-200
        ${isUploading
          ? "border-brass-400 bg-brass-50 cursor-wait"
          : "border-warm-300 bg-warm-50 hover:border-brass-400 hover:bg-brass-50/40"
        }`}
      >
        {isUploading ? (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass-200 border-t-brass-600" />
            <span className="text-sm font-medium text-brass-700">Uploading…</span>
            {/* Progress bar */}
            <div className="w-full max-w-[160px] overflow-hidden rounded-full bg-warm-200 h-1.5">
              <div
                className="h-full rounded-full bg-brass-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-100 text-brass-500 text-xl">
              +
            </div>
            <div>
              <span className="block text-sm font-semibold text-warm-800">Add Image</span>
              <span className="block text-xs text-warm-400 mt-0.5">PNG, JPG, GIF, WebP · up to 15 MB source</span>
            </div>
          </>
        )}

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
