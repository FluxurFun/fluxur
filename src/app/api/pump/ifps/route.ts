import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // Basic validation
    const file = form.get("file");
    const name = (form.get("name") as string) || "";
    const symbol = (form.get("symbol") as string) || "";
    const description = (form.get("description") as string) || "";
    const twitter = (form.get("twitter") as string) || "";
    const telegram = (form.get("telegram") as string) || "";
    const website = (form.get("website") as string) || "";

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing image file" }, { status: 400 });
    }

    const upstream = new FormData();
    upstream.append("file", file);
    upstream.append("name", name);
    upstream.append("symbol", symbol);
    upstream.append("description", description);
    upstream.append("twitter", twitter);
    upstream.append("telegram", telegram);
    upstream.append("website", website);
    upstream.append("showName", "true");

    const res = await fetch("https://pump.fun/api/ipfs", {
      method: "POST",
      body: upstream,
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "Pump IPFS upload failed", details: text }, { status: 502 });
    }

    const json = await res.json();
    return NextResponse.json({ metadataUri: json.metadataUri });
  } catch (error: any) {
    return NextResponse.json({ error: "Server error", details: String(error?.message || error) }, { status: 500 });
  }
}
