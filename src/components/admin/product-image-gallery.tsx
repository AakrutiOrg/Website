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

  function handleDelete(imageId: string, storagePath: string) {
    if (confirm("Are you sure you want to delete this image?")) {
      startTransition(() => {
        deleteProductImage(imageId, storagePath, productId);
      });
    }
  }

  function handleSetPrimary(imageId: string, storagePath: string) {
    startTransition(() => {
      setPrimaryImage(productId, imageId, storagePath);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {images.map((image) => {
          const publicUrl = supabase.storage.from("product-images").getPublicUrl(image.storage_path).data.publicUrl;

          return (
            <div
              key={image.id}
              className={`group relative aspect-square overflow-hidden rounded-2xl border-2 ${
                image.is_primary ? "border-brass-500" : "border-warm-200"
              } bg-warm-100`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={publicUrl}
                alt="Product feature"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              
              {image.is_primary && (
                <div className="absolute left-2 top-2 rounded-md bg-brass-600 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                  Primary
                </div>
              )}

              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-warm-900/60 opacity-0 transition group-hover:opacity-100">
                {!image.is_primary && (
                  <button
                    disabled={isPending}
                    onClick={() => handleSetPrimary(image.id, image.storage_path)}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-warm-900 hover:bg-warm-100"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  disabled={isPending}
                  onClick={() => handleDelete(image.id, image.storage_path)}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}

        <ImageUploader productId={productId} />
      </div>
    </div>
  );
}
