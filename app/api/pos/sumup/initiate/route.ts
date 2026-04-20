import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

type InitiateBody = {
  amount: number;
  currency: string;
  reference: string;
};

function getSumUpEnv() {
  const apiKey = process.env.SUMUP_API_KEY;
  const terminalId = process.env.SUMUP_TERMINAL_ID;

  if (!apiKey || !terminalId) {
    throw new Error("SUMUP_API_KEY and SUMUP_TERMINAL_ID must be set in environment variables.");
  }

  return { apiKey, terminalId };
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = (await request.json()) as InitiateBody;
    const { amount, currency, reference } = body;

    if (!amount || !currency || !reference) {
      return NextResponse.json({ error: "amount, currency and reference are required." }, { status: 400 });
    }

    const { apiKey, terminalId } = getSumUpEnv();
    const authHeader = `Bearer ${apiKey}`;

    // Step 1: Create a SumUp checkout
    const createRes = await fetch("https://api.sumup.com/v0.1/checkouts", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        checkout_reference: reference,
        amount,
        currency,
        description: "Aakruti POS Sale",
      }),
    });

    if (!createRes.ok) {
      const text = await createRes.text().catch(() => "");
      return NextResponse.json(
        { error: `SumUp checkout creation failed: ${text}` },
        { status: 502 },
      );
    }

    const checkout = (await createRes.json()) as { id: string };
    const checkoutId = checkout.id;

    // Step 2: Send the checkout to the Solo terminal
    const terminalRes = await fetch(
      `https://api.sumup.com/v0.1/terminals/${terminalId}/checkouts/${checkoutId}`,
      {
        method: "POST",
        headers: { Authorization: authHeader },
      },
    );

    if (!terminalRes.ok) {
      const text = await terminalRes.text().catch(() => "");
      return NextResponse.json(
        { error: `Failed to send payment to terminal: ${text}` },
        { status: 502 },
      );
    }

    return NextResponse.json({ checkoutId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected SumUp initiation error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
