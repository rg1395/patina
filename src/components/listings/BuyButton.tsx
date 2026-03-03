"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { C, euros, mono } from "@/lib/design";

export default function BuyButton({ listingId, priceCents, isSeller }: {
  listingId: string; priceCents: number; isSeller: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (isSeller) return null;

  const buy = async () => {
    setLoading(true); setError("");
    const res = await fetch("/api/escrow/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: listingId, amount_cents: priceCents }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Errore."); setLoading(false); return; }
    router.push(`/escrow/${json.escrow_id}`);
  };

  return (
    <div style={{ marginTop: "0.8rem" }}>
      {error && <div style={{ ...mono, fontSize: "0.55rem", color: C.orange, marginBottom: "0.5rem" }}>{error}</div>}
      <button onClick={buy} disabled={loading} style={{ ...mono, width: "100%", background: loading ? C.muted : C.dark, color: C.cream, padding: "0.9rem", border: "none", cursor: loading ? "not-allowed" : "pointer", fontSize: "0.62rem" }}>
        {loading ? "Elaborazione..." : `Acquista ora — ${euros(priceCents)} →`}
      </button>
      <div style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "0.78rem", color: C.muted, textAlign: "center", marginTop: "0.4rem" }}>
        Pagamento protetto da escrow Patina
      </div>
    </div>
  );
}
