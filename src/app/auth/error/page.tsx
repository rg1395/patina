import Link from "next/link";
import { C } from "@/lib/design";

export default function AuthErrorPage() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "2rem", marginBottom: "1rem" }}>Errore di autenticazione</h1>
        <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: C.muted, marginBottom: "2rem" }}>
          Si è verificato un problema. Riprova ad accedere.
        </p>
        <Link href="/auth/login" style={{ fontFamily: "DM Mono, monospace", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", background: C.orange, color: C.cream, padding: "0.8rem 2rem", textDecoration: "none" }}>
          Torna al login →
        </Link>
      </div>
    </div>
  );
}
