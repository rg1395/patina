import { getAdmin, fetchProfiles } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import SuggestForm from "@/app/community/SuggestForm";
import Link from "next/link";
import { C } from "@/lib/design";

const TAGS = ["Weber", "Carburazione", "Restauro", "Alfa Romeo", "Ducati", "Fiat", "NOS", "Motore", "Elettrica", "Storia"];

export default async function RubrichePage({ searchParams }: { searchParams: Record<string, string> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = getAdmin();
  const tag = searchParams.tag ?? "";

  let query = admin.from("articles").select("*").eq("status", "published").order("published_at", { ascending: false });
  if (tag) query = query.contains("tags", [tag]);
  const { data: articles } = await query.limit(30);

  const profiles = await fetchProfiles(admin, (articles ?? []).map((a: any) => a.author_id));

  let canWrite = false;
  if (user) {
    const { data: profile } = await admin.from("profiles").select("is_expert,role").eq("id", user.id).single();
    canWrite = !!(profile?.is_expert || profile?.role === "admin");
  }

  const featured = (articles ?? [])[0];
  const rest = (articles ?? []).slice(1);

  return (
    <div>
      <div style={{ background: C.dark, padding: "3rem 1.5rem 2.5rem" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".62rem", letterSpacing: ".18em", textTransform: "uppercase", color: C.orange, marginBottom: ".5rem" }}>Rubriche</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontStyle: "italic", fontSize: "clamp(2.2rem,8vw,4rem)", color: C.cream, lineHeight: 1.0, letterSpacing: "-.02em", marginBottom: ".6rem" }}>
                Guide e <em style={{ fontStyle: "normal", color: C.orange }}>approfondimenti</em>
              </h1>
              <p style={{ fontFamily: "Lora, serif", fontStyle: "italic", color: "rgba(246,242,235,0.5)", fontSize: "1.05rem", lineHeight: 1.6, maxWidth: "480px" }}>
                Articoli tecnici scritti dagli esperti. Come riconoscere un Weber falso, come valutare un NOS, e molto altro.
              </p>
            </div>
            {canWrite && (
              <Link href="/rubriche/new" style={{ fontFamily: "DM Mono, monospace", fontSize: ".62rem", letterSpacing: ".1em", textTransform: "uppercase", background: C.orange, color: C.cream, padding: ".7rem 1.5rem", borderRadius: "100px", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
                + Scrivi articolo
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tag filters */}
      <div style={{ borderBottom: `1px solid ${C.light}`, padding: ".9rem 1.5rem", overflowX: "auto", scrollbarWidth: "none" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", gap: ".5rem", flexWrap: "nowrap" }}>
          <Link href="/rubriche" style={{ fontFamily: "DM Mono, monospace", fontSize: ".52rem", letterSpacing: ".08em", textTransform: "uppercase", padding: ".3rem .8rem", borderRadius: "100px", border: `1px solid ${!tag ? C.dark : C.tan}`, background: !tag ? C.dark : "transparent", color: !tag ? C.cream : C.muted, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
            Tutti
          </Link>
          {TAGS.map(t => (
            <Link key={t} href={`/rubriche?tag=${t}`} style={{ fontFamily: "DM Mono, monospace", fontSize: ".52rem", letterSpacing: ".08em", textTransform: "uppercase", padding: ".3rem .8rem", borderRadius: "100px", border: `1px solid ${tag === t ? C.orange : C.tan}`, background: tag === t ? C.orange : "transparent", color: tag === t ? C.cream : C.muted, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
              {t}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {(articles?.length ?? 0) === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 2rem", border: `1px dashed ${C.tan}`, borderRadius: "16px" }}>
            <p style={{ fontFamily: "Lora, serif", fontStyle: "italic", color: C.muted, fontSize: "1.1rem", marginBottom: "1rem" }}>Nessun articolo ancora.</p>
            {canWrite && <Link href="/rubriche/new" style={{ fontFamily: "DM Mono, monospace", fontSize: ".62rem", letterSpacing: ".1em", textTransform: "uppercase", color: C.orange, textDecoration: "none" }}>Scrivi il primo →</Link>}
          </div>
        ) : (
          <>
            {featured && (
              <Link href={`/rubriche/${featured.slug}`} style={{ textDecoration: "none", color: "inherit", display: "block", marginBottom: "2rem", borderRadius: "16px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: C.dark }}>
                  <div style={{ aspectRatio: "4/3", background: C.light, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {featured.cover_image_url
                      ? <img src={featured.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : null}
                  </div>
                  <div style={{ padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".5rem", color: C.orange, marginBottom: ".5rem", textTransform: "uppercase", letterSpacing: ".12em" }}>
                      In evidenza {(featured.tags ?? []).slice(0, 2).map((t: string) => `· ${t}`).join("")}
                    </div>
                    <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "1.8rem", color: C.cream, lineHeight: 1.2, marginBottom: "1rem" }}>{featured.title}</h2>
                    {featured.excerpt && <p style={{ fontFamily: "Lora, serif", fontStyle: "italic", color: "rgba(246,242,235,0.55)", fontSize: "1rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>{featured.excerpt}</p>}
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".5rem", color: C.muted }}>
                      {profiles[featured.author_id]?.username ?? "—"} · {featured.published_at ? new Date(featured.published_at).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" }) : ""}
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {rest.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "1.2rem" }}>
                {rest.map((a: any) => {
                  const author = profiles[a.author_id];
                  return (
                    <Link key={a.id} href={`/rubriche/${a.slug}`} style={{ background: C.white, borderRadius: "14px", overflow: "hidden", textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", boxShadow: "0 1px 4px rgba(0,0,0,.06)", transition: "transform .3s cubic-bezier(.34,1.56,.64,1)" }}>
                      <div style={{ aspectRatio: "16/9", background: C.light, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {a.cover_image_url ? <img src={a.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                      </div>
                      <div style={{ padding: "1.1rem", flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".48rem", color: C.orange, marginBottom: ".4rem", textTransform: "uppercase", letterSpacing: ".1em" }}>
                          {(a.tags ?? []).slice(0, 2).join(" · ") || "Rubrica"}
                        </div>
                        <h3 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1.05rem", lineHeight: 1.3, marginBottom: ".6rem", flex: 1 }}>{a.title}</h3>
                        <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".46rem", color: C.muted }}>
                          {author?.username ?? "—"} · {a.published_at ? new Date(a.published_at).toLocaleDateString("it-IT") : ""} · {a.views_count ?? 0} visite
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Suggest article form */}
        <div id="suggerisci" style={{ marginTop: "2rem" }}>
          <SuggestForm user={user} defaultTab="rubrica" />
        </div>
      </div>
    </div>
  );
}
