import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Usa il service role key per operazioni server-side senza RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  // In produzione: verifica la firma Stripe
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // let event;
  // try {
  //   event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  // } catch (err) {
  //   return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  // }

  let event: any;
  try { event = JSON.parse(body); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object;
      const escrowId = pi.metadata?.escrow_id;
      if (!escrowId) break;

      await supabase.from("escrow_transactions").update({
        status: "payment_held",
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: pi.id,
      }).eq("id", escrowId);

      const { data: tx } = await supabase.from("escrow_transactions").select("seller_id, listing:listings(title)").eq("id", escrowId).single();
      if (tx) {
        await supabase.from("escrow_events").insert({ transaction_id: escrowId, event_type: "payment_received", data: { stripe_pi: pi.id } });
        await supabase.from("notifications").insert({
          user_id: (tx as any).seller_id,
          type: "payment_received",
          title: "Pagamento ricevuto!",
          body: `Puoi spedire "${(tx as any).listing?.title}".`,
          data: { escrow_id: escrowId },
        });
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object;
      const escrowId = pi.metadata?.escrow_id;
      if (!escrowId) break;
      await supabase.from("escrow_transactions").update({ status: "refunded", refunded_at: new Date().toISOString() }).eq("id", escrowId);
      await supabase.from("escrow_events").insert({ transaction_id: escrowId, event_type: "payment_failed", data: { stripe_pi: pi.id } });
      break;
    }

    case "transfer.created": {
      const transfer = event.data.object;
      const escrowId = transfer.metadata?.escrow_id;
      if (!escrowId) break;
      await supabase.from("escrow_transactions").update({ stripe_transfer_id: transfer.id }).eq("id", escrowId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

export const config = { api: { bodyParser: false } };
