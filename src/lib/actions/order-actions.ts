"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendEnv } from "@/lib/env";
import type { CheckoutSettings, DeliveryType, Order, OrderItem } from "@/types";

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
            <p style="margin:0;font-size:14px;color:#e8f5e8;">Order Fulfillment</p>
            <p style="margin:8px 0 0 0;font-size:24px;font-weight:700;color:#ffffff;">Order Number: ${orderId}</p>
          </td>
        </tr>
        <tr><td style="padding:32px 24px;">
          <p style="margin:0 0 8px 0;font-size:18px;color:#145018;">Dear ${customerName},</p>
          <p style="margin:0 0 24px 0;font-size:15px;line-height:28px;color:#2e7d32;">Great news! Your Aakruti Treasures are on their way to you.</p>
          ${deliveryBlock}
          <h2 style="margin:0 0 14px 0;font-size:18px;color:#145018;">Your Treasures</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e8f5e8;margin:0 0 24px 0;">
            <tr>
              <td style="padding:12px 14px;background:#f5fbf5;font-size:12px;font-weight:700;text-transform:uppercase;color:#548520;">Item</td>
              <td style="padding:12px 14px;background:#f5fbf5;font-size:12px;font-weight:700;text-transform:uppercase;color:#548520;text-align:center;">Qty</td>
            </tr>
            ${itemRows}
          </table>
          <p style="margin:0;font-size:14px;line-height:24px;color:#388e3c;">Thank you for choosing Aakruti. We hope these Treasures bring joy and beauty to your home.</p>
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
            <p style="margin:0;font-size:14px;color:#e8f5e8;">Order Cancellation</p>
            <p style="margin:8px 0 0 0;font-size:24px;font-weight:700;color:#ffffff;">Order Number: ${orderId}</p>
          </td>
        </tr>
        <tr><td style="padding:32px 24px;">
          <p style="margin:0 0 8px 0;font-size:18px;color:#145018;">Dear ${customerName},</p>
          <p style="margin:0 0 24px 0;font-size:15px;line-height:28px;color:#6b7280;">We regret to inform you that your order has been cancelled.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #fecaca;margin:0 0 24px 0;">
            <tr><td style="padding:14px 16px;background:#fff1f2;font-size:12px;font-weight:700;text-transform:uppercase;color:#991b1b;">Cancellation Reason</td></tr>
            <tr><td style="padding:16px;font-size:14px;line-height:24px;color:#145018;">${cancellationReason}</td></tr>
          </table>
          <h2 style="margin:0 0 14px 0;font-size:18px;color:#145018;">Cancelled Treasures</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #fecaca;margin:0 0 24px 0;">
            <tr>
              <td style="padding:12px 14px;background:#fff1f2;font-size:12px;font-weight:700;text-transform:uppercase;color:#991b1b;">Item</td>
              <td style="padding:12px 14px;background:#fff1f2;font-size:12px;font-weight:700;text-transform:uppercase;color:#991b1b;text-align:center;">Qty</td>
            </tr>
            ${itemRows}
          </table>
          <p style="margin:0;font-size:14px;line-height:24px;color:#388e3c;">We hope to welcome you back to Aakruti soon. Please feel free to browse our Treasures and find something that speaks to you.</p>
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

type InvoiceItem = {
  name: string;
  variant: string | null;
  quantity: number;
  unitPrice: number | null;
  imageUrl: string | null;
};

function buildInvoiceEmailHtml(args: {
  orderId: string;
  customerName: string;
  orderDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discountType: "percentage" | "absolute" | null;
  discountAmount: number | null;
  totalDue: number;
  bankAccountDetails: string;
}) {
  const { orderId, customerName, orderDate, items, subtotal, discountType, discountAmount, totalDue, bankAccountDetails } = args;

  const itemRows = items.map((item) => {
    const lineTotal = item.unitPrice != null ? item.unitPrice * item.quantity : null;
    const imgCell = item.imageUrl
      ? `<img src="${item.imageUrl}" alt="${item.name}" width="64" height="64" style="width:64px;height:64px;object-fit:cover;border-radius:6px;display:block;" />`
      : `<div style="width:64px;height:64px;background:#e8f5e8;border-radius:6px;display:flex;align-items:center;justify-content:center;"></div>`;

    return `<tr>
      <td style="padding:14px 16px;border-top:1px solid #e8f5e8;vertical-align:middle;">${imgCell}</td>
      <td style="padding:14px 16px;border-top:1px solid #e8f5e8;vertical-align:middle;">
        <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#145018;">${item.name}</p>
        ${item.variant ? `<p style="margin:0;font-size:12px;color:#2e7d32;">${item.variant}</p>` : ""}
      </td>
      <td style="padding:14px 16px;border-top:1px solid #e8f5e8;text-align:center;vertical-align:middle;font-size:14px;color:#145018;">${item.quantity}</td>
      <td style="padding:14px 16px;border-top:1px solid #e8f5e8;text-align:right;vertical-align:middle;font-size:14px;color:#145018;">${item.unitPrice != null ? `£${item.unitPrice.toFixed(2)}` : "—"}</td>
      <td style="padding:14px 16px;border-top:1px solid #e8f5e8;text-align:right;vertical-align:middle;font-size:14px;font-weight:700;color:#145018;">${lineTotal != null ? `£${lineTotal.toFixed(2)}` : "—"}</td>
    </tr>`;
  }).join("");

  const discountLabel = discountType === "percentage"
    ? `Discount (${discountAmount}%)`
    : "Discount";

  const discountValue = discountType === "percentage"
    ? subtotal * (discountAmount! / 100)
    : discountAmount!;

  const discountRow = discountAmount && discountAmount > 0 ? `
    <tr>
      <td colspan="4" style="padding:10px 16px;text-align:right;font-size:13px;color:#2e7d32;">${discountLabel}</td>
      <td style="padding:10px 16px;text-align:right;font-size:13px;color:#b45309;">−£${discountValue.toFixed(2)}</td>
    </tr>` : "";

  const bankDetailsHtml = bankAccountDetails.trim()
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e8f5e8;margin:0 0 28px 0;">
        <tr><td style="padding:12px 16px;background:#f5fbf5;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;">Bank Transfer Details</td></tr>
        <tr><td style="padding:16px;font-size:14px;line-height:24px;color:#145018;white-space:pre-line;">${bankAccountDetails.trim()}</td></tr>
      </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f5fbf5;font-family:Segoe UI,Helvetica Neue,Arial,sans-serif;color:#145018;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5fbf5;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #c8e6c8;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#145018,#6da228);padding:28px 24px;text-align:center;">
            <img src="cid:aakruti-logo" alt="Aakruti" width="150" style="display:block;margin:0 auto 16px auto;width:150px;max-width:100%;height:auto;" />
            <p style="margin:0;font-size:16px;line-height:22px;color:#c4e786;font-family:'Great Vibes',cursive;letter-spacing:0.02em;">Shaping your Abode</p>
            <p style="margin:16px 0 0 0;font-size:14px;line-height:22px;color:#e8f5e8;">Invoice</p>
            <p style="margin:8px 0 0 0;font-size:24px;line-height:30px;font-weight:700;color:#ffffff;">Order Number: ${orderId}</p>
            <p style="margin:6px 0 0 0;font-size:12px;color:#e8f5e8;">${orderDate}</p>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:32px 24px 8px 24px;">
            <p style="margin:0 0 16px 0;font-size:18px;line-height:28px;color:#145018;">Dear ${customerName},</p>
            <p style="margin:0;font-size:15px;line-height:28px;color:#2e7d32;">
              Thanks for choosing Treasures from Aakruti. Please find below your invoice summary.
              Kindly arrange payment via bank transfer using the details provided below.
            </p>
          </td>
        </tr>

        <!-- Items table -->
        <tr>
          <td style="padding:20px 24px 0 24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e8f5e8;">
              <thead>
                <tr style="background:#f5fbf5;">
                  <td style="padding:12px 14px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;width:80px;"></td>
                  <td style="padding:12px 14px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;">Item</td>
                  <td style="padding:12px 14px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;text-align:center;">Qty</td>
                  <td style="padding:12px 14px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;text-align:right;">Unit Price</td>
                  <td style="padding:12px 14px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#548520;text-align:right;">Total</td>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="padding:12px 16px;text-align:right;font-size:13px;color:#2e7d32;border-top:2px solid #e8f5e8;">Subtotal</td>
                  <td style="padding:12px 16px;text-align:right;font-size:13px;color:#145018;border-top:2px solid #e8f5e8;">£${subtotal.toFixed(2)}</td>
                </tr>
                ${discountRow}
                <tr style="background:#f5fbf5;">
                  <td colspan="4" style="padding:14px 16px;text-align:right;font-size:15px;font-weight:700;color:#145018;border-top:2px solid #c8e6c8;">Total Due</td>
                  <td style="padding:14px 16px;text-align:right;font-size:18px;font-weight:700;color:#6da228;border-top:2px solid #c8e6c8;">£${totalDue.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </td>
        </tr>

        <!-- Bank details -->
        <tr>
          <td style="padding:28px 24px 0 24px;">
            ${bankDetailsHtml}
          </td>
        </tr>

        <!-- Footer -->
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

export async function generateInvoiceHtml(
  orderDbId: string,
  forAdminPreview: boolean = false,
  overrideDiscountType?: "percentage" | "absolute" | null,
  overrideDiscountValue?: number | null
) {
  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderDbId)
    .single<Order>();

  if (orderError || !order) throw new Error("Order not found.");

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_db_id", orderDbId)
    .returns<OrderItem[]>();

  const { data: settingsData } = await supabase
    .from("checkout_settings")
    .select("bank_account_details")
    .eq("id", "default")
    .maybeSingle<Pick<CheckoutSettings, "bank_account_details">>();

  const bankAccountDetails = settingsData?.bank_account_details ?? "";

  // Resolve product images from the view (UK market default)
  const productIds = (items ?? []).map((i) => i.product_id).filter(Boolean) as string[];
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

  let logoUrl = "cid:aakruti-logo";
  if (forAdminPreview) {
    const { data: { publicUrl: fallbackLogoUrl } } = supabase.storage
      .from("public-assets")
      .getPublicUrl("logo.png"); // Assuming logo.png in public-assets, otherwise fallback to root if deployed. 
    logoUrl = "/logo.png"; // Works usually for local preview, admin is on same origin
  }

  const invoiceItems: InvoiceItem[] = (items ?? []).map((item) => {
    const variant = [
      item.selected_variant_json?.size ? `Size: ${item.selected_variant_json.size}` : null,
      item.selected_variant_json?.color ? `Colour: ${item.selected_variant_json.color}` : null,
    ].filter(Boolean).join(" · ") || null;

    return {
      name: item.product_name_snapshot,
      variant,
      quantity: item.quantity,
      unitPrice: item.unit_price_snapshot,
      imageUrl: item.product_id ? (imageMap.get(item.product_id) ?? null) : null,
    };
  });

  const subtotal = invoiceItems.reduce((sum, item) => {
    return sum + (item.unitPrice != null ? item.unitPrice * item.quantity : 0);
  }, 0);

  const discountType = overrideDiscountType !== undefined ? overrideDiscountType : order.discount_type;
  const discountValue = overrideDiscountValue !== undefined ? overrideDiscountValue : order.discount_amount;

  let totalDue = subtotal;
  if (discountValue && discountValue > 0) {
    if (discountType === "percentage") {
      totalDue = subtotal * (1 - discountValue / 100);
    } else if (discountType === "absolute") {
      totalDue = Math.max(0, subtotal - discountValue);
    }
  }

  const orderDate = new Date(order.created_at).toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const html = buildInvoiceEmailHtml({
    orderId: order.order_id,
    customerName: order.customer_name,
    orderDate,
    items: invoiceItems,
    subtotal,
    discountType: discountValue && discountValue > 0 ? discountType : null,
    discountAmount: discountValue && discountValue > 0 ? discountValue : null,
    totalDue,
    bankAccountDetails,
  });

  if (forAdminPreview) {
    return html.replace("cid:aakruti-logo", logoUrl);
  }

  return { html, totalDue, order };
}

export async function sendInvoice(
  orderDbId: string,
  discountType: "percentage" | "absolute" | null,
  discountValue: number | null,
) {
  await requireAdmin();

  const supabase = createAdminClient();

  const { html, totalDue, order } = await generateInvoiceHtml(orderDbId, false, discountType, discountValue) as { html: string; totalDue: number; order: Order };

  if (!order.email) throw new Error("This order has no customer email address.");

  const bankAccountDetails = ""; // Optional: extract bank details text for plain-text email here if necessary, or simplify text part

  const resendEnv = getResendEnv();
  const logoAttachment = await getInlineLogoAttachment();

  const { data: checkoutSettings } = await supabase
    .from("checkout_settings")
    .select("admin_bcc_email")
    .eq("id", "default")
    .maybeSingle();

  const bccEmail = checkoutSettings?.admin_bcc_email || resendEnv.RESEND_FROM_EMAIL;

  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendEnv.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendEnv.RESEND_FROM_EMAIL,
      to: [order.email],
      bcc: [bccEmail],
      subject: `Invoice for your Aakruti order ${order.order_id}`,
      html,
      text: `Dear ${order.customer_name},\n\nPlease find your invoice for order ${order.order_id}.\n\nTotal Due: £${totalDue.toFixed(2)}\n\nAakruti · Shaping your Abode`,
      attachments: [logoAttachment],
    }),
  });

  if (!emailRes.ok) {
    const body = await emailRes.text().catch(() => "");
    throw new Error(`Failed to send invoice email: ${body}`);
  }

  const { error: updateError } = await createAdminClient()
    .from("orders")
    .update({
      invoice_sent_at: new Date().toISOString(),
      discount_type: discountValue && discountValue > 0 ? discountType : null,
      discount_amount: discountValue && discountValue > 0 ? discountValue : null,
      status: order.status === "pending" || order.status === "confirmed" ? "contacted" : undefined,
    })
    .eq("id", orderDbId);

  if (updateError) {
    throw new Error(`Invoice sent successfully, but failed to update status in database: ${updateError.message}`);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.order_id}`);
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

      const { data: checkoutSettings } = await supabase
        .from("checkout_settings")
        .select("admin_bcc_email")
        .eq("id", "default")
        .maybeSingle();

      const bccEmail = checkoutSettings?.admin_bcc_email || resendEnv.RESEND_FROM_EMAIL;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendEnv.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendEnv.RESEND_FROM_EMAIL,
          to: [order.email],
          bcc: [bccEmail],
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

  // Restore stock and log inventory events — best-effort, never blocks the cancellation
  if (order.market_id && items?.length) {
    try {
      const productQuantities = new Map<string, number>();
      for (const item of items) {
        if (item.product_id) {
          productQuantities.set(item.product_id, (productQuantities.get(item.product_id) ?? 0) + item.quantity);
        }
      }

      const productIds = [...productQuantities.keys()];
      if (productIds.length > 0) {
        const { data: marketDataRows } = await supabase
          .from("product_market_data")
          .select("id, product_id, stock_quantity")
          .eq("market_id", order.market_id)
          .in("product_id", productIds);

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

          await supabase
            .from("product_market_data")
            .update({ stock_quantity: row.stock_quantity + qty })
            .eq("id", row.id);

          inventoryEvents.push({
            source: "order",
            product_id: row.product_id,
            product_market_data_id: row.id,
            market_id: order.market_id,
            quantity_delta: qty,
            change_type: "order_cancelled",
            raw_payload: { order_db_id: orderDbId, order_ref: order.order_id },
            processed_at: new Date().toISOString(),
          });
        }

        if (inventoryEvents.length > 0) {
          await supabase.from("inventory_events").insert(inventoryEvents);
        }
      }
    } catch {
      // Stock restore failure should not block the cancellation
    }
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

      const { data: checkoutSettings } = await supabase
        .from("checkout_settings")
        .select("admin_bcc_email")
        .eq("id", "default")
        .maybeSingle();

      const bccEmail = checkoutSettings?.admin_bcc_email || resendEnv.RESEND_FROM_EMAIL;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendEnv.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendEnv.RESEND_FROM_EMAIL,
          to: [order.email],
          bcc: [bccEmail],
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

export async function deleteOrder(orderDbId: string, restoreStock: boolean = false) {
  await requireAdmin();

  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderDbId)
    .single<Order>();

  if (orderError || !order) {
    throw new Error("Order not found.");
  }

  if (restoreStock && order.market_id) {
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_db_id", orderDbId)
      .returns<OrderItem[]>();

    if (items?.length) {
      try {
        const productQuantities = new Map<string, number>();
        for (const item of items) {
          if (item.product_id) {
            productQuantities.set(item.product_id, (productQuantities.get(item.product_id) ?? 0) + item.quantity);
          }
        }

        const productIds = [...productQuantities.keys()];
        if (productIds.length > 0) {
          const { data: marketDataRows } = await supabase
            .from("product_market_data")
            .select("id, product_id, stock_quantity")
            .eq("market_id", order.market_id)
            .in("product_id", productIds);

          const inventoryEvents: any[] = [];
          for (const row of marketDataRows ?? []) {
            const qty = productQuantities.get(row.product_id);
            if (!qty) continue;

            await supabase
              .from("product_market_data")
              .update({ stock_quantity: row.stock_quantity + qty })
              .eq("id", row.id);

            inventoryEvents.push({
              source: "system",
              product_id: row.product_id,
              product_market_data_id: row.id,
              market_id: order.market_id,
              quantity_delta: qty,
              change_type: "order_deleted",
              raw_payload: { order_db_id: orderDbId, order_ref: order.order_id },
              processed_at: new Date().toISOString(),
            });
          }

          if (inventoryEvents.length > 0) {
            await supabase.from("inventory_events").insert(inventoryEvents);
          }
        }
      } catch {
        // Stock restore failure should not block the deletion
      }
    }
  }

  const { error: itemsDeleteError } = await supabase
    .from("order_items")
    .delete()
    .eq("order_db_id", orderDbId);

  if (itemsDeleteError) {
    throw new Error(`Failed to delete order items: ${itemsDeleteError.message}`);
  }

  const { error: deleteError } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderDbId);

  if (deleteError) {
    throw new Error(`Failed to delete order: ${deleteError.message}`);
  }

  revalidatePath("/admin/orders");
}
