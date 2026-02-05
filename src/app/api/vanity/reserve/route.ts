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
 * POST /api/vanity/reserve
 *
 * Reserves ONE FLXR mint atomically using the reserve_vanity_mint RPC.
 * Uses supabaseService (SERVICE ROLE) to bypass RLS.
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

    // Reserve ONE FLXR mint atomically using RPC
    const { data, error } = await supabaseService.rpc("reserve_vanity_mint");

    if (error) {
      console.error("[vanity/reserve] RPC error:", error);
      // Show actual error for column/function issues
      if (error.message?.includes("does not exist") || error.message?.includes("Could not find")) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: `reserve_vanity_mint failed: ${error.message}` }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "No FLXR addresses available right now. Please try again in a few minutes." },
        { status: 409 }
      );
    }

    const { public_key, secret_key_base58 } = data[0];

    return NextResponse.json({
      public_key,
      secret_key_base58,
    });
  } catch (e: unknown) {
    console.error("[vanity/reserve] Unexpected exception:", e);
    const msg = e instanceof Error ? e.message : String(e);
    // Show actual error for column/function issues
    if (msg.includes("does not exist") || msg.includes("Could not find")) {
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
