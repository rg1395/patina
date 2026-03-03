"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { C, MAKES, inputStyle, labelStyle, mono } from "@/lib/design";

const RESTORE_STATUS = [
  { v: "running", l: "Funzionante" },
  { v: "project", l: "Progetto da restaurare" },
  { v: "restored", l: "Restaurato" },
  { v: "partial", l: "Parzialmente restaurato" },
];

export default function AddVehiclePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ type:"car", make:"", model:"", year:"", color:"", chassis_number:"", engine_code:"", restoration_status:"running", notes:"", is_public:true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = "/auth/login?redirect=/garage/add-vehicle";
    });
  }, []);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.make || !form.model || !form.year) { setError("Marca, modello e anno sono obbligatori."); return; }
    const yr = parseInt(form.year);
    if (isNaN(yr) || yr < 1900 || yr > new Date().getFullYear()) { setError("Anno non valido."); return; }
    setLoading(true); setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: form.type, make: form.make, model: form.model, year: yr, color: form.color, chassis_number: form.chassis_number, engine_code: form.engine_code, restoration_status: form.restoration_status, notes: form.notes, is_public: form.is_public }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Errore."); setLoading(false); return; }

    router.push("/garage");
  };

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "3rem 2rem" }}>
      <Link href="/garage" style={{ ...mono, fontSize: "0.58rem", color: C.muted, textDecoration: "none" }}>← Garage</Link>
      <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "2rem", margin: "1.5rem 0 2rem" }}>
        Aggiungi <em style={{ fontStyle: "italic", color: C.orange }}>veicolo</em>
      </h1>

      {error && <div style={{ ...mono, fontSize: "0.58rem", color: C.orange, border: `1px solid ${C.orange}`, padding: "0.7rem", marginBottom: "1.2rem" }}>{error}</div>}

      <form onSubmit={submit}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Tipo</label>
          <select value={form.type} onChange={e => set("type", e.target.value)} style={{ ...inputStyle, background: "#fff" }}>
            <option value="car">Automobile</option>
            <option value="moto">Motocicletta</option>
            <option value="truck">Camion / Furgone</option>
            <option value="other">Altro</option>
          </select>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Marca *</label>
          <input list="makes-list" value={form.make} onChange={e => set("make", e.target.value)} required placeholder="Es. Alfa Romeo" style={inputStyle} />
          <datalist id="makes-list">{MAKES.map(m => <option key={m} value={m} />)}</datalist>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "1rem" }}>
          <div>
            <label style={labelStyle}>Modello *</label>
            <input value={form.model} onChange={e => set("model", e.target.value)} required placeholder="Es. Giulia Sprint" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Anno *</label>
            <input type="number" value={form.year} onChange={e => set("year", e.target.value)} required placeholder="Es. 1967" style={inputStyle} min={1900} max={new Date().getFullYear()} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "1rem" }}>
          <div>
            <label style={labelStyle}>Colore</label>
            <input value={form.color} onChange={e => set("color", e.target.value)} placeholder="Es. Rosso Alfa" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Stato restauro</label>
            <select value={form.restoration_status} onChange={e => set("restoration_status", e.target.value)} style={{ ...inputStyle, background: "#fff" }}>
              {RESTORE_STATUS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "1rem" }}>
          <div>
            <label style={labelStyle}>Numero telaio</label>
            <input value={form.chassis_number} onChange={e => set("chassis_number", e.target.value)} placeholder="Opzionale" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Codice motore</label>
            <input value={form.engine_code} onChange={e => set("engine_code", e.target.value)} placeholder="Opzionale" style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Note</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Storia del veicolo, lavori fatti..." style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.5rem", cursor: "pointer" }}>
          <input type="checkbox" checked={form.is_public} onChange={e => set("is_public", e.target.checked)} style={{ accentColor: C.orange, width: "16px", height: "16px" }} />
          <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.95rem", color: C.muted }}>Mostra nel profilo pubblico e nei pool</span>
        </label>

        <div style={{ background: C.light, padding: "0.8rem 1rem", marginBottom: "1.5rem", borderLeft: `3px solid ${C.orange}` }}>
          <div style={{ ...mono, fontSize: "0.52rem", color: C.orange, marginBottom: "0.3rem" }}>Verrai aggiunto automaticamente</div>
          <div style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "0.9rem", color: C.muted }}>
            Aggiungendo questo veicolo entrerai nei pool {form.make ? `${form.make}` : "della marca"} e riceverai notifiche sui ricambi compatibili.
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.8rem" }}>
          <Link href="/garage" style={{ ...mono, fontSize: "0.62rem", color: C.muted, padding: "0.9rem 1.8rem", border: `1px solid ${C.tan}`, textDecoration: "none" }}>Annulla</Link>
          <button type="submit" disabled={loading} style={{ ...mono, flex: 1, background: loading ? C.muted : C.orange, color: C.cream, padding: "0.9rem", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Salvataggio..." : "Aggiungi al garage →"}
          </button>
        </div>
      </form>
    </div>
  );
}
