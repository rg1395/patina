import { getAdmin } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { C } from "@/lib/design";

const mono = { fontFamily: "DM Mono, Courier New, monospace" };
const serif = { fontFamily: "Playfair Display, serif" };

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const admin = getAdmin();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: article } = await admin.from("articles").select("*").eq("slug", params.slug).single();
  if (!article) notFound();
  if (article.status !== "published") {
    // Only admin/author can preview drafts
    if (!user) notFound();
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin" && article.author_id !== user.id) notFound();
  }

  const { data: author } = await admin.from("profiles").select("id,username,avatar_url,is_expert,expert_makes").eq("id", article.author_id).single();

  // Track view
  admin.from("articles").update({ views_count: (article.views_count ?? 0) + 1 }).eq("id", article.id).then(() => {});

  // Related articles (same tags or makes)
  const { data: related } = await admin.from("articles")
    .select("id,title,slug,cover_image_url,published_at,tags")
    .eq("status", "published")
    .neq("id", article.id)
    .limit(3);

  // Check admin
  let isAdmin = false;
  if (user) {
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    isAdmin = profile?.role === "admin";
  }

  const a = article as any;
  const paragraphs = (a.body as string).split("\n").filter((p: string) => p.trim());

  return (
    <div>
      {/* Hero */}
      <div style={{ background: C.dark, padding: "4rem 2.5rem 3rem" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <Link href="/rubriche" style={{ ...mono, fontSize: "0.52rem", color: C.muted, textDecoration: "none" }}>← Rubriche</Link>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", margin: "1.5rem 0 1rem" }}>
            {(a.tags ?? []).map((t: string) => (
              <Link key={t} href={`/rubriche?tag=${t}`} style={{ ...mono, fontSize: "0.5rem", color: C.orange, border: `1px solid rgba(196,98,45,0.4)`, padding: "0.2rem 0.5rem", textDecoration: "none" }}>
                {t}
              </Link>
            ))}
            {a.status === "draft" && (
              <span style={{ ...mono, fontSize: "0.5rem", color: "#E74C3C", border: "1px solid #E74C3C", padding: "0.2rem 0.5rem" }}>BOZZA</span>
            )}
          </div>
          <h1 style={{ ...serif, fontWeight: 900, fontSize: "2.8rem", color: C.cream, lineHeight: 1.1, marginBottom: "1.2rem", letterSpacing: "-0.02em" }}>
            {a.title}
          </h1>
          {a.excerpt && (
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "1.25rem", color: "rgba(245,240,232,0.6)", lineHeight: 1.65, marginBottom: "1.5rem" }}>
              {a.excerpt}
            </p>
          )}
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: C.orange, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {(author as any)?.avatar_url
                ? <img src={(author as any).avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ ...mono, fontSize: "0.55rem", color: C.cream }}>{(author as any)?.username?.[0]?.toUpperCase()}</span>
              }
            </div>
            <div>
              <div style={{ ...mono, fontSize: "0.52rem", color: C.cream }}>
                @{(author as any)?.username ?? "—"}
                {(author as any)?.is_expert && <span style={{ marginLeft: "0.5rem", color: C.orange }}>✦ Esperto</span>}
              </div>
              <div style={{ ...mono, fontSize: "0.46rem", color: C.muted }}>
                {a.published_at ? new Date(a.published_at).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" }) : ""}
                {" · "}{a.views_count ?? 0} visite
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cover image */}
      {a.cover_image_url && (
        <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 2.5rem" }}>
          <img src={a.cover_image_url} alt="" style={{ width: "100%", aspectRatio: "16/7", objectFit: "cover" }} />
        </div>
      )}

      {/* Body */}
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "3rem 2.5rem" }}>
        <div style={{ display: "flex", gap: "3rem" }}>
          <div style={{ flex: 1 }}>
            {paragraphs.map((p: string, i: number) => (
              <p key={i} style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.15rem", lineHeight: 1.75, color: C.dark, marginBottom: "1.3rem" }}>
                {p}
              </p>
            ))}

            {/* Makes mentioned */}
            {(a.makes ?? []).length > 0 && (
              <div style={{ borderTop: `1px solid ${C.tan}`, paddingTop: "1.5rem", marginTop: "1.5rem" }}>
                <div style={{ ...mono, fontSize: "0.5rem", color: C.muted, marginBottom: "0.5rem" }}>Marche trattate in questo articolo</div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {(a.makes ?? []).map((m: string) => (
                    <Link key={m} href={`/search?makes=${m}`} style={{ ...mono, fontSize: "0.52rem", color: C.orange, border: `1px solid ${C.tan}`, padding: "0.25rem 0.6rem", textDecoration: "none" }}>
                      {m}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Admin actions */}
            {isAdmin && a.status === "draft" && (
              <div style={{ background: C.light, padding: "1.2rem", marginTop: "2rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                <span style={{ ...mono, fontSize: "0.52rem", color: C.muted }}>Articolo in bozza</span>
                <PublishButton articleId={a.id} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related */}
      {(related?.length ?? 0) > 0 && (
        <div style={{ background: C.light, padding: "3rem 2.5rem", borderTop: `1px solid ${C.tan}` }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div style={{ ...mono, fontSize: "0.55rem", color: C.muted, marginBottom: "1.5rem", textTransform: "uppercase", letterSpacing: "0.12em" }}>Leggi anche</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1px", background: C.tan, borderRadius: "14px", overflow: "hidden" }}>
              {(related ?? []).map((r: any) => (
                <Link key={r.id} href={`/rubriche/${r.slug}`} style={{ background: C.cream, padding: "1.2rem", textDecoration: "none", color: "inherit" }}>
                  <div style={{ ...mono, fontSize: "0.46rem", color: C.orange, marginBottom: "0.4rem" }}>{(r.tags ?? []).slice(0, 2).join(" · ") || "Rubrica"}</div>
                  <div style={{ ...serif, fontWeight: 700, fontSize: "1rem", lineHeight: 1.3 }}>{r.title}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple publish button - server rendered with form action
function PublishButton({ articleId }: { articleId: string }) {
  return (
    <form action={`/api/articles`} method="POST" style={{ display: "inline" }}>
      <input type="hidden" name="id" value={articleId} />
      <input type="hidden" name="status" value="published" />
      <button type="submit" style={{ fontFamily: "DM Mono, monospace", fontSize: "0.55rem", background: C.orange, color: C.cream, border: "none", padding: "0.4rem 1rem", cursor: "pointer" }}>
        Pubblica articolo
      </button>
    </form>
  );
}
