import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { escrow_id } = await request.json();

  const { data: tx } = await supabase
    .from("escrow_transactions")
    .select("*")
    .eq("id", escrow_id)
    .eq("buyer_id", user.id)
    .single();

  if (!tx) return NextResponse.json({ error: "Transazione non trovata." }, { status: 404 });
  if (tx.status !== "shipped")
    return NextResponse.json({ error: "L'articolo non risulta ancora spedito." }, { status: 400 });

  // Aggiorna a completed — qui in produzione si chiamerebbe Stripe per trasferire i fondi
  await supabase.from("escrow_transactions").update({
    status: "completed",
    delivered_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    stripe_transfer_id: "transfer_simulated_" + Date.now(), // in produzione: Stripe Transfer API
  }).eq("id", escrow_id);

  // Marca annuncio come venduto
  await supabase.from("listings").update({ status: "sold" }).eq("id", tx.listing_id);

  await supabase.from("escrow_events").insert({
    transaction_id: escrow_id, actor_id: user.id,
    event_type: "delivery_confirmed",
    data: { released_amount: tx.seller_payout_cents },
  });

  await supabase.from("notifications").insert({
    user_id: tx.seller_id,
    type: "payout_released",
    title: "Pagamento rilasciato!",
    body: `€${(tx.seller_payout_cents / 100).toLocaleString("it-IT")} sono in arrivo sul tuo conto.`,
    data: { escrow_id },
  });

  return NextResponse.json({ ok: true });
}
