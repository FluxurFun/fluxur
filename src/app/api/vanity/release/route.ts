import { NextResponse } from "next/server";
import { supabaseService } from "@/server/supabase";
import { createHash } from "crypto";

function readCookie(header: string | null, key: string): string | null {
  if (!header) return null;
  const parts = header.split(/;\s*/);
  for (const p of parts) {
    const [k, ...rest] = p.split("=");
    if (k === key) return rest.join("=");
  }
  return null;
}

async function getLoggedInUser(request: Request) {
  if (!supabaseService) return null;
  const cookieHeader = request.headers.get("cookie");
  const token = readCookie(cookieHeader, "sb_session");
  if (!token) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const { data: sess, error: sessErr } = await supabaseService
    .from("user_sessions")
    .select("id, user_id, expires_at")
    .eq("token_hash", tokenHash)
    .order("id", { ascending: false })
    .limit(1)
    .single();
  if (sessErr || !sess) return null;
  if (!sess.expires_at || isNaN(new Date(sess.expires_at).getTime()) || new Date(sess.expires_at) <= new Date()) {
    return null;
  }

  const { data: user, error: userErr } = await supabaseService
    .from("users")
    .select("id, wallet_address")
    .eq("id", sess.user_id)
    .single();
  if (userErr || !user) return null;
  return user;
}

/**
 * POST /api/vanity/release
 * Releases a reserved vanity mint back to available status.
 */
export async function POST(request: Request) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseService) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { public_key } = await request.json();

    if (!public_key || typeof public_key !== "string") {
      return NextResponse.json({ error: "Missing public_key" }, { status: 400 });
    }

    // Release the mint back to available
    await supabaseService
      .from("vanity_mints")
      .update({ status: "available", reserved_at: null })
      .eq("public_key", public_key);

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error("[vanity/release] Exception:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
