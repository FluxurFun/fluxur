import { NextResponse } from "next/server";
import { supabase } from "@/server/supabase";

export async function GET(req: Request) {
  const { pathname } = new URL(req.url);
  const parts = pathname.split("/").filter(Boolean);
  const mint = parts[parts.length - 1] || "";
  if (!mint) {
    return NextResponse.json({ error: "Missing mint" }, { status: 400 });
  }
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("commitments")
    .select("mint,name,symbol,creator_wallet,escrow_address,custody_wallet,payout_wallet,created_at,image_url,metadata_uri,website,twitter,telegram")
    .eq("mint", mint)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found", mint }, { status: 404 });

  return NextResponse.json({
    mint: data.mint,
    name: data.name,
    symbol: data.symbol,
    createdAt: data.created_at,
    escrowAddress: data.escrow_address,
    custodyWallet: data.custody_wallet,
    creatorPayoutWallet: data.payout_wallet,
    creatorWallet: data.creator_wallet,
    metadataUri: data.metadata_uri,
    imageUrl: data.image_url,
    website: data.website,
    twitter: data.twitter,
    telegram: data.telegram,
  });
}
