"use client";

import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/providers/cart-provider";
import { useGlobalLoading } from "@/components/providers/global-loading-provider";
import { formatCurrency } from "@/lib/utils";

type CheckoutState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  county: string;
  postcode: string;
};

const INITIAL_STATE: CheckoutState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  county: "",
  postcode: "",
};

const INPUT_CLS =
  "w-full border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-1 focus:ring-brass-100";

export function CheckoutPageContent() {
  const { items, totalAmount, totalItems, clearCart } = useCart();
  const { startLoading, stopLoading } = useGlobalLoading();
  const [form, setForm] = useState(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successOrderId, setSuccessOrderId] = useState("");

  const set = (key: keyof CheckoutState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((c) => ({ ...c, [key]: e.target.value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (items.length === 0) { setError("Your cart is empty."); return; }

    setIsSubmitting(true);
    setError("");
    startLoading();

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: { ...form, country: "United Kingdom" }, items }),
      });
      const result = (await response.json()) as { success?: boolean; error?: string; orderId?: string };
      if (!response.ok || !result.success) throw new Error(result.error || "Unable to place your order.");
      setSuccessOrderId(result.orderId || "");
      clearCart();
      setForm(INITIAL_STATE);
      stopLoading();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to place your order.");
      stopLoading();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successOrderId) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-2xl px-6 py-16 sm:px-10 text-center">
          <div className="border border-warm-100 bg-warm-50 p-10">
            <span className="text-3xl text-brass-400" aria-hidden="true">✦</span>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.4em] text-brass-600">
              Order Sent
            </p>
            <h1 className="font-heading mt-3 text-3xl font-bold text-warm-900">
              Thank you!
            </h1>
            <p className="mt-3 text-sm leading-6 text-warm-600">
              Your enquiry has been received. Reference:{" "}
              <span className="font-semibold text-warm-900">{successOrderId}</span>
            </p>
            <p className="mt-2 text-xs text-warm-400">
              We will contact you shortly to confirm your order.
            </p>
            <Link
              href="/#collections"
              className="mt-6 inline-flex items-center gap-2 bg-brass-500 px-7 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-warm-900 transition-colors hover:bg-brass-400"
            >
              Browse all Treasures
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Compact header */}
      <div className="border-b border-warm-100 bg-warm-50">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
          <div className="flex items-center justify-between py-4 sm:py-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-brass-600">
                Checkout
              </p>
              <h1 className="font-heading text-xl font-bold text-warm-900 sm:text-2xl">
                Order Enquiry
              </h1>
            </div>
            <Link
              href="/cart"
              className="text-[11px] font-semibold uppercase tracking-[0.15em] text-brass-600 transition-colors hover:text-brass-500"
            >
              ← Back to Cart
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 sm:px-10 sm:py-10 md:grid-cols-[1.1fr_0.9fr] lg:px-12">
        {/* Form */}
        <form onSubmit={handleSubmit} className="border border-warm-100 bg-white p-5 sm:p-6">
          <div className="mb-5 border-b border-warm-100 pb-4">
            <h2 className="font-heading text-lg font-bold text-warm-900 sm:text-xl">
              Customer Details
            </h2>
            <p className="mt-1 text-xs leading-5 text-warm-500">
              We support checkout enquiries for UK shipping addresses.
            </p>
          </div>

          {error && (
            <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Name row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-warm-700">
                  First Name
                </span>
                <input required value={form.firstName} onChange={set("firstName")} className={INPUT_CLS} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-warm-700">
                  Last Name
                </span>
                <input required value={form.lastName} onChange={set("lastName")} className={INPUT_CLS} />
              </label>
            </div>

            {/* Contact row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-warm-700">
                  Email
                </span>
                <input required type="email" value={form.email} onChange={set("email")} className={INPUT_CLS} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-warm-700">
                  Phone
                </span>
                <input required type="tel" value={form.phone} onChange={set("phone")} className={INPUT_CLS} />
              </label>
            </div>

            {/* Address section */}
            <div className="border-t border-warm-100 pt-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-brass-600">
                Delivery Address
              </p>
              <div className="space-y-3">
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-warm-700">
                    Address Line 1
                  </span>
                  <input required value={form.addressLine1} onChange={set("addressLine1")} className={INPUT_CLS} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-warm-700">
                    Address Line 2{" "}
                    <span className="font-normal normal-case tracking-normal text-warm-400">(optional)</span>
                  </span>
                  <input value={form.addressLine2} onChange={set("addressLine2")} className={INPUT_CLS} />
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-warm-700">
                      Town / City
                    </span>
                    <input required value={form.city} onChange={set("city")} className={INPUT_CLS} />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-warm-700">
                      County
                    </span>
                    <input value={form.county} onChange={set("county")} className={INPUT_CLS} />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-warm-700">
                      Postcode
                    </span>
                    <input
                      required
                      value={form.postcode}
                      onChange={(e) =>
                        setForm((c) => ({ ...c, postcode: e.target.value.toUpperCase() }))
                      }
                      className={`${INPUT_CLS} uppercase`}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="border-t border-warm-100 pt-4">
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="inline-flex items-center gap-2 bg-brass-500 px-7 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-warm-900 transition-colors hover:bg-brass-400 disabled:cursor-not-allowed disabled:bg-warm-200 disabled:text-warm-500"
              >
                {isSubmitting ? "Sending..." : "Place Order Enquiry"}
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </form>

        {/* Order summary sidebar */}
        <aside className="h-fit border border-warm-100 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brass-600">
            Your Order
          </p>
          <h2 className="font-heading mt-1.5 text-xl font-bold text-warm-900">
            Order Summary
          </h2>

          {items.length === 0 ? (
            <div className="mt-4 space-y-3 text-sm text-warm-500">
              <p>Your cart is empty.</p>
              <Link
                href="/#collections"
                className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brass-600 transition-colors hover:text-brass-500"
              >
                Browse Treasures →
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-4 divide-y divide-warm-50">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    {/* Product thumbnail */}
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-warm-100 bg-warm-50">
                      {item.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="text-xs text-brass-200" aria-hidden="true">✦</span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-5 text-warm-900">{item.name}</p>
                      <p className="mt-0.5 text-xs text-warm-500">Qty: {item.quantity}</p>
                      {(item.size || item.color) && (
                        <div className="mt-0.5 text-xs text-warm-400">
                          {item.size && <span>Size: {item.size}</span>}
                          {item.color && <span className="ml-2">Color: {item.color}</span>}
                        </div>
                      )}
                    </div>
                    <p className="shrink-0 text-sm font-bold text-brass-600">
                      {item.price !== null
                        ? formatCurrency((item.price ?? 0) * item.quantity, item.currency)
                        : "TBD"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 border-t border-warm-100 pt-4">
                <div className="flex items-center justify-between text-sm text-warm-600">
                  <span>Total items</span>
                  <span className="font-medium text-warm-900">{totalItems}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-warm-600">Estimated total</span>
                  <span className="text-base font-bold text-brass-600">
                    {items[0] ? formatCurrency(totalAmount, items[0].currency) : "TBD"}
                  </span>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
