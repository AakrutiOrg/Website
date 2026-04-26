import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin";
import { generateOnlineReceiptPreviewHtml } from "@/lib/actions/order-actions";
import { generatePosReceiptPreviewHtml } from "@/lib/actions/pos-actions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin("/admin/login");

    const { id } = await params;
    const supabase = createAdminClient();

    const { data: order, error } = await supabase
      .from("orders")
      .select("sale_channel")
      .eq("id", id)
      .single();

    if (error || !order) {
      throw new Error("Order not found.");
    }

    const html =
      order.sale_channel === "pos"
        ? await generatePosReceiptPreviewHtml(id)
        : await generateOnlineReceiptPreviewHtml(id);

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load receipt preview.";
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:32px;color:#991b1b;"><h2>Error</h2><p>${message}</p></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } },
    );
  }
}
