"use client";

import { useTransition } from "react";
import { deleteProductImage, setPrimaryImage } from "@/lib/actions/product-image-actions";
import { ImageUploader } from "./image-uploader";
import { supabase } from "@/lib/supabase/browser";

export type ProductImage = {
  id: string;
  storage_path: string;
  is_primary: boolean;
};

type ProductImageGalleryProps = {
  productId: string;
  images: ProductImage[];
};

export function ProductImageGallery({ productId, images }: ProductImageGalleryProps) {
  const [isPending, startTransition] = useTransition();

  const primaryImage = images.find((img) => img.is_primary);
  const secondaryImages = images.filter((img) => !img.is_primary);

  function getPublicUrl(storagePath: string) {
    return supabase.storage.from("product-images").getPublicUrl(storagePath).data.publicUrl;
  }

  function handleDelete(imageId: string, storagePath: string) {
    if (confirm("Are you sure you want to delete this image?")) {
      startTransition(async () => {
        await deleteProductImage(imageId, storagePath, productId);
      });
    }
  }

  function handleSetPrimary(imageId: string) {
    startTransition(async () => {
      await setPrimaryImage(productId, imageId);
    });
  }

  return (
    <div className={`space-y-4 ${isPending ? "opacity-60 pointer-events-none" : ""} transition-opacity`}>

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-200 bg-warm-50 py-12 text-center">
          <div className="mb-3 flex items-center gap-2 text-brass-300">
            <div className="h-px w-8 bg-brass-200" />
            <span className="text-2xl" aria-hidden="true">◆</span>
            <div className="h-px w-8 bg-brass-200" />
          </div>
          <p className="text-sm font-medium text-warm-600">No images yet</p>
          <p className="mt-1 text-xs text-warm-400">Upload your first image below</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Primary Image — large featured display */}
          {primaryImage && (
            <div className="group relative w-full overflow-hidden rounded-2xl border-2 border-brass-400 bg-warm-100" style={{ aspectRatio: "4/3" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getPublicUrl(primaryImage.storage_path)}
                alt="Primary product image"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />

              {/* Primary badge */}
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-brass-600 px-3 py-1 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">★ Primary</span>
              </div>

              {/* Delete overlay */}
              <div className="absolute inset-0 flex items-end justify-end p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <button
                  disabled={isPending}
                  onClick={() => handleDelete(primaryImage.id, primaryImage.storage_path)}
                  className="rounded-xl bg-red-600/90 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-sm hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Secondary Images — thumbnail strip */}
          {secondaryImages.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {secondaryImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative overflow-hidden rounded-xl border border-warm-200 bg-warm-100 shadow-sm"
                  style={{ width: "100px", height: "100px" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getPublicUrl(image.storage_path)}
                    alt="Product image"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                  />

                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-warm-900/70 opacity-0 transition-opacity duration-200 group-hover:opacity-100 p-2">
                    <button
                      disabled={isPending}
                      onClick={() => handleSetPrimary(image.id)}
                      className="w-full rounded-lg bg-white px-2 py-1.5 text-[10px] font-semibold text-warm-900 hover:bg-brass-50 transition leading-tight"
                    >
                      Set Primary
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => handleDelete(image.id, image.storage_path)}
                      className="w-full rounded-lg bg-red-600 px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-red-700 transition leading-tight"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Zone */}
      <div className="pt-2">
        <ImageUploader productId={productId} />
      </div>

      {isPending && (
        <p className="text-center text-xs font-medium text-brass-600 animate-pulse">Updating gallery…</p>
      )}
    </div>
  );
}
