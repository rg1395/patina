"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/lib/design";

const mono = { fontFamily: "DM Mono, Courier New, monospace" };
const serif = { fontFamily: "Playfair Display, serif" };

export default function AddPartPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "", listing_id: "", installed_at: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Il nome del ricambio è obbligatorio."); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/vehicle-parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle_id: params.id,
        name: form.name,
        description: form.description || null,
        listing_id: form.listing_id || null,
        installed_at: form.installed_at || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Errore"); setLoading(false); return; }
    router.back();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.75rem 1rem",
    border: `1px solid ${C.tan}`, background: C.cream,
    fontFamily: "Cormorant Garamond, serif", fontSize: "1rem",
    color: C.dark, outline: "none",
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "3rem 2.5rem" }}>
      <button onClick={() => router.back()} style={{ ...mono, fontSize: "0.52rem", color: C.muted, background: "none", border: "none", cursor: "pointer", marginBottom: "2rem" }}>← Indietro</button>
      <h1 style={{ ...serif, fontWeight: 900, fontSize: "2rem", marginBottom: "2rem" }}>
        Aggiungi <em style={{ fontStyle: "italic", color: C.orange }}>ricambio</em>
      </h1>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.8rem 1rem", marginBottom: "1.5rem", ...mono, fontSize: "0.6rem" }}>{error}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        <div>
          <label style={{ ...mono, fontSize: "0.55rem", color: C.muted, display: "block", marginBottom: "0.4rem" }}>NOME RICAMBIO *</label>
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="es. Carburatore Weber 40 DCOE" style={inputStyle} />
        </div>
        <div>
          <label style={{ ...mono, fontSize: "0.55rem", color: C.muted, display: "block", marginBottom: "0.4rem" }}>DESCRIZIONE</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Note aggiuntive, provenienza, condizione..." rows={3} style={{ ...inputStyle, resize: "none" }} />
        </div>
        <div>
          <label style={{ ...mono, fontSize: "0.55rem", color: C.muted, display: "block", marginBottom: "0.4rem" }}>DATA INSTALLAZIONE</label>
          <input type="date" value={form.installed_at} onChange={e => set("installed_at", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ ...mono, fontSize: "0.55rem", color: C.muted, display: "block", marginBottom: "0.4rem" }}>ID ANNUNCIO PATINA (opzionale)</label>
          <input value={form.listing_id} onChange={e => set("listing_id", e.target.value)} placeholder="Incolla l'ID dell'annuncio se acquistato su Patina" style={inputStyle} />
          <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "0.85rem", color: C.muted, marginTop: "0.3rem" }}>
            Collega questo ricambio a un annuncio Patina per mostrare il link agli altri utenti.
          </p>
        </div>
        <button onClick={handleSubmit} disabled={loading} style={{ ...mono, fontSize: "0.65rem", background: loading ? C.muted : C.orange, color: C.cream, border: "none", padding: "0.85rem 2rem", cursor: loading ? "not-allowed" : "pointer", alignSelf: "flex-start" }}>
          {loading ? "Salvataggio..." : "Salva ricambio →"}
        </button>
      </div>
    </div>
  );
}
