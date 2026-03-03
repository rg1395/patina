import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { C, euros, mono } from "@/lib/design";

const STATUS_LABEL: Record<string,string> = {
  pending_payment:"Attesa pagamento", payment_held:"Pagamento ricevuto",
  shipped:"Spedito", completed:"Completato", disputed:"Disputa", refunded:"Rimborsato",
};
const STATUS_COLOR: Record<string,string> = {
  pending_payment:C.muted, payment_held:"#B7950B", shipped:"#1F618D",
  completed:"#1E8449", disputed:"#C0392B", refunded:C.muted,
};

export default async function EscrowListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/escrow");

  const { data: asBuyer } = await supabase.from("escrow_transactions")
    .select("id,status,amount_cents,created_at,listing:listings(title,cover_image_url,slug),seller:profiles!escrow_transactions_seller_id_fkey(username)")
    .eq("buyer_id", user.id).order("created_at",{ascending:false}).limit(20);

  const { data: asSeller } = await supabase.from("escrow_transactions")
    .select("id,status,amount_cents,seller_payout_cents,created_at,listing:listings(title,cover_image_url,slug),buyer:profiles!escrow_transactions_buyer_id_fkey(username)")
    .eq("seller_id", user.id).order("created_at",{ascending:false}).limit(20);

  const TxRow = ({ tx, role }: { tx: any; role: "buyer"|"seller" }) => (
    <Link href={`/escrow/${tx.id}`} style={{ textDecoration:"none", color:"inherit", display:"flex", gap:"1rem", alignItems:"center", background:C.cream, padding:"1rem", borderBottom:`1px solid ${C.light}` }}>
      <div style={{ width:"56px",height:"42px",background:C.dark,flexShrink:0,overflow:"hidden" }}>
        {tx.listing?.cover_image_url ? <img src={tx.listing.cover_image_url} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <div style={{width:"100%",height:"100%",background:"#2a1f1a"}} />}
      </div>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontFamily:"Playfair Display, serif",fontWeight:700,fontSize:"0.95rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{tx.listing?.title}</div>
        <div style={{ ...mono,fontSize:"0.48rem",color:C.muted }}>
          {role === "buyer" ? `Venditore: @${tx.seller?.username}` : `Acquirente: @${tx.buyer?.username}`} · {new Date(tx.created_at).toLocaleDateString("it-IT")}
        </div>
      </div>
      <div style={{ textAlign:"right",flexShrink:0 }}>
        <div style={{ fontFamily:"Playfair Display, serif",fontWeight:700,fontSize:"1rem",color:C.orange }}>{euros(role === "seller" ? tx.seller_payout_cents : tx.amount_cents)}</div>
        <div style={{ ...mono,fontSize:"0.45rem",color:STATUS_COLOR[tx.status]??C.muted,border:`1px solid ${STATUS_COLOR[tx.status]??C.tan}`,padding:"0.1rem 0.4rem",marginTop:"0.2rem" }}>{STATUS_LABEL[tx.status]??tx.status}</div>
      </div>
    </Link>
  );

  return (
    <div style={{ maxWidth:"760px",margin:"0 auto",padding:"3rem 2rem" }}>
      <h1 style={{ fontFamily:"Playfair Display, serif",fontWeight:900,fontSize:"2rem",marginBottom:"2rem" }}>
        Le tue <em style={{ fontStyle:"italic",color:C.orange }}>transazioni</em>
      </h1>

      <div style={{ marginBottom:"2.5rem" }}>
        <div style={{ ...mono,fontSize:"0.58rem",color:C.muted,marginBottom:"1rem" }}>Acquisti ({asBuyer?.length??0})</div>
        {(asBuyer?.length??0) === 0
          ? <div style={{ padding:"2rem",border:`1px dashed ${C.tan}`,textAlign:"center",fontFamily:"Cormorant Garamond, serif",fontStyle:"italic",color:C.muted }}>Nessun acquisto ancora.</div>
          : <div style={{ border:`1px solid ${C.tan}` }}>{(asBuyer??[]).map(tx => <TxRow key={tx.id} tx={tx} role="buyer" />)}</div>}
      </div>

      <div>
        <div style={{ ...mono,fontSize:"0.58rem",color:C.muted,marginBottom:"1rem" }}>Vendite ({asSeller?.length??0})</div>
        {(asSeller?.length??0) === 0
          ? <div style={{ padding:"2rem",border:`1px dashed ${C.tan}`,textAlign:"center",fontFamily:"Cormorant Garamond, serif",fontStyle:"italic",color:C.muted }}>Nessuna vendita ancora.</div>
          : <div style={{ border:`1px solid ${C.tan}` }}>{(asSeller??[]).map(tx => <TxRow key={tx.id} tx={tx} role="seller" />)}</div>}
      </div>
    </div>
  );
}
