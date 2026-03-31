"use client";

import { useState, useTransition } from "react";
import { fulfillOrder, cancelOrder } from "@/lib/actions/order-actions";
import type { DeliveryType } from "@/types";

type Props = {
  orderDbId: string;
};

export function OrderActionButtons({ orderDbId }: Props) {
  const [dialog, setDialog] = useState<"fulfill" | "cancel" | null>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("tracked");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCompany, setShippingCompany] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function closeDialog() {
    setDialog(null);
    setError(null);
    setTrackingNumber("");
    setShippingCompany("");
    setTrackingUrl("");
    setCancelReason("");
    setDeliveryType("tracked");
  }

  function handleFulfill() {
    setError(null);
    startTransition(async () => {
      try {
        await fulfillOrder(
          orderDbId,
          deliveryType,
          deliveryType === "tracked" ? trackingNumber : null,
          deliveryType === "tracked" ? shippingCompany || null : null,
          deliveryType === "tracked" ? trackingUrl || null : null,
        );
        closeDialog();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fulfil order.");
      }
    });
  }

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      try {
        await cancelOrder(orderDbId, cancelReason);
        closeDialog();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to cancel order.");
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setDialog("fulfill")}
          className="rounded-xl bg-brass-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brass-700"
        >
          Mark as Fulfilled
        </button>
        <button
          onClick={() => setDialog("cancel")}
          className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:border-red-400"
        >
          Cancel Order
        </button>
      </div>

      {/* Backdrop */}
      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-warm-900/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeDialog(); }}
        >
          {/* ── Fulfil Dialog ── */}
          {dialog === "fulfill" && (
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-warm-200">
              <div className="border-b border-warm-100 px-6 py-4">
                <h3 className="font-heading text-lg font-semibold text-warm-900">Mark as Fulfilled</h3>
                <p className="mt-1 text-sm text-warm-500">
                  An email notification will be sent to the customer.
                </p>
              </div>

              <div className="space-y-4 px-6 py-5">
                <fieldset>
                  <legend className="mb-3 text-sm font-semibold text-warm-800">Delivery Method</legend>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-warm-200 px-4 py-3 transition hover:border-brass-400 has-[:checked]:border-brass-500 has-[:checked]:bg-brass-50">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="tracked"
                        checked={deliveryType === "tracked"}
                        onChange={() => setDeliveryType("tracked")}
                        className="accent-brass-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-warm-900">Tracked Delivery</p>
                        <p className="text-xs text-warm-500">Provide a tracking number for the shipment</p>
                      </div>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-warm-200 px-4 py-3 transition hover:border-brass-400 has-[:checked]:border-brass-500 has-[:checked]:bg-brass-50">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="home_delivery"
                        checked={deliveryType === "home_delivery"}
                        onChange={() => setDeliveryType("home_delivery")}
                        className="accent-brass-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-warm-900">Home Delivery</p>
                        <p className="text-xs text-warm-500">Our team will arrange delivery directly</p>
                      </div>
                    </label>
                  </div>
                </fieldset>

                {deliveryType === "tracked" && (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-warm-800">
                        Shipping Company
                      </label>
                      <input
                        type="text"
                        value={shippingCompany}
                        onChange={(e) => setShippingCompany(e.target.value)}
                        placeholder="e.g. Royal Mail, DHL, FedEx"
                        className="w-full rounded-xl border border-warm-200 px-4 py-2.5 text-sm text-warm-900 outline-none transition focus:border-brass-400 focus:ring-2 focus:ring-brass-200"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-warm-800">
                        Tracking Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="e.g. RM123456789GB"
                        className="w-full rounded-xl border border-warm-200 px-4 py-2.5 text-sm text-warm-900 outline-none transition focus:border-brass-400 focus:ring-2 focus:ring-brass-200"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-warm-800">
                        Tracking Page URL
                      </label>
                      <input
                        type="url"
                        value={trackingUrl}
                        onChange={(e) => setTrackingUrl(e.target.value)}
                        placeholder="e.g. https://www.royalmail.com/track-your-item"
                        className="w-full rounded-xl border border-warm-200 px-4 py-2.5 text-sm text-warm-900 outline-none transition focus:border-brass-400 focus:ring-2 focus:ring-brass-200"
                      />
                      <p className="mt-1 text-xs text-warm-400">The tracking number in the customer email will link to this page.</p>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-200">{error}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-warm-100 px-6 py-4">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={isPending}
                  className="rounded-xl border border-warm-200 px-4 py-2 text-sm font-medium text-warm-700 hover:bg-warm-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFulfill}
                  disabled={isPending || (deliveryType === "tracked" && !trackingNumber.trim())}
                  className="rounded-xl bg-brass-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brass-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? "Processing…" : "Confirm Fulfilment"}
                </button>
              </div>
            </div>
          )}

          {/* ── Cancel Dialog ── */}
          {dialog === "cancel" && (
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-warm-200">
              <div className="border-b border-warm-100 px-6 py-4">
                <h3 className="font-heading text-lg font-semibold text-warm-900">Cancel Order</h3>
                <p className="mt-1 text-sm text-warm-500">
                  The customer will be notified by email with the reason.
                </p>
              </div>

              <div className="space-y-4 px-6 py-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-warm-800">
                    Cancellation Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Item is out of stock, customer requested cancellation…"
                    rows={4}
                    className="w-full rounded-xl border border-warm-200 px-4 py-2.5 text-sm text-warm-900 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100 resize-none"
                  />
                </div>

                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-200">{error}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-warm-100 px-6 py-4">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={isPending}
                  className="rounded-xl border border-warm-200 px-4 py-2 text-sm font-medium text-warm-700 hover:bg-warm-50 transition"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isPending || !cancelReason.trim()}
                  className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? "Processing…" : "Confirm Cancellation"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
