"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { C, euros, inputStyle, labelStyle } from "@/lib/design";

const mono = { fontFamily: "DM Mono, Courier New, monospace", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase" as const };

function NewMessageForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const listingId = searchParams.get("listing");
  const supabase = createClient();
  const [listing, setListing] = useState<any>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = `/auth/login?redirect=/messages/new?listing=${listingId}`; return; }
      if (!listingId) { router.push("/search"); return; }

      const { data: l } = await supabase.from("listings")
        .select("id,title,price_cents,cover_image_url,slug,seller_id,seller:profiles(id,username,full_name)")
        .eq("id", listingId).single();

      if (!l) { setError("Annuncio non trovato."); setLoading(false); return; }
      if (l.seller_id === session.user.id) { router.push(`/listings/${l.slug ?? l.id}`); return; }

      const { data: existing } = await supabase.from("conversations")
        .select("id").eq("listing_id", listingId).eq("buyer_id", session.user.id).maybeSingle();
      if (existing) { router.push(`/messages/${existing.id}`); return; }

      setListing({ ...l, user_id: session.user.id });
      setLoading(false);
    };
    init();
  }, [listingId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !listing) return;
    setSending(true);

    const { data: conv, error: convErr } = await supabase.from("conversations")
      .insert({ listing_id: listing.id, buyer_id: listing.user_id, seller_id: listing.seller_id })
      .select("id").single();

    if (convErr || !conv) { setError("Errore."); setSending(false); return; }
    await supabase.from("messages").insert({ conversation_id: conv.id, sender_id: listing.user_id, body: body.trim() });
    router.push(`/messages/${conv.id}`);
  };

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ ...mono, color: C.muted }}>Caricamento...</span>
    </div>
  );

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "3rem 2rem" }}>
      <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "2rem", marginBottom: "0.5rem" }}>
        Contatta il <em style={{ fontStyle: "italic", color: C.orange }}>venditore</em>
      </h1>
      <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: C.muted, marginBottom: "2rem" }}>
        {listing ? `Scrivi a ${(listing?.seller as any)?.full_name ?? (listing?.seller as any)?.username}.` : ""}
      </p>

      {listing && (
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", border: `1px solid ${C.tan}`, padding: "0.9rem", marginBottom: "2rem" }}>
          {listing.cover_image_url && (
            <div style={{ width: "64px", height: "48px", background: C.dark, overflow: "hidden", flexShrink: 0 }}>
              <img src={listing.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div>
            <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "0.95rem" }}>{listing.title}</div>
            <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1rem", color: C.orange }}>{euros(listing.price_cents)}</div>
          </div>
        </div>
      )}

      {error && <div style={{ ...mono, fontSize: "0.58rem", color: C.orange, border: `1px solid ${C.orange}`, padding: "0.7rem", marginBottom: "1rem" }}>{error}</div>}

      <form onSubmit={send}>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Il tuo messaggio</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} required rows={6}
            placeholder={listing ? `Ciao, sono interessato a "${listing.title}". È ancora disponibile?` : "Scrivi il tuo messaggio..."}
            style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        <button type="submit" disabled={!body.trim() || sending} style={{ ...mono, width: "100%", background: body.trim() && !sending ? C.orange : C.muted, color: C.cream, padding: "0.9rem", border: "none", cursor: body.trim() ? "pointer" : "not-allowed" }}>
          {sending ? "Invio..." : "Invia messaggio →"}
        </button>
      </form>
    </div>
  );
}

export default function NewMessagePage() {
  return <Suspense><NewMessageForm /></Suspense>;
}
