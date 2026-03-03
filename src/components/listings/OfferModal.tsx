"use client";
import { useState } from "react";
import { C, euros, inputStyle, labelStyle } from "@/lib/design";

const mono = { fontFamily: "DM Mono, Courier New, monospace", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase" as const };

export default function OfferModal({ listingId, listingTitle, askingCents, onClose }: {
  listingId: string; listingTitle: string; askingCents: number; onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const asking = askingCents / 100;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError("Inserisci un importo valido."); return; }
    if (amt > asking) { setError(`L'offerta non può superare €${asking.toLocaleString("it-IT")}.`); return; }
    setLoading(true); setError("");

    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: listingId, amount_cents: Math.round(amt * 100), message: message || null }),
    });

    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Errore durante l'invio."); setLoading(false); return; }
    setSuccess(true);
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(26,22,18,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: C.cream, maxWidth: "460px", width: "100%", padding: "2rem" }}>
        {success ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✓</div>
            <h3 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1.5rem", marginBottom: "0.5rem" }}>Offerta inviata</h3>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: C.muted, marginBottom: "1.5rem" }}>Il venditore risponderà entro 72 ore.</p>
            <button onClick={onClose} style={{ ...mono, background: C.orange, color: C.cream, padding: "0.7rem 2rem", border: "none", cursor: "pointer" }}>Chiudi</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <div style={{ ...mono, fontSize: "0.55rem", color: C.muted, marginBottom: "0.3rem" }}>Fai un&apos;offerta</div>
                <h3 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1.1rem", lineHeight: 1.2 }}>{listingTitle}</h3>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: C.muted, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ background: C.light, padding: "0.7rem 1rem", marginBottom: "1.2rem", display: "flex", justifyContent: "space-between" }}>
              <span style={{ ...mono, fontSize: "0.52rem", color: C.muted }}>Prezzo richiesto</span>
              <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1rem" }}>{euros(askingCents)}</span>
            </div>

            {error && <div style={{ ...mono, fontSize: "0.58rem", color: C.orange, border: `1px solid ${C.orange}`, padding: "0.6rem 0.8rem", marginBottom: "1rem", background: "rgba(196,98,45,0.06)" }}>{error}</div>}

            <form onSubmit={send}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>La tua offerta (€) *</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder={`es. ${Math.round(asking * 0.9)}`} style={inputStyle} />
                {amount && Number(amount) > 0 && Number(amount) <= asking && (
                  <div style={{ ...mono, fontSize: "0.5rem", color: C.muted, marginTop: "0.3rem" }}>
                    Sconto {Math.round((1 - Number(amount) / asking) * 100)}% · risparmi €{(asking - Number(amount)).toFixed(0)}
                  </div>
                )}
              </div>
              <div style={{ marginBottom: "1.2rem" }}>
                <label style={labelStyle}>Messaggio (opzionale)</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Motiva la tua offerta..." style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <button type="submit" disabled={loading} style={{ ...mono, width: "100%", background: loading ? C.muted : C.orange, color: C.cream, padding: "0.9rem", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Invio..." : "Invia offerta →"}
              </button>
              <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "0.8rem", color: C.muted, textAlign: "center", marginTop: "0.8rem" }}>
                Valida 72 ore · Nessun addebito finché non accettata
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
