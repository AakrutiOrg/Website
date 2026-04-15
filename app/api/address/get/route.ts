import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const apiKey = process.env.GETADDRESS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Address lookup not configured" }, { status: 500 });
  }

  const url = `https://api.getaddress.io/get/${encodeURIComponent(id)}?api-key=${apiKey}`;

  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: text || "Could not retrieve address details." },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
