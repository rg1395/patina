"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { C, inputStyle, labelStyle, mono } from "@/lib/design";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    setDone(true);
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: C.cream }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "2rem", color: C.dark }}>Patin<span style={{ color: C.orange }}>a</span></span>
          </Link>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1.8rem", marginTop: "1.2rem", marginBottom: "0.4rem" }}>
            {done ? "Email inviata" : "Recupera password"}
          </h1>
          <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: C.muted, fontSize: "1rem" }}>
            {done
              ? `Controlla la tua casella — abbiamo inviato un link a ${email}`
              : "Inserisci la tua email e ti mandiamo un link per reimpostare la password."}
          </p>
        </div>

        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>✉️</div>
            <Link href="/auth/login" style={{ ...mono, fontSize: "0.62rem", color: C.muted, textDecoration: "none" }}>← Torna al login</Link>
          </div>
        ) : (
          <>
            {error && <div style={{ ...mono, fontSize: "0.62rem", color: C.orange, border: `1px solid ${C.orange}`, padding: "0.75rem 1rem", marginBottom: "1.2rem" }}>{error}</div>}
            <form onSubmit={submit}>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@email.com" style={inputStyle} />
              </div>
              <button type="submit" disabled={loading} style={{ ...mono, width: "100%", background: loading ? C.muted : C.orange, color: C.cream, padding: "0.9rem", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Invio..." : "Invia link →"}
              </button>
            </form>
            <p style={{ textAlign: "center", fontFamily: "Cormorant Garamond, serif", fontSize: "0.95rem", color: C.muted, marginTop: "1.5rem" }}>
              <Link href="/auth/login" style={{ color: C.orange, textDecoration: "none", fontStyle: "italic" }}>← Torna al login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
