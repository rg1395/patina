"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { C, inputStyle, labelStyle } from "@/lib/design";

const mono = { fontFamily: "DM Mono, Courier New, monospace", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase" as const };

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const searchParams = useSearchParams();
  const next = searchParams.get("redirect") ?? "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) { setError("Username minimo 3 caratteri."); return; }
    if (!/^[a-z0-9_]+$/.test(username)) { setError("Username: solo lettere, numeri, underscore."); return; }
    if (password.length < 8) { setError("Password minimo 8 caratteri."); return; }
    setLoading(true); setError("");

    const supabase = createClient();

    // Check username availability
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (existing) {
      setError("Username già in uso. Scegliene un altro.");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        data: { username },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If user is immediately confirmed (e.g. email confirmation disabled)
    if (data.user && data.session) {
      // Trigger may have already created profile — update username instead of insert
      await supabase.from("profiles").upsert({
        id: data.user.id,
        username,
        full_name: null,
        avatar_url: null,
      }, { onConflict: "id" });
      window.location.href = next;
      return;
    }

    // Email confirmation required
    setDone(true);
  };

  if (done) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: C.cream }}>
        <div style={{ textAlign: "center", maxWidth: "420px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✉</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1.8rem", marginBottom: "0.5rem" }}>Controlla la tua email</h2>
          <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: C.muted, fontSize: "1rem", lineHeight: 1.6 }}>
            Abbiamo inviato un link di conferma a <strong>{email}</strong>. Clicca il link per attivare il tuo account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: C.cream }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "2rem", color: C.dark }}>
              Patin<span style={{ color: C.orange }}>a</span>
            </span>
          </Link>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1.8rem", marginTop: "1.2rem", marginBottom: "0.4rem" }}>
            Crea il tuo account
          </h1>
          <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: C.muted, fontSize: "1rem" }}>
            Unisciti alla community dei collezionisti.
          </p>
        </div>

        {error && (
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.62rem", color: C.orange, border: `1px solid ${C.orange}`, padding: "0.75rem 1rem", marginBottom: "1.2rem", background: "rgba(196,98,45,0.06)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value.toLowerCase())} required placeholder="es. giulia_collector" style={inputStyle} />
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.52rem", color: C.muted, marginTop: "0.3rem" }}>Solo lettere minuscole, numeri e _</div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@email.com" style={inputStyle} />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={labelStyle}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Minimo 8 caratteri" style={inputStyle} />
          </div>
          <button type="submit" disabled={loading} style={{ ...mono, width: "100%", background: loading ? C.muted : C.orange, color: C.cream, padding: "0.9rem", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Registrazione..." : "Crea account →"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontFamily: "Cormorant Garamond, serif", fontSize: "0.95rem", color: C.muted, marginTop: "1.5rem" }}>
          Hai già un account?{" "}
          <Link href={`/auth/login?redirect=${encodeURIComponent(next)}`} style={{ color: C.orange, textDecoration: "none", fontStyle: "italic" }}>
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
