import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { C } from "@/lib/design";

const mono = { fontFamily: "DM Mono, Courier New, monospace" };
const serif = { fontFamily: "Playfair Display, serif" };

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/messages");

  const { data: convs } = await supabase
    .from("conversations")
    .select(`id, last_message_at, buyer_id, seller_id,
      buyer:profiles!conversations_buyer_id_fkey(id,username,full_name,avatar_url),
      seller:profiles!conversations_seller_id_fkey(id,username,full_name,avatar_url),
      listing:listings(id,title,cover_image_url,price_cents,slug)`)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  const conversations = convs ?? [];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 2rem" }}>
      <h1 style={{ ...serif, fontWeight: 900, fontSize: "2.2rem", marginBottom: "0.5rem" }}>Messaggi</h1>
      <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: C.muted, marginBottom: "2.5rem" }}>
        Le tue conversazioni con acquirenti e venditori.
      </p>

      {conversations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 2rem", border: `1px dashed ${C.tan}`, color: C.muted }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: 0.3 }}>✉</div>
          <div style={{ ...serif, fontSize: "1.4rem", color: C.dark, marginBottom: "0.5rem" }}>Nessun messaggio</div>
          <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic" }}>
            Contatta un venditore da un annuncio per iniziare.
          </p>
          <Link href="/search" style={{ ...mono, fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: C.orange, textDecoration: "none", display: "block", marginTop: "1.5rem" }}>
            Sfoglia ricambi →
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: C.tan, borderRadius: "14px", overflow: "hidden" }}>
          {conversations.map((c: any) => {
            const other = c.buyer_id === user.id ? c.seller : c.buyer;
            const listing = c.listing;
            return (
              <Link key={c.id} href={`/messages/${c.id}`} style={{ background: C.cream, textDecoration: "none", color: "inherit", display: "flex", gap: "1rem", padding: "1.2rem", alignItems: "center" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: C.dark, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", ...serif, fontWeight: 900, fontSize: "1rem", color: C.cream }}>
                  {other?.avatar_url ? <img src={other.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (other?.username ?? "?")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                    <span style={{ ...serif, fontWeight: 700, fontSize: "1rem" }}>{other?.full_name ?? other?.username ?? "—"}</span>
                    <span style={{ ...mono, fontSize: "0.5rem", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{new Date(c.last_message_at).toLocaleDateString("it-IT")}</span>
                  </div>
                  {listing && (
                    <div style={{ ...mono, fontSize: "0.52rem", letterSpacing: "0.06em", textTransform: "uppercase", color: C.orange, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      Re: {listing.title}
                    </div>
                  )}
                </div>
                {listing?.cover_image_url && (
                  <div style={{ width: "48px", height: "36px", background: C.dark, flexShrink: 0, overflow: "hidden" }}>
                    <img src={listing.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
