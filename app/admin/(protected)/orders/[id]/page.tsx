import { notFound } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/types";
import { OrderActionButtons } from "./_components/order-action-buttons";
import { DeleteOrderButton } from "./_components/delete-order-button";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-800" },
  contacted: { label: "Contacted", className: "bg-purple-100 text-purple-800" },
  fulfilled: { label: "Fulfilled", className: "bg-brass-100 text-brass-700" },
  closed: { label: "Closed", className: "bg-warm-200 text-warm-700" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};


type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_id", id)
    .single<Order>();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_db_id", order.id)
    .returns<OrderItem[]>();

  const badge = STATUS_BADGE[order.status] ?? { label: order.status, className: "bg-warm-100 text-warm-700" };

  const shippingParts = [
    order.address_line1,
    order.address_line2,
    order.city,
    order.state,
    order.postal_code,
    order.country,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/orders"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-warm-500 transition hover:text-brass-600"
          >
            ← Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-2xl font-semibold text-warm-900 font-mono">
              {order.order_id}
            </h2>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-warm-500">
            Placed on{" "}
            {new Date(order.created_at).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <OrderActionButtons
          orderDbId={order.id}
          invoiceSentAt={order.invoice_sent_at ?? null}
          hasEmail={!!order.email}
          saleChannel={order.sale_channel}
          status={order.status}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: customer + items */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer details */}
          <section className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-heading text-base font-semibold text-warm-900">Customer</h3>
            <dl className="grid gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-warm-400">Name</dt>
                <dd className="mt-1 text-sm font-medium text-warm-900">{order.customer_name}</dd>
              </div>
              {order.email && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-warm-400">Email</dt>
                  <dd className="mt-1 text-sm text-warm-700">
                    <a href={`mailto:${order.email}`} className="hover:text-brass-600 transition">{order.email}</a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-warm-400">Phone</dt>
                <dd className="mt-1 text-sm text-warm-700">
                  <a href={`tel:${order.phone}`} className="hover:text-brass-600 transition">{order.phone}</a>
                </dd>
              </div>
              {shippingParts.length > 0 && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-warm-400">Shipping Address</dt>
                  <dd className="mt-1 text-sm leading-6 text-warm-700 whitespace-pre-line">
                    {shippingParts.join("\n")}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Order items */}
          <section className="rounded-2xl border border-warm-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-warm-100 px-6 py-4">
              <h3 className="font-heading text-base font-semibold text-warm-900">
                Items ({order.total_items})
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-warm-50 border-b border-warm-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-400">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-400">Details</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-warm-400">Qty</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-warm-400">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {(items ?? []).map((item) => {
                  const variant = item.selected_variant_json;
                  const details = [
                    variant?.size ? `Size: ${variant.size}` : null,
                    variant?.color ? `Colour: ${variant.color}` : null,
                  ].filter(Boolean).join(" · ");

                  return (
                    <tr key={item.id} className="hover:bg-warm-50/50">
                      <td className="px-6 py-4 font-medium text-warm-900">{item.product_name_snapshot}</td>
                      <td className="px-6 py-4 text-warm-500">{details || "—"}</td>
                      <td className="px-6 py-4 text-right text-warm-700">{item.quantity}</td>
                      <td className="px-6 py-4 text-right text-warm-700">
                        {item.unit_price_snapshot != null
                          ? `£${item.unit_price_snapshot.toFixed(2)}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {order.subtotal != null && (() => {
                const hasDiscount = order.discount_amount != null && order.discount_amount > 0 && order.discount_type != null;
                const gross = hasDiscount
                  ? order.discount_type === "percentage"
                    ? order.subtotal / (1 - order.discount_amount! / 100)
                    : order.subtotal + order.discount_amount!
                  : order.subtotal;
                const saving = hasDiscount ? gross - order.subtotal : 0;

                return (
                  <tfoot>
                    {hasDiscount && (
                      <>
                        <tr className="border-t-2 border-warm-200 bg-warm-50">
                          <td colSpan={3} className="px-6 py-3 text-right text-sm text-warm-500">Gross Total</td>
                          <td className="px-6 py-3 text-right text-sm text-warm-500">
                            £{gross.toFixed(2)}
                          </td>
                        </tr>
                        <tr className="bg-warm-50">
                          <td colSpan={3} className="px-6 py-2 text-right text-sm text-green-700">
                            Discount
                            {order.discount_type === "percentage"
                              ? ` (${order.discount_amount}%)`
                              : " (fixed)"}
                          </td>
                          <td className="px-6 py-2 text-right text-sm font-medium text-green-700">
                            −£{saving.toFixed(2)}
                          </td>
                        </tr>
                      </>
                    )}
                    <tr className={`bg-warm-50 ${hasDiscount ? "border-t border-warm-200" : "border-t-2 border-warm-200"}`}>
                      <td colSpan={3} className="px-6 py-3 text-right text-sm font-semibold text-warm-700">
                        {hasDiscount ? "Total Paid" : "Subtotal"}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-bold text-warm-900">
                        £{order.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                );
              })()}
            </table>
          </section>
        </div>

        {/* Right column: status details */}
        <div className="space-y-6">
          {/* Workflow Status */}
          <section className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-heading text-base font-semibold text-warm-900">Workflow Timeline</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brass-500 text-white">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
                       <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                    </svg>
                  </div>
                  <div className="w-px flex-1 bg-warm-200 my-1"></div>
                </div>
                <div className="pb-4">
                  <p className="text-sm font-semibold text-warm-900">Order Placed</p>
                  <p className="text-xs text-warm-500">{new Date(order.created_at).toLocaleString("en-GB")}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${order.invoice_sent_at ? "bg-brass-500 text-white" : "border-2 border-warm-200 bg-white text-transparent"}`}>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
                       <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                    </svg>
                  </div>
                  <div className={`w-px flex-1 ${order.invoice_sent_at && order.status !== 'cancelled' ? "bg-warm-200" : "bg-transparent"} my-1`}></div>
                </div>
                <div className="pb-4">
                  <p className={`text-sm font-semibold ${order.invoice_sent_at ? "text-warm-900" : "text-warm-400"}`}>Invoice Sent</p>
                  {order.invoice_sent_at && <p className="text-xs text-warm-500">{new Date(order.invoice_sent_at).toLocaleString("en-GB")}</p>}
                </div>
              </div>

              {order.status !== 'cancelled' ? (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${order.fulfilled_at ? "bg-brass-500 text-white" : "border-2 border-warm-200 bg-white text-transparent"}`}>
                      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${order.fulfilled_at ? "text-warm-900" : "text-warm-400"}`}>Fulfilled</p>
                    {order.fulfilled_at && <p className="text-xs text-warm-500">{new Date(order.fulfilled_at).toLocaleString("en-GB")}</p>}
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4.22 4.22a.75.75 0 0 1 1.06 0L8 6.94l2.72-2.72a.75.75 0 1 1 1.06 1.06L9.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L8 9.06l-2.72 2.72a.75.75 0 0 1-1.06-1.06L6.94 8 4.22 5.28a.75.75 0 0 1 0-1.06Z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-700">Cancelled</p>
                    {order.cancelled_at && <p className="text-xs text-red-500">{new Date(order.cancelled_at).toLocaleString("en-GB")}</p>}
                  </div>
                </div>
              )}
            </div>
          </section>
          {order.status === "fulfilled" && (
            <section className="rounded-2xl border border-brass-200 bg-brass-50 p-6">
              <h3 className="mb-3 font-heading text-base font-semibold text-brass-800">Fulfilment</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-brass-600">Method</dt>
                  <dd className="mt-1 text-sm text-brass-900 font-medium">
                    {order.delivery_type === "tracked" ? "Tracked Delivery" : "Home Delivery"}
                  </dd>
                </div>
                {order.shipping_company && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-brass-600">Shipping Company</dt>
                    <dd className="mt-1 text-sm font-medium text-brass-900">{order.shipping_company}</dd>
                  </div>
                )}
                {order.tracking_number && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-brass-600">Tracking Number</dt>
                    <dd className="mt-1 text-sm font-mono font-semibold text-brass-900">
                      {order.tracking_url ? (
                        <a
                          href={order.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-brass-600 transition"
                        >
                          {order.tracking_number}
                        </a>
                      ) : (
                        order.tracking_number
                      )}
                    </dd>
                  </div>
                )}
                {order.tracking_url && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-brass-600">Tracking Page</dt>
                    <dd className="mt-1 text-xs">
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-brass-600 underline hover:text-brass-700 transition"
                      >
                        {order.tracking_url}
                      </a>
                    </dd>
                  </div>
                )}
                {order.fulfilled_at && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-brass-600">Fulfilled On</dt>
                    <dd className="mt-1 text-sm text-brass-900">
                      {new Date(order.fulfilled_at).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* Cancellation info */}
          {order.status === "cancelled" && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h3 className="mb-3 font-heading text-base font-semibold text-red-800">Cancellation</h3>
              <dl className="space-y-2">
                {order.cancellation_reason && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-red-600">Reason</dt>
                    <dd className="mt-1 text-sm text-red-900 leading-6">{order.cancellation_reason}</dd>
                  </div>
                )}
                {order.cancelled_at && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-red-600">Cancelled On</dt>
                    <dd className="mt-1 text-sm text-red-900">
                      {new Date(order.cancelled_at).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* Invoice info */}
          {order.invoice_sent_at && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h3 className="mb-3 font-heading text-base font-semibold text-amber-800">Invoice</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-amber-600">Sent On</dt>
                  <dd className="mt-1 text-sm font-medium text-amber-900">
                    {new Date(order.invoice_sent_at).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </dd>
                </div>
                {order.discount_amount != null && order.discount_amount > 0 && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-amber-600">Discount Applied</dt>
                    <dd className="mt-1 text-sm font-medium text-amber-900">
                      {order.discount_type === "percentage"
                        ? `${order.discount_amount}%`
                        : `£${order.discount_amount.toFixed(2)}`}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* Order meta */}
          <section className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 font-heading text-base font-semibold text-warm-900">Order Info</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-warm-400">Channel</dt>
                <dd className="mt-1 text-sm font-medium capitalize text-warm-900">
                  {order.sale_channel === "pos" ? "POS" : "Online"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-warm-400">Payment Method</dt>
                <dd className="mt-1 text-sm font-medium text-warm-900">
                  {order.payment_method ? order.payment_method.replaceAll("_", " ") : "Not captured"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-warm-400">Payment Status</dt>
                <dd className="mt-1">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    order.payment_status === "paid"
                      ? "bg-brass-100 text-brass-700"
                      : order.payment_status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                  }`}>
                    {order.payment_status}
                  </span>
                </dd>
              </div>
              {order.paid_at && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-warm-400">Paid On</dt>
                  <dd className="mt-1 text-sm text-warm-700">
                    {new Date(order.paid_at).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-warm-400">Invoice</dt>
                <dd className="mt-1">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    order.invoice_sent_at
                      ? "bg-amber-100 text-amber-700"
                      : "bg-warm-100 text-warm-500"
                  }`}>
                    {order.invoice_sent_at ? "Sent" : "Not sent"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-warm-400">Email Status</dt>
                <dd className="mt-1">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    order.email_status === "sent"
                      ? "bg-brass-100 text-brass-700"
                      : order.email_status === "failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {order.email_status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-warm-400">Last Updated</dt>
                <dd className="mt-1 text-sm text-warm-700">
                  {new Date(order.updated_at).toLocaleDateString("en-GB", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <DeleteOrderButton orderDbId={order.id} />
      </div>
    </div>
  );
}
