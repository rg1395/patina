"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { C, MAKES } from "@/lib/design";

const mono = { fontFamily: "DM Mono, Courier New, monospace" };
const serif = { fontFamily: "Playfair Display, serif" };

const SUGGESTED_TAGS = ["Weber", "Carburazione", "Restauro", "NOS", "Motore", "Elettrica", "Carrozzeria", "Valutazione", "Guida all'acquisto", "Storia"];

export default function NewArticlePage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", excerpt: "", body: "", cover_image_url: "", tags: [] as string[], makes: [] as string[] });
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const toggleTag = (t: string) => {
    set("tags", form.tags.includes(t) ? form.tags.filter(x => x !== t) : [...form.tags, t]);
  };

  const toggleMake = (m: string) => {
    set("makes", form.makes.includes(m) ? form.makes.filter(x => x !== m) : [...form.makes, m]);
  };

  const addCustomTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      set("tags", [...form.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.body.trim()) { setError("Titolo e testo sono obbligatori."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Errore"); setLoading(false); return; }
      router.push(`/rubriche/${data.slug}`);
    } catch {
      setError("Errore di rete."); setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.75rem 1rem",
    border: `1px solid ${C.tan}`, background: C.cream,
    fontFamily: "Cormorant Garamond, serif", fontSize: "1rem",
    color: C.dark, outline: "none",
  };

  return (
    <div>
      <div style={{ background: C.dark, padding: "3rem 2.5rem" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div style={{ ...mono, fontSize: "0.58rem", color: C.orange, marginBottom: "0.5rem" }}>Rubriche</div>
          <h1 style={{ ...serif, fontWeight: 900, fontSize: "2.2rem", color: C.cream }}>Scrivi un <em style={{ fontStyle: "italic" }}>articolo</em></h1>
        </div>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "3rem 2.5rem" }}>
        {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.8rem 1rem", marginBottom: "1.5rem", ...mono, fontSize: "0.6rem" }}>{error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Title */}
          <div>
            <label style={{ ...mono, fontSize: "0.55rem", color: C.muted, display: "block", marginBottom: "0.4rem" }}>TITOLO *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Come riconoscere un Weber 40 DCOE falso..." style={{ ...inputStyle, ...serif, fontWeight: 700, fontSize: "1.3rem" }} />
          </div>

          {/* Excerpt */}
          <div>
            <label style={{ ...mono, fontSize: "0.55rem", color: C.muted, display: "block", marginBottom: "0.4rem" }}>SOMMARIO (opzionale)</label>
            <input value={form.excerpt} onChange={e => set("excerpt", e.target.value)} placeholder="Una breve descrizione dell'articolo..." style={inputStyle} />
          </div>

          {/* Cover URL */}
          <div>
            <label style={{ ...mono, fontSize: "0.55rem", color: C.muted, display: "block", marginBottom: "0.4rem" }}>URL IMMAGINE DI COPERTINA (opzionale)</label>
            <input value={form.cover_image_url} onChange={e => set("cover_image_url", e.target.value)} placeholder="https://..." style={inputStyle} />
          </div>

          {/* Body */}
          <div>
            <label style={{ ...mono, fontSize: "0.55rem", color: C.muted, display: "block", marginBottom: "0.4rem" }}>TESTO * <span style={{ color: C.muted, fontWeight: "normal" }}>(usa righe vuote per dividere i paragrafi)</span></label>
            <textarea
              value={form.body}
              onChange={e => set("body", e.target.value)}
              placeholder="Scrivi l'articolo qui. Ogni paragrafo separato da una riga vuota..."
              rows={16}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
            />
          </div>

          {/* Tags */}
          <div>
            <label style={{ ...mono, fontSize: "0.55rem", color: C.muted, display: "block", marginBottom: "0.6rem" }}>TAG</label>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
              {SUGGESTED_TAGS.map(t => (
                <button key={t} onClick={() => toggleTag(t)} style={{ ...mono, fontSize: "0.52rem", padding: "0.3rem 0.7rem", border: `1px solid ${form.tags.includes(t) ? C.orange : C.tan}`, background: form.tags.includes(t) ? C.orange : "transparent", color: form.tags.includes(t) ? C.cream : C.muted, cursor: "pointer" }}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustomTag()} placeholder="Aggiungi tag personalizzato..." style={{ ...inputStyle, flex: 1 }} />
              <button onClick={addCustomTag} style={{ ...mono, fontSize: "0.55rem", background: C.dark, color: C.cream, border: "none", padding: "0 1rem", cursor: "pointer" }}>+</button>
            </div>
          </div>

          {/* Makes */}
          <div>
            <label style={{ ...mono, fontSize: "0.55rem", color: C.muted, display: "block", marginBottom: "0.6rem" }}>MARCHE TRATTATE</label>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {MAKES.filter((m, i, a) => a.indexOf(m) === i).map(m => (
                <button key={m} onClick={() => toggleMake(m)} style={{ ...mono, fontSize: "0.5rem", padding: "0.25rem 0.6rem", border: `1px solid ${form.makes.includes(m) ? C.orange : C.tan}`, background: form.makes.includes(m) ? C.orange : "transparent", color: form.makes.includes(m) ? C.cream : C.muted, cursor: "pointer" }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Info box */}
          <div style={{ background: C.light, borderLeft: `3px solid ${C.orange}`, padding: "0.8rem 1rem" }}>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "0.95rem", color: C.muted }}>
              Gli articoli degli esperti vengono inviati in revisione agli admin prima della pubblicazione. Riceverai una notifica quando sarà approvato.
            </p>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading} style={{ ...mono, fontSize: "0.65rem", background: loading ? C.muted : C.orange, color: C.cream, border: "none", padding: "0.9rem 2rem", cursor: loading ? "not-allowed" : "pointer", alignSelf: "flex-start" }}>
            {loading ? "Invio in corso..." : "Invia per revisione →"}
          </button>
        </div>
      </div>
    </div>
  );
}
