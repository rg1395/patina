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

export default function EditVehiclePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    type: "car", make: "", model: "", year: "", color: "",
    chassis_number: "", engine_code: "", restoration_status: "running",
    notes: "", is_public: true,
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/auth/login"; return; }

      const { data: v } = await supabase.from("vehicles").select("*").eq("id", id).eq("owner_id", user.id).single();
      if (!v) { router.push("/garage"); return; }

      setForm({
        type: v.type ?? "car",
        make: v.make ?? "",
        model: v.model ?? "",
        year: v.year?.toString() ?? "",
        color: v.color ?? "",
        chassis_number: v.chassis_number ?? "",
        engine_code: v.engine_code ?? "",
        restoration_status: v.restoration_status ?? "running",
        notes: v.notes ?? "",
        is_public: v.is_public ?? true,
      });
      setLoading(false);
    };
    init();
  }, [id]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.make || !form.model || !form.year) { setError("Marca, modello e anno sono obbligatori."); return; }
    const yr = parseInt(form.year);
    if (isNaN(yr) || yr < 1900 || yr > new Date().getFullYear()) { setError("Anno non valido."); return; }
    setSaving(true); setError("");

    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type: form.type, make: form.make, model: form.model, year: yr, color: form.color, chassis_number: form.chassis_number, engine_code: form.engine_code, restoration_status: form.restoration_status, notes: form.notes, is_public: form.is_public }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Errore."); setSaving(false); return; }

    router.push("/garage");
  };

  const deleteVehicle = async () => {
    setDeleting(true);
    await fetch("/api/vehicles", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.push("/garage");
  };

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ ...mono, fontSize: "0.6rem", color: C.muted }}>Caricamento...</span>
    </div>
  );

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "3rem 2rem" }}>
      <Link href="/garage" style={{ ...mono, fontSize: "0.58rem", color: C.muted, textDecoration: "none" }}>← Garage</Link>
      <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "2rem", margin: "1.5rem 0 2rem" }}>
        Modifica <em style={{ fontStyle: "italic", color: C.orange }}>veicolo</em>
      </h1>

      {error && <div style={{ ...mono, fontSize: "0.58rem", color: C.orange, border: `1px solid ${C.orange}`, padding: "0.7rem", marginBottom: "1.2rem" }}>{error}</div>}

      <form onSubmit={save}>
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

        <div style={{ display: "flex", gap: "0.8rem", marginBottom: "2rem" }}>
          <Link href="/garage" style={{ ...mono, fontSize: "0.62rem", color: C.muted, padding: "0.9rem 1.8rem", border: `1px solid ${C.tan}`, textDecoration: "none" }}>Annulla</Link>
          <button type="submit" disabled={saving} style={{ ...mono, flex: 1, background: saving ? C.muted : C.orange, color: C.cream, padding: "0.9rem", border: "none", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Salvataggio..." : "Salva modifiche →"}
          </button>
        </div>
      </form>

      {/* Zona pericolosa */}
      <div style={{ borderTop: `1px solid ${C.tan}`, paddingTop: "1.5rem" }}>
        <div style={{ ...mono, fontSize: "0.52rem", color: C.muted, marginBottom: "0.8rem" }}>Zona pericolosa</div>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} style={{ ...mono, fontSize: "0.6rem", background: "transparent", color: "#c0392b", border: "1px solid #c0392b", padding: "0.6rem 1.2rem", cursor: "pointer" }}>
            Elimina veicolo
          </button>
        ) : (
          <div style={{ background: "#fef2f2", border: "1px solid #c0392b", padding: "1rem" }}>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.95rem", color: "#c0392b", marginBottom: "0.8rem" }}>
              Sei sicuro? Questa azione non è reversibile.
            </p>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button onClick={() => setConfirmDelete(false)} style={{ ...mono, fontSize: "0.58rem", background: "transparent", color: C.muted, border: `1px solid ${C.tan}`, padding: "0.5rem 1rem", cursor: "pointer" }}>Annulla</button>
              <button onClick={deleteVehicle} disabled={deleting} style={{ ...mono, fontSize: "0.58rem", background: "#c0392b", color: "#fff", border: "none", padding: "0.5rem 1.2rem", cursor: "pointer" }}>
                {deleting ? "Eliminazione..." : "Sì, elimina"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
