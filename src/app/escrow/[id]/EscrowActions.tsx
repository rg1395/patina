"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { C, mono, inputStyle, labelStyle } from "@/lib/design";

export default function EscrowActions({ tx, userId, isBuyer, isSeller }: {
  tx: any; userId: string; isBuyer: boolean; isSeller: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [showShipForm, setShowShipForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  const call = async (endpoint: string, body: object) => {
    setLoading(true); setError("");
    const res = await fetch(`/api/escrow/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Errore."); setLoading(false); return false; }
    setLoading(false);
    router.refresh();
    return true;
  };

  const btn = (label: string, onClick: () => void, variant: "primary"|"secondary"|"danger" = "primary") => (
    <button onClick={onClick} disabled={loading} style={{
      ...mono, fontSize: "0.62rem",
      background: variant === "primary" ? C.orange : variant === "danger" ? "#C0392B" : "transparent",
      color: variant === "secondary" ? C.dark : C.cream,
      border: variant === "secondary" ? `1px solid ${C.tan}` : "none",
      padding: "0.8rem 1.5rem", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
    }}>{loading ? "..." : label}</button>
  );

  if (tx.status === "completed" || tx.status === "refunded") {
    return (
      <div style={{ background: tx.status === "completed" ? "#EAF7EA" : C.light, border: `1px solid ${tx.status === "completed" ? "#1E8449" : C.tan}`, padding: "1.2rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <span style={{ fontSize: "1.5rem" }}>{tx.status === "completed" ? "✓" : "↩"}</span>
        <div>
          <div style={{ ...mono, fontSize: "0.55rem", color: tx.status === "completed" ? "#1E8449" : C.muted }}>
            {tx.status === "completed" ? "Transazione completata" : "Rimborsato"}
          </div>
          <div style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "0.9rem", color: C.muted }}>
            {tx.status === "completed" ? "I fondi sono stati rilasciati al venditore." : "Il pagamento è stato rimborsato all'acquirente."}
          </div>
        </div>
      </div>
    );
  }

  if (tx.status === "disputed") {
    return (
      <div style={{ background: "#FEF2F2", border: "1px solid #C0392B", padding: "1.2rem 1.5rem" }}>
        <div style={{ ...mono, fontSize: "0.55rem", color: "#C0392B", marginBottom: "0.4rem" }}>Disputa aperta</div>
        <div style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "0.95rem", color: C.muted, marginBottom: "0.3rem" }}>{tx.dispute_reason}</div>
        <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.85rem", color: C.muted }}>Il team Patina esaminerà il caso e vi contatterà entro 48 ore a info@patina.eu</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
      {error && <div style={{ ...mono, fontSize: "0.58rem", color: C.orange, border: `1px solid ${C.orange}`, padding: "0.7rem" }}>{error}</div>}

      {/* BUYER: pending_payment → deve pagare */}
      {isBuyer && tx.status === "pending_payment" && (
        <div style={{ background: C.light, padding: "1.2rem 1.5rem", borderLeft: `3px solid ${C.orange}` }}>
          <div style={{ ...mono, fontSize: "0.55rem", color: C.orange, marginBottom: "0.5rem" }}>Completa il pagamento</div>
          <div style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "0.95rem", color: C.muted, marginBottom: "1rem" }}>
            Il pagamento viene trattenuto in escrow fino a quando confermi la ricezione dell'articolo.
          </div>
          {/* In produzione: link a Stripe Checkout con il payment intent */}
          <Link
            href={`/api/escrow/checkout?id=${tx.id}`}
            style={{ ...mono, fontSize: "0.62rem", background: C.orange, color: C.cream, padding: "0.8rem 1.5rem", textDecoration: "none", display: "inline-block" }}
          >
            Paga ora con Stripe →
          </Link>
        </div>
      )}

      {/* SELLER: payment_held → deve spedire */}
      {isSeller && tx.status === "payment_held" && (
        <div style={{ background: C.light, padding: "1.2rem 1.5rem", borderLeft: `3px solid ${C.orange}` }}>
          <div style={{ ...mono, fontSize: "0.55rem", color: C.orange, marginBottom: "0.5rem" }}>Il pagamento è confermato — spedisci l'articolo</div>
          <div style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "0.95rem", color: C.muted, marginBottom: "1rem" }}>
            Spedisci entro {new Date(tx.ship_by).toLocaleDateString("it-IT")}. Inserisci il numero di tracking per proteggere la transazione.
          </div>
          {!showShipForm ? (
            btn("Dichiara spedizione →", () => setShowShipForm(true))
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <div>
                <label style={labelStyle}>Corriere</label>
                <select value={carrier} onChange={e => setCarrier(e.target.value)} style={{ ...inputStyle, background: "#fff" }}>
                  <option value="">Seleziona corriere</option>
                  {["Poste Italiane","BRT","DHL","UPS","FedEx","GLS","SDA","Nexive","Altro"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Numero tracking (opzionale ma consigliato)</label>
                <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Es. 1Z999AA10123456784" style={inputStyle} />
              </div>
              <div style={{ display: "flex", gap: "0.6rem" }}>
                {btn("Conferma spedizione →", () => call("shipped", { escrow_id: tx.id, tracking_number: tracking, carrier }))}
                <button onClick={() => setShowShipForm(false)} style={{ ...mono, fontSize: "0.58rem", background: "transparent", color: C.muted, border: `1px solid ${C.tan}`, padding: "0.7rem 1rem", cursor: "pointer" }}>Annulla</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BUYER: shipped → deve confermare ricezione */}
      {isBuyer && tx.status === "shipped" && (
        <div style={{ background: C.light, padding: "1.2rem 1.5rem", borderLeft: `3px solid ${C.orange}` }}>
          <div style={{ ...mono, fontSize: "0.55rem", color: C.orange, marginBottom: "0.5rem" }}>Hai ricevuto l'articolo?</div>
          <div style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "0.95rem", color: C.muted, marginBottom: "1rem" }}>
            Confermando la ricezione, i fondi vengono rilasciati al venditore. Hai tempo fino al {tx.confirm_by ? new Date(tx.confirm_by).toLocaleDateString("it-IT") : "—"}.
          </div>
          {btn("Confermo la ricezione →", () => call("confirm", { escrow_id: tx.id }))}
        </div>
      )}

      {/* Apri disputa (buyer o seller, in certi stati) */}
      {["payment_held", "shipped"].includes(tx.status) && (
        <div style={{ marginTop: "0.5rem" }}>
          {!showDisputeForm ? (
            <button onClick={() => setShowDisputeForm(true)} style={{ ...mono, fontSize: "0.55rem", background: "transparent", color: "#C0392B", border: "1px solid #C0392B", padding: "0.5rem 1rem", cursor: "pointer" }}>
              Apri una disputa
            </button>
          ) : (
            <div style={{ border: "1px solid #C0392B", padding: "1rem", background: "#FEF2F2" }}>
              <div style={{ ...mono, fontSize: "0.52rem", color: "#C0392B", marginBottom: "0.8rem" }}>Descrivi il problema</div>
              <textarea
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                rows={3}
                placeholder="Es. Articolo non ricevuto, diverso dalla descrizione..."
                style={{ ...inputStyle, resize: "vertical", marginBottom: "0.8rem" }}
              />
              <div style={{ display: "flex", gap: "0.6rem" }}>
                {btn("Invia disputa", () => call("dispute", { escrow_id: tx.id, reason: disputeReason }), "danger")}
                <button onClick={() => setShowDisputeForm(false)} style={{ ...mono, fontSize: "0.58rem", background: "transparent", color: C.muted, border: `1px solid ${C.tan}`, padding: "0.7rem 1rem", cursor: "pointer" }}>Annulla</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
