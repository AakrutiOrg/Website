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
import type { CheckoutCartItem, CheckoutCustomer, CheckoutSettings } from "@/types";

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

function createOrderId() {
  const date = new Date();
  const stamp = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AKR-${stamp}-${suffix}`;
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

    const { data: ukMarket } = await supabase
      .from("markets")
      .select("id")
      .eq("code", "UK")
      .maybeSingle<{ id: string }>();

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
        market_id: ukMarket?.id ?? null,
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
