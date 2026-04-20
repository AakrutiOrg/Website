import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/types";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Fulfilled", value: "fulfilled" },
  { label: "Cancelled", value: "cancelled" },
] as const;

const SOURCE_FILTERS = [
  { label: "All sources", value: "" },
  { label: "Online", value: "online" },
  { label: "POS", value: "pos" },
] as const;

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-800" },
  contacted: { label: "Contacted", className: "bg-purple-100 text-purple-800" },
  fulfilled: { label: "Fulfilled", className: "bg-brass-100 text-brass-700" },
  closed: { label: "Closed", className: "bg-warm-200 text-warm-700" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

type OrdersPageProps = {
  searchParams: Promise<{ status?: string; source?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const { status, source } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (source) {
    query = query.eq("sale_channel", source);
  }

  const { data: orders } = await query.returns<Order[]>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-warm-900">Orders</h2>
          <p className="mt-1 text-sm text-warm-500">
            {orders?.length ?? 0} order{(orders?.length ?? 0) !== 1 ? "s" : ""}
            {status ? ` · ${status}` : ""}
            {source ? ` · ${source}` : ""}
          </p>
        </div>
      </div>

      {/* Status + source filter tabs */}
      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((filter) => {
            const href = new URLSearchParams({ ...(filter.value ? { status: filter.value } : {}), ...(source ? { source } : {}) }).toString();
            return (
              <Link
                key={filter.value}
                href={href ? `/admin/orders?${href}` : "/admin/orders"}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  (status ?? "") === filter.value
                    ? "bg-brass-600 text-white"
                    : "border border-warm-200 bg-white text-warm-700 hover:border-brass-400 hover:text-brass-700"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>
        <div className="flex gap-2 flex-wrap">
          {SOURCE_FILTERS.map((filter) => {
            const href = new URLSearchParams({ ...(status ? { status } : {}), ...(filter.value ? { source: filter.value } : {}) }).toString();
            return (
              <Link
                key={filter.value}
                href={href ? `/admin/orders?${href}` : "/admin/orders"}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  (source ?? "") === filter.value
                    ? "bg-warm-800 text-white"
                    : "border border-warm-200 bg-white text-warm-600 hover:border-warm-400 hover:text-warm-800"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-warm-200 bg-white shadow-sm">
        {(orders ?? []).length === 0 ? (
          <div className="p-10 text-center text-sm text-warm-500">
            No orders found{status ? ` with status "${status}"` : ""}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-warm-100 bg-warm-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Order</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Customer</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Items</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">Source</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {(orders ?? []).map((order) => {
                  const badge = STATUS_BADGE[order.status] ?? { label: order.status, className: "bg-warm-100 text-warm-700" };
                  return (
                    <tr key={order.id} className="hover:bg-warm-50/50 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-warm-900">
                        {order.order_id}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-warm-900">{order.customer_name}</p>
                        {order.email && (
                          <p className="text-xs text-warm-500">{order.email}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-warm-700">{order.total_items}</td>
                      <td className="px-5 py-4 text-warm-600">
                        {new Date(order.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {order.sale_channel === "pos" ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            POS
                          </span>
                        ) : (
                          <span className="text-xs text-warm-400">Online</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/orders/${order.order_id}`}
                          className="rounded-lg border border-warm-200 px-3 py-1.5 text-sm font-medium text-warm-700 transition hover:border-brass-400 hover:text-brass-700"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
