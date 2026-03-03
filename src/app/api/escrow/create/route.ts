import { rateLimit } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  if (!rateLimit(user.id, 3, 3600)) return NextResponse.json({ error: "Troppe richieste. Riprova tra un'ora." }, { status: 429 });

  const { listing_id, amount_cents } = await request.json();

  const { data: listing } = await supabase
    .from("listings")
    .select("id,seller_id,price_cents,title,status")
    .eq("id", listing_id)
    .single();

  if (!listing || listing.status !== "active")
    return NextResponse.json({ error: "Annuncio non disponibile." }, { status: 400 });
  if (listing.seller_id === user.id)
    return NextResponse.json({ error: "Non puoi acquistare il tuo annuncio." }, { status: 400 });

  const commission = Math.round(amount_cents * 0.08);
  const payout = amount_cents - commission;

  // Crea transazione escrow in stato pending_payment
  const { data: tx, error } = await supabase
    .from("escrow_transactions")
    .insert({
      listing_id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      amount_cents,
      commission_cents: commission,
      seller_payout_cents: payout,
      status: "pending_payment",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log evento
  await supabase.from("escrow_events").insert({
    transaction_id: tx.id,
    actor_id: user.id,
    event_type: "escrow_created",
    data: { listing_id, amount_cents },
  });

  // Notifica venditore
  await supabase.from("notifications").insert({
    user_id: listing.seller_id,
    type: "escrow_pending",
    title: "Nuovo acquisto in attesa",
    body: `Un acquirente vuole comprare "${listing.title}". Il pagamento è in corso.`,
    data: { escrow_id: tx.id },
  });

  return NextResponse.json({ escrow_id: tx.id });
}
