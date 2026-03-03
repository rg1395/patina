"use client";
import { useState } from "react";
import { C, mono } from "@/lib/design";

export default function WorkshopCard({ w }: { w: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ background: C.cream, padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
            <h3 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1.2rem" }}>{w.name}</h3>
            {w.is_verified && <span style={{ ...mono, fontSize: "0.45rem", color: C.orange, border: `1px solid ${C.orange}`, padding: "0.1rem 0.4rem" }}>✓ Verificata</span>}
          </div>
          <div style={{ ...mono, fontSize: "0.52rem", color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{w.city} · {w.country}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {w.rating_count > 0 && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1.1rem", color: C.orange }}>★ {w.rating_avg?.toFixed(1)}</div>
              <div style={{ ...mono, fontSize: "0.48rem", color: C.muted }}>{w.rating_count} rec.</div>
            </div>
          )}
          <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: `1px solid ${C.tan}`, cursor: "pointer", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.8rem", color: C.muted, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
            ▾
          </button>
        </div>
      </div>

      {w.specializations?.length > 0 && (
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
          {w.specializations.map((s: string) => (
            <span key={s} style={{ ...mono, fontSize: "0.48rem", color: C.orange, border: `1px solid ${C.orange}`, padding: "0.15rem 0.4rem" }}>{s}</span>
          ))}
        </div>
      )}

      {expanded && (
        <div style={{ borderTop: `1px solid ${C.light}`, paddingTop: "1rem", marginTop: "0.5rem" }}>
          {w.description && (
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "0.95rem", color: C.muted, lineHeight: 1.6, marginBottom: "1rem" }}>{w.description}</p>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "1rem" }}>
            {w.address && (
              <div>
                <div style={{ ...mono, fontSize: "0.48rem", color: C.muted, marginBottom: "0.2rem" }}>Indirizzo</div>
                <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.9rem" }}>{w.address}</div>
              </div>
            )}
            {w.opening_hours && (
              <div>
                <div style={{ ...mono, fontSize: "0.48rem", color: C.muted, marginBottom: "0.2rem" }}>Orari</div>
                <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.9rem" }}>{w.opening_hours}</div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {w.phone && (
              <a href={`tel:${w.phone}`} style={{ ...mono, fontSize: "0.52rem", color: C.dark, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                📞 {w.phone}
              </a>
            )}
            {w.email && (
              <a href={`mailto:${w.email}`} style={{ ...mono, fontSize: "0.52rem", color: C.dark, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                ✉ {w.email}
              </a>
            )}
            {w.website && (
              <a href={w.website} target="_blank" rel="noopener" style={{ ...mono, fontSize: "0.52rem", color: C.orange, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                ↗ Sito web
              </a>
            )}
          </div>
        </div>
      )}

      {!expanded && w.description && (
        <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "0.9rem", color: C.muted, lineHeight: 1.5, marginBottom: "0.5rem", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>
          {w.description}
        </p>
      )}

      {!expanded && (
        <button onClick={() => setExpanded(true)} style={{ ...mono, fontSize: "0.5rem", color: C.muted, background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: "0.3rem" }}>
          Mostra di più →
        </button>
      )}
    </div>
  );
}
