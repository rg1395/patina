"use client";
import { useState } from "react";
import { C } from "@/lib/design";

const mn: React.CSSProperties = { fontFamily:"DM Mono, monospace", fontSize:".6rem", letterSpacing:".1em", textTransform:"uppercase" };

export default function SuggestFormClient() {
  const [tab, setTab] = useState<"raduno"|"rubrica">("raduno");
  const [form, setForm] = useState({ title:"", location:"", date:"", description:"" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setLoading(true);
    // Submit to community API (creates a forum thread)
    await fetch("/api/forum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: tab === "raduno" ? "eventi" : "tecnica",
        title: `[Suggerimento ${tab === "raduno" ? "Raduno" : "Rubrica"}] ${form.title}`,
        body: [form.description, form.location && `Luogo: ${form.location}`, form.date && `Data: ${form.date}`].filter(Boolean).join("\n\n"),
      }),
    });
    setSent(true); setLoading(false);
  };

  const inputS: React.CSSProperties = { width:"100%", background:"rgba(246,242,235,0.07)", border:"1px solid rgba(200,184,152,0.2)", borderRadius:"10px", color:"#F6F2EB", fontFamily:"Lora, serif", fontStyle:"italic", fontSize:"1rem", padding:".8rem 1rem", outline:"none", marginBottom:".8rem" };

  if (sent) return (
    <div style={{ textAlign:"center", padding:"2rem", color:"rgba(246,242,235,0.5)" }}>
      <div style={{ fontSize:"2rem", marginBottom:".8rem" }}>✓</div>
      <div style={{ ...mn, color:"#C4612C" }}>Suggerimento inviato!</div>
      <p style={{ fontFamily:"Lora, serif", fontStyle:"italic", fontSize:".9rem", marginTop:".4rem" }}>Lo valuteremo presto.</p>
    </div>
  );

  return (
    <>
      <div style={{ display:"flex", gap:"1px", background:"rgba(200,184,152,0.15)", borderRadius:"8px", overflow:"hidden", marginBottom:"1.2rem" }}>
        {(["raduno","rubrica"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex:1, textAlign:"center", padding:".6rem", ...mn, cursor:"pointer", transition:"background .15s", background: tab===t ? C.orange : "transparent", color: tab===t ? C.cream : "rgba(246,242,235,0.4)", border:"none" }}>
            {t === "raduno" ? "🏁 Raduno" : "📖 Rubrica"}
          </button>
        ))}
      </div>
      <input value={form.title} onChange={e=>set("title",e.target.value)} placeholder={tab==="raduno" ? "Nome del raduno o evento..." : "Argomento o titolo articolo..."} style={inputS} />
      {tab === "raduno" && <>
        <input value={form.location} onChange={e=>set("location",e.target.value)} placeholder="Dove? Città o luogo..." style={inputS} />
        <input value={form.date} onChange={e=>set("date",e.target.value)} placeholder="Quando? Data o periodo..." style={inputS} />
      </>}
      <textarea value={form.description} onChange={e=>set("description",e.target.value)} placeholder={tab==="raduno" ? "Descrizione breve..." : "Perché sarebbe utile? Cosa dovrebbe coprire?"} rows={2} style={{ ...inputS, resize:"none" }} />
      <button onClick={handleSubmit} disabled={loading||!form.title.trim()} style={{ width:"100%", background: loading||!form.title.trim() ? C.muted : C.orange, color:C.cream, border:"none", borderRadius:"100px", padding:".9rem", ...mn, cursor: loading||!form.title.trim() ? "not-allowed" : "pointer", transition:"background .2s" }}>
        {loading ? "Invio..." : "Invia suggerimento →"}
      </button>
    </>
  );
}
