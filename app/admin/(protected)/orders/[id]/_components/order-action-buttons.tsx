"use client";

import { useState, useTransition } from "react";
import { fulfillOrder, cancelOrder, sendInvoice, resendOnlineReceiptEmail } from "@/lib/actions/order-actions";
import { resendPosReceiptEmail } from "@/lib/actions/pos-actions";
import type { DeliveryType } from "@/types";

type Props = {
  orderDbId: string;
  invoiceSentAt: string | null;
  hasEmail: boolean;
  saleChannel: string | null;
  status: string;
};

type Dialog = "invoice" | "fulfill" | "cancel" | "preview" | null;

export function OrderActionButtons({ orderDbId, invoiceSentAt, hasEmail, saleChannel, status }: Props) {
  const [dialog, setDialog] = useState<Dialog>(null);

  // Fulfill state
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("tracked");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCompany, setShippingCompany] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  // Cancel state
  const [cancelReason, setCancelReason] = useState("");

  // Invoice state
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "absolute">("none");
  const [discountValue, setDiscountValue] = useState("");

  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isActive = ["pending", "confirmed", "contacted"].includes(status);
  const isPos = saleChannel === "pos";

  function closeDialog() {
    setDialog(null);
    setError(null);
    setResendSuccess(false);
    setTrackingNumber("");
    setShippingCompany("");
    setTrackingUrl("");
    setCancelReason("");
    setDiscountType("none");
    setDiscountValue("");
    setDeliveryType("tracked");
  }

  function handleSendInvoice() {
    setError(null);
    const parsedDiscount = discountType !== "none" && discountValue.trim()
      ? parseFloat(discountValue)
      : null;

    if (parsedDiscount !== null && (isNaN(parsedDiscount) || parsedDiscount <= 0)) {
      setError("Please enter a valid discount value.");
      return;
    }
    if (discountType === "percentage" && parsedDiscount !== null && parsedDiscount > 100) {
      setError("Percentage discount cannot exceed 100%.");
      return;
    }

    startTransition(async () => {
      try {
        await sendInvoice(orderDbId, discountType !== "none" ? discountType : null, parsedDiscount);
        closeDialog();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send invoice.");
      }
    });
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

  function handleResendReceipt() {
    setError(null);
    setResendSuccess(false);
    startTransition(async () => {
      try {
        if (isPos) {
          await resendPosReceiptEmail(orderDbId);
        } else {
          await resendOnlineReceiptEmail(orderDbId);
        }
        setResendSuccess(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to resend receipt.");
      }
    });
  }

  if (!hasEmail && !isActive) return null;

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {/* Preview + Resend receipt — available for any order with email */}
        {hasEmail && (
          <>
            <button
              onClick={() => { setError(null); setResendSuccess(false); setDialog("preview"); }}
              className="rounded-xl border border-warm-200 bg-white px-5 py-2.5 text-sm font-semibold text-warm-700 transition hover:bg-warm-50 hover:border-warm-400 inline-flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              Preview Email
            </button>
            <button
              onClick={handleResendReceipt}
              disabled={isPending}
              className="rounded-xl border border-brass-400 bg-white px-5 py-2.5 text-sm font-semibold text-brass-700 transition hover:bg-brass-50 hover:border-brass-600 disabled:opacity-50 inline-flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              {isPending ? "Sending…" : "Resend Receipt"}
            </button>
          </>
        )}

        {/* Invoice buttons — online active orders only */}
        {hasEmail && !isPos && isActive && (
          <div className="flex items-center gap-3">
            {invoiceSentAt && (
              <a
                href={`/api/admin/orders/${orderDbId}/invoice`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-brass-400 bg-brass-50 px-5 py-2.5 text-sm font-semibold text-brass-700 transition hover:bg-brass-100 hover:border-brass-600 inline-flex items-center"
              >
                View Invoice
              </a>
            )}
            <button
              onClick={() => setDialog("invoice")}
              className="rounded-xl border border-brass-400 bg-white px-5 py-2.5 text-sm font-semibold text-brass-700 transition hover:bg-brass-50 hover:border-brass-600"
            >
              {invoiceSentAt ? "Resend Invoice" : "Send Invoice"}
            </button>
          </div>
        )}

        {/* Fulfil + Cancel — active orders only */}
        {isActive && !isPos && (
          <button
            onClick={() => setDialog("fulfill")}
            className="rounded-xl bg-brass-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brass-700"
          >
            Mark as Fulfilled
          </button>
        )}
        {isActive && (
          <button
            onClick={() => setDialog("cancel")}
            className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:border-red-400"
          >
            Cancel Order
          </button>
        )}
      </div>

      {/* Inline resend feedback (outside modal) */}
      {resendSuccess && !dialog && (
        <p className="mt-2 text-sm text-brass-700 font-medium">Receipt email sent successfully.</p>
      )}
      {error && !dialog && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-warm-900/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeDialog(); }}
        >

          {/* ── Preview Email Dialog ── */}
          {dialog === "preview" && (
            <div className="flex w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl border border-warm-200" style={{ maxHeight: "90vh" }}>
              <div className="flex items-center justify-between border-b border-warm-100 px-6 py-4 shrink-0">
                <div>
                  <h3 className="font-heading text-lg font-semibold text-warm-900">Email Preview</h3>
                  <p className="mt-0.5 text-sm text-warm-500">This is how the receipt email looks to the customer.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleResendReceipt}
                    disabled={isPending}
                    className="rounded-xl bg-brass-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brass-700 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    {isPending ? "Sending…" : "Send Now"}
                  </button>
                  <button onClick={closeDialog} className="rounded-lg p-1.5 text-warm-400 hover:bg-warm-100 hover:text-warm-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              </div>

              {resendSuccess && (
                <div className="shrink-0 mx-6 mt-4 rounded-xl bg-brass-50 border border-brass-200 px-4 py-3 text-sm font-medium text-brass-800">
                  Receipt sent successfully.
                </div>
              )}
              {error && (
                <div className="shrink-0 mx-6 mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <iframe
                src={`/api/admin/orders/${orderDbId}/receipt`}
                className="min-h-0 flex-1 w-full rounded-b-2xl border-0"
                title="Receipt email preview"
              />
            </div>
          )}

          {/* ── Invoice Dialog ── */}
          {dialog === "invoice" && (
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-warm-200">
              <div className="border-b border-warm-100 px-6 py-4">
                <h3 className="font-heading text-lg font-semibold text-warm-900">
                  {invoiceSentAt ? "Resend Invoice" : "Send Invoice"}
                </h3>
                <p className="mt-1 text-sm text-warm-500">
                  {invoiceSentAt
                    ? "A new invoice will be sent to the customer's email address. You may update the discount below."
                    : "An invoice will be sent to the customer's email with item details and payment instructions."}
                </p>
              </div>

              <div className="space-y-5 px-6 py-5">
                <div>
                  <p className="mb-3 text-sm font-semibold text-warm-800">Discount</p>
                  <div className="flex gap-2">
                    {(["none", "percentage", "absolute"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => { setDiscountType(type); setDiscountValue(""); }}
                        className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                          discountType === type
                            ? "border-brass-500 bg-brass-50 text-brass-700"
                            : "border-warm-200 text-warm-600 hover:border-brass-300"
                        }`}
                      >
                        {type === "none" ? "No Discount" : type === "percentage" ? "Percentage %" : "Fixed Amount £"}
                      </button>
                    ))}
                  </div>
                </div>

                {discountType !== "none" && (
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-warm-800">
                      {discountType === "percentage" ? "Discount %" : "Discount Amount (£)"}
                      <span className="text-red-500"> *</span>
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-warm-400">
                        {discountType === "percentage" ? "%" : "£"}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max={discountType === "percentage" ? "100" : undefined}
                        step="0.01"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder={discountType === "percentage" ? "e.g. 10" : "e.g. 25.00"}
                        className="w-full rounded-xl border border-warm-200 py-2.5 pl-8 pr-4 text-sm text-warm-900 outline-none transition focus:border-brass-400 focus:ring-2 focus:ring-brass-200"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-200">{error}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-warm-100 px-6 py-4">
                <button type="button" onClick={closeDialog} disabled={isPending} className="rounded-xl border border-warm-200 px-4 py-2 text-sm font-medium text-warm-700 hover:bg-warm-50 transition">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendInvoice}
                  disabled={isPending}
                  className="rounded-xl bg-brass-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brass-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? "Sending…" : invoiceSentAt ? "Resend Invoice" : "Send Invoice"}
                </button>
              </div>
            </div>
          )}

          {/* ── Fulfil Dialog ── */}
          {dialog === "fulfill" && (
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-warm-200">
              <div className="border-b border-warm-100 px-6 py-4">
                <h3 className="font-heading text-lg font-semibold text-warm-900">Mark as Fulfilled</h3>
                <p className="mt-1 text-sm text-warm-500">An email notification will be sent to the customer.</p>
              </div>

              <div className="space-y-4 px-6 py-5">
                <fieldset>
                  <legend className="mb-3 text-sm font-semibold text-warm-800">Delivery Method</legend>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-warm-200 px-4 py-3 transition hover:border-brass-400 has-[:checked]:border-brass-500 has-[:checked]:bg-brass-50">
                      <input type="radio" name="deliveryType" value="tracked" checked={deliveryType === "tracked"} onChange={() => setDeliveryType("tracked")} className="accent-brass-600" />
                      <div>
                        <p className="text-sm font-medium text-warm-900">Tracked Delivery</p>
                        <p className="text-xs text-warm-500">Provide a tracking number for the shipment</p>
                      </div>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-warm-200 px-4 py-3 transition hover:border-brass-400 has-[:checked]:border-brass-500 has-[:checked]:bg-brass-50">
                      <input type="radio" name="deliveryType" value="home_delivery" checked={deliveryType === "home_delivery"} onChange={() => setDeliveryType("home_delivery")} className="accent-brass-600" />
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
                      <label className="mb-1.5 block text-sm font-semibold text-warm-800">Shipping Company</label>
                      <input type="text" value={shippingCompany} onChange={(e) => setShippingCompany(e.target.value)} placeholder="e.g. Royal Mail, DHL, FedEx" className="w-full rounded-xl border border-warm-200 px-4 py-2.5 text-sm text-warm-900 outline-none transition focus:border-brass-400 focus:ring-2 focus:ring-brass-200" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-warm-800">
                        Tracking Number <span className="text-red-500">*</span>
                      </label>
                      <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. RM123456789GB" className="w-full rounded-xl border border-warm-200 px-4 py-2.5 text-sm text-warm-900 outline-none transition focus:border-brass-400 focus:ring-2 focus:ring-brass-200" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-warm-800">Tracking Page URL</label>
                      <input type="url" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="e.g. https://www.royalmail.com/track-your-item" className="w-full rounded-xl border border-warm-200 px-4 py-2.5 text-sm text-warm-900 outline-none transition focus:border-brass-400 focus:ring-2 focus:ring-brass-200" />
                      <p className="mt-1 text-xs text-warm-400">The tracking number in the customer email will link to this page.</p>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-200">{error}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-warm-100 px-6 py-4">
                <button type="button" onClick={closeDialog} disabled={isPending} className="rounded-xl border border-warm-200 px-4 py-2 text-sm font-medium text-warm-700 hover:bg-warm-50 transition">
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
                <p className="mt-1 text-sm text-warm-500">The customer will be notified by email with the reason.</p>
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
                <button type="button" onClick={closeDialog} disabled={isPending} className="rounded-xl border border-warm-200 px-4 py-2 text-sm font-medium text-warm-700 hover:bg-warm-50 transition">
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
