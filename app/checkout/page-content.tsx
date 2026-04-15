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

export function CheckoutPageContent() {
  const { items, totalAmount, totalItems, clearCart } = useCart();
  const { startLoading, stopLoading } = useGlobalLoading();
  const [form, setForm] = useState(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successOrderId, setSuccessOrderId] = useState("");



  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    startLoading();

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            ...form,
            country: "United Kingdom",
          },
          items,
        }),
      });

      const result = (await response.json()) as { success?: boolean; error?: string; orderId?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to place your order.");
      }

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
      <div className="bg-warm-50">
        <section className="mx-auto max-w-4xl px-6 py-20 sm:px-10">
          <div className="border border-warm-200 bg-white p-10 text-center shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-brass-600">
              Order Sent
            </p>
            <h1 className="font-heading mt-3 text-4xl font-bold text-warm-900">
              Thank you for your enquiry
            </h1>
            <p className="mt-4 text-base leading-8 text-warm-600">
              Your order email has been sent successfully. Your reference is{" "}
              <span className="font-semibold text-warm-900">{successOrderId}</span>.
            </p>
            <Link
              href="/?view=collections"
              className="mt-8 inline-flex items-center gap-2 border border-brass-500 bg-brass-500 px-7 py-3 text-sm font-medium uppercase tracking-[0.15em] text-warm-900 transition-colors hover:border-brass-400 hover:bg-brass-400"
            >
              Explore All Treasures
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-warm-50">
      <section className="relative overflow-hidden bg-warm-900 py-14 sm:py-16 lg:py-20">
        <div className="bg-craft-texture absolute inset-0 opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-warm-900 via-warm-900/95 to-warm-800" />

        <div className="relative mx-auto max-w-6xl px-6 sm:px-10 lg:px-12">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-brass-400">
            Checkout
          </p>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-warm-50 sm:text-5xl">
            Complete your Order Enquiry
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-warm-300 sm:text-lg">
            Share your shipping details and we will email the order request directly to the team.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12">
          <form onSubmit={handleSubmit} className="space-y-6 border border-warm-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="border-b border-warm-100 pb-4">
              <h2 className="font-heading text-3xl font-bold text-warm-900">Customer Details</h2>
              <p className="mt-2 text-sm leading-6 text-warm-600">
                We currently support checkout enquiries for UK shipping addresses.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-warm-800">First Name</span>
                <input
                  required
                  value={form.firstName}
                  onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                  className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-warm-800">Last Name</span>
                <input
                  required
                  value={form.lastName}
                  onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                  className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
                />
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-warm-800">Email</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-warm-800">Phone Number</span>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
                />
              </label>
            </div>

            <div className="border-t border-warm-100 mt-6 pt-6 uppercase tracking-[0.1em] text-xs font-semibold text-brass-600 mb-2">
               Delivery Address
            </div>

              <div className="space-y-6">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-warm-800">Address Line 1</span>
                  <input
                    required
                    value={form.addressLine1}
                    onChange={(event) => setForm((current) => ({ ...current, addressLine1: event.target.value }))}
                    className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-warm-800">Address Line 2</span>
                  <input
                    value={form.addressLine2}
                    onChange={(event) => setForm((current) => ({ ...current, addressLine2: event.target.value }))}
                    className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
                  />
                </label>

                <div className="grid gap-6 sm:grid-cols-3">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-warm-800">Town / City</span>
                    <input
                      required
                      value={form.city}
                      onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                      className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-warm-800">County</span>
                    <input
                      value={form.county}
                      onChange={(event) => setForm((current) => ({ ...current, county: event.target.value }))}
                      className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-warm-800">Postcode</span>
                    <input
                      required
                      value={form.postcode}
                      onChange={(event) => setForm((current) => ({ ...current, postcode: event.target.value.toUpperCase() }))}
                      className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm uppercase text-warm-900 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-100"
                    />
                  </label>
                </div>
              </div>

            <div className="border-t border-warm-100 pt-4">
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-brass-500 bg-brass-500 px-7 py-3 text-sm font-medium uppercase tracking-[0.15em] text-warm-900 transition-colors hover:border-brass-400 hover:bg-brass-400 disabled:cursor-not-allowed disabled:border-warm-300 disabled:bg-warm-200 disabled:text-warm-500"
              >
                {isSubmitting ? "Sending Order..." : "Place Order Enquiry"}
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </form>

          <aside className="h-fit border border-warm-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-brass-600">Summary</p>
            <h2 className="font-heading mt-2 text-3xl font-bold text-warm-900">Your Cart</h2>

            {items.length === 0 ? (
              <div className="mt-6 space-y-4 text-sm text-warm-600">
                <p>Your cart is empty right now.</p>
                <Link
                  href="/?view=collections"
                  className="inline-flex items-center gap-2 text-sm font-medium text-brass-600 transition-colors hover:text-brass-500"
                >
                  Explore All Treasures
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-6 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="border-b border-warm-100 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-warm-900">{item.name}</p>
                          <p className="mt-1 text-sm text-warm-600">Qty {item.quantity}</p>
                          {(item.size || item.color) && (
                            <div className="mt-1 space-y-1 text-sm text-warm-500">
                              {item.size && <p>Size: {item.size}</p>}
                              {item.color && <p>Color: {item.color}</p>}
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-brass-600">
                          {item.price !== null
                            ? formatCurrency((item.price ?? 0) * item.quantity, item.currency)
                            : "Price TBD"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3 border-t border-warm-200 pt-5">
                  <div className="flex items-center justify-between text-sm text-warm-600">
                    <span>Total items</span>
                    <span className="font-medium text-warm-900">{totalItems}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-warm-600">
                    <span>Estimated total</span>
                    <span className="text-lg font-semibold text-brass-600">
                      {items[0] ? formatCurrency(totalAmount, items[0].currency) : "Price TBD"}
                    </span>
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
