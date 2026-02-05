import { NextResponse } from "next/server";
import bs58 from "bs58";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
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
 * Release a reserved vanity mint back to available
 */
async function releaseVanityMint(publicKey: string): Promise<void> {
  if (!supabaseService) return;

  await supabaseService
    .from("vanity_mints")
    .update({ status: "available", reserved_at: null })
    .eq("public_key", publicKey);
}

/**
 * Mark a vanity mint as used after successful token creation
 */
async function markVanityMintUsed(publicKey: string): Promise<void> {
  if (!supabaseService) return;

  await supabaseService
    .from("vanity_mints")
    .update({ status: "used", used_at: new Date().toISOString() })
    .eq("public_key", publicKey);
}

export async function POST(req: Request) {
  let reservedMintPublicKey: string | null = null;

  try {
    // Get logged in user - required for token creation
    const user = await getLoggedInUser(req);
    if (!user) {
      return NextResponse.json({ error: "Please connect your wallet and sign in to create a token." }, { status: 401 });
    }

    if (!supabaseService) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const body = await req.json();
    const {
      publicKey,
      name,
      symbol,
      metadataUri,
      website,
      twitter,
      telegram,
      amount = 0.1,
      slippage = 10,
      priorityFee = 0.0005,
      pool = "pump",
      imageUrl,
    } = body || {};

    // Validation
    const errors: string[] = [];
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanSymbol = typeof symbol === "string" ? symbol.replace(/^\$/i, "").trim() : "";
    const cleanMetadataUri = typeof metadataUri === "string" ? metadataUri.trim() : "";
    const cleanWebsite = typeof website === "string" ? website.trim() : "";
    const cleanTwitter = typeof twitter === "string" ? twitter.trim() : "";
    const cleanTelegram = typeof telegram === "string" ? telegram.trim() : "";
    const cleanPublicKey = typeof publicKey === "string" ? publicKey.trim() : "";

    if (!cleanName) errors.push("Coin name is required");
    if (!cleanSymbol) errors.push("Ticker is required");
    if (!cleanMetadataUri) errors.push("Metadata URI is required");
    if (!cleanPublicKey) errors.push("Wallet public key is required");

    if (typeof amount !== "number" || Number.isNaN(amount)) errors.push("Invalid amount");
    if (typeof slippage !== "number" || Number.isNaN(slippage)) errors.push("Invalid slippage");
    if (typeof priorityFee !== "number" || Number.isNaN(priorityFee)) errors.push("Invalid priority fee");
    if (pool !== "pump") errors.push("Invalid pool");

    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join(". ") },
        { status: 400 },
      );
    }

    // Reserve ONE FLXR mint atomically using RPC
    console.log("[create-tx] Calling reserve_vanity_mint RPC...");
    const { data: rpcData, error: rpcError } = await supabaseService.rpc("reserve_vanity_mint");

    if (rpcError) {
      console.error("[create-tx] RPC error:", rpcError);
      // Show actual error for function/column issues
      if (rpcError.message?.includes("does not exist") || rpcError.message?.includes("Could not find")) {
        return NextResponse.json({ error: rpcError.message }, { status: 500 });
      }
      return NextResponse.json({ error: `reserve_vanity_mint failed: ${rpcError.message}` }, { status: 500 });
    }

    if (!rpcData || rpcData.length === 0) {
      console.log("[create-tx] No FLXR mints available");
      return NextResponse.json(
        { error: "No FLXR addresses available right now. Please try again in a few minutes." },
        { status: 409 }
      );
    }

    const { public_key: mintPublicKey, secret_key_base58: mintSecretBase58 } = rpcData[0];
    reservedMintPublicKey = mintPublicKey;
    console.log("[create-tx] Reserved FLXR mint:", mintPublicKey);

    // Decode the secret key to create a Keypair for signing
    let vanityMintKeypair: Keypair;
    try {
      const secretKeyBytes = bs58.decode(mintSecretBase58);
      vanityMintKeypair = Keypair.fromSecretKey(secretKeyBytes);
    } catch (e) {
      console.error("[create-tx] Failed to decode mint secret key:", e);
      await releaseVanityMint(mintPublicKey);
      return NextResponse.json({ error: "Failed to prepare FLXR address. Please try again." }, { status: 500 });
    }

    const sentBody = {
      publicKey: cleanPublicKey,
      action: "create",
      tokenMetadata: { name: cleanName, symbol: cleanSymbol, uri: cleanMetadataUri },
      mint: mintPublicKey,
      denominatedInSol: "true",
      amount,
      slippage,
      priorityFee,
      pool,
    };

    console.log("[create-tx] Calling PumpPortal...");

    const res = await fetch("https://pumpportal.fun/api/trade-local", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sentBody),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[create-tx] PumpPortal error:", errorText);
      await releaseVanityMint(mintPublicKey);
      return NextResponse.json(
        { error: "Failed to build transaction. Please try again." },
        { status: 502 },
      );
    }

    // Normalize success to base64 tx
    const contentType = res.headers.get("Content-Type") || "";
    let encodedTxBase64 = "";

    if (contentType.includes("application/json")) {
      const json = await res.json();
      if (Array.isArray(json)) {
        const base58Tx = json[0];
        const raw = bs58.decode(base58Tx);
        encodedTxBase64 = Buffer.from(raw).toString("base64");
      } else if (typeof json === "object") {
        if (typeof json.encodedTx === "string") {
          if (json.encoding === "base58") {
            const raw = bs58.decode(json.encodedTx);
            encodedTxBase64 = Buffer.from(raw).toString("base64");
          } else {
            encodedTxBase64 = json.encodedTx as string;
          }
        } else if (typeof json.tx === "string") {
          encodedTxBase64 = json.tx as string;
        } else {
          await releaseVanityMint(mintPublicKey);
          return NextResponse.json(
            { error: "Failed to build transaction. Please try again." },
            { status: 502 },
          );
        }
      }
    } else {
      const buf = await res.arrayBuffer();
      encodedTxBase64 = Buffer.from(buf).toString("base64");
    }

    // Sign the transaction server-side with the vanity mint keypair
    try {
      const txBytes = Buffer.from(encodedTxBase64, "base64");
      const tx = VersionedTransaction.deserialize(txBytes);
      tx.sign([vanityMintKeypair]);
      encodedTxBase64 = Buffer.from(tx.serialize()).toString("base64");
      console.log("[create-tx] Transaction signed with FLXR mint");
    } catch (e) {
      console.error("[create-tx] Failed to sign transaction:", e);
      await releaseVanityMint(mintPublicKey);
      return NextResponse.json(
        { error: "Failed to sign transaction. Please try again." },
        { status: 500 }
      );
    }

    // Persist commitment row in Supabase
    try {
      console.log("[create-tx] Saving commitment...");
      const wallets = {
        escrow_address: cleanPublicKey,
        custody_wallet: cleanPublicKey,
        payout_wallet: cleanPublicKey,
      };
      await supabaseService
        .from("commitments")
        .upsert({
          mint: mintPublicKey,
          name: cleanName,
          symbol: cleanSymbol,
          creator_wallet: cleanPublicKey,
          metadata_uri: cleanMetadataUri,
          image_url: imageUrl || null,
          website: cleanWebsite || null,
          twitter: cleanTwitter || null,
          telegram: cleanTelegram || null,
          ...wallets,
        }, { onConflict: "mint" });
    } catch (e) {
      console.error("[create-tx] Supabase insert error:", e);
    }

    // Return response - client will mark as used after successful on-chain confirmation
    return NextResponse.json({
      encodedTx: encodedTxBase64,
      encoding: "base64",
      mint: mintPublicKey,
      isVanityMint: true,
      vanityMintPublicKey: mintPublicKey,
    });
  } catch (error: unknown) {
    // Release vanity mint on any unexpected error
    if (reservedMintPublicKey) {
      await releaseVanityMint(reservedMintPublicKey);
    }
    console.error("[create-tx] Unexpected error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    // Show actual error for column/function issues
    if (msg.includes("does not exist") || msg.includes("Could not find")) {
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
