"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { C, inputStyle, labelStyle } from "@/lib/design";

const mono = { fontFamily: "DM Mono, Courier New, monospace", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase" as const };

export default function ForumReplyForm({ threadId, threadSlug }: { threadId: string; threadSlug: string }) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) { setError("Scrivi una risposta."); return; }
    setLoading(true); setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth/login"; return; }

    const res = await fetch("/api/forum/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id: threadId, body: body.trim() }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Errore."); setLoading(false); return; }

    setBody("");
    setLoading(false);
    router.refresh();
  };

  return (
    <div style={{ border: `1px solid ${C.tan}`, padding: "1.5rem" }}>
      <h4 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1.1rem", marginBottom: "1rem" }}>
        Rispondi alla <em style={{ fontStyle: "italic", color: C.orange }}>discussione</em>
      </h4>
      {error && <div style={{ ...mono, fontSize: "0.58rem", color: C.orange, border: `1px solid ${C.orange}`, padding: "0.6rem", marginBottom: "1rem" }}>{error}</div>}
      <form onSubmit={submit}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>La tua risposta</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} required rows={6} placeholder="Scrivi la tua risposta..." style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        <button type="submit" disabled={loading || !body.trim()} style={{ ...mono, background: loading ? C.muted : C.orange, color: C.cream, padding: "0.85rem 2rem", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Invio..." : "Pubblica risposta →"}
        </button>
      </form>
    </div>
  );
}
