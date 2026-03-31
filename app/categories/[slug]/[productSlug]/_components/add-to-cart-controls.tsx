"use client";

import { useState } from "react";

import { useCart } from "@/components/providers/cart-provider";

type AddToCartControlsProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    categorySlug: string;
    imageUrl: string | null;
    price: number | null;
    currency: string;
    stockQuantity: number;
    size?: string | null;
    color?: string | null;
  };
};

export function AddToCartControls({ product }: AddToCartControlsProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState("");

  const maxQuantity = Math.max(product.stockQuantity, 1);
  const isOutOfStock = product.stockQuantity <= 0;

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const increaseQuantity = () => {
    setQuantity((current) => Math.min(maxQuantity, current + 1));
  };

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      categorySlug: product.categorySlug,
      imageUrl: product.imageUrl,
      price: product.price,
      currency: product.currency,
      quantity,
      stockQuantity: product.stockQuantity,
      size: product.size ?? null,
      color: product.color ?? null,
    });

    setAddedMessage(`${quantity} item${quantity > 1 ? "s" : ""} added to cart`);
    window.setTimeout(() => setAddedMessage(""), 2200);
  };

  return (
    <div className="mt-10 space-y-4 border-t border-warm-700/70 pt-8">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-brass-400">Quantity</p>
          <div className="inline-flex items-center border border-warm-600 bg-warm-900/40">
            <button
              type="button"
              onClick={decreaseQuantity}
              className="inline-flex h-12 w-12 items-center justify-center text-lg text-warm-100 transition-colors hover:bg-warm-50/10"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="inline-flex min-w-14 items-center justify-center text-base font-medium text-warm-50">
              {quantity}
            </span>
            <button
              type="button"
              onClick={increaseQuantity}
              className="inline-flex h-12 w-12 items-center justify-center text-lg text-warm-100 transition-colors hover:bg-warm-50/10"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="inline-flex items-center gap-2 border border-brass-500 bg-brass-500 px-7 py-3 text-sm font-medium uppercase tracking-[0.15em] text-warm-900 transition-colors hover:border-brass-400 hover:bg-brass-400 disabled:cursor-not-allowed disabled:border-warm-700 disabled:bg-warm-700 disabled:text-warm-300"
        >
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        {!isOutOfStock && (
          <p className="text-warm-300">
            Available stock: <span className="font-semibold text-warm-100">{product.stockQuantity}</span>
          </p>
        )}
        {addedMessage && <p className="font-medium text-brass-300">{addedMessage}</p>}
      </div>
    </div>
  );
}
