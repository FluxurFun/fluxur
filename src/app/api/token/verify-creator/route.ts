import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

// Use mainnet by default, can be overridden
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const CLUSTER = RPC_URL.includes("devnet") ? "devnet" : "mainnet-beta";

async function getOldestTransactionFeePayer(
  connection: Connection,
  mintPubkey: PublicKey
): Promise<{ feePayer: string | null; oldestSig: string | null; error?: string }> {
  try {
    // Get all signatures for the mint address, paginating to find the oldest
    let allSignatures: { signature: string }[] = [];
    let beforeSig: string | undefined = undefined;

    // Paginate through all signatures to find the oldest
    while (true) {
      const sigs = await connection.getSignaturesForAddress(mintPubkey, {
        before: beforeSig,
        limit: 1000,
      });

      if (sigs.length === 0) break;

      allSignatures = sigs;
      beforeSig = sigs[sigs.length - 1].signature;

      // If we got less than 1000, we've reached the end
      if (sigs.length < 1000) break;
    }

    if (allSignatures.length === 0) {
      return { feePayer: null, oldestSig: null, error: "No transactions found for this mint" };
    }

    // The oldest signature is the last one in our final batch
    const oldestSig = allSignatures[allSignatures.length - 1].signature;

    // Get the transaction details
    const tx = await connection.getTransaction(oldestSig, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || !tx.transaction) {
      return { feePayer: null, oldestSig, error: "Could not fetch oldest transaction" };
    }

    // Get the fee payer (first account in the transaction)
    // For versioned transactions, we need to handle both legacy and versioned
    let feePayer: string;

    if ("message" in tx.transaction && tx.transaction.message) {
      const message = tx.transaction.message;

      // Handle both legacy and versioned transactions
      if ("accountKeys" in message && Array.isArray(message.accountKeys)) {
        // Legacy transaction
        feePayer = message.accountKeys[0].toBase58();
      } else if ("staticAccountKeys" in message && Array.isArray(message.staticAccountKeys)) {
        // Versioned transaction (v0)
        feePayer = message.staticAccountKeys[0].toBase58();
      } else {
        return { feePayer: null, oldestSig, error: "Unknown transaction format" };
      }
    } else {
      return { feePayer: null, oldestSig, error: "Transaction has no message" };
    }

    return { feePayer, oldestSig };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { feePayer: null, oldestSig: null, error: `RPC error: ${msg}` };
  }
}

// Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

// Try to fetch token metadata for name/symbol/image
async function fetchTokenMetadata(
  connection: Connection,
  mintPubkey: PublicKey
): Promise<{ name: string; symbol: string; image: string }> {
  const mintAddress = mintPubkey.toBase58();

  // 1) Try Metaplex Token Metadata PDA first
  try {
    // Derive metadata PDA: ["metadata", TOKEN_METADATA_PROGRAM_ID, mint]
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintPubkey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const accountInfo = await connection.getAccountInfo(metadataPDA);
    if (accountInfo && accountInfo.data) {
      // Parse metadata account data
      // Metadata structure: key (1) + update_authority (32) + mint (32) + name (36) + symbol (14) + uri (204) + ...
      const data = accountInfo.data;

      // Skip: key (1) + update_authority (32) + mint (32) = 65 bytes
      // Then read name: 4 bytes length prefix + string (max 32 chars)
      let offset = 65;

      // Read name length (4 bytes, little endian)
      const nameLen = data.readUInt32LE(offset);
      offset += 4;
      const name = data
        .slice(offset, offset + Math.min(nameLen, 32))
        .toString("utf8")
        .replace(/\0/g, "")
        .trim();
      offset += 32;

      // Read symbol length (4 bytes, little endian)
      const symbolLen = data.readUInt32LE(offset);
      offset += 4;
      const symbol = data
        .slice(offset, offset + Math.min(symbolLen, 10))
        .toString("utf8")
        .replace(/\0/g, "")
        .trim();
      offset += 10;

      // Read URI length and URI
      const uriLen = data.readUInt32LE(offset);
      offset += 4;
      const uri = data
        .slice(offset, offset + Math.min(uriLen, 200))
        .toString("utf8")
        .replace(/\0/g, "")
        .trim();

      // Try to fetch image from URI if it's a JSON metadata URL
      let image = "";
      if (uri && (uri.startsWith("http://") || uri.startsWith("https://"))) {
        try {
          const metaRes = await fetch(uri);
          if (metaRes.ok) {
            const metaJson = await metaRes.json();
            image = metaJson.image || "";
          }
        } catch {
          // Ignore URI fetch errors
        }
      }

      if (name || symbol) {
        return { name, symbol, image };
      }
    }
  } catch {
    // Metaplex PDA failed
  }

  // 2) Try Dexscreener API as fallback
  try {
    const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`, {
      headers: { Accept: "application/json" },
    });
    if (dexRes.ok) {
      const dexData = await dexRes.json();
      if (dexData.pairs && dexData.pairs.length > 0) {
        // Pick the best pair (first one, usually highest liquidity)
        const bestPair = dexData.pairs[0];
        if (bestPair.baseToken) {
          const name = (bestPair.baseToken.name || "").trim();
          const symbol = (bestPair.baseToken.symbol || "").trim();
          const image = bestPair.info?.imageUrl || "";
          if (name || symbol) {
            return { name, symbol, image };
          }
        }
      }
    }
  } catch {
    // Dexscreener failed
  }

  // 3) Try Metaplex JS SDK as final fallback
  try {
    const { Metaplex } = await import("@metaplex-foundation/js");
    const metaplex = Metaplex.make(connection);
    const nft = await metaplex.nfts().findByMint({ mintAddress: mintPubkey });
    if (nft.name || nft.symbol) {
      return {
        name: (nft.name || "").trim(),
        symbol: (nft.symbol || "").trim(),
        image: nft.json?.image || "",
      };
    }
  } catch {
    // Metaplex SDK failed
  }

  // No metadata found
  return { name: "", symbol: "", image: "" };
}

export async function POST(request: Request) {
  try {
    const { mint, wallet } = await request.json();

    if (!mint || typeof mint !== "string") {
      return NextResponse.json({ error: "Missing mint address" }, { status: 400 });
    }
    if (!wallet || typeof wallet !== "string") {
      return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
    }

    // Validate addresses
    let mintPubkey: PublicKey;
    let walletPubkey: PublicKey;
    try {
      mintPubkey = new PublicKey(mint);
      walletPubkey = new PublicKey(wallet);
    } catch {
      return NextResponse.json({ error: "Invalid address format" }, { status: 400 });
    }

    const connection = new Connection(RPC_URL, "confirmed");

    // Get the fee payer of the oldest transaction (the creator)
    const { feePayer, oldestSig, error: feePayerError } = await getOldestTransactionFeePayer(connection, mintPubkey);

    // Strict verification required on ALL networks
    if (feePayerError || !feePayer) {
      return NextResponse.json({
        verified: false,
        error: feePayerError || "Could not determine token creator",
        debug: {
          mint,
          cluster: CLUSTER,
          wallet,
          derivedCreator: null,
          oldestSig,
        },
      });
    }

    // Compare the fee payer with the connected wallet
    const isCreator = feePayer === wallet;

    // Strict check - user must be the creator
    if (!isCreator) {
      return NextResponse.json({
        verified: false,
        error: "Wallet is not the token creator (fee payer of mint transaction)",
        debug: {
          mint,
          cluster: CLUSTER,
          wallet,
          derivedCreator: feePayer,
          oldestSig,
        },
      });
    }

    // Fetch token metadata for name/symbol/image
    const metadata = await fetchTokenMetadata(connection, mintPubkey);

    return NextResponse.json({
      verified: true,
      verificationMethod: "fee_payer",
      name: metadata.name,
      symbol: metadata.symbol,
      image: metadata.image,
      debug: {
        mint,
        cluster: CLUSTER,
        wallet,
        derivedCreator: feePayer,
        oldestSig,
      },
    });
  } catch (e: unknown) {
    console.error("/api/token/verify-creator: exception", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
