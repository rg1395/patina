"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { C, inputStyle, labelStyle, mono } from "@/lib/design";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase manda i token nell'hash URL, dobbiamo aspettare che li processi
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password minimo 8 caratteri."); return; }
    if (password !== confirm) { setError("Le password non coincidono."); return; }
    setLoading(true); setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); setLoading(false); return; }
    setDone(true);
    setTimeout(() => router.push("/"), 2000);
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: C.cream }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "2rem", color: C.dark }}>Patin<span style={{ color: C.orange }}>a</span></span>
          </Link>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1.8rem", marginTop: "1.2rem", marginBottom: "0.4rem" }}>
            {done ? "Password aggiornata" : "Nuova password"}
          </h1>
        </div>

        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✓</div>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: C.muted }}>Reindirizzamento in corso...</p>
          </div>
        ) : !ready ? (
          <div style={{ textAlign: "center", color: C.muted }}>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic" }}>Verifica del link in corso...</p>
          </div>
        ) : (
          <>
            {error && <div style={{ ...mono, fontSize: "0.62rem", color: C.orange, border: `1px solid ${C.orange}`, padding: "0.75rem 1rem", marginBottom: "1.2rem" }}>{error}</div>}
            <form onSubmit={submit}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>Nuova password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Minimo 8 caratteri" style={inputStyle} />
              </div>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={labelStyle}>Conferma password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Ripeti la password" style={inputStyle} />
              </div>
              <button type="submit" disabled={loading} style={{ ...mono, width: "100%", background: loading ? C.muted : C.orange, color: C.cream, padding: "0.9rem", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Salvataggio..." : "Salva nuova password →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
