import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/db";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { listing_id, authenticity, price_fairness, condition_accuracy, comment } = body;

  if (!listing_id || !authenticity || !price_fairness || !condition_accuracy) {
    return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
  }
  if ([authenticity, price_fairness, condition_accuracy].some((v) => v < 1 || v > 5)) {
    return NextResponse.json({ error: "I voti devono essere tra 1 e 5" }, { status: 400 });
  }

  const admin = getAdmin();

  // Check user is not the seller
  const { data: listing } = await admin.from("listings").select("seller_id").eq("id", listing_id).single();
  if (listing?.seller_id === user.id) {
    return NextResponse.json({ error: "Non puoi valutare il tuo annuncio" }, { status: 400 });
  }

  // Check if user is expert
  const { data: profile } = await admin.from("profiles").select("is_expert").eq("id", user.id).single();

  const { data, error } = await admin.from("part_valuations").upsert({
    listing_id,
    user_id: user.id,
    authenticity,
    price_fairness,
    condition_accuracy,
    comment: comment || null,
    is_expert: profile?.is_expert ?? false,
  }, { onConflict: "listing_id,user_id" }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
