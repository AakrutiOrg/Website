"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteOrder } from "@/lib/actions/order-actions";

type Props = {
  orderDbId: string;
};

export function DeleteOrderButton({ orderDbId }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteOrder(orderDbId, false);
        router.push("/admin/orders");
      } catch (e) {
        alert(e instanceof Error ? e.message : "Failed to delete order");
        setShowConfirm(false);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 hover:border-red-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
        Permanently Delete Order
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-warm-900/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !isPending) setShowConfirm(false); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-warm-200">
            <div className="border-b border-warm-100 px-6 py-4">
              <h3 className="font-heading text-lg font-semibold text-warm-900">Delete Order</h3>
              <p className="mt-1 text-sm text-warm-500">
                This action is permanent and cannot be undone.
              </p>
            </div>

            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-warm-700">
                The order record and all its items will be permanently removed from the database.
              </p>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Stock will <strong>not</strong> be restored automatically. If this is a real order, use{" "}
                <span className="font-semibold">Cancel Order</span> instead to keep an audit trail.
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-warm-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="rounded-xl border border-warm-200 px-4 py-2 text-sm font-medium text-warm-700 hover:bg-warm-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete Permanently"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
