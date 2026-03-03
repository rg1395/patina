"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/design";
import OfferModal from "./OfferModal";

const mono = { fontFamily: "DM Mono, Courier New, monospace", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase" as const };

export default function ListingActions({ listingId, listingTitle, priceCents, isNegotiable, sellerId }: {
  listingId: string; listingTitle: string; priceCents: number; isNegotiable: boolean; sellerId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showOffer, setShowOffer] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);
      const { data } = await supabase.from("saved_listings").select("listing_id").eq("user_id", session.user.id).eq("listing_id", listingId).maybeSingle();
      setSaved(!!data);
    });
  }, [listingId]);

  const toggleSave = async () => {
    if (!userId) { router.push(`/auth/login?redirect=/listings/${listingId}`); return; }
    setSaving(true);
    if (saved) {
      await supabase.from("saved_listings").delete().eq("user_id", userId).eq("listing_id", listingId);
      setSaved(false);
    } else {
      await supabase.from("saved_listings").insert({ user_id: userId, listing_id: listingId });
      setSaved(true);
    }
    setSaving(false);
  };

  const isOwner = userId === sellerId;

  if (!userId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        <Link href={`/auth/login?redirect=/listings/${listingId}`} style={{ ...mono, background: C.orange, color: C.cream, padding: "0.9rem", textAlign: "center", textDecoration: "none", display: "block" }}>
          Accedi per contattare →
        </Link>
        <button onClick={toggleSave} style={{ ...mono, background: "transparent", color: C.muted, padding: "0.7rem", border: "none", cursor: "pointer", width: "100%" }}>
          ♡ Salva annuncio
        </button>
      </div>
    );
  }

  if (isOwner) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        <div style={{ ...mono, fontSize: "0.55rem", color: C.muted, textAlign: "center", padding: "0.5rem", background: C.light }}>
          Il tuo annuncio
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        <Link
          href={`/messages/new?listing=${listingId}`}
          style={{ ...mono, background: C.orange, color: C.cream, padding: "0.9rem", textAlign: "center", textDecoration: "none", display: "block" }}
        >
          Contatta il venditore →
        </Link>
        {isNegotiable && (
          <button
            onClick={() => setShowOffer(true)}
            style={{ ...mono, background: "transparent", color: C.dark, padding: "0.9rem", border: `1px solid ${C.tan}`, cursor: "pointer", width: "100%" }}
          >
            Fai un&apos;offerta
          </button>
        )}
        <button
          onClick={toggleSave}
          disabled={saving}
          style={{ ...mono, fontSize: "0.62rem", background: "transparent", color: saved ? C.orange : C.muted, padding: "0.6rem", border: "none", cursor: "pointer", width: "100%" }}
        >
          {saved ? "♥ Salvato" : "♡ Salva annuncio"}
        </button>
      </div>

      {showOffer && (
        <OfferModal
          listingId={listingId}
          listingTitle={listingTitle}
          askingCents={priceCents}
          onClose={() => setShowOffer(false)}
        />
      )}
    </>
  );
}
