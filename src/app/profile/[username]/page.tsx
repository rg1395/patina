import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { C, euros, CONDITION } from "@/lib/design";

const mono = { fontFamily: "DM Mono, Courier New, monospace" };
const serif = { fontFamily: "Playfair Display, serif" };

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).single();
  if (!profile) notFound();

  const p = profile as any;
  const isOwn = user?.id === p.id;

  const [{ data: listings }, { data: vehicles }, { data: reviews }] = await Promise.all([
    supabase.from("listings").select("id,title,price_cents,cover_image_url,slug,condition,compatible_makes").eq("seller_id", p.id).eq("status", "active").limit(8),
    supabase.from("vehicles").select("*").eq("owner_id", p.id).eq("is_public", true).limit(6),
    supabase.from("reviews").select("*,reviewer:profiles(username,avatar_url)").eq("reviewed_id", p.id).order("created_at", { ascending: false }).limit(5),
  ]);

  return (
    <div>
      {/* Profile hero */}
      <div style={{ background: C.dark, padding: "4rem 2.5rem" }}>
        <div className="profile-hero-inner" style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", gap: "2rem", alignItems: "flex-start" }}>
          <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: C.orange, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", ...serif, fontWeight: 900, fontSize: "2.5rem", color: C.cream }}>
            {p.avatar_url ? <img src={p.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (p.full_name ?? p.username ?? "U")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.3rem" }}>
              <h1 style={{ ...serif, fontWeight: 900, fontSize: "2rem", color: C.cream }}>{p.full_name ?? p.username}</h1>
              {p.is_verified && <span style={{ ...mono, fontSize: "0.48rem", letterSpacing: "0.1em", textTransform: "uppercase", color: C.orange, border: `1px solid ${C.orange}`, padding: "0.15rem 0.5rem" }}>✓ Verificato</span>}
            </div>
            <div style={{ ...mono, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, marginBottom: "0.8rem" }}>
              @{p.username} · {p.location_city ?? "Italia"} · Membro dal {new Date(p.created_at).toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
            </div>
            {p.bio && <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: "rgba(245,240,232,0.7)", fontSize: "1rem", lineHeight: 1.6, maxWidth: "500px" }}>{p.bio}</p>}
          </div>
          <div style={{ display: "flex", gap: "2rem", flexShrink: 0 }}>
            {[
              { label: "Vendite", value: p.sales_count ?? 0 },
              { label: "Rating", value: p.rating_count > 0 ? `★ ${p.rating_avg?.toFixed(1)}` : "—" },
              { label: "Annunci", value: listings?.length ?? 0 },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ ...serif, fontWeight: 900, fontSize: "1.8rem", color: C.cream }}>{s.value}</div>
                <div style={{ ...mono, fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="profile-content" style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 2.5rem" }}>
        {isOwn && (
          <div style={{ display: "flex", gap: "0.8rem", marginBottom: "2rem" }}>
            <Link href="/profile/edit" style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", background: C.dark, color: C.cream, padding: "0.5rem 1.2rem", textDecoration: "none" }}>Modifica profilo</Link>
            <Link href="/garage" style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", border: `1px solid ${C.tan}`, borderRadius: "14px", color: C.dark, padding: "0.5rem 1.2rem", textDecoration: "none" }}>Il mio garage</Link>
          </div>
        )}

        {/* Vehicles */}
        {(vehicles?.length ?? 0) > 0 && (
          <div style={{ marginBottom: "3rem" }}>
            <h2 style={{ ...serif, fontWeight: 700, fontSize: "1.5rem", marginBottom: "1.5rem" }}>Garage di <em style={{ fontStyle: "italic", color: C.orange }}>{p.username}</em></h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1px", background: C.tan, borderRadius: "14px", overflow: "hidden" }}>
              {(vehicles ?? []).map((v: any) => (
                <div key={v.id} style={{ background: C.white, padding: "1rem" }}>
                  <div style={{ aspectRatio: "16/9", background: C.dark, marginBottom: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {v.cover_image_url ? <img src={v.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "2rem", opacity: 0.2 }}>🚗</span>}
                  </div>
                  <div style={{ ...serif, fontWeight: 700, fontSize: "0.9rem" }}>{v.make} {v.model}</div>
                  <div style={{ ...mono, fontSize: "0.48rem", color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{v.year}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Listings */}
        {(listings?.length ?? 0) > 0 && (
          <div style={{ marginBottom: "3rem" }}>
            <h2 style={{ ...serif, fontWeight: 700, fontSize: "1.5rem", marginBottom: "1.5rem" }}>Annunci <em style={{ fontStyle: "italic", color: C.orange }}>attivi</em></h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1px", background: C.tan, borderRadius: "14px", overflow: "hidden" }}>
              {(listings ?? []).map((l: any) => (
                <Link key={l.id} href={`/listings/${l.slug ?? l.id}`} style={{ background: C.cream, textDecoration: "none", color: "inherit", display: "block" }}>
                  <div style={{ aspectRatio: "4/3", background: C.dark, overflow: "hidden", position: "relative" }}>
                    {l.cover_image_url ? <img src={l.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", background: "#2a1f1a" }} />}
                    <span style={{ position: "absolute", top: "0.5rem", left: "0.5rem", ...mono, fontSize: "0.48rem", letterSpacing: "0.08em", textTransform: "uppercase", background: l.condition === "nos" ? C.orange : C.dark, color: C.cream, padding: "0.15rem 0.45rem" }}>{CONDITION[l.condition]}</span>
                  </div>
                  <div style={{ padding: "0.8rem" }}>
                    <div style={{ ...serif, fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2, marginBottom: "0.3rem" }}>{l.title}</div>
                    <div style={{ ...serif, fontWeight: 700, fontSize: "1rem", color: C.orange }}>{euros(l.price_cents)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {!isOwn && user && (
          <Link href={`/reviews/new?user=${p.id}`} style={{ ...mono, fontSize:"0.58rem", display:"inline-block", background:C.orange, color:C.cream, padding:"0.5rem 1.2rem", textDecoration:"none", marginBottom:"1.5rem" }}>
            Lascia una recensione →
          </Link>
        )}
        {(reviews?.length ?? 0) > 0 && (
          <div>
            <h2 style={{ ...serif, fontWeight: 700, fontSize: "1.5rem", marginBottom: "1.5rem" }}>
              Recensioni <em style={{ fontStyle: "italic", color: C.orange }}>({p.rating_count})</em>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: C.tan, borderRadius: "14px", overflow: "hidden" }}>
              {(reviews ?? []).map((r: any) => (
                <div key={r.id} style={{ background: C.white, padding: "1.2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ ...mono, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: C.dark }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    <span style={{ ...mono, fontSize: "0.5rem", color: C.muted, textTransform: "uppercase" }}>{(r.reviewer as any)?.username} · {new Date(r.created_at).toLocaleDateString("it-IT")}</span>
                  </div>
                  {r.body && <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "1rem", lineHeight: 1.6, color: C.dark }}>{r.body}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
