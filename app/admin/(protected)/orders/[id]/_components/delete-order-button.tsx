"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteOrder } from "@/lib/actions/order-actions";

type Props = {
  orderDbId: string;
};

export function DeleteOrderButton({ orderDbId }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    const isConfirmed = window.confirm(
      "Are you sure you want to completely delete this order? This action cannot be undone. " +
      "If you just want to track a cancellation, use the Cancel Order button instead. " +
      "(Note: Deleting will NOT automatically restore stock. Use this mainly for cleaning up test orders.)"
    );

    if (isConfirmed) {
      startTransition(async () => {
        try {
          await deleteOrder(orderDbId, false);
          router.push("/admin/orders");
        } catch (e) {
          alert(e instanceof Error ? e.message : "Failed to delete order");
        }
      });
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Deleting...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
          Permanently Delete Order
        </>
      )}
    </button>
  );
}
