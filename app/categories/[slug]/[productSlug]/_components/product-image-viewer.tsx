"use client";

import { useEffect, useState } from "react";

type ProductImageViewerItem = {
  id: string;
  url: string;
  is_primary: boolean;
};

type ProductImageViewerProps = {
  images: ProductImageViewerItem[];
  productName: string;
};

export function ProductImageViewer({ images, productName }: ProductImageViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIndex === null) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLightboxIndex(null);
        return;
      }

      if (event.key === "ArrowRight") {
        setLightboxIndex((current) => (current === null ? 0 : (current + 1) % images.length));
      }

      if (event.key === "ArrowLeft") {
        setLightboxIndex((current) =>
          current === null ? 0 : (current - 1 + images.length) % images.length,
        );
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [images.length, lightboxIndex]);

  if (images.length === 0) {
    return (
      <div className="relative overflow-hidden border border-warm-200 bg-white shadow-sm">
        <div className="bg-craft-texture aspect-[4/5] w-full opacity-70" />
      </div>
    );
  }

  const activeImage = images[activeIndex] ?? images[0];
  const lightboxImage =
    lightboxIndex !== null ? images[lightboxIndex] ?? images[0] : null;

  const showPrevious = () => {
    setLightboxIndex((current) =>
      current === null ? 0 : (current - 1 + images.length) % images.length,
    );
  };

  const showNext = () => {
    setLightboxIndex((current) => (current === null ? 0 : (current + 1) % images.length));
  };

  return (
    <>
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setLightboxIndex(activeIndex)}
          className="group relative block w-full cursor-pointer overflow-hidden border border-warm-200 bg-white shadow-sm"
        >
          <div className="relative aspect-[4/5] bg-warm-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage.url}
              alt={productName}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-warm-900/0 transition-colors duration-200 group-hover:bg-warm-900/10" />
            <div className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-brass-400" />
            <div className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-brass-400" />
            <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-brass-400" />
            <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-brass-400" />
          </div>
        </button>

        {images.length > 1 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`cursor-pointer overflow-hidden border bg-white shadow-sm transition-all ${
                  index === activeIndex
                    ? "border-brass-400"
                    : "border-warm-200 hover:border-brass-300"
                }`}
              >
                <div className="aspect-square bg-warm-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={`${productName} gallery ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl text-white transition-colors hover:bg-white/20"
            aria-label="Close image viewer"
          >
            ×
          </button>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showPrevious();
              }}
              className="absolute left-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl text-white transition-colors hover:bg-white/20"
              aria-label="Previous image"
            >
              ←
            </button>
          )}

          <div
            className="relative max-h-[90vh] max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage.url}
              alt={productName}
              className="max-h-[90vh] w-auto max-w-full object-contain shadow-2xl"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-4 py-2 text-sm text-white">
              {lightboxIndex + 1} / {images.length}
            </div>
          </div>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showNext();
              }}
              className="absolute right-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl text-white transition-colors hover:bg-white/20"
              aria-label="Next image"
            >
              →
            </button>
          )}
        </div>
      )}
    </>
  );
}
