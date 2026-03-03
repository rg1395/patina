"use client";
import { useState } from "react";
import { C } from "@/lib/design";

type Tab = "raduno" | "rubrica";

export default function SuggestForm({ user, defaultTab = "raduno" }: { user: any; defaultTab?: Tab }) {
  const tab = defaultTab; // fixed — no switching, each page shows its own
  const [form, setForm] = useState({ title: "", location: "", date: "", description: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isRaduno = tab === "raduno";
  const inp: React.CSSProperties = {
    width: "100%", background: "rgba(246,242,235,0.07)", border: "1px solid rgba(200,184,152,0.2)",
    borderRadius: "10px", color: C.cream, fontFamily: "Lora, serif", fontStyle: "italic",
    fontSize: "1rem", padding: ".85rem 1rem", marginBottom: ".8rem", outline: "none",
  };

  if (!user) return (
    <div style={{ background: C.dark, borderRadius: "16px", padding: "2rem 2rem", display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: "200px" }}>
        <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "1.3rem", color: C.cream, marginBottom: ".4rem" }}>
          {isRaduno ? "Conosci un raduno?" : "Hai un'idea per una rubrica?"}
        </div>
        <p style={{ fontFamily: "Lora, serif", fontStyle: "italic", color: "rgba(246,242,235,0.45)", fontSize: ".9rem", lineHeight: 1.6 }}>
          {isRaduno ? "Segnalacelo e lo aggiungiamo al calendario." : "Proponi un argomento agli esperti della community."}
        </p>
      </div>
      <a href="/auth/login" style={{ fontFamily: "DM Mono, monospace", fontSize: ".62rem", letterSpacing: ".1em", textTransform: "uppercase" as const, background: C.orange, color: C.cream, padding: ".8rem 1.6rem", borderRadius: "100px", textDecoration: "none", whiteSpace: "nowrap" }}>
        Accedi per suggerire →
      </a>
    </div>
  );

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setLoading(true); setError("");
    try {
      const endpoint = isRaduno ? "/api/suggestions/event" : "/api/suggestions/article";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Errore"); setLoading(false); return; }
      setSent(true);
    } catch {
      setError("Errore di rete.");
    }
    setLoading(false);
  };

  if (sent) return (
    <div style={{ background: C.dark, borderRadius: "16px", padding: "2.5rem", textAlign: "center" }}>
      <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "1.6rem", color: C.cream, marginBottom: ".5rem" }}>Grazie!</div>
      <p style={{ fontFamily: "Lora, serif", fontStyle: "italic", color: "rgba(246,242,235,0.5)", fontSize: "1rem", lineHeight: 1.65 }}>
        {isRaduno
          ? "Il raduno è stato aggiunto in bozza al calendario. Lo pubblicheremo dopo verifica."
          : "La proposta è stata inviata. Gli esperti ti risponderanno presto."}
      </p>
      <button onClick={() => { setSent(false); setForm({ title: "", location: "", date: "", description: "" }); }}
        style={{ fontFamily: "DM Mono, monospace", fontSize: ".55rem", letterSpacing: ".1em", textTransform: "uppercase" as const, background: "transparent", color: "rgba(246,242,235,0.35)", border: "none", cursor: "pointer", marginTop: "1.2rem" }}>
        Invia un altro →
      </button>
    </div>
  );

  return (
    <div style={{ background: C.dark, borderRadius: "16px", padding: "2rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".58rem", letterSpacing: ".18em", textTransform: "uppercase" as const, color: C.orange, marginBottom: ".4rem" }}>
          {isRaduno ? "Suggerisci un raduno" : "Proponi una rubrica"}
        </div>
        <h3 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "1.5rem", color: C.cream, lineHeight: 1.15 }}>
          {isRaduno ? "Vuoi suggerire un evento o raduno?" : "Hai un'idea per un articolo tecnico?"}
        </h3>
      </div>

      {error && <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".55rem", color: "#fca5a5", marginBottom: ".8rem", background: "rgba(239,68,68,0.1)", padding: ".6rem .8rem", borderRadius: "8px" }}>{error}</div>}

      {isRaduno ? (
        <>
          <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nome del raduno o evento" />
          <input style={inp} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Città o luogo" />
          <input style={inp} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} placeholder="Data o periodo (es. 15 Giugno 2026)" />
          <textarea style={{ ...inp, resize: "none" as const }} rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Note aggiuntive (opzionale)" />
        </>
      ) : (
        <>
          <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Titolo o argomento dell'articolo" />
          <textarea style={{ ...inp, resize: "none" as const }} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Di cosa dovrebbe parlare? Perché è utile per la community?" />
        </>
      )}

      <button onClick={handleSubmit} disabled={loading || !form.title.trim()}
        style={{ width: "100%", background: loading || !form.title.trim() ? C.muted : C.orange, color: C.cream, border: "none", borderRadius: "100px", padding: "1rem", fontFamily: "DM Mono, monospace", fontSize: ".65rem", letterSpacing: ".1em", textTransform: "uppercase" as const, cursor: loading || !form.title.trim() ? "not-allowed" : "pointer", transition: "background .2s" }}>
        {loading ? "Invio in corso..." : isRaduno ? "Segnala il raduno →" : "Proponi la rubrica →"}
      </button>
    </div>
  );
}
