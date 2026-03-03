import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { C, euros, mono } from "@/lib/design";
import DisputeControls from "./DisputeControls";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim());

export default async function AdminDisputePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/");

  const { data: tx } = await supabase.from("escrow_transactions").select(`*,listing:listings(title,slug),buyer:profiles!escrow_transactions_buyer_id_fkey(id,username),seller:profiles!escrow_transactions_seller_id_fkey(id,username)`).eq("id", id).single();
  if (!tx) redirect("/admin");

  const { data: events } = await supabase.from("escrow_events").select("*,actor:profiles(username)").eq("transaction_id", id).order("created_at");

  return (
    <div style={{ minHeight: "100vh", background: C.dark, padding: "2.5rem" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <Link href="/admin" style={{ ...mono, fontSize: "0.55rem", color: C.muted, textDecoration: "none" }}>← Admin</Link>
        <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "1.8rem", color: C.cream, margin: "1.5rem 0 0.5rem" }}>Disputa #{id.slice(0,8).toUpperCase()}</h1>
        <div style={{ ...mono, fontSize: "0.55rem", color: "#E74C3C", marginBottom: "2rem" }}>{tx.dispute_reason}</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5px", background: "rgba(255,255,255,0.05)", marginBottom: "2rem" }}>
          {[
            { k: "Articolo", v: (tx.listing as any)?.title },
            { k: "Importo", v: euros(tx.amount_cents) },
            { k: "Acquirente", v: `@${(tx.buyer as any)?.username}` },
            { k: "Venditore", v: `@${(tx.seller as any)?.username}` },
            { k: "Commissione Patina", v: euros(tx.commission_cents) },
            { k: "Payout venditore", v: euros(tx.seller_payout_cents) },
            { k: "Aperta il", v: tx.disputed_at ? new Date(tx.disputed_at).toLocaleDateString("it-IT") : "—" },
            { k: "Stato", v: tx.status },
          ].map(r => (
            <div key={r.k} style={{ background: "#1e1a16", padding: "0.8rem 1.2rem", display: "flex", justifyContent: "space-between" }}>
              <span style={{ ...mono, fontSize: "0.5rem", color: C.muted }}>{r.k}</span>
              <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.9rem", color: C.cream }}>{r.v}</span>
            </div>
          ))}
        </div>

        <DisputeControls escrowId={id} buyerId={(tx.buyer as any)?.id} sellerId={(tx.seller as any)?.id} />

        <div style={{ marginTop: "2rem" }}>
          <div style={{ ...mono, fontSize: "0.55rem", color: C.muted, marginBottom: "1rem" }}>Timeline</div>
          {(events ?? []).map((ev: any) => (
            <div key={ev.id} style={{ background: "#1e1a16", padding: "0.8rem 1rem", marginBottom: "1.5px", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.orange, marginTop: "0.3rem", flexShrink: 0 }} />
              <div>
                <div style={{ ...mono, fontSize: "0.48rem", color: C.orange }}>{ev.event_type.replace(/_/g," ")}</div>
                <div style={{ ...mono, fontSize: "0.45rem", color: C.muted }}>{new Date(ev.created_at).toLocaleString("it-IT")}{ev.actor?.username ? ` · @${ev.actor.username}` : ""}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
