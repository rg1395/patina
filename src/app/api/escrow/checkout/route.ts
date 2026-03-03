import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// NOTA: Questo è un placeholder. Per la produzione:
// 1. npm install stripe
// 2. Aggiungi STRIPE_SECRET_KEY in .env.local
// 3. Decommenta il codice Stripe sotto

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/auth/login", request.url));

  const { searchParams } = new URL(request.url);
  const escrowId = searchParams.get("id");

  const { data: tx } = await supabase
    .from("escrow_transactions")
    .select("*, listing:listings(title)")
    .eq("id", escrowId)
    .eq("buyer_id", user.id)
    .single();

  if (!tx) return NextResponse.redirect(new URL("/garage", request.url));

  // ============================================================
  // PRODUZIONE: sostituisci questo blocco con Stripe Checkout
  // ============================================================
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const session = await stripe.checkout.sessions.create({
  //   payment_method_types: ["card"],
  //   line_items: [{
  //     price_data: {
  //       currency: "eur",
  //       product_data: { name: tx.listing.title },
  //       unit_amount: tx.amount_cents,
  //     },
  //     quantity: 1,
  //   }],
  //   mode: "payment",
  //   success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/escrow/${escrowId}?payment=success`,
  //   cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/escrow/${escrowId}`,
  //   metadata: { escrow_id: escrowId, buyer_id: user.id },
  //   payment_intent_data: {
  //     capture_method: "manual", // trattieni i fondi, non addebitare subito
  //     metadata: { escrow_id: escrowId },
  //   },
  // });
  // return NextResponse.redirect(session.url!);
  // ============================================================

  // SIMULAZIONE per sviluppo: aggiorna direttamente a payment_held
  await supabase.from("escrow_transactions").update({
    status: "payment_held",
    paid_at: new Date().toISOString(),
    stripe_payment_intent_id: "pi_simulated_" + Date.now(),
  }).eq("id", escrowId);

  await supabase.from("escrow_events").insert({
    transaction_id: escrowId,
    actor_id: user.id,
    event_type: "payment_received",
    data: { simulated: true },
  });

  await supabase.from("notifications").insert({
    user_id: tx.seller_id,
    type: "payment_received",
    title: "Pagamento ricevuto!",
    body: `Il pagamento per "${(tx.listing as any)?.title}" è stato confermato. Puoi spedire l'articolo.`,
    data: { escrow_id: escrowId },
  });

  return NextResponse.redirect(new URL(`/escrow/${escrowId}?payment=success`, request.url));
}
