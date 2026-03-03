import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { escrow_id, reason } = await request.json();

  const { data: tx } = await supabase
    .from("escrow_transactions")
    .select("*")
    .eq("id", escrow_id)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single();

  if (!tx) return NextResponse.json({ error: "Transazione non trovata." }, { status: 404 });
  if (!["payment_held", "shipped"].includes(tx.status))
    return NextResponse.json({ error: "Non è possibile aprire una disputa in questo stato." }, { status: 400 });

  await supabase.from("escrow_transactions").update({
    status: "disputed",
    disputed_at: new Date().toISOString(),
    dispute_reason: reason,
  }).eq("id", escrow_id);

  await supabase.from("escrow_events").insert({
    transaction_id: escrow_id, actor_id: user.id,
    event_type: "dispute_opened",
    data: { reason },
  });

  // Notifica l'altra parte
  const otherId = user.id === tx.buyer_id ? tx.seller_id : tx.buyer_id;
  await supabase.from("notifications").insert({
    user_id: otherId,
    type: "dispute_opened",
    title: "Disputa aperta",
    body: `Una disputa è stata aperta sulla transazione. Il team Patina esaminerà il caso.`,
    data: { escrow_id },
  });

  return NextResponse.json({ ok: true });
}
