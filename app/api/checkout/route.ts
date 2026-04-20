import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_CHECKOUT_TEMPLATE,
  DEFAULT_CUSTOMER_CONFIRMATION_SUBJECT,
  DEFAULT_CUSTOMER_CONFIRMATION_TEMPLATE,
  fillCheckoutTemplate,
  formatShippingAddress,
} from "@/lib/checkout";
import { getResendEnv } from "@/lib/env";
import { getCurrentMarket } from "@/lib/market/resolve-market";
import { createOrderId } from "@/lib/orders/create-order-id";
import type { CheckoutCartItem, CheckoutCustomer, CheckoutSettings } from "@/types";

type SupabaseAdminClient = ReturnType<typeof createAdminClient>;

async function decrementStockForItems(
  supabase: SupabaseAdminClient,
  items: CheckoutCartItem[],
  marketId: string,
  orderDbId: string,
  orderRef: string,
) {
  // Aggregate quantities by product — a cart can theoretically have duplicate entries
  const productQuantities = new Map<string, number>();
  for (const item of items) {
    if (item.id) {
      productQuantities.set(item.id, (productQuantities.get(item.id) ?? 0) + item.quantity);
    }
  }

  const productIds = [...productQuantities.keys()];
  if (productIds.length === 0) return;

  const { data: marketDataRows, error } = await supabase
    .from("product_market_data")
    .select("id, product_id, stock_quantity")
    .eq("market_id", marketId)
    .in("product_id", productIds);

  if (error || !marketDataRows?.length) return;

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

  for (const row of marketDataRows) {
    const qty = productQuantities.get(row.product_id);
    if (!qty) continue;

    // Cap at 0 so we never violate the stock_quantity >= 0 DB constraint
    const newStock = Math.max(0, row.stock_quantity - qty);

    await supabase
      .from("product_market_data")
      .update({ stock_quantity: newStock })
      .eq("id", row.id);

    inventoryEvents.push({
      source: "order",
      product_id: row.product_id,
      product_market_data_id: row.id,
      market_id: marketId,
      quantity_delta: -qty,
      change_type: "order_placed",
      raw_payload: { order_db_id: orderDbId, order_ref: orderRef },
      processed_at: new Date().toISOString(),
    });
  }

  if (inventoryEvents.length > 0) {
    await supabase.from("inventory_events").insert(inventoryEvents);
  }
}

type CheckoutRequestBody = {
  customer: CheckoutCustomer;
  items: CheckoutCartItem[];
};

function isValidCustomer(customer: CheckoutCustomer) {
  return (
    customer.firstName.trim() &&
    customer.lastName.trim() &&
    customer.email.trim() &&
    customer.phone.trim() &&
    customer.addressLine1.trim() &&
    customer.city.trim() &&
    customer.postcode.trim()
  );
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutRequestBody;
    const customer = body.customer;
    const items = body.items;

    if (!customer || !Array.isArray(items) || items.length === 0 || !isValidCustomer(customer)) {
      return NextResponse.json({ error: "Please complete all checkout details." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const orderId = createOrderId();
    const customerName = `${customer.firstName} ${customer.lastName}`.trim();
    const subtotal = items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const logoUrl = "cid:aakruti-logo";

    const market = await getCurrentMarket();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_id: orderId,
        customer_name: customerName,
        phone: customer.phone,
        email: customer.email,
        city: customer.city,
        state: customer.county || null,
        country: customer.country,
        address_line1: customer.addressLine1,
        address_line2: customer.addressLine2?.trim() || null,
        postal_code: customer.postcode,
        subtotal,
        total_items: totalItems,
        market_id: market.id,
        status: "pending",
        email_status: "pending",
      })
      .select("id")
      .single<{ id: string }>();

    if (orderError || !order) {
      return NextResponse.json({ error: `Could not create order: ${orderError?.message ?? "Unknown error"}` }, { status: 500 });
    }

    const orderItems = items.map((item) => ({
      order_db_id: order.id,
      product_id: item.id,
      product_name_snapshot: item.name,
      product_slug_snapshot: item.slug,
      unit_price_snapshot: item.price,
      quantity: item.quantity,
      selected_variant_json: {
        size: item.size ?? null,
        color: item.color ?? null,
      },
    }));

    const { error: orderItemsError } = await supabase.from("order_items").insert(orderItems);

    if (orderItemsError) {
      return NextResponse.json({ error: `Could not save order items: ${orderItemsError.message}` }, { status: 500 });
    }

    // Decrement stock and log inventory events — best-effort, never blocks the checkout
    try {
      await decrementStockForItems(supabase, items, market.id, order.id, orderId);
    } catch {
      // Stock decrement failure should not block the order
    }

    const { data: settingsData } = await supabase
      .from("checkout_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle<CheckoutSettings>();

    const settings = settingsData ?? {
      id: "default",
      order_notification_emails: [],
      order_email_template: DEFAULT_CHECKOUT_TEMPLATE,
      customer_email_subject: DEFAULT_CUSTOMER_CONFIRMATION_SUBJECT,
      customer_email_template: DEFAULT_CUSTOMER_CONFIRMATION_TEMPLATE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (settings.order_notification_emails.length === 0) {
      await supabase.from("orders").update({ email_status: "failed" }).eq("id", order.id);
      return NextResponse.json(
        { error: "Checkout settings are missing recipient emails. Please contact the site administrator." },
        { status: 500 },
      );
    }

    const emailBody = fillCheckoutTemplate({
      template: settings.order_email_template,
      orderId,
      customer,
      items,
      logoUrl,
    });

    const customerEmailHtml = fillCheckoutTemplate({
      template: settings.customer_email_template,
      orderId,
      customer,
      items,
      logoUrl,
    });
    const inlineLogoAttachment = await getInlineLogoAttachment();

    const resendEnv = getResendEnv();
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendEnv.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendEnv.RESEND_FROM_EMAIL,
        to: settings.order_notification_emails,
        subject: `New Aakruti order enquiry: ${customerName}`,
        text: emailBody,
        html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;">${emailBody.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre>`,
        reply_to: customer.email,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      await supabase.from("orders").update({ email_status: "failed" }).eq("id", order.id);
      return NextResponse.json(
        { error: `Order saved, but Resend failed to send the email. ${resendError}` },
        { status: 502 },
      );
    }

    const customerEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendEnv.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendEnv.RESEND_FROM_EMAIL,
        to: [customer.email],
        subject: settings.customer_email_subject,
        html: customerEmailHtml,
        text: `Order reference: ${orderId}\n\nThanks for choosing Treasures from Aakruti. Team Aakruti will get back to you on this soon. Have a Tresureful Day.`,
        attachments: [inlineLogoAttachment],
      }),
    });

    if (!customerEmailResponse.ok) {
      const customerEmailError = await customerEmailResponse.text();
      await supabase.from("orders").update({ email_status: "failed" }).eq("id", order.id);
      return NextResponse.json(
        { error: `Order saved, but customer confirmation email failed to send. ${customerEmailError}` },
        { status: 502 },
      );
    }

    await supabase.from("orders").update({ email_status: "sent" }).eq("id", order.id);

    return NextResponse.json({
      success: true,
      orderId,
      shippingAddress: formatShippingAddress(customer),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected checkout error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
