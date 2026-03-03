"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/ui/ImageUpload";
import { C, inputStyle, labelStyle, mono } from "@/lib/design";

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ full_name:"", bio:"", location_city:"", website:"" });
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/auth/login?redirect=/profile/edit"; return; }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (p) { setForm({ full_name: p.full_name??'', bio: p.bio??'', location_city: p.location_city??'', website: p.website??'' }); setAvatarUrl(p.avatar_url??''); }
      setLoading(false);
    };
    init();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: err } = await supabase.from("profiles").update({ full_name: form.full_name||null, bio: form.bio||null, location_city: form.location_city||null, website: form.website||null, avatar_url: avatarUrl||null }).eq("id", user.id);
    if (err) { setError(err.message); setSaving(false); return; }
    router.push("/profile");
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  if (loading) return <div style={{ minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center" }}><span style={{ ...mono,color:C.muted }}>Caricamento...</span></div>;

  return (
    <div style={{ maxWidth:"600px",margin:"0 auto",padding:"3rem 2rem" }}>
      <Link href="/profile" style={{ ...mono,fontSize:"0.58rem",color:C.muted,textDecoration:"none" }}>← Profilo</Link>
      <h1 style={{ fontFamily:"Playfair Display, serif",fontWeight:900,fontSize:"2rem",margin:"1.5rem 0 2rem" }}>Modifica <em style={{ fontStyle:"italic",color:C.orange }}>profilo</em></h1>
      {error&&<div style={{ ...mono,fontSize:"0.58rem",color:C.orange,border:`1px solid ${C.orange}`,padding:"0.7rem",marginBottom:"1.2rem" }}>{error}</div>}
      <form onSubmit={save}>
        {/* Avatar */}
        <div style={{ marginBottom:"1.5rem" }}>
          <label style={labelStyle}>Foto profilo</label>
          {avatarUrl && <div style={{ width:"72px",height:"72px",borderRadius:"50%",overflow:"hidden",marginBottom:"0.8rem",border:`2px solid ${C.tan}` }}><img src={avatarUrl} style={{ width:"100%",height:"100%",objectFit:"cover" }} /></div>}
          <ImageUpload bucket="avatars" maxFiles={1} existing={avatarUrl?[avatarUrl]:[]} onUpload={urls=>setAvatarUrl(urls[0]??"")} />
        </div>
        {[{k:"full_name",l:"Nome completo",p:"Es. Marco Bianchi"},{k:"location_city",l:"Città",p:"Es. Milano"},{k:"website",l:"Sito web",p:"https://..."}].map(f=>(
          <div key={f.k} style={{ marginBottom:"1rem" }}>
            <label style={labelStyle}>{f.l}</label>
            <input value={(form as any)[f.k]} onChange={e=>set(f.k,e.target.value)} placeholder={f.p} style={inputStyle} />
          </div>
        ))}
        <div style={{ marginBottom:"1.5rem" }}>
          <label style={labelStyle}>Bio</label>
          <textarea value={form.bio} onChange={e=>set("bio",e.target.value)} rows={4} placeholder="Raccontati in poche righe..." style={{ ...inputStyle,resize:"vertical" }} />
        </div>
        <div style={{ display:"flex",gap:"0.8rem" }}>
          <Link href="/profile" style={{ ...mono,background:"transparent",color:C.muted,padding:"0.9rem 1.8rem",border:`1px solid ${C.tan}`,textDecoration:"none" }}>Annulla</Link>
          <button type="submit" disabled={saving} style={{ ...mono,flex:1,background:saving?C.muted:C.orange,color:C.cream,padding:"0.9rem",border:"none",cursor:saving?"not-allowed":"pointer" }}>
            {saving?"Salvataggio...":"Salva modifiche →"}
          </button>
        </div>
      </form>
    </div>
  );
}
