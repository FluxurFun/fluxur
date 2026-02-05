import { NextResponse } from "next/server";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { supabaseService } from "@/server/supabase";
import { createHash, randomUUID, randomBytes } from "crypto";

function setSessionCookie(res: NextResponse, token: string) {
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  res.headers.append(
    "Set-Cookie",
    `sb_session=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`,
  );
}

export async function POST(req: Request) {
  try {
    if (!supabaseService) {
      console.error("/api/auth/verify: Supabase not configured");
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }
    const { walletAddress, nonce, signature, issuedAt } = await req.json();
    if (!walletAddress || !nonce || !signature || !issuedAt) {
      console.error("/api/auth/verify: missing fields", { walletAddress: !!walletAddress, nonce: !!nonce, signature: !!signature, issuedAt: !!issuedAt });
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Load latest valid nonce for wallet
    const { data: nonceRows, error: nonceErr } = await supabaseService
      .from("auth_nonces")
      .select("id, nonce, expires_at, used_at")
      .eq("wallet_address", walletAddress)
      .order("id", { ascending: false })
      .limit(5);
    if (nonceErr) {
      console.error("/api/auth/verify: nonce query error", nonceErr);
      return NextResponse.json({ error: nonceErr.message }, { status: 500 });
    }
    const row = (nonceRows || []).find(r => r.nonce === nonce && !r.used_at && new Date(r.expires_at) > new Date());
    if (!row) {
      console.error("/api/auth/verify: invalid or expired nonce");
      return NextResponse.json({ error: "Invalid or expired nonce" }, { status: 401 });
    }

    // Rebuild message that was signed
    const message = `Domain: fluxur\nWallet: ${walletAddress}\nNonce: ${nonce}\nIssuedAt: ${issuedAt}`;
    const messageBytes = new TextEncoder().encode(message);
    const sigBytes = bs58.decode(signature);
    const pubkeyBytes = bs58.decode(walletAddress);

    const ok = nacl.sign.detached.verify(messageBytes, sigBytes, pubkeyBytes);
    if (!ok) {
      console.error("/api/auth/verify: signature verify failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Consume nonce
    const { error: updErr } = await supabaseService
      .from("auth_nonces")
      .update({ used_at: new Date().toISOString() })
      .eq("id", row.id);
    if (updErr) {
      console.error("/api/auth/verify: update nonce error", updErr);
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    // Upsert user
    const { data: userRow, error: userErr } = await supabaseService
      .from("users")
      .upsert({ wallet_address: walletAddress }, { onConflict: "wallet_address" })
      .select("id, wallet_address")
      .single();
    if (userErr || !userRow) {
      console.error("/api/auth/verify: user upsert error", userErr);
      return NextResponse.json({ error: userErr?.message || "User upsert failed" }, { status: 500 });
    }

    // Create a session token and store hash
    const tokenPlain = `${walletAddress}.${(randomUUID && randomUUID()) || randomBytes(16).toString("hex")}`;
    const tokenHash = createHash("sha256").update(tokenPlain).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: sessErr } = await supabaseService
      .from("user_sessions")
      .insert({ user_id: userRow.id, token_hash: tokenHash, expires_at: expiresAt });
    if (sessErr) {
      console.error("/api/auth/verify: session insert error", sessErr);
      return NextResponse.json({ error: sessErr.message }, { status: 500 });
    }

    const res = NextResponse.json({ ok: true });
    setSessionCookie(res, tokenPlain);
    return res;
  } catch (e: unknown) {
    console.error("/api/auth/verify: exception", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
