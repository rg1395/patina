"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/design";

const S = { serif:{fontFamily:"Playfair Display, serif"}, mono:{fontFamily:"DM Mono, monospace"} };

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const next = searchParams.get("redirect") ?? "/";
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push(next); router.refresh();
  };

  const inp: React.CSSProperties = { width:"100%", padding:".85rem 1rem", border:`1px solid ${C.tan}`, borderRadius:"12px", background:C.white, fontFamily:"Lora, serif", fontSize:"1rem", color:C.dark, outline:"none" };

  return (
    <div style={{ minHeight:"100svh", display:"flex", alignItems:"center", justifyContent:"center", background:C.dark, padding:"2rem 1.5rem" }}>
      <div style={{ width:"100%", maxWidth:"420px" }}>
        <div style={{ textAlign:"center", marginBottom:"2.5rem" }}>
          <Link href="/" style={{ ...S.serif, fontWeight:900, fontSize:"1.8rem", color:C.cream, letterSpacing:"-.02em", textDecoration:"none" }}>
            Patin<span style={{ color:C.orange }}>a</span>
          </Link>
          <h1 style={{ ...S.serif, fontWeight:900, fontStyle:"italic", fontSize:"2rem", color:C.cream, marginTop:"1.5rem", marginBottom:".4rem" }}>
            Bentornato
          </h1>
          <p style={{ fontFamily:"Lora, serif", fontStyle:"italic", color:"rgba(246,242,235,0.4)", fontSize:".95rem" }}>
            Accedi al tuo account Patina.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {error&&<div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"10px", padding:".75rem 1rem", fontFamily:"DM Mono, monospace", fontSize:".58rem", letterSpacing:".06em", color:"#fca5a5" }}>{error}</div>}
          <div>
            <label style={{ fontFamily:"DM Mono, monospace", fontSize:".55rem", letterSpacing:".12em", textTransform:"uppercase", color:"rgba(246,242,235,0.45)", display:"block", marginBottom:".4rem" }}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoFocus placeholder="la@tua.email" style={{ ...inp, background:"rgba(246,242,235,0.07)", border:"1px solid rgba(200,184,152,0.2)", color:C.cream }} />
          </div>
          <div>
            <label style={{ fontFamily:"DM Mono, monospace", fontSize:".55rem", letterSpacing:".12em", textTransform:"uppercase", color:"rgba(246,242,235,0.45)", display:"block", marginBottom:".4rem" }}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" style={{ ...inp, background:"rgba(246,242,235,0.07)", border:"1px solid rgba(200,184,152,0.2)", color:C.cream }} />
          </div>
          <button type="submit" disabled={loading} style={{ fontFamily:"DM Mono, monospace", fontSize:".65rem", letterSpacing:".1em", textTransform:"uppercase", background:loading?C.muted:C.orange, color:C.cream, border:"none", borderRadius:"100px", padding:"1rem", cursor:loading?"not-allowed":"pointer", transition:"background .2s" }}>
            {loading?"Accesso in corso...":"Accedi →"}
          </button>
          <div style={{ textAlign:"center" }}>
            <Link href="/auth/forgot-password" style={{ fontFamily:"DM Mono, monospace", fontSize:".52rem", letterSpacing:".08em", textTransform:"uppercase", color:"rgba(246,242,235,0.3)", textDecoration:"none" }}>
              Password dimenticata?
            </Link>
          </div>
        </form>

        <div style={{ borderTop:"1px solid rgba(200,184,152,0.12)", paddingTop:"1.5rem", marginTop:"1.5rem", textAlign:"center" }}>
          <p style={{ fontFamily:"Lora, serif", fontStyle:"italic", color:"rgba(246,242,235,0.4)", fontSize:".9rem", marginBottom:".8rem" }}>Non hai ancora un account?</p>
          <Link href={`/auth/register${next!=="/"?`?redirect=${next}`:""}`} style={{ fontFamily:"DM Mono, monospace", fontSize:".62rem", letterSpacing:".1em", textTransform:"uppercase", color:C.orange, textDecoration:"none", border:`1px solid rgba(196,97,44,0.4)`, padding:".6rem 1.4rem", borderRadius:"100px" }}>
            Registrati gratis →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
