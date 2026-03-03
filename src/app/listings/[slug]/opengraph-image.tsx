import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const supabase = await createClient();
  const { data: listing } = await supabase.from("listings").select("title,price_cents,cover_image_url,condition,location_city").eq("slug", slug).single();

  const price = listing ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format((listing.price_cents ?? 0) / 100) : "";

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#1A1612", position: "relative" }}>
      {listing?.cover_image_url && (
        <img src={listing.cover_image_url} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(26,22,18,0.95) 50%, rgba(26,22,18,0.4))" }} />
      <div style={{ position: "relative", padding: "60px", display: "flex", flexDirection: "column", justifyContent: "flex-end", flex: 1 }}>
        <div style={{ fontSize: 18, color: "#C4622D", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16 }}>Patina — Ricambi d'epoca</div>
        <div style={{ fontSize: 52, fontWeight: 900, color: "#F5F0E8", lineHeight: 1.1, marginBottom: 20, maxWidth: 700 }}>{listing?.title ?? "Ricambio d'epoca"}</div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <span style={{ fontSize: 36, fontWeight: 900, color: "#C4622D" }}>{price}</span>
          {listing?.location_city && <span style={{ fontSize: 20, color: "rgba(245,240,232,0.6)" }}>{listing.location_city}</span>}
        </div>
      </div>
    </div>,
    size
  );
}
