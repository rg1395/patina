"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { C, MAKES, CATEGORIES, inputStyle, labelStyle, mono, euros } from "@/lib/design";
import ImageUpload from "@/components/ui/ImageUpload";

const CONDITIONS = [
  { v: "nos", l: "NOS — New Old Stock" },
  { v: "original_used", l: "Originale usato" },
  { v: "restored", l: "Restaurato" },
  { v: "needs_restore", l: "Da restaurare" },
];

export default function EditListingPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [listingId, setListingId] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", condition: "original_used", category_id: "",
    price_cents: "", is_negotiable: true, location_city: "",
    shipping_available: true, shipping_cost_cents: "",
    compatible_makes: [] as string[], part_number: "", provenance_notes: "",
    year_from: "", year_to: "", status: "active",
  });
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/auth/login"; return; }
      const { data: l } = await supabase.from("listings").select("*").eq("slug", slug).eq("seller_id", user.id).single();
      if (!l) { router.push("/garage"); return; }
      setListingId(l.id);
      setImages(l.images ?? []);
      setForm({
        title: l.title ?? "", description: l.description ?? "",
        condition: l.condition ?? "original_used", category_id: l.category_id?.toString() ?? "",
        price_cents: l.price_cents ? (l.price_cents / 100).toString() : "",
        is_negotiable: l.is_negotiable ?? true,
        location_city: l.location_city ?? "",
        shipping_available: l.shipping_available ?? true,
        shipping_cost_cents: l.shipping_cost_cents ? (l.shipping_cost_cents / 100).toString() : "",
        compatible_makes: l.compatible_makes ?? [],
        part_number: l.part_number ?? "", provenance_notes: l.provenance_notes ?? "",
        year_from: l.year_from?.toString() ?? "", year_to: l.year_to?.toString() ?? "",
        status: l.status ?? "active",
      });
      setLoading(false);
    };
    init();
  }, [slug]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const toggleMake = (m: string) => set("compatible_makes", form.compatible_makes.includes(m) ? form.compatible_makes.filter(x => x !== m) : [...form.compatible_makes, m]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price_cents) { setError("Titolo e prezzo sono obbligatori."); return; }
    setSaving(true); setError("");
    const price = Math.round(parseFloat(form.price_cents) * 100);
    const shipping = form.shipping_cost_cents ? Math.round(parseFloat(form.shipping_cost_cents) * 100) : null;
    const { error: err } = await supabase.from("listings").update({
      title: form.title, description: form.description || null,
      condition: form.condition as any, category_id: form.category_id ? parseInt(form.category_id) : null,
      price_cents: price, is_negotiable: form.is_negotiable,
      location_city: form.location_city || null, shipping_available: form.shipping_available,
      shipping_cost_cents: shipping, compatible_makes: form.compatible_makes,
      part_number: form.part_number || null, provenance_notes: form.provenance_notes || null,
      year_from: form.year_from ? parseInt(form.year_from) : null,
      year_to: form.year_to ? parseInt(form.year_to) : null,
      images, cover_image_url: images[0] ?? null, status: form.status as any,
      updated_at: new Date().toISOString(),
    }).eq("id", listingId);
    if (err) { setError(err.message); setSaving(false); return; }
    router.push(`/listings/${slug}`);
  };

  const deleteListing = async () => {
    setDeleting(true);
    await supabase.from("listings").update({ status: "deleted" }).eq("id", listingId);
    router.push("/garage");
  };

  if (loading) return <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ ...mono, color: C.muted }}>Caricamento...</span></div>;

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "3rem 2rem" }}>
      <Link href={`/listings/${slug}`} style={{ ...mono, fontSize: "0.55rem", color: C.muted, textDecoration: "none" }}>← Annuncio</Link>
      <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "2rem", margin: "1.5rem 0 2rem" }}>
        Modifica <em style={{ fontStyle: "italic", color: C.orange }}>annuncio</em>
      </h1>

      {error && <div style={{ ...mono, fontSize: "0.58rem", color: C.orange, border: `1px solid ${C.orange}`, padding: "0.7rem", marginBottom: "1.2rem" }}>{error}</div>}

      <form onSubmit={save}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Titolo *</label>
          <input value={form.title} onChange={e => set("title", e.target.value)} required style={inputStyle} />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Descrizione</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={5} style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "1rem" }}>
          <div>
            <label style={labelStyle}>Condizione</label>
            <select value={form.condition} onChange={e => set("condition", e.target.value)} style={{ ...inputStyle, background: "#fff" }}>
              {CONDITIONS.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Categoria</label>
            <select value={form.category_id} onChange={e => set("category_id", e.target.value)} style={{ ...inputStyle, background: "#fff" }}>
              <option value="">— Seleziona —</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Foto</label>
          <ImageUpload bucket="listings" maxFiles={8} existing={images} onUpload={setImages} />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Marche compatibili</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.4rem" }}>
            {MAKES.map(m => (
              <button key={m} type="button" onClick={() => toggleMake(m)} style={{ ...mono, fontSize: "0.5rem", padding: "0.3rem 0.7rem", background: form.compatible_makes.includes(m) ? C.orange : "transparent", color: form.compatible_makes.includes(m) ? C.cream : C.muted, border: `1px solid ${form.compatible_makes.includes(m) ? C.orange : C.tan}`, cursor: "pointer" }}>{m}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.8rem", marginBottom: "1rem" }}>
          <div>
            <label style={labelStyle}>Prezzo (€) *</label>
            <input type="number" value={form.price_cents} onChange={e => set("price_cents", e.target.value)} required min={0} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Anno da</label>
            <input type="number" value={form.year_from} onChange={e => set("year_from", e.target.value)} placeholder="Es. 1960" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Anno a</label>
            <input type="number" value={form.year_to} onChange={e => set("year_to", e.target.value)} placeholder="Es. 1975" style={inputStyle} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "1rem" }}>
          <div>
            <label style={labelStyle}>Città</label>
            <input value={form.location_city} onChange={e => set("location_city", e.target.value)} placeholder="Es. Milano" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Costo spedizione (€)</label>
            <input type="number" value={form.shipping_cost_cents} onChange={e => set("shipping_cost_cents", e.target.value)} placeholder="0 = gratis" min={0} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "1rem" }}>
          <div>
            <label style={labelStyle}>Numero parte</label>
            <input value={form.part_number} onChange={e => set("part_number", e.target.value)} placeholder="Opzionale" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Stato annuncio</label>
            <select value={form.status} onChange={e => set("status", e.target.value)} style={{ ...inputStyle, background: "#fff" }}>
              <option value="active">Attivo</option>
              <option value="paused">In pausa</option>
              <option value="sold">Venduto</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Note di provenienza</label>
          <textarea value={form.provenance_notes} onChange={e => set("provenance_notes", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        <div style={{ display: "flex", gap: "0.8rem", marginBottom: "1rem" }}>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={form.is_negotiable} onChange={e => set("is_negotiable", e.target.checked)} style={{ accentColor: C.orange }} />
            <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.95rem", color: C.muted }}>Prezzo trattabile</span>
          </label>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={form.shipping_available} onChange={e => set("shipping_available", e.target.checked)} style={{ accentColor: C.orange }} />
            <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.95rem", color: C.muted }}>Spedizione disponibile</span>
          </label>
        </div>

        <div style={{ display: "flex", gap: "0.8rem", marginBottom: "2rem" }}>
          <Link href={`/listings/${slug}`} style={{ ...mono, fontSize: "0.62rem", color: C.muted, padding: "0.9rem 1.8rem", border: `1px solid ${C.tan}`, textDecoration: "none" }}>Annulla</Link>
          <button type="submit" disabled={saving} style={{ ...mono, flex: 1, background: saving ? C.muted : C.orange, color: C.cream, padding: "0.9rem", border: "none", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Salvataggio..." : "Salva modifiche →"}
          </button>
        </div>
      </form>

      <div style={{ borderTop: `1px solid ${C.tan}`, paddingTop: "1.5rem" }}>
        <div style={{ ...mono, fontSize: "0.52rem", color: C.muted, marginBottom: "0.8rem" }}>Zona pericolosa</div>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} style={{ ...mono, fontSize: "0.6rem", background: "transparent", color: "#C0392B", border: "1px solid #C0392B", padding: "0.6rem 1.2rem", cursor: "pointer" }}>Elimina annuncio</button>
        ) : (
          <div style={{ background: "#FEF2F2", border: "1px solid #C0392B", padding: "1rem" }}>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.95rem", color: "#C0392B", marginBottom: "0.8rem" }}>Sei sicuro? L'annuncio verrà rimosso.</p>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button onClick={() => setConfirmDelete(false)} style={{ ...mono, fontSize: "0.58rem", background: "transparent", color: C.muted, border: `1px solid ${C.tan}`, padding: "0.5rem 1rem", cursor: "pointer" }}>Annulla</button>
              <button onClick={deleteListing} disabled={deleting} style={{ ...mono, fontSize: "0.58rem", background: "#C0392B", color: "#fff", border: "none", padding: "0.5rem 1.2rem", cursor: "pointer" }}>{deleting ? "..." : "Sì, elimina"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
