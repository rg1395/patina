"use client";
import { useState } from "react";
import { C } from "@/lib/design";

const mono = { fontFamily: "DM Mono, Courier New, monospace" };
const serif = { fontFamily: "Playfair Display, serif" };

interface Valuation {
  id: string;
  user_id: string;
  authenticity: number;
  price_fairness: number;
  condition_accuracy: number;
  comment: string | null;
  is_expert: boolean;
  created_at: string;
  username?: string;
}

interface Props {
  listingId: string;
  userId: string | null;
  initialValuations: Valuation[];
  userHasValuated: boolean;
}

function StarRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
      <span style={{ ...mono, fontSize: "0.54rem", color: C.muted }}>{label}</span>
      <div style={{ display: "flex", gap: "0.2rem" }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: n <= value ? C.orange : C.tan, padding: "0 0.1rem" }}>
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

function avg(vals: number[]) {
  if (!vals.length) return 0;
  return (vals.reduce((a, b) => a + b, 0) / vals.length);
}

function Stars({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span style={{ color: C.orange, fontSize: "0.9rem" }}>
      {"★".repeat(rounded)}{"☆".repeat(5 - rounded)}
      <span style={{ ...mono, fontSize: "0.48rem", color: C.muted, marginLeft: "0.3rem" }}>{value.toFixed(1)}</span>
    </span>
  );
}

export default function ValuationWidget({ listingId, userId, initialValuations, userHasValuated }: Props) {
  const [valuations, setValuations] = useState<Valuation[]>(initialValuations);
  const [showForm, setShowForm] = useState(false);
  const [alreadyValuated, setAlreadyValuated] = useState(userHasValuated);
  const [form, setForm] = useState({ authenticity: 0, price_fairness: 0, condition_accuracy: 0, comment: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const avgAuth = avg(valuations.map(v => v.authenticity));
  const avgPrice = avg(valuations.map(v => v.price_fairness));
  const avgCond = avg(valuations.map(v => v.condition_accuracy));
  const expertCount = valuations.filter(v => v.is_expert).length;

  const handleSubmit = async () => {
    if (!form.authenticity || !form.price_fairness || !form.condition_accuracy) {
      setError("Valuta tutti e tre i criteri."); return;
    }
    setLoading(true); setError("");
    const res = await fetch("/api/valuations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: listingId, ...form }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Errore"); setLoading(false); return; }
    setValuations(prev => [...prev, { ...data, username: "Tu" }]);
    setAlreadyValuated(true);
    setShowForm(false);
    setLoading(false);
  };

  return (
    <div style={{ border: `1px solid ${C.tan}`, padding: "1.5rem", background: C.light }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
        <div>
          <div style={{ ...mono, fontSize: "0.55rem", color: C.orange, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.2rem" }}>Valutazione community</div>
          <div style={{ ...mono, fontSize: "0.5rem", color: C.muted }}>
            {valuations.length} {valuations.length === 1 ? "valutazione" : "valutazioni"}
            {expertCount > 0 && <span style={{ color: C.orange, marginLeft: "0.5rem" }}>· {expertCount} da esperti ✦</span>}
          </div>
        </div>
        {userId && !alreadyValuated && !showForm && (
          <button onClick={() => setShowForm(true)} style={{ ...mono, fontSize: "0.55rem", background: C.orange, color: C.cream, border: "none", padding: "0.45rem 1rem", cursor: "pointer" }}>
            Valuta
          </button>
        )}
      </div>

      {/* Averages */}
      {valuations.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.2rem", background: "white", padding: "1rem" }}>
          {[
            { label: "Autenticità", val: avgAuth },
            { label: "Prezzo", val: avgPrice },
            { label: "Condizioni", val: avgCond },
          ].map(({ label, val }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ ...mono, fontSize: "0.48rem", color: C.muted, marginBottom: "0.3rem" }}>{label}</div>
              <Stars value={val} />
            </div>
          ))}
        </div>
      )}

      {valuations.length === 0 && !showForm && (
        <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: C.muted, fontSize: "0.95rem" }}>
          Nessuna valutazione ancora. Sii il primo a esprimere un'opinione su questo ricambio.
        </p>
      )}

      {/* Form */}
      {showForm && (
        <div style={{ background: "white", padding: "1.2rem", marginBottom: "1rem" }}>
          <div style={{ ...mono, fontSize: "0.55rem", color: C.dark, marginBottom: "0.8rem" }}>La tua valutazione</div>
          {error && <div style={{ ...mono, fontSize: "0.52rem", color: "#b91c1c", marginBottom: "0.6rem" }}>{error}</div>}
          <StarRow label="Autenticità" value={form.authenticity} onChange={v => setForm(f => ({ ...f, authenticity: v }))} />
          <StarRow label="Prezzo equo" value={form.price_fairness} onChange={v => setForm(f => ({ ...f, price_fairness: v }))} />
          <StarRow label="Condizioni dichiarate" value={form.condition_accuracy} onChange={v => setForm(f => ({ ...f, condition_accuracy: v }))} />
          <textarea
            value={form.comment}
            onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
            placeholder="Commento opzionale..."
            rows={2}
            style={{ width: "100%", padding: "0.5rem", border: `1px solid ${C.tan}`, fontFamily: "Cormorant Garamond, serif", fontSize: "0.95rem", resize: "none", outline: "none", marginTop: "0.6rem" }}
          />
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.8rem" }}>
            <button onClick={handleSubmit} disabled={loading} style={{ ...mono, fontSize: "0.55rem", background: loading ? C.muted : C.orange, color: C.cream, border: "none", padding: "0.5rem 1.2rem", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Invio..." : "Invia valutazione"}
            </button>
            <button onClick={() => { setShowForm(false); setError(""); }} style={{ ...mono, fontSize: "0.55rem", background: "transparent", color: C.muted, border: `1px solid ${C.tan}`, padding: "0.5rem 1rem", cursor: "pointer" }}>
              Annulla
            </button>
          </div>
        </div>
      )}

      {alreadyValuated && !showForm && (
        <div style={{ ...mono, fontSize: "0.52rem", color: "#2d7a2d", marginBottom: "0.8rem" }}>✓ Hai già valutato questo ricambio</div>
      )}

      {/* Individual valuations */}
      {valuations.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          {valuations.map((v: any) => (
            <div key={v.id} style={{ background: "white", padding: "0.8rem 1rem", borderLeft: v.is_expert ? `3px solid ${C.orange}` : `3px solid ${C.tan}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <div style={{ ...mono, fontSize: "0.48rem", color: C.muted }}>
                  @{v.username ?? "anonimo"}
                  {v.is_expert && <span style={{ color: C.orange, marginLeft: "0.4rem" }}>✦ Esperto</span>}
                </div>
                <div style={{ display: "flex", gap: "0.8rem" }}>
                  {[
                    { label: "Auth", val: v.authenticity },
                    { label: "Prezzo", val: v.price_fairness },
                    { label: "Cond.", val: v.condition_accuracy },
                  ].map(({ label, val }) => (
                    <span key={label} style={{ ...mono, fontSize: "0.44rem", color: C.muted }}>
                      {label}: <span style={{ color: C.orange }}>{"★".repeat(val)}</span>
                    </span>
                  ))}
                </div>
              </div>
              {v.comment && (
                <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "0.92rem", color: C.dark }}>{v.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {!userId && (
        <p style={{ ...mono, fontSize: "0.52rem", color: C.muted, marginTop: "0.8rem" }}>
          <a href="/auth/login" style={{ color: C.orange }}>Accedi</a> per valutare questo ricambio.
        </p>
      )}
    </div>
  );
}
