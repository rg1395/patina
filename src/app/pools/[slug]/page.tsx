import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { C, euros, mono, CONDITION } from "@/lib/design";
import PoolChat from "./PoolChat";
import PoolJoinButton from "./PoolJoinButton";

type Props = { params: { slug: string } };

export default async function PoolPage({ params }: Props) {
  const { slug } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: pool } = await supabase
    .from("pools")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!pool) notFound();

  // Annunci compatibili con la marca del pool
  const { data: listings } = await supabase
    .from("listings")
    .select("id,title,slug,price_cents,cover_image_url,condition,location_city,compatible_makes,seller:profiles(username)")
    .eq("status", "active")
    .contains("compatible_makes", [pool.make])
    .order("created_at", { ascending: false })
    .limit(12);

  // Ultimi messaggi della chat
  const { data: messages } = await supabase
    .from("pool_messages")
    .select("id,body,created_at,author:profiles(username,avatar_url)")
    .eq("pool_id", pool.id)
    .order("created_at", { ascending: false })
    .limit(40);

  // Controlla se l'utente è membro
  let isMember = false;
  if (user) {
    const { data: membership } = await supabase
      .from("pool_members")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("pool_id", pool.id)
      .maybeSingle();
    isMember = !!membership;
  }

  // Alcuni membri
  const { data: members } = await supabase
    .from("pool_members")
    .select("profiles(username,avatar_url)")
    .eq("pool_id", pool.id)
    .limit(8);

  return (
    <div>
      {/* Header */}
      <div style={{ background: C.dark, padding: "3rem 2.5rem" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <Link href="/pools" style={{ ...mono, fontSize: "0.55rem", color: C.muted, textDecoration: "none", display: "block", marginBottom: "1.2rem" }}>← Tutti i pool</Link>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ ...mono, fontSize: "0.55rem", color: C.orange, marginBottom: "0.5rem" }}>Pool · {pool.make}</div>
              <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "2.5rem", color: C.cream, lineHeight: 1.1, marginBottom: "1rem" }}>
                {pool.display_name}
              </h1>
              <div style={{ display: "flex", gap: "2rem" }}>
                {[{ n: pool.members_count, l: "membri" }, { n: pool.listings_count, l: "ricambi attivi" }].map(s => (
                  <div key={s.l}>
                    <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "1.5rem", color: C.orange }}>{s.n}</div>
                    <div style={{ ...mono, fontSize: "0.48rem", color: "rgba(245,240,232,0.5)" }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <PoolJoinButton poolId={pool.id} isMember={isMember} userId={user?.id ?? null} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 2.5rem", display: "grid", gridTemplateColumns: "1fr 380px", gap: "3rem", alignItems: "start" }}>

        {/* Feed annunci */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1.4rem" }}>
              Ricambi <em style={{ fontStyle: "italic", color: C.orange }}>compatibili</em>
            </h2>
            <Link href={`/search?makes=${encodeURIComponent(pool.make)}`} style={{ ...mono, fontSize: "0.55rem", color: C.muted, textDecoration: "none" }}>Vedi tutti →</Link>
          </div>
          {(listings ?? []).length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", border: `1px dashed ${C.tan}`, color: C.muted }}>
              <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic" }}>Nessun ricambio per {pool.make} al momento.</p>
              <Link href="/listings/new" style={{ ...mono, fontSize: "0.6rem", color: C.orange, textDecoration: "none", display: "block", marginTop: "1rem" }}>Pubblica il primo →</Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1px", background: C.tan, borderRadius: "14px", overflow: "hidden" }}>
              {(listings ?? []).map((l: any) => (
                <Link key={l.id} href={`/listings/${l.slug ?? l.id}`} style={{ background: C.cream, textDecoration: "none", color: "inherit", display: "block" }}>
                  <div style={{ aspectRatio: "4/3", background: C.dark, overflow: "hidden", position: "relative" }}>
                    {l.cover_image_url
                      ? <img src={l.cover_image_url} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#2a1f1a,#3a2a1a)" }} />
                    }
                    {l.condition && <span style={{ position: "absolute", top: "0.5rem", left: "0.5rem", ...mono, fontSize: "0.45rem", background: l.condition === "nos" ? C.orange : C.dark, color: C.cream, padding: "0.15rem 0.4rem" }}>{CONDITION[l.condition] ?? l.condition}</span>}
                  </div>
                  <div style={{ padding: "0.8rem" }}>
                    <div style={{ ...mono, fontSize: "0.45rem", color: C.muted, marginBottom: "0.2rem" }}>{l.location_city ?? "IT"}</div>
                    <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2, marginBottom: "0.4rem" }}>{l.title}</div>
                    <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1rem", color: C.orange }}>{euros(l.price_cents)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Membri */}
          {(members ?? []).length > 0 && (
            <div style={{ marginTop: "2.5rem" }}>
              <div style={{ ...mono, fontSize: "0.58rem", color: C.muted, marginBottom: "1rem" }}>Membri del pool</div>
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                {(members ?? []).map((m: any, i: number) => {
                  const p = m.profiles;
                  return (
                    <Link key={i} href={`/profile/${p?.username}`} style={{ textDecoration: "none" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: C.dark, overflow: "hidden", border: `2px solid ${C.tan}` }}>
                        {p?.avatar_url
                          ? <img src={p.avatar_url} alt={p.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", ...mono, fontSize: "0.55rem", color: C.cream }}>{p?.username?.[0]?.toUpperCase() ?? "?"}</div>
                        }
                      </div>
                    </Link>
                  );
                })}
                {pool.members_count > 8 && (
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: C.light, border: `2px solid ${C.tan}`, display: "flex", alignItems: "center", justifyContent: "center", ...mono, fontSize: "0.45rem", color: C.muted }}>
                    +{pool.members_count - 8}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chat del pool */}
        <div style={{ position: "sticky", top: "5.5rem" }}>
          <div style={{ ...mono, fontSize: "0.58rem", color: C.muted, marginBottom: "1rem" }}>Chat del pool</div>
          <PoolChat
            poolId={pool.id}
            initialMessages={(messages ?? []).reverse()}
            userId={user?.id ?? null}
            isMember={isMember}
          />
        </div>
      </div>
    </div>
  );
}
