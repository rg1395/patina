"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { C, inputStyle, labelStyle, mono } from "@/lib/design";

function ReviewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listing");
  const reviewedId = searchParams.get("user");

  const supabase = createClient();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listing, setListing] = useState<any>(null);
  const [reviewed, setReviewed] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/auth/login"; return; }
      if (listingId) {
        const { data } = await supabase.from("listings").select("id,title,cover_image_url,slug").eq("id", listingId).single();
        setListing(data);
      }
      if (reviewedId) {
        const { data } = await supabase.from("profiles").select("id,username,avatar_url,full_name").eq("id", reviewedId).single();
        setReviewed(data);
      }
    };
    init();
  }, [listingId, reviewedId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError("Seleziona una valutazione."); return; }
    setLoading(true); setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase.from("reviews").insert({
      reviewer_id: user.id,
      reviewed_id: reviewedId,
      listing_id: listingId || null,
      rating,
      body: body.trim() || null,
    });

    if (err) {
      if (err.code === "23505") setError("Hai già lasciato una recensione per questa transazione.");
      else setError(err.message);
      setLoading(false); return;
    }

    // Aggiorna media rating del venditore
    const { data: reviews } = await supabase.from("reviews").select("rating").eq("reviewed_id", reviewedId);
    if (reviews?.length) {
      const avg = reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length;
      await supabase.from("profiles").update({ rating_avg: Math.round(avg * 100) / 100, rating_count: reviews.length }).eq("id", reviewedId);
    }

    router.push(`/profile/${reviewed?.username ?? ""}`);
  };

  return (
    <div style={{ maxWidth: "520px", margin: "0 auto", padding: "3rem 2rem" }}>
      <Link href={`/profile/${reviewed?.username ?? ""}`} style={{ ...mono, fontSize: "0.55rem", color: C.muted, textDecoration: "none" }}>← Profilo</Link>
      <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "2rem", margin: "1.5rem 0 2rem" }}>
        Lascia una <em style={{ fontStyle: "italic", color: C.orange }}>recensione</em>
      </h1>

      {reviewed && (
        <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", marginBottom: "1.5rem", padding: "1rem", background: C.light }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: C.dark, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {reviewed.avatar_url
              ? <img src={reviewed.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ ...mono, fontSize: "0.55rem", color: C.cream }}>{reviewed.username?.[0]?.toUpperCase()}</span>}
          </div>
          <div>
            <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "0.95rem" }}>{reviewed.full_name ?? reviewed.username}</div>
            <div style={{ ...mono, fontSize: "0.5rem", color: C.muted }}>@{reviewed.username}</div>
          </div>
        </div>
      )}

      {listing && (
        <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", marginBottom: "1.5rem", padding: "0.8rem 1rem", border: `1px solid ${C.tan}` }}>
          <div style={{ width: "48px", height: "36px", background: C.dark, flexShrink: 0, overflow: "hidden" }}>
            {listing.cover_image_url && <img src={listing.cover_image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
          <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.9rem", color: C.muted, fontStyle: "italic" }}>{listing.title}</div>
        </div>
      )}

      {error && <div style={{ ...mono, fontSize: "0.58rem", color: C.orange, border: `1px solid ${C.orange}`, padding: "0.7rem", marginBottom: "1.2rem" }}>{error}</div>}

      <form onSubmit={submit}>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Valutazione *</label>
          <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem" }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} type="button"
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "2rem", lineHeight: 1, color: star <= (hovered || rating) ? "#C4622D" : C.tan, transition: "color 0.1s" }}>
                ★
              </button>
            ))}
          </div>
          <div style={{ ...mono, fontSize: "0.5rem", color: C.muted, marginTop: "0.4rem" }}>
            {rating === 1 ? "Pessimo" : rating === 2 ? "Scarso" : rating === 3 ? "Nella media" : rating === 4 ? "Buono" : rating === 5 ? "Eccellente" : "Seleziona"}
          </div>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Commento (opzionale)</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="Descrivi la tua esperienza con questo venditore..." style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        <button type="submit" disabled={loading || rating === 0} style={{ ...mono, width: "100%", background: loading || rating === 0 ? C.muted : C.orange, color: C.cream, padding: "0.9rem", border: "none", cursor: loading || rating === 0 ? "not-allowed" : "pointer" }}>
          {loading ? "Invio..." : "Pubblica recensione →"}
        </button>
      </form>
    </div>
  );
}

export default function ReviewNewPage() { return <Suspense><ReviewForm /></Suspense>; }
