"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteProduct } from "@/lib/actions/product-actions";

type Props = {
  productId: string;
  productName: string;
  hasSales: boolean;
};

export function DeleteProductButton({ productId, productName, hasSales }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmationMessage = hasSales
      ? `Delete "${productName}"?\n\nThis product has already been sold, so it will be archived instead of permanently deleted. It will be hidden from the storefront and POS, but kept for order reference.`
      : `Delete "${productName}"?\n\nThis will permanently remove the product, its market data, its image records, and its stored product images. This action cannot be undone.`;

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteProduct(productId);
        window.alert(result.message);
        router.refresh();
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Failed to delete product.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? "Deleting..." : hasSales ? "Archive" : "Delete"}
    </button>
  );
}
