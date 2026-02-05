import { NextResponse } from "next/server";
import { supabaseService } from "@/server/supabase";

function randomNonce(): string {
  // simple 32-byte random nonce base64
  const arr = new Uint8Array(32);
  for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
  return Buffer.from(arr).toString("base64");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const walletAddress: string | undefined = body?.walletAddress;
    if (!walletAddress || typeof walletAddress !== "string") {
      console.error("/api/auth/nonce: missing walletAddress");
      return NextResponse.json({ error: "walletAddress required" }, { status: 400 });
    }
    if (!supabaseService) {
      console.error("/api/auth/nonce: Supabase not configured");
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const nonce = randomNonce();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Insert nonce row
    const { error } = await supabaseService
      .from("auth_nonces")
      .insert({ wallet_address: walletAddress, nonce, expires_at: expiresAt });
    if (error) {
      console.error("/api/auth/nonce: insert error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ nonce, expiresAt });
  } catch (e: unknown) {
    console.error("/api/auth/nonce: exception", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
