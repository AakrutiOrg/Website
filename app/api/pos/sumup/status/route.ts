import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

type SumUpCheckoutStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "CANCELLED";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const checkoutId = searchParams.get("checkoutId");

    if (!checkoutId) {
      return NextResponse.json({ error: "checkoutId query parameter is required." }, { status: 400 });
    }

    const apiKey = process.env.SUMUP_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "SUMUP_API_KEY is not configured." }, { status: 500 });
    }

    const res = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `SumUp status check failed: ${text}` },
        { status: 502 },
      );
    }

    const data = (await res.json()) as { status: SumUpCheckoutStatus; transaction_code?: string };

    return NextResponse.json({
      status: data.status,
      transactionCode: data.transaction_code ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected SumUp status error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
