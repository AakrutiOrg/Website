"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin";
import { getOptionalSumUpEnv, getResendEnv } from "@/lib/env";
import { getCurrentMarket } from "@/lib/market/resolve-market";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order, OrderItem, PosDeviceTestResult, PosSaleInput, PosSaleResult } from "@/types";

type PosPricedItem = {
  product_id: string;
  name: string;
  slug: string;
  category_slug: string;
  price: number | null;
  stock_quantity: number;
  primary_image_url: string | null;
};

type SumUpTransaction = {
  id: string;
  amount: number;
  currency: string;
  status: "SUCCESSFUL" | "CANCELLED" | "FAILED" | "PENDING";
  transaction_code: string | null;
};

type SumUpReaderStatusResponse = {
  data?: {
    status?: "ONLINE" | "OFFLINE";
    state?: string;
    firmware_version?: string;
    last_activity?: string;
    battery_level?: number;
    connection_type?: string;
  };
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createPosOrderId() {
  const date = new Date();
  const stamp = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AKR-POS-${stamp}-${suffix}`;
}

function validateSumUpEnv() {
  const env = getOptionalSumUpEnv();
  if (!env) {
    throw new Error("SumUp Solo is not configured yet. Add SUMUP_API_KEY, SUMUP_MERCHANT_CODE, and SUMUP_SOLO_READER_ID.");
  }

  if (env.SUMUP_API_KEY.startsWith("sup_pk_")) {
    throw new Error(
      "SUMUP_API_KEY is using a publishable key (`sup_pk_`). The Solo terminal API requires a secret server-side key, typically prefixed `sup_sk_`.",
    );
  }

  if (!env.SUMUP_API_KEY.startsWith("sup_sk_")) {
    throw new Error(
      "SUMUP_API_KEY does not look like a valid SumUp secret key. Please use a server-side SumUp API key with the required reader permissions.",
    );
  }

  if (!/^rdr_[A-Za-z0-9]{26}$/.test(env.SUMUP_SOLO_READER_ID)) {
    throw new Error(
      "SUMUP_SOLO_READER_ID does not look like a valid SumUp Reader ID. It should usually look like `rdr_...`, not a serial number.",
    );
  }

  return env;
}

async function getInlineLogoAttachment() {
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  const logoContent = await readFile(logoPath);

  return {
    content: logoContent.toString("base64"),
    filename: "aakruti-logo.png",
    content_type: "image/png",
    content_id: "aakruti-logo",
    content_disposition: "inline",
  };
}

async function getUkCatalogItems(productIds: string[]) {
  const supabase = createAdminClient();
  const market = await getCurrentMarket("UK");

  const { data, error } = await supabase
    .from("product_catalog_market_view")
    .select("product_id, name, slug, category_slug, price, stock_quantity, primary_image_url")
    .eq("market_id", market.id)
    .in("product_id", productIds);

  if (error) {
    throw new Error(`Could not load POS products: ${error.message}`);
  }

  return {
    market,
    items: (data ?? []) as PosPricedItem[],
  };
}

async function adjustStockForItems(args: {
  orderDbId: string;
  orderRef: string;
  marketId: string;
  items: OrderItem[];
  deltaDirection: "decrement" | "increment";
  changeType: string;
}) {
  const { orderDbId, orderRef, marketId, items, deltaDirection, changeType } = args;
  const supabase = createAdminClient();

  const productQuantities = new Map<string, number>();
  for (const item of items) {
    if (item.product_id) {
      productQuantities.set(item.product_id, (productQuantities.get(item.product_id) ?? 0) + item.quantity);
    }
  }

  const productIds = [...productQuantities.keys()];
  if (productIds.length === 0) {
    return;
  }

  const { data: marketDataRows, error } = await supabase
    .from("product_market_data")
    .select("id, product_id, stock_quantity")
    .eq("market_id", marketId)
    .in("product_id", productIds);

  if (error) {
    throw new Error(`Could not update stock: ${error.message}`);
  }

  const inventoryEvents: {
    source: string;
    product_id: string;
    product_market_data_id: string;
    market_id: string;
    quantity_delta: number;
    change_type: string;
    raw_payload: object;
    processed_at: string;
  }[] = [];

  for (const row of marketDataRows ?? []) {
    const qty = productQuantities.get(row.product_id);
    if (!qty) continue;

    const quantityDelta = deltaDirection === "decrement" ? -qty : qty;
    const nextStock = row.stock_quantity + quantityDelta;

    if (nextStock < 0) {
      throw new Error("One or more items no longer have enough stock to complete this sale.");
    }

    const { error: updateError } = await supabase
      .from("product_market_data")
      .update({ stock_quantity: nextStock })
      .eq("id", row.id);

    if (updateError) {
      throw new Error(`Could not update stock: ${updateError.message}`);
    }

    inventoryEvents.push({
      source: "pos",
      product_id: row.product_id,
      product_market_data_id: row.id,
      market_id: marketId,
      quantity_delta: quantityDelta,
      change_type: changeType,
      raw_payload: { order_db_id: orderDbId, order_ref: orderRef },
      processed_at: new Date().toISOString(),
    });
  }

  if (inventoryEvents.length > 0) {
    await supabase.from("inventory_events").insert(inventoryEvents);
  }
}

function buildPosReceiptEmailHtml(args: {
  orderId: string;
  customerName: string;
  paymentMethod: string;
  subtotal: number;
  discountType?: "percentage" | "absolute" | null;
  discountAmount?: number | null;
  paidAt: string;
  items: (OrderItem & { imageUrl?: string | null })[];
}) {
  const grossTotal = args.items.reduce((sum, item) => sum + (item.unit_price_snapshot ?? 0) * item.quantity, 0);

  let summaryRows = "";
  if (args.discountType && args.discountAmount && args.discountAmount > 0) {
    const savings = args.discountType === "percentage" 
      ? grossTotal * (args.discountAmount / 100)
      : args.discountAmount;
    const discountLabel = args.discountType === "percentage" 
      ? `Discount (${args.discountAmount}%)`
      : `Discount`;

    summaryRows = `
      <tr>
        <td colspan="5" style="padding:14px;border-top:1px solid #e8f5e8;font-size:14px;color:#145018;text-align:right;">Subtotal</td>
        <td style="padding:14px;border-top:1px solid #e8f5e8;font-size:14px;font-weight:700;color:#145018;text-align:right;">£${grossTotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="5" style="padding:14px;padding-top:0;font-size:14px;color:#2e7d32;text-align:right;">${discountLabel}</td>
        <td style="padding:14px;padding-top:0;font-size:14px;font-weight:700;color:#2e7d32;text-align:right;">-£${savings.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="5" style="padding:14px;font-size:16px;font-weight:700;color:#145018;text-align:right;">Total Paid</td>
        <td style="padding:14px;font-size:16px;font-weight:700;color:#145018;text-align:right;">£${args.subtotal.toFixed(2)}</td>
      </tr>
    `;
  } else {
    summaryRows = `
      <tr>
        <td colspan="5" style="padding:14px;border-top:1px solid #e8f5e8;font-size:16px;font-weight:700;color:#145018;text-align:right;">Total Paid</td>
        <td style="padding:14px;border-top:1px solid #e8f5e8;font-size:16px;font-weight:700;color:#145018;text-align:right;">£${args.subtotal.toFixed(2)}</td>
      </tr>
    `;
  }

  const itemRows = args.items
    .map((item) => {
      const variant = [
        item.selected_variant_json?.size ? `Size: ${item.selected_variant_json.size}` : null,
        item.selected_variant_json?.color ? `Colour: ${item.selected_variant_json.color}` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      const unitPrice = item.unit_price_snapshot != null ? `£${item.unit_price_snapshot.toFixed(2)}` : "—";
      const lineTotal =
        item.unit_price_snapshot != null ? `£${(item.unit_price_snapshot * item.quantity).toFixed(2)}` : "—";

      const imgCell = item.imageUrl
        ? `<img src="${item.imageUrl}" alt="${escapeHtml(item.product_name_snapshot)}" width="48" height="48" style="width:48px;height:48px;object-fit:cover;border-radius:4px;display:block;" />`
        : `<div style="width:48px;height:48px;background:#e8f5e8;border-radius:4px;display:flex;align-items:center;justify-content:center;"></div>`;

      return `<tr>
        <td style="padding:14px;border-top:1px solid #e8f5e8;vertical-align:middle;width:48px;">${imgCell}</td>
        <td style="padding:14px;border-top:1px solid #e8f5e8;font-size:14px;line-height:22px;color:#145018;vertical-align:middle;">${escapeHtml(item.product_name_snapshot)}</td>
        <td style="padding:14px;border-top:1px solid #e8f5e8;font-size:13px;line-height:20px;color:#2e7d32;vertical-align:middle;">${variant || "In-store purchase"}</td>
        <td style="padding:14px;border-top:1px solid #e8f5e8;font-size:14px;color:#145018;text-align:center;vertical-align:middle;">${item.quantity}</td>
        <td style="padding:14px;border-top:1px solid #e8f5e8;font-size:14px;color:#145018;text-align:right;vertical-align:middle;">${unitPrice}</td>
        <td style="padding:14px;border-top:1px solid #e8f5e8;font-size:14px;font-weight:700;color:#145018;text-align:right;vertical-align:middle;">${lineTotal}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;background:#f5fbf5;font-family:Segoe UI,Helvetica Neue,Arial,sans-serif;color:#145018;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5fbf5;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:700px;background:#ffffff;border:1px solid #c8e6c8;">
            <tr>
              <td style="background:linear-gradient(135deg,#145018,#6da228);padding:28px 24px;text-align:center;">
                <img src="cid:aakruti-logo" alt="Aakruti" width="150" style="display:block;margin:0 auto 16px auto;width:150px;max-width:100%;height:auto;" />
                <p style="margin:0;font-size:14px;color:#e8f5e8;">POS Receipt</p>
                <p style="margin:8px 0 0 0;font-size:24px;font-weight:700;color:#ffffff;">Order Number: ${escapeHtml(args.orderId)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 24px;">
                <p style="margin:0 0 10px 0;font-size:18px;color:#145018;">Dear ${escapeHtml(args.customerName)},</p>
                <p style="margin:0 0 24px 0;font-size:15px;line-height:28px;color:#2e7d32;">
                  Your payment has been received successfully. Thank you for shopping with Aakruti.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e2f3c0;margin:0 0 24px 0;">
                  <tr>
                    <td style="padding:14px 16px;background:#f4faec;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;">Payment Method</td>
                    <td style="padding:14px 16px;background:#f4faec;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;">Paid On</td>
                    <td style="padding:14px 16px;background:#f4faec;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;text-align:right;">Total</td>
                  </tr>
                  <tr>
                    <td style="padding:16px;font-size:14px;color:#145018;">${escapeHtml(args.paymentMethod)}</td>
                    <td style="padding:16px;font-size:14px;color:#145018;">${escapeHtml(args.paidAt)}</td>
                    <td style="padding:16px;font-size:16px;font-weight:700;color:#145018;text-align:right;">£${args.subtotal.toFixed(2)}</td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e8f5e8;">
                  <tr>
                    <td style="padding:12px 14px;background:#f5fbf5;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;width:56px;"></td>
                    <td style="padding:12px 14px;background:#f5fbf5;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;">Item</td>
                    <td style="padding:12px 14px;background:#f5fbf5;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;">Details</td>
                    <td style="padding:12px 14px;background:#f5fbf5;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;text-align:center;">Qty</td>
                    <td style="padding:12px 14px;background:#f5fbf5;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;text-align:right;">Unit</td>
                    <td style="padding:12px 14px;background:#f5fbf5;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;text-align:right;">Total</td>
                  </tr>
                  ${itemRows}
                  ${summaryRows}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendReceiptEmail(order: Order, items: OrderItem[]) {
  if (!order.email) {
    return;
  }

  const supabase = createAdminClient();
  const productIds = items.map((i) => i.product_id).filter(Boolean) as string[];
  const imageMap = new Map<string, string | null>();

  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("product_catalog_market_view")
      .select("product_id, primary_image_url")
      .in("product_id", productIds);

    for (const p of products ?? []) {
      if (p.primary_image_url) {
        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(p.primary_image_url);
        imageMap.set(p.product_id, publicUrl);
      } else {
        imageMap.set(p.product_id, null);
      }
    }
  }

  const itemsWithImages = items.map((item) => ({
    ...item,
    imageUrl: item.product_id ? (imageMap.get(item.product_id) ?? null) : null,
  }));

  const resendEnv = getResendEnv();
  const logoAttachment = await getInlineLogoAttachment();
  const paidAtLabel = new Date(order.paid_at ?? order.updated_at).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const paymentMethodLabel =
    order.payment_method === "sumup_solo" ? "Card via SumUp Solo" : order.payment_method === "cash" ? "Cash" : "Payment received";

  const { data: checkoutSettings } = await supabase
    .from("checkout_settings")
    .select("admin_bcc_email")
    .eq("id", "default")
    .maybeSingle();

  const bccEmail = checkoutSettings?.admin_bcc_email || resendEnv.RESEND_FROM_EMAIL;

  const html = buildPosReceiptEmailHtml({
    orderId: order.order_id,
    customerName: order.customer_name,
    paymentMethod: paymentMethodLabel,
    subtotal: order.subtotal ?? 0,
    discountType: order.discount_type as "percentage" | "absolute" | null,
    discountAmount: order.discount_amount,
    paidAt: paidAtLabel,
    items: itemsWithImages,
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendEnv.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendEnv.RESEND_FROM_EMAIL,
      to: [order.email],
      bcc: [bccEmail],
      subject: `Aakruti receipt for ${order.order_id}`,
      html,
      text: `Receipt for ${order.order_id}\nPayment method: ${paymentMethodLabel}\nTotal: £${(order.subtotal ?? 0).toFixed(2)}`,
      attachments: [logoAttachment],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Receipt email failed: ${body}`);
  }
}

async function fetchOrderWithItems(orderDbId: string) {
  const supabase = createAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderDbId)
    .single<Order>();

  if (orderError || !order) {
    throw new Error("POS sale not found.");
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_db_id", orderDbId)
    .returns<OrderItem[]>();

  if (itemsError) {
    throw new Error(`Could not load POS sale items: ${itemsError.message}`);
  }

  return { order, items: items ?? [] };
}

async function finalizePosOrderPayment(orderDbId: string) {
  const supabase = createAdminClient();
  const { order, items } = await fetchOrderWithItems(orderDbId);

  if (order.payment_status === "paid") {
    return order;
  }

  const paidAt = new Date().toISOString();
  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      status: "fulfilled",
      paid_at: paidAt,
    })
    .eq("id", orderDbId)
    .select("*")
    .single<Order>();

  if (updateError || !updatedOrder) {
    throw new Error(`Could not finalize POS payment: ${updateError?.message ?? "Unknown error"}`);
  }

  if (updatedOrder.email) {
    try {
      await sendReceiptEmail(updatedOrder, items);
      await supabase.from("orders").update({ email_status: "sent" }).eq("id", orderDbId);
    } catch {
      await supabase.from("orders").update({ email_status: "failed" }).eq("id", orderDbId);
    }
  }

  revalidatePath("/admin/pos");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${updatedOrder.order_id}`);

  return updatedOrder;
}

async function markPosOrderFailed(orderDbId: string) {
  const supabase = createAdminClient();
  const { order, items } = await fetchOrderWithItems(orderDbId);

  if (order.payment_status === "failed") {
    return order;
  }

  if (order.market_id) {
    await adjustStockForItems({
      orderDbId,
      orderRef: order.order_id,
      marketId: order.market_id,
      items,
      deltaDirection: "increment",
      changeType: "pos_payment_released",
    });
  }

  const { data: updatedOrder, error } = await supabase
    .from("orders")
    .update({
      payment_status: "failed",
      status: "cancelled",
    })
    .eq("id", orderDbId)
    .select("*")
    .single<Order>();

  if (error || !updatedOrder) {
    throw new Error(`Could not update failed POS sale: ${error?.message ?? "Unknown error"}`);
  }

  revalidatePath("/admin/pos");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${updatedOrder.order_id}`);

  return updatedOrder;
}

async function createSumUpReaderCheckout(args: {
  orderId: string;
  amount: number;
  currency: string;
}) {
  const env = validateSumUpEnv();

  const response = await fetch(
    `https://api.sumup.com/v0.1/merchants/${env.SUMUP_MERCHANT_CODE}/readers/${env.SUMUP_SOLO_READER_ID}/checkout`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.SUMUP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: `Aakruti POS sale ${args.orderId}`,
        total_amount: {
          currency: args.currency,
          minor_unit: 2,
          value: Math.round(args.amount * 100),
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`SumUp Solo checkout could not be started. ${body}`);
  }

  const data = (await response.json()) as { data?: { client_transaction_id?: string } };
  const clientTransactionId = data.data?.client_transaction_id;

  if (!clientTransactionId) {
    throw new Error("SumUp Solo did not return a client transaction ID.");
  }

  return clientTransactionId;
}

async function fetchSumUpTransactionStatus(clientTransactionId: string) {
  const env = validateSumUpEnv();

  const url = new URL(`https://api.sumup.com/v2.1/merchants/${env.SUMUP_MERCHANT_CODE}/transactions`);
  url.searchParams.set("client_transaction_id", clientTransactionId);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.SUMUP_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Could not check SumUp payment status. ${body}`);
  }

  return (await response.json()) as SumUpTransaction;
}

export async function testSumUpSoloConnection(): Promise<PosDeviceTestResult> {
  await requireAdmin("/admin");

  const testedAt = new Date().toISOString();

  try {
    const env = validateSumUpEnv();
    const response = await fetch(
      `https://api.sumup.com/v0.1/merchants/${env.SUMUP_MERCHANT_CODE}/readers/${env.SUMUP_SOLO_READER_ID}/status`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.SUMUP_API_KEY}`,
          Accept: "application/problem+json, application/json",
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");

      if (response.status === 401) {
        throw new Error(
          "SumUp rejected the device test with 401 Unauthorized. Check that the API key has reader permissions and belongs to the same merchant as the Solo device.",
        );
      }

      if (response.status === 404) {
        throw new Error(
          "SumUp could not find this Solo reader under the configured merchant. The reader ID may be stale, re-paired, or linked to a different merchant account.",
        );
      }

      throw new Error(`SumUp device test failed. ${body}`);
    }

    const data = (await response.json()) as SumUpReaderStatusResponse;
    const status = data.data?.status ?? "UNKNOWN";
    const state = data.data?.state ?? null;
    const firmwareVersion = data.data?.firmware_version ?? null;
    const lastActivity = data.data?.last_activity ?? null;
    const batteryLevel = data.data?.battery_level ?? null;
    const connectionType = data.data?.connection_type ?? null;

    return {
      ok: true,
      message:
        status === "ONLINE"
          ? "Solo reader is reachable and ready for use."
          : "Solo reader responded, but it is currently offline. Power it on and reconnect it before taking card payments.",
      deviceStatus: status,
      readerState: state,
      firmwareVersion,
      lastActivity,
      batteryLevel,
      connectionType,
      testedAt,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "The Solo reader test could not be completed.",
      testedAt,
      deviceStatus: "UNKNOWN",
      readerState: null,
      firmwareVersion: null,
      lastActivity: null,
      batteryLevel: null,
      connectionType: null,
    };
  }
}

export async function createPosSale(input: PosSaleInput): Promise<PosSaleResult> {
  await requireAdmin("/admin/pos");

  const customerName = input.customer.name.trim();
  const customerEmail = input.customer.email.trim().toLowerCase();
  const customerPhone = input.customer.phone.trim();

  if (!customerName || !customerEmail || !customerPhone) {
    return {
      ok: false,
      paymentStatus: "failed",
      message: "Customer name, email, and phone are required for POS checkout.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return {
      ok: false,
      paymentStatus: "failed",
      message: "Please enter a valid customer email address.",
    };
  }

  const itemMap = new Map<string, number>();
  for (const item of input.items) {
    if (!item.productId || item.quantity <= 0) continue;
    itemMap.set(item.productId, (itemMap.get(item.productId) ?? 0) + item.quantity);
  }

  const productIds = [...itemMap.keys()];
  if (productIds.length === 0) {
    return {
      ok: false,
      paymentStatus: "failed",
      message: "Add at least one item to the basket before checkout.",
    };
  }

  const orderId = createPosOrderId();
  const supabase = createAdminClient();

  const { market, items: catalogItems } = await getUkCatalogItems(productIds);
  const pricedItems = productIds.map((productId) => {
    const product = catalogItems.find((item) => item.product_id === productId);
    if (!product) {
      throw new Error("One of the selected products is no longer available in the UK market.");
    }

    const quantity = itemMap.get(productId) ?? 0;
    if (product.price == null) {
      throw new Error(`${product.name} does not have a UK selling price yet.`);
    }
    if (product.stock_quantity < quantity) {
      throw new Error(`${product.name} does not have enough stock for this sale.`);
    }

    return {
      ...product,
      quantity,
    };
  });

  const subtotal = pricedItems.reduce((sum, item) => sum + item.price! * item.quantity, 0);
  const totalItems = pricedItems.reduce((sum, item) => sum + item.quantity, 0);

  const discountType = input.discountAmount && input.discountAmount > 0 ? (input.discountType ?? null) : null;
  const discountAmount = input.discountAmount && input.discountAmount > 0 ? input.discountAmount : null;
  let totalDue = subtotal;
  if (discountAmount && discountAmount > 0) {
    if (discountType === "percentage") {
      totalDue = subtotal * (1 - discountAmount / 100);
    } else if (discountType === "absolute") {
      totalDue = Math.max(0, subtotal - discountAmount);
    }
  }

  const initialStatus = "pending";
  const initialPaymentStatus = "pending";

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_id: orderId,
      customer_name: customerName,
      phone: customerPhone,
      email: customerEmail,
      subtotal: totalDue,
      total_items: totalItems,
      market_id: market.id,
      status: initialStatus,
      email_status: "pending",
      sale_channel: "pos",
      payment_method: input.paymentMethod,
      payment_status: initialPaymentStatus,
      payment_provider: input.paymentMethod === "sumup_solo" ? "sumup" : null,
      paid_at: input.paymentMethod === "cash" ? new Date().toISOString() : null,
      discount_type: discountType,
      discount_amount: discountAmount,
    })
    .select("*")
    .single<Order>();

  if (orderError || !order) {
    return {
      ok: false,
      paymentStatus: "failed",
      message: `Could not create the POS sale. ${orderError?.message ?? ""}`.trim(),
    };
  }

  const orderItems = pricedItems.map((item) => ({
    order_db_id: order.id,
    product_id: item.product_id,
    product_name_snapshot: item.name,
    product_slug_snapshot: item.slug,
    unit_price_snapshot: item.price,
    quantity: item.quantity,
    selected_variant_json: null,
  }));

  const { error: orderItemsError } = await supabase.from("order_items").insert(orderItems);

  if (orderItemsError) {
    return {
      ok: false,
      paymentStatus: "failed",
      message: `Could not save POS basket items. ${orderItemsError.message}`,
    };
  }

  const savedItems = orderItems.map((item, index) => ({
    id: `pos-item-${index}`,
    created_at: new Date().toISOString(),
    ...item,
  })) as OrderItem[];

  await adjustStockForItems({
    orderDbId: order.id,
    orderRef: order.order_id,
    marketId: market.id,
    items: savedItems,
    deltaDirection: "decrement",
    changeType: input.paymentMethod === "cash" ? "pos_sale_completed" : "pos_sale_reserved",
  });

  if (input.paymentMethod === "cash") {
    await finalizePosOrderPayment(order.id);
    return {
      ok: true,
      orderId: order.order_id,
      paymentStatus: "paid",
      message: "Cash sale completed and receipt email sent.",
      customerName: input.customer.name,
      customerEmail: input.customer.email,
      paymentMethod: "Cash",
    };
  }

  try {
    const clientTransactionId = await createSumUpReaderCheckout({
      orderId: order.order_id,
      amount: totalDue,
      currency: "GBP",
    });

    await supabase
      .from("orders")
      .update({ payment_reference: clientTransactionId })
      .eq("id", order.id);

    revalidatePath("/admin/pos");
    revalidatePath("/admin/orders");

    return {
      ok: true,
      orderId: order.order_id,
      paymentStatus: "pending",
      message: "Payment request sent to the SumUp Solo terminal. Waiting for cardholder approval.",
    };
  } catch (error) {
    await markPosOrderFailed(order.id);
    return {
      ok: false,
      orderId: order.order_id,
      paymentStatus: "failed",
      message: error instanceof Error ? error.message : "SumUp payment could not be started.",
    };
  }
}

export async function syncPosPaymentStatus(orderId: string): Promise<PosSaleResult> {
  await requireAdmin("/admin/pos");

  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_id", orderId)
    .single<Order>();

  if (error || !order || order.sale_channel !== "pos") {
    return {
      ok: false,
      paymentStatus: "failed",
      message: "POS sale not found.",
    };
  }

  if (order.payment_status === "paid") {
    return {
      ok: true,
      orderId: order.order_id,
      paymentStatus: "paid",
      message: "Payment has already been completed.",
      customerName: order.customer_name,
      customerEmail: order.email || undefined,
      paymentMethod: order.payment_method === "cash" ? "Cash" : "Card",
    };
  }

  if (order.payment_method !== "sumup_solo" || !order.payment_reference) {
    return {
      ok: false,
      orderId: order.order_id,
      paymentStatus: "failed",
      message: "This sale is not waiting for a SumUp Solo payment.",
    };
  }

  try {
    const transaction = await fetchSumUpTransactionStatus(order.payment_reference);

    if (transaction.status === "SUCCESSFUL") {
      await supabase
        .from("orders")
        .update({
          payment_reference: transaction.transaction_code ?? order.payment_reference,
        })
        .eq("id", order.id);

      await finalizePosOrderPayment(order.id);
      return {
        ok: true,
        orderId: order.order_id,
        paymentStatus: "paid",
        message: "SumUp payment confirmed and customer receipt sent.",
        customerName: order.customer_name,
        customerEmail: order.email || undefined,
        paymentMethod: "Card",
      };
    }

    if (transaction.status === "FAILED" || transaction.status === "CANCELLED") {
      await markPosOrderFailed(order.id);
      return {
        ok: false,
        orderId: order.order_id,
        paymentStatus: "failed",
        message: "SumUp reported that the terminal payment did not complete.",
      };
    }

    return {
      ok: true,
      orderId: order.order_id,
      paymentStatus: "pending",
      message: "Waiting for the customer to complete payment on the SumUp Solo terminal.",
    };
  } catch (syncError) {
    return {
      ok: false,
      orderId: order.order_id,
      paymentStatus: "pending",
      message: syncError instanceof Error ? syncError.message : "Could not check the payment status yet.",
    };
  }
}
