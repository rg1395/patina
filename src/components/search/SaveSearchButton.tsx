"use client";
import { useState } from "react";
import { C } from "@/lib/design";

const mono = { fontFamily: "DM Mono, Courier New, monospace" };

interface Props {
  userId: string | null;
  query: string;
  makes: string[];
  conditions: string[];
  minPrice: number;
  maxPrice: number;
}

export default function SaveSearchButton({ userId, query, makes, conditions, minPrice, maxPrice }: Props) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState(query || makes.join(", ") || "Ricerca");

  if (!userId) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, query, makes, conditions, min_price: minPrice, max_price: maxPrice }),
      });
      if (res.ok) { setSaved(true); setShowInput(false); }
    } finally { setLoading(false); }
  };

  if (saved) {
    return (
      <span style={{ ...mono, fontSize: "0.55rem", color: "#2d7a2d" }}>✓ Ricerca salvata</span>
    );
  }

  if (showInput) {
    return (
      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          placeholder="Nome ricerca..."
          autoFocus
          style={{ padding: "0.35rem 0.6rem", border: `1px solid ${C.tan}`, fontFamily: "Cormorant Garamond, serif", fontSize: "0.9rem", outline: "none", width: "160px" }}
        />
        <button onClick={handleSave} disabled={loading} style={{ ...mono, fontSize: "0.52rem", background: C.orange, color: C.cream, border: "none", padding: "0.35rem 0.7rem", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "..." : "Salva"}
        </button>
        <button onClick={() => setShowInput(false)} style={{ ...mono, fontSize: "0.52rem", background: "transparent", color: C.muted, border: `1px solid ${C.tan}`, padding: "0.35rem 0.5rem", cursor: "pointer" }}>
          ✕
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setShowInput(true)} style={{ ...mono, fontSize: "0.55rem", background: "transparent", color: C.muted, border: `1px solid ${C.tan}`, padding: "0.4rem 0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>
      🔔 Salva ricerca
    </button>
  );
}
