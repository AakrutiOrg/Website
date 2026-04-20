import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendEnv } from "@/lib/env";
import { getCurrentMarket } from "@/lib/market/resolve-market";
import { createOrderId } from "@/lib/orders/create-order-id";
import { decrementStockForItems } from "@/lib/orders/decrement-stock";

export type POSCheckoutItem = {
  id: string;           // product_market_data_id
  name: string;
  slug: string;
  price: number | null;
  quantity: number;
  size?: string | null;
  color?: string | null;
};

type POSCheckoutBody = {
  customerName?: string;
  email?: string;
  items: POSCheckoutItem[];
  paymentMethod: "cash" | "sumup_solo";
  paymentReference?: string;
  discountType?: "percentage" | "absolute" | null;
  discountAmount?: number | null;
};

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

function buildReceiptHtml(args: {
  orderId: string;
  customerName: string;
  items: POSCheckoutItem[];
  subtotal: number;
  discountType: "percentage" | "absolute" | null;
  discountAmount: number | null;
  totalPaid: number;
  paymentMethod: string;
}): string {
  const { orderId, customerName, items, subtotal, discountType, discountAmount, totalPaid, paymentMethod } = args;

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:12px 16px;border-top:1px solid #e8f5e8;font-size:14px;color:#145018;">${item.name}${item.size ? ` · ${item.size}` : ""}${item.color ? ` · ${item.color}` : ""}</td>
      <td style="padding:12px 16px;border-top:1px solid #e8f5e8;font-size:14px;color:#145018;text-align:center;">${item.quantity}</td>
      <td style="padding:12px 16px;border-top:1px solid #e8f5e8;font-size:14px;color:#145018;text-align:right;">${item.price != null ? `£${(item.price * item.quantity).toFixed(2)}` : "—"}</td>
    </tr>`).join("");

  const discountLabel = discountType === "percentage"
    ? `Discount (${discountAmount}%)`
    : "Discount";
  const discountValue = discountType === "percentage"
    ? subtotal * (discountAmount! / 100)
    : discountAmount!;
  const discountRow = discountAmount && discountAmount > 0 ? `
    <tr>
      <td colspan="2" style="padding:10px 16px;text-align:right;font-size:13px;color:#2e7d32;">${discountLabel}</td>
      <td style="padding:10px 16px;text-align:right;font-size:13px;color:#b45309;">−£${discountValue.toFixed(2)}</td>
    </tr>` : "";

  const paymentLabel = paymentMethod === "sumup_solo" ? "Card (SumUp)" : "Cash";

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;background:#f5fbf5;font-family:Segoe UI,Helvetica Neue,Arial,sans-serif;color:#145018;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5fbf5;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#ffffff;border:1px solid #c8e6c8;">
        <tr>
          <td style="background:linear-gradient(135deg,#145018,#6da228);padding:28px 24px;text-align:center;">
            <img src="cid:aakruti-logo" alt="Aakruti" width="120" style="display:block;margin:0 auto 16px auto;height:auto;" />
            <p style="margin:0;font-size:13px;color:#e8f5e8;">Receipt · ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
            <p style="margin:8px 0 0 0;font-size:22px;font-weight:700;color:#ffffff;">${orderId}</p>
          </td>
        </tr>
        <tr><td style="padding:28px 24px;">
          <p style="margin:0 0 20px 0;font-size:16px;color:#145018;">Dear ${customerName},</p>
          <p style="margin:0 0 24px 0;font-size:14px;line-height:24px;color:#2e7d32;">Thank you for your purchase at Aakruti. Here is your receipt.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e8f5e8;margin:0 0 20px 0;">
            <thead>
              <tr style="background:#f5fbf5;">
                <td style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#548520;">Item</td>
                <td style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#548520;text-align:center;">Qty</td>
                <td style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#548520;text-align:right;">Total</td>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:10px 16px;text-align:right;font-size:13px;color:#2e7d32;border-top:2px solid #e8f5e8;">Subtotal</td>
                <td style="padding:10px 16px;text-align:right;font-size:13px;color:#145018;border-top:2px solid #e8f5e8;">£${subtotal.toFixed(2)}</td>
              </tr>
              ${discountRow}
              <tr style="background:#f5fbf5;">
                <td colspan="2" style="padding:12px 16px;text-align:right;font-size:15px;font-weight:700;color:#145018;border-top:2px solid #c8e6c8;">Total Paid</td>
                <td style="padding:12px 16px;text-align:right;font-size:17px;font-weight:700;color:#6da228;border-top:2px solid #c8e6c8;">£${totalPaid.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <p style="margin:0 0 8px 0;font-size:13px;color:#548520;font-weight:600;">Payment Method: ${paymentLabel}</p>
          <p style="margin:24px 0 0 0;font-size:13px;line-height:22px;color:#388e3c;">We hope these treasures bring joy to your home. Thank you for choosing Aakruti.</p>
        </td></tr>
        <tr>
          <td style="padding:16px 24px;background:#f5fbf5;text-align:center;font-size:11px;color:#7ab57c;border-top:1px solid #e8f5e8;">
            Aakruti · Shaping your Abode
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = (await request.json()) as POSCheckoutBody;
    const { items, paymentMethod, paymentReference, discountType, discountAmount } = body;
    const customerName = body.customerName?.trim() || "Walk-in Customer";
    const email = body.email?.trim() || null;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Basket is empty." }, { status: 400 });
    }
    if (!paymentMethod) {
      return NextResponse.json({ error: "Payment method is required." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const orderId = createOrderId();
    const market = await getCurrentMarket("UK");

    const subtotal = items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    let totalPaid = subtotal;
    if (discountAmount && discountAmount > 0) {
      if (discountType === "percentage") {
        totalPaid = subtotal * (1 - discountAmount / 100);
      } else if (discountType === "absolute") {
        totalPaid = Math.max(0, subtotal - discountAmount);
      }
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_id: orderId,
        customer_name: customerName,
        phone: "N/A",
        email,
        country: "United Kingdom",
        subtotal: totalPaid,
        total_items: totalItems,
        market_id: market.id,
        status: "confirmed",
        email_status: email ? "pending" : "sent",
        sale_channel: "pos",
        payment_method: paymentMethod,
        payment_reference: paymentReference ?? null,
        payment_status: "paid",
        paid_at: new Date().toISOString(),
        discount_type: discountAmount && discountAmount > 0 ? discountType : null,
        discount_amount: discountAmount && discountAmount > 0 ? discountAmount : null,
      })
      .select("id")
      .single<{ id: string }>();

    if (orderError || !order) {
      return NextResponse.json(
        { error: `Could not create order: ${orderError?.message ?? "Unknown error"}` },
        { status: 500 },
      );
    }

    const orderItems = items.map((item) => ({
      order_db_id: order.id,
      product_id: item.id,
      product_name_snapshot: item.name,
      product_slug_snapshot: item.slug,
      unit_price_snapshot: item.price,
      quantity: item.quantity,
      selected_variant_json: { size: item.size ?? null, color: item.color ?? null },
    }));

    const { error: orderItemsError } = await supabase.from("order_items").insert(orderItems);
    if (orderItemsError) {
      return NextResponse.json(
        { error: `Could not save order items: ${orderItemsError.message}` },
        { status: 500 },
      );
    }

    // Decrement stock — best-effort, never blocks
    try {
      await decrementStockForItems(
        supabase,
        items.map((i) => ({ id: i.id, quantity: i.quantity })),
        market.id,
        order.id,
        orderId,
      );
    } catch {
      // Stock decrement failure should not block POS sale
    }

    // Send receipt email if customer provided one
    if (email) {
      try {
        const resendEnv = getResendEnv();
        const logoAttachment = await getInlineLogoAttachment();
        const html = buildReceiptHtml({
          orderId,
          customerName,
          items,
          subtotal,
          discountType: discountAmount && discountAmount > 0 ? (discountType ?? null) : null,
          discountAmount: discountAmount && discountAmount > 0 ? discountAmount : null,
          totalPaid,
          paymentMethod,
        });

        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendEnv.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: resendEnv.RESEND_FROM_EMAIL,
            to: [email],
            subject: `Your Aakruti receipt – ${orderId}`,
            html,
            text: `Thank you for your purchase at Aakruti!\n\nOrder reference: ${orderId}\nTotal paid: £${totalPaid.toFixed(2)}\n\nAakruti · Shaping your Abode`,
            attachments: [logoAttachment],
          }),
        });

        const emailStatus = emailRes.ok ? "sent" : "failed";
        await supabase.from("orders").update({ email_status: emailStatus }).eq("id", order.id);
      } catch {
        await supabase.from("orders").update({ email_status: "failed" }).eq("id", order.id);
      }
    }

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected POS checkout error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
