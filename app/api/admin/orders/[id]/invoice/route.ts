import { NextResponse } from "next/server";
import { generateInvoiceHtml } from "@/lib/actions/order-actions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // We pass forAdminPreview = true to fallback the logo to public url
    const html = await generateInvoiceHtml(id, true);

    return new NextResponse(html as string, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load invoice HTML";
    return new NextResponse(`<html><body><h1>Error loading invoice</h1><p>${message}</p></body></html>`, {
      status: 500,
      headers: {
        "Content-Type": "text/html",
      },
    });
  }
}
