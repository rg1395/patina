"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { C, MAKES, CATEGORIES, inputStyle, labelStyle } from "@/lib/design";
import ImageUpload from "@/components/ui/ImageUpload";

const mono = { fontFamily: "DM Mono, Courier New, monospace", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase" as const };

// Field definito FUORI dal componente per evitare re-render che perdono il focus
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: "1.1rem" }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);

export default function NewListingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "", description: "", condition: "original_used", category_id: "",
    compatible_makes: [] as string[], compatible_models: "",
    year_from: "", year_to: "", part_number: "",
    price: "", is_negotiable: true, shipping_available: true, shipping_cost: "",
    location_city: "", provenance_notes: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = "/auth/login?redirect=/listings/new";
    });
  }, []);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const toggleMake = (m: string) =>
    set("compatible_makes", form.compatible_makes.includes(m)
      ? form.compatible_makes.filter((x: string) => x !== m)
      : [...form.compatible_makes, m]);

  const next = (validate?: () => string | null) => {
    if (validate) {
      const err = validate();
      if (err) { setError(err); return; }
    }
    setError("");
    setStep(s => s + 1);
  };

  const submit = async () => {
    if (!form.price || Number(form.price) <= 0) { setError("Inserisci un prezzo valido."); return; }
    setLoading(true); setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth/login"; return; }

    const payload: any = {
      seller_id: user.id,
      title: form.title,
      description: form.description || null,
      condition: form.condition,
      category_id: form.category_id ? Number(form.category_id) : null,
      compatible_makes: form.compatible_makes.length ? form.compatible_makes : null,
      compatible_models: form.compatible_models
        ? form.compatible_models.split(",").map(s => s.trim()).filter(Boolean)
        : null,
      year_from: form.year_from ? Number(form.year_from) : null,
      year_to: form.year_to ? Number(form.year_to) : null,
      part_number: form.part_number || null,
      price_cents: Math.round(Number(form.price) * 100),
      is_negotiable: form.is_negotiable,
      shipping_available: form.shipping_available,
      shipping_cost_cents: form.shipping_cost ? Math.round(Number(form.shipping_cost) * 100) : null,
      location_city: form.location_city || null,
      location_country: "IT",
      provenance_notes: form.provenance_notes || null,
      images: images.length ? images : null,
      cover_image_url: images[0] ?? null,
      status: "active",
    };

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Errore."); setLoading(false); return; }
    router.push(`/listings/${json.slug}`);
  };

  const stepLabels = ["Descrizione", "Foto", "Compatibilità", "Prezzo"];

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "3rem 2rem" }}>
      <Link href="/garage" style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, textDecoration: "none" }}>← Garage</Link>

      <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "2.2rem", margin: "1.5rem 0 0.3rem" }}>
        Pubblica un <em style={{ fontStyle: "italic", color: C.orange }}>ricambio</em>
      </h1>
      <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: C.muted, marginBottom: "2rem" }}>
        Raggiungi migliaia di collezionisti europei.
      </p>

      {/* Steps */}
      <div style={{ display: "flex", marginBottom: "2.5rem" }}>
        {stepLabels.map((label, i) => (
          <div key={label} style={{ flex: 1, borderBottom: `2px solid ${step === i + 1 ? C.orange : step > i + 1 ? C.dark : C.tan}`, paddingBottom: "0.5rem" }}>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: step === i + 1 ? C.orange : step > i + 1 ? C.dark : C.muted }}>
              {i + 1}. {label}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.62rem", color: C.orange, border: `1px solid ${C.orange}`, padding: "0.75rem 1rem", marginBottom: "1.5rem", background: "rgba(196,98,45,0.06)" }}>
          {error}
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <div>
          <Field label="Titolo *">
            <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="es. Weber 40 DCOE — Coppia NOS originale" style={inputStyle} />
          </Field>
          <Field label="Descrizione">
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={5} placeholder="Descrivi il ricambio: storia, condizioni, dimensioni..." style={{ ...inputStyle, resize: "vertical" }} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="Condizione *">
              <select value={form.condition} onChange={e => set("condition", e.target.value)} style={inputStyle}>
                <option value="nos">NOS — New Old Stock</option>
                <option value="original_used">Originale usato</option>
                <option value="restored">Restaurato</option>
                <option value="needs_restore">Da restaurare</option>
              </select>
            </Field>
            <Field label="Categoria">
              <select value={form.category_id} onChange={e => set("category_id", e.target.value)} style={inputStyle}>
                <option value="">Seleziona...</option>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Storia del pezzo">
            <textarea value={form.provenance_notes} onChange={e => set("provenance_notes", e.target.value)} rows={3} placeholder="Provenienza, storia, documentazione..." style={{ ...inputStyle, fontStyle: "italic", resize: "vertical" }} />
          </Field>
          <button onClick={() => next(() => !form.title.trim() ? "Inserisci un titolo." : null)} style={{ ...mono, background: C.orange, color: C.cream, padding: "0.9rem 2.5rem", border: "none", cursor: "pointer" }}>
            Continua →
          </button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div>
          <h3 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1.2rem", marginBottom: "0.5rem" }}>Foto del ricambio</h3>
          <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: C.muted, fontSize: "0.95rem", marginBottom: "1.5rem" }}>
            La prima foto diventa la copertina. Più foto = più vendite.
          </p>
          <ImageUpload bucket="listings" maxFiles={8} onUpload={setImages} existing={images} />
          <div style={{ display: "flex", gap: "0.8rem", marginTop: "2rem" }}>
            <button onClick={() => { setError(""); setStep(1); }} style={{ ...mono, background: "transparent", color: C.muted, padding: "0.9rem 1.8rem", border: `1px solid ${C.tan}`, cursor: "pointer" }}>← Indietro</button>
            <button onClick={() => next()} style={{ ...mono, background: C.orange, color: C.cream, padding: "0.9rem 2rem", border: "none", cursor: "pointer" }}>
              {images.length > 0 ? `Continua con ${images.length} foto →` : "Continua senza foto →"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div>
          <Field label="Marche compatibili">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.2rem" }}>
              {MAKES.map(m => (
                <button key={m} type="button" onClick={() => toggleMake(m)} style={{ fontFamily: "DM Mono, monospace", fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.3rem 0.7rem", border: `1px solid ${form.compatible_makes.includes(m) ? C.orange : C.tan}`, background: form.compatible_makes.includes(m) ? "rgba(196,98,45,0.1)" : "transparent", color: form.compatible_makes.includes(m) ? C.orange : C.muted, cursor: "pointer" }}>
                  {m}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Modelli (separati da virgola)">
            <input value={form.compatible_models} onChange={e => set("compatible_models", e.target.value)} placeholder="es. Giulia Sprint GTA, 1750 GT Veloce" style={inputStyle} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <Field label="Anno (da)">
              <input type="number" value={form.year_from} onChange={e => set("year_from", e.target.value)} placeholder="1963" style={inputStyle} />
            </Field>
            <Field label="Anno (a)">
              <input type="number" value={form.year_to} onChange={e => set("year_to", e.target.value)} placeholder="1972" style={inputStyle} />
            </Field>
            <Field label="Numero parte">
              <input value={form.part_number} onChange={e => set("part_number", e.target.value)} placeholder="es. 10041.00102" style={inputStyle} />
            </Field>
          </div>
          <div style={{ display: "flex", gap: "0.8rem" }}>
            <button onClick={() => { setError(""); setStep(2); }} style={{ ...mono, background: "transparent", color: C.muted, padding: "0.9rem 1.8rem", border: `1px solid ${C.tan}`, cursor: "pointer" }}>← Indietro</button>
            <button onClick={() => next()} style={{ ...mono, background: C.orange, color: C.cream, padding: "0.9rem 2rem", border: "none", cursor: "pointer" }}>Continua →</button>
          </div>
        </div>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="Prezzo (€) *">
              <input type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="es. 2400" style={inputStyle} />
            </Field>
            <Field label="Città">
              <input value={form.location_city} onChange={e => set("location_city", e.target.value)} placeholder="es. Milano" style={inputStyle} />
            </Field>
          </div>

          <div style={{ display: "flex", gap: "2rem", marginBottom: "1.2rem" }}>
            <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={form.is_negotiable} onChange={e => set("is_negotiable", e.target.checked)} style={{ accentColor: C.orange }} />
              <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1rem" }}>Prezzo trattabile</span>
            </label>
            <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={form.shipping_available} onChange={e => set("shipping_available", e.target.checked)} style={{ accentColor: C.orange }} />
              <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1rem" }}>Spedizione disponibile</span>
            </label>
          </div>

          {form.shipping_available && (
            <Field label="Costo spedizione (€ — vuoto se da concordare)">
              <input type="number" value={form.shipping_cost} onChange={e => set("shipping_cost", e.target.value)} placeholder="es. 25" style={inputStyle} />
            </Field>
          )}

          {/* Preview */}
          {Number(form.price) > 0 && (
            <div style={{ background: C.light, border: `1px solid ${C.tan}`, padding: "1rem 1.2rem", marginBottom: "1.5rem" }}>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, marginBottom: "0.6rem" }}>Riepilogo commissioni</div>
              {[
                { label: "Prezzo", value: `€${Number(form.price).toLocaleString("it-IT")}` },
                { label: "Commissione Patina (8%)", value: `- €${(Number(form.price) * 0.08).toFixed(0)}` },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontFamily: "Cormorant Garamond, serif", fontSize: "1rem", color: C.muted, marginBottom: "0.2rem" }}>
                  <span>{r.label}</span><span>{r.value}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1.1rem", borderTop: `1px solid ${C.tan}`, paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                <span>Incassi</span>
                <span style={{ color: C.orange }}>€{(Number(form.price) * 0.92).toFixed(0)}</span>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.8rem" }}>
            <button onClick={() => { setError(""); setStep(3); }} style={{ ...mono, background: "transparent", color: C.muted, padding: "0.9rem 1.8rem", border: `1px solid ${C.tan}`, cursor: "pointer" }}>← Indietro</button>
            <button onClick={submit} disabled={loading} style={{ ...mono, flex: 1, background: loading ? C.muted : C.orange, color: C.cream, padding: "0.9rem", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Pubblicazione..." : "Pubblica annuncio →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
