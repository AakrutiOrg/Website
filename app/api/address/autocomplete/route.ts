import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const postcode = request.nextUrl.searchParams.get("query");
  if (!postcode) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  const apiKey = process.env.GETADDRESS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Address lookup not configured" }, { status: 500 });
  }

  const url = `https://api.getaddress.io/find/${encodeURIComponent(postcode)}?api-key=${apiKey}&expand=true`;

  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    return NextResponse.json(
      { error: (json as { Message?: string }).Message || "Postcode not found or invalid." },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
