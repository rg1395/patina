import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { escrow_id, tracking_number, carrier } = await request.json();

  const { data: tx } = await supabase
    .from("escrow_transactions")
    .select("*")
    .eq("id", escrow_id)
    .eq("seller_id", user.id)
    .single();

  if (!tx) return NextResponse.json({ error: "Transazione non trovata." }, { status: 404 });
  if (tx.status !== "payment_held")
    return NextResponse.json({ error: "Il pagamento non è ancora stato confermato." }, { status: 400 });

  const confirmBy = new Date();
  confirmBy.setDate(confirmBy.getDate() + 7);

  await supabase.from("escrow_transactions").update({
    status: "shipped",
    shipped_at: new Date().toISOString(),
    tracking_number: tracking_number || null,
    carrier: carrier || null,
    confirm_by: confirmBy.toISOString(),
  }).eq("id", escrow_id);

  await supabase.from("escrow_events").insert({
    transaction_id: escrow_id, actor_id: user.id,
    event_type: "marked_shipped",
    data: { tracking_number, carrier },
  });

  await supabase.from("notifications").insert({
    user_id: tx.buyer_id,
    type: "item_shipped",
    title: "Il tuo ordine è stato spedito",
    body: tracking_number ? `Tracciamento: ${tracking_number}` : "Il venditore ha dichiarato la spedizione.",
    data: { escrow_id },
  });

  return NextResponse.json({ ok: true });
}
