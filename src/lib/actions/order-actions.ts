"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendEnv } from "@/lib/env";
import type { DeliveryType, Order, OrderItem } from "@/types";

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

function buildFulfillmentEmailHtml(args: {
  orderId: string;
  customerName: string;
  deliveryType: DeliveryType;
  trackingNumber: string | null;
  shippingCompany: string | null;
  trackingUrl: string | null;
  items: OrderItem[];
}) {
  const { orderId, customerName, deliveryType, trackingNumber, shippingCompany, trackingUrl, items } = args;

  const trackingLink = trackingUrl
    ? `<a href="${trackingUrl}" style="color:#548520;font-weight:700;">${trackingNumber}</a>`
    : `<span style="font-weight:700;color:#145018;">${trackingNumber}</span>`;

  const deliveryBlock =
    deliveryType === "tracked"
      ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e2f3c0;margin:0 0 24px 0;">
          <tr>
            ${shippingCompany ? `<td style="padding:14px 16px;background:#f4faec;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;border-right:1px solid #e2f3c0;">Shipping Company</td>` : ""}
            <td style="padding:14px 16px;background:#f4faec;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;">Tracking Number</td>
          </tr>
          <tr>
            ${shippingCompany ? `<td style="padding:16px;font-size:15px;color:#145018;border-right:1px solid #e2f3c0;">${shippingCompany}</td>` : ""}
            <td style="padding:16px;font-size:15px;color:#145018;">${trackingLink}${trackingUrl ? `<br/><a href="${trackingUrl}" style="font-size:12px;color:#84be35;word-break:break-all;">Track your parcel →</a>` : ""}</td>
          </tr>
        </table>`
      : `<p style="margin:0 0 24px 0;padding:14px 16px;background:#f4faec;border:1px solid #e2f3c0;font-size:14px;color:#145018;">Your order will be delivered via <strong>Home Delivery</strong>. Our team will contact you to arrange delivery.</p>`;

  const itemRows = items
    .map(
      (item) => `<tr>
        <td style="padding:14px;border-top:1px solid #e8f5e8;font-size:14px;line-height:22px;color:#145018;">${item.product_name_snapshot}</td>
        <td style="padding:14px;border-top:1px solid #e8f5e8;font-size:14px;color:#145018;text-align:center;">${item.quantity}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;background:#f5fbf5;font-family:Segoe UI,Helvetica Neue,Arial,sans-serif;color:#145018;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5fbf5;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #c8e6c8;">
        <tr>
          <td style="background:linear-gradient(135deg,#145018,#6da228);padding:28px 24px;text-align:center;">
            <img src="cid:aakruti-logo" alt="Aakruti" width="120" style="display:block;margin:0 auto 16px auto;height:auto;" />
            <p style="margin:0;font-size:14px;color:#e8f5e8;">Order Reference</p>
            <p style="margin:8px 0 0 0;font-size:24px;font-weight:700;color:#ffffff;">${orderId}</p>
          </td>
        </tr>
        <tr><td style="padding:32px 24px;">
          <p style="margin:0 0 8px 0;font-size:18px;color:#145018;">Dear ${customerName},</p>
          <p style="margin:0 0 24px 0;font-size:15px;line-height:28px;color:#2e7d32;">Great news! Your Aakruti treasures are on their way to you.</p>
          ${deliveryBlock}
          <h2 style="margin:0 0 14px 0;font-size:18px;color:#145018;">Your Chosen Treasures</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e8f5e8;margin:0 0 24px 0;">
            <tr>
              <td style="padding:12px 14px;background:#f5fbf5;font-size:12px;font-weight:700;text-transform:uppercase;color:#548520;">Item</td>
              <td style="padding:12px 14px;background:#f5fbf5;font-size:12px;font-weight:700;text-transform:uppercase;color:#548520;text-align:center;">Qty</td>
            </tr>
            ${itemRows}
          </table>
          <p style="margin:0;font-size:14px;line-height:24px;color:#388e3c;">Thank you for choosing Aakruti. We hope these treasures bring joy to your home.</p>
        </td></tr>
        <tr>
          <td style="padding:20px 24px;background:#f5fbf5;text-align:center;font-size:12px;color:#7ab57c;border-top:1px solid #e8f5e8;">
            Aakruti · Shaping your Abode
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildCancellationEmailHtml(args: {
  orderId: string;
  customerName: string;
  cancellationReason: string;
  items: OrderItem[];
}) {
  const { orderId, customerName, cancellationReason, items } = args;

  const itemRows = items
    .map(
      (item) => `<tr>
        <td style="padding:14px;border-top:1px solid #fee2e2;font-size:14px;color:#145018;">${item.product_name_snapshot}</td>
        <td style="padding:14px;border-top:1px solid #fee2e2;font-size:14px;color:#145018;text-align:center;">${item.quantity}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;background:#f5fbf5;font-family:Segoe UI,Helvetica Neue,Arial,sans-serif;color:#145018;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5fbf5;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #fecaca;">
        <tr>
          <td style="background:linear-gradient(135deg,#145018,#6da228);padding:28px 24px;text-align:center;">
            <img src="cid:aakruti-logo" alt="Aakruti" width="120" style="display:block;margin:0 auto 16px auto;height:auto;" />
            <p style="margin:0;font-size:14px;color:#e8f5e8;">Order Reference</p>
            <p style="margin:8px 0 0 0;font-size:24px;font-weight:700;color:#ffffff;">${orderId}</p>
          </td>
        </tr>
        <tr><td style="padding:32px 24px;">
          <p style="margin:0 0 8px 0;font-size:18px;color:#145018;">Dear ${customerName},</p>
          <p style="margin:0 0 24px 0;font-size:15px;line-height:28px;color:#6b7280;">We regret to inform you that your order has been cancelled.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #fecaca;margin:0 0 24px 0;">
            <tr><td style="padding:14px 16px;background:#fff1f2;font-size:12px;font-weight:700;text-transform:uppercase;color:#991b1b;">Cancellation Reason</td></tr>
            <tr><td style="padding:16px;font-size:14px;line-height:24px;color:#145018;">${cancellationReason}</td></tr>
          </table>
          <h2 style="margin:0 0 14px 0;font-size:18px;color:#145018;">Cancelled Items</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #fecaca;margin:0 0 24px 0;">
            <tr>
              <td style="padding:12px 14px;background:#fff1f2;font-size:12px;font-weight:700;text-transform:uppercase;color:#991b1b;">Item</td>
              <td style="padding:12px 14px;background:#fff1f2;font-size:12px;font-weight:700;text-transform:uppercase;color:#991b1b;text-align:center;">Qty</td>
            </tr>
            ${itemRows}
          </table>
          <p style="margin:0;font-size:14px;line-height:24px;color:#388e3c;">We hope to welcome you back to Aakruti soon. Please feel free to browse our collection again.</p>
        </td></tr>
        <tr>
          <td style="padding:20px 24px;background:#f5fbf5;text-align:center;font-size:12px;color:#7ab57c;border-top:1px solid #e8f5e8;">
            Aakruti · Shaping your Abode
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function fulfillOrder(
  orderDbId: string,
  deliveryType: DeliveryType,
  trackingNumber: string | null,
  shippingCompany: string | null,
  trackingUrl: string | null,
) {
  await requireAdmin();

  if (deliveryType === "tracked" && !trackingNumber?.trim()) {
    throw new Error("Tracking number is required for tracked delivery.");
  }

  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderDbId)
    .single<Order>();

  if (orderError || !order) {
    throw new Error("Order not found.");
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_db_id", orderDbId)
    .returns<OrderItem[]>();

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "fulfilled",
      delivery_type: deliveryType,
      tracking_number: deliveryType === "tracked" ? trackingNumber!.trim() : null,
      shipping_company: deliveryType === "tracked" ? shippingCompany?.trim() || null : null,
      tracking_url: deliveryType === "tracked" ? trackingUrl?.trim() || null : null,
      fulfilled_at: new Date().toISOString(),
    })
    .eq("id", orderDbId);

  if (updateError) {
    throw new Error(`Failed to update order: ${updateError.message}`);
  }

  if (order.email) {
    try {
      const resendEnv = getResendEnv();
      const logoAttachment = await getInlineLogoAttachment();
      const html = buildFulfillmentEmailHtml({
        orderId: order.order_id,
        customerName: order.customer_name,
        deliveryType,
        trackingNumber: deliveryType === "tracked" ? trackingNumber!.trim() : null,
        shippingCompany: deliveryType === "tracked" ? shippingCompany?.trim() || null : null,
        trackingUrl: deliveryType === "tracked" ? trackingUrl?.trim() || null : null,
        items: items ?? [],
      });

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendEnv.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendEnv.RESEND_FROM_EMAIL,
          to: [order.email],
          subject: `Aakruti: Your order ${order.order_id} is on its way!`,
          html,
          text: `Your order ${order.order_id} has been fulfilled. ${deliveryType === "tracked" ? `Tracking number: ${trackingNumber}` : "It will be delivered via Home Delivery."}`,
          attachments: [logoAttachment],
        }),
      });
    } catch {
      // Email failure should not block the fulfillment
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.order_id}`);
}

export async function cancelOrder(orderDbId: string, reason: string) {
  await requireAdmin();

  if (!reason.trim()) {
    throw new Error("Cancellation reason is required.");
  }

  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderDbId)
    .single<Order>();

  if (orderError || !order) {
    throw new Error("Order not found.");
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_db_id", orderDbId)
    .returns<OrderItem[]>();

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      cancellation_reason: reason.trim(),
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", orderDbId);

  if (updateError) {
    throw new Error(`Failed to update order: ${updateError.message}`);
  }

  if (order.email) {
    try {
      const resendEnv = getResendEnv();
      const logoAttachment = await getInlineLogoAttachment();
      const html = buildCancellationEmailHtml({
        orderId: order.order_id,
        customerName: order.customer_name,
        cancellationReason: reason.trim(),
        items: items ?? [],
      });

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendEnv.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendEnv.RESEND_FROM_EMAIL,
          to: [order.email],
          subject: `Aakruti: Your order ${order.order_id} has been cancelled`,
          html,
          text: `Your order ${order.order_id} has been cancelled.\n\nReason: ${reason.trim()}`,
          attachments: [logoAttachment],
        }),
      });
    } catch {
      // Email failure should not block the cancellation
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.order_id}`);
}
