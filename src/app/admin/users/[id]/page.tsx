import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { C, euros, mono } from "@/lib/design";
import UserAdminControls from "./UserAdminControls";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim());

export default async function AdminUserPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!profile) redirect("/admin");

  const { data: listings } = await supabase.from("listings").select("id,title,price_cents,status,slug,created_at").eq("seller_id", id).order("created_at",{ascending:false}).limit(10);
  const { data: reviews } = await supabase.from("reviews").select("*,reviewer:profiles!reviews_reviewer_id_fkey(username)").eq("reviewed_id", id).limit(10);

  return (
    <div style={{ minHeight: "100vh", background: C.dark, padding: "2.5rem" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <Link href="/admin" style={{ ...mono, fontSize: "0.55rem", color: C.muted, textDecoration: "none" }}>← Admin</Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1.5rem 0 2rem" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#2a1f1a", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {profile.avatar_url ? <img src={profile.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ ...mono, fontSize: "0.8rem", color: C.cream }}>{profile.username?.[0]?.toUpperCase()}</span>}
          </div>
          <div>
            <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "1.8rem", color: C.cream }}>@{profile.username}</h1>
            {profile.full_name && <div style={{ ...mono, fontSize: "0.52rem", color: C.muted }}>{profile.full_name}</div>}
          </div>
          {profile.is_verified && <span style={{ ...mono, fontSize: "0.45rem", color: C.orange, border: `1px solid ${C.orange}`, padding: "0.15rem 0.4rem" }}>✓ Verificato</span>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.5px", background: "rgba(255,255,255,0.05)", marginBottom: "2rem" }}>
          {[
            { k: "Rating", v: `★ ${profile.rating_avg?.toFixed(1) ?? "—"}` },
            { k: "Vendite", v: profile.sales_count ?? 0 },
            { k: "Registrato", v: new Date(profile.created_at).toLocaleDateString("it-IT") },
            { k: "Città", v: profile.location_city ?? "—" },
          ].map(r => (
            <div key={r.k} style={{ background: "#1e1a16", padding: "1rem", textAlign: "center" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1.2rem", color: C.cream, marginBottom: "0.2rem" }}>{r.v}</div>
              <div style={{ ...mono, fontSize: "0.45rem", color: C.muted }}>{r.k}</div>
            </div>
          ))}
        </div>

        <UserAdminControls userId={id} isVerified={profile.is_verified ?? false} />

        <div style={{ marginTop: "2rem" }}>
          <div style={{ ...mono, fontSize: "0.55rem", color: C.muted, marginBottom: "1rem" }}>Annunci ({listings?.length ?? 0})</div>
          {(listings ?? []).map((l: any) => (
            <div key={l.id} style={{ background: "#1e1a16", padding: "0.8rem 1rem", marginBottom: "1.5px", display: "flex", justifyContent: "space-between" }}>
              <Link href={`/listings/${l.slug}`} target="_blank" style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.9rem", color: C.cream, textDecoration: "none" }}>{l.title}</Link>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, color: C.orange }}>{euros(l.price_cents)}</span>
                <span style={{ ...mono, fontSize: "0.45rem", color: C.muted }}>{l.status}</span>
                <Link href={`/admin/listings/${l.id}`} style={{ ...mono, fontSize: "0.45rem", color: C.muted, textDecoration: "none" }}>Gestisci</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
