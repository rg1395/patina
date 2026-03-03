"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { C, inputStyle, labelStyle } from "@/lib/design";

const mono = { fontFamily: "DM Mono, Courier New, monospace", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase" as const };

const CATS = ["tecnica", "mercato", "storia", "eventi", "officine", "generale"];

export default function NewThreadPage() {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("generale");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = "/auth/login?redirect=/community/new";
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { setError("Titolo e contenuto sono obbligatori."); return; }
    setLoading(true); setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth/login"; return; }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) + "-" + Date.now().toString(36);

    const res = await fetch("/api/forum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), body: body.trim(), category }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Errore."); setLoading(false); return; }
    router.push(`/community/${json.slug}`);
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "3rem 2rem" }}>
      <Link href="/community" style={{ ...mono, fontSize: "0.58rem", color: C.muted, textDecoration: "none" }}>← Community</Link>
      <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "2rem", margin: "1.5rem 0 0.5rem" }}>
        Nuova <em style={{ fontStyle: "italic", color: C.orange }}>discussione</em>
      </h1>
      <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: C.muted, marginBottom: "2rem" }}>
        Condividi una domanda, un consiglio o una storia con la community.
      </p>

      {error && <div style={{ ...mono, fontSize: "0.58rem", color: C.orange, border: `1px solid ${C.orange}`, padding: "0.7rem", marginBottom: "1.2rem" }}>{error}</div>}

      <form onSubmit={submit}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Categoria</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
            {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Titolo *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Titolo chiaro e descrittivo" style={inputStyle} />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Contenuto *</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} required rows={10} placeholder="Scrivi qui il contenuto della tua discussione..." style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        <div style={{ display: "flex", gap: "0.8rem" }}>
          <Link href="/community" style={{ ...mono, background: "transparent", color: C.muted, padding: "0.9rem 1.8rem", border: `1px solid ${C.tan}`, textDecoration: "none" }}>Annulla</Link>
          <button type="submit" disabled={loading} style={{ ...mono, flex: 1, background: loading ? C.muted : C.orange, color: C.cream, padding: "0.9rem", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Pubblicazione..." : "Pubblica discussione →"}
          </button>
        </div>
      </form>
    </div>
  );
}
