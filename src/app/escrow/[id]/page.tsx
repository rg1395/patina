import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { C, euros, mono } from "@/lib/design";
import EscrowActions from "./EscrowActions";

type Props = { params: { id: string } };

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "In attesa di pagamento",
  payment_held: "Pagamento ricevuto — attesa spedizione",
  shipped: "Spedito — attesa conferma",
  delivered: "Consegnato",
  completed: "Completato",
  disputed: "Disputa aperta",
  refunded: "Rimborsato",
};

const STATUS_COLOR: Record<string, string> = {
  pending_payment: C.muted,
  payment_held: "#B7950B",
  shipped: "#1F618D",
  delivered: "#1E8449",
  completed: "#1E8449",
  disputed: "#C0392B",
  refunded: C.muted,
};

export default async function EscrowPage({ params }: Props) {
  const { id } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: tx } = await supabase
    .from("escrow_transactions")
    .select(`
      *,
      listing:listings(id,title,slug,cover_image_url,price_cents),
      buyer:profiles!escrow_transactions_buyer_id_fkey(id,username,avatar_url),
      seller:profiles!escrow_transactions_seller_id_fkey(id,username,avatar_url)
    `)
    .eq("id", id)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single();

  if (!tx) notFound();

  const { data: events } = await supabase
    .from("escrow_events")
    .select("*,actor:profiles(username)")
    .eq("transaction_id", id)
    .order("created_at", { ascending: true });

  const isBuyer = user.id === tx.buyer_id;
  const isSeller = user.id === tx.seller_id;
  const listing = tx.listing as any;
  const buyer = tx.buyer as any;
  const seller = tx.seller as any;

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "3rem 2rem" }}>
      <Link href="/garage" style={{ ...mono, fontSize: "0.55rem", color: C.muted, textDecoration: "none" }}>← Garage</Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "1.5rem 0 2rem" }}>
        <div>
          <div style={{ ...mono, fontSize: "0.52rem", color: C.muted, marginBottom: "0.3rem" }}>
            Transazione #{id.slice(0, 8).toUpperCase()}
          </div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "2rem", lineHeight: 1.1 }}>
            {listing?.title ?? "Articolo"}
          </h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ ...mono, fontSize: "0.55rem", color: STATUS_COLOR[tx.status] ?? C.muted, border: `1px solid ${STATUS_COLOR[tx.status] ?? C.tan}`, padding: "0.3rem 0.7rem", marginBottom: "0.3rem" }}>
            {STATUS_LABEL[tx.status] ?? tx.status}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: C.tan, borderRadius: "14px", overflow: "hidden", marginBottom: "2rem" }}>
        {/* Articolo */}
        <div style={{ background: C.cream, padding: "1.2rem", gridColumn: "1 / -1", display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ width: "80px", height: "60px", background: C.dark, flexShrink: 0, overflow: "hidden" }}>
            {listing?.cover_image_url
              ? <img src={listing.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", background: "#2a1f1a" }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1rem", marginBottom: "0.2rem" }}>{listing?.title}</div>
            <Link href={`/listings/${listing?.slug ?? listing?.id}`} style={{ ...mono, fontSize: "0.5rem", color: C.orange, textDecoration: "none" }}>Vedi annuncio →</Link>
          </div>
        </div>

        {/* Importi */}
        {[
          { l: "Prezzo concordato", v: euros(tx.amount_cents) },
          { l: "Commissione Patina (8%)", v: euros(tx.commission_cents) },
          { l: "Incasso venditore", v: euros(tx.seller_payout_cents), highlight: true },
        ].map(r => (
          <div key={r.l} style={{ background: C.cream, padding: "1rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ ...mono, fontSize: "0.52rem", color: C.muted }}>{r.l}</span>
            <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1.1rem", color: r.highlight ? C.orange : C.dark }}>{r.v}</span>
          </div>
        ))}

        {/* Parti */}
        {[
          { role: "Acquirente", p: buyer, isMe: isBuyer },
          { role: "Venditore", p: seller, isMe: isSeller },
        ].map(({ role, p, isMe }) => (
          <div key={role} style={{ background: C.cream, padding: "1rem 1.2rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: C.dark, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {p?.avatar_url
                ? <img src={p.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ ...mono, fontSize: "0.5rem", color: C.cream }}>{p?.username?.[0]?.toUpperCase()}</span>}
            </div>
            <div>
              <div style={{ ...mono, fontSize: "0.48rem", color: C.muted }}>{role}{isMe ? " (tu)" : ""}</div>
              <Link href={`/profile/${p?.username}`} style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.95rem", color: C.dark, textDecoration: "none" }}>@{p?.username}</Link>
            </div>
          </div>
        ))}

        {/* Tracking */}
        {tx.tracking_number && (
          <div style={{ background: C.cream, padding: "1rem 1.2rem", gridColumn: "1 / -1" }}>
            <div style={{ ...mono, fontSize: "0.5rem", color: C.muted, marginBottom: "0.2rem" }}>Tracking spedizione</div>
            <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1rem" }}>
              {tx.carrier && <span style={{ ...mono, fontSize: "0.55rem", color: C.orange, marginRight: "0.8rem" }}>{tx.carrier}</span>}
              {tx.tracking_number}
            </div>
          </div>
        )}
      </div>

      {/* Azioni contestuali */}
      <EscrowActions tx={tx} userId={user.id} isBuyer={isBuyer} isSeller={isSeller} />

      {/* Timeline eventi */}
      {(events ?? []).length > 0 && (
        <div style={{ marginTop: "2.5rem" }}>
          <div style={{ ...mono, fontSize: "0.58rem", color: C.muted, marginBottom: "1rem" }}>Storico transazione</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {(events ?? []).map((ev: any, i: number) => (
              <div key={ev.id} style={{ display: "flex", gap: "1rem", alignItems: "flex-start", paddingBottom: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: C.orange, flexShrink: 0 }} />
                  {i < (events?.length ?? 0) - 1 && <div style={{ width: "1px", flex: 1, background: C.tan, minHeight: "1.5rem" }} />}
                </div>
                <div style={{ paddingBottom: "0.5rem" }}>
                  <div style={{ ...mono, fontSize: "0.5rem", color: C.orange, textTransform: "uppercase", letterSpacing: "0.08em" }}>{ev.event_type.replace(/_/g, " ")}</div>
                  <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.85rem", color: C.muted }}>
                    {new Date(ev.created_at).toLocaleDateString("it-IT", { day:"2-digit", month:"long", hour:"2-digit", minute:"2-digit" })}
                    {ev.actor?.username && ` · @${ev.actor.username}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
