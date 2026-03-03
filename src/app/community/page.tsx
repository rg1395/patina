import { createClient } from "@/lib/supabase/server";
import { getAdmin, fetchProfiles } from "@/lib/db";
import Link from "next/link";
import { C } from "@/lib/design";

const S = {
  serif: { fontFamily: "Playfair Display, serif" },
  mono:  { fontFamily: "DM Mono, monospace" },
  body:  { fontFamily: "Lora, serif" },
};

const CATS = [
  { slug: "tecnica",   name: "Tecnica & Restauro",     desc: "Domande tecniche, guide, problemi e soluzioni", icon: "🔧" },
  { slug: "mercato",   name: "Mercato & Valutazioni",   desc: "Valutazioni, consigli d'acquisto, segnalazioni", icon: "💰" },
  { slug: "storia",    name: "Storia & Cultura",        desc: "Storie, aneddoti, libri, documentari", icon: "📚" },
  { slug: "raduni",    name: "Raduni & Gare",           desc: "Organizza e trova eventi nella tua zona", icon: "🏁" },
  { slug: "officine",  name: "Officine Consigliate",    desc: "Consigli e recensioni di officine specializzate", icon: "🏭" },
  { slug: "generale",  name: "Generale",                desc: "Tutto il resto, presentazioni, off-topic", icon: "💬" },
];

export default async function CommunityPage({ searchParams }: { searchParams: Record<string, string> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = getAdmin();
  const activeCat = searchParams.cat ?? "";

  let q = admin.from("forum_threads").select("*").order("created_at", { ascending: false }).limit(20);
  if (activeCat) q = q.eq("category", activeCat);
  const { data: threads } = await q;

  const profiles = await fetchProfiles(admin, (threads ?? []).map((t: any) => t.author_id));

  const { count: memberCount } = await admin.from("profiles").select("id", { count: "exact", head: true });
  const { count: threadCount } = await admin.from("forum_threads").select("id", { count: "exact", head: true });

  return (
    <div>
      <div style={{ background: C.dark, padding: "3rem 1.5rem 2.5rem" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".62rem", letterSpacing: ".18em", textTransform: "uppercase", color: C.orange, marginBottom: ".5rem" }}>Community</div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontStyle: "italic", fontSize: "clamp(2.2rem,8vw,4rem)", color: C.cream, lineHeight: 1.0, letterSpacing: "-.02em", marginBottom: ".8rem" }}>
            Il forum dei <em style={{ fontStyle: "normal", color: C.orange }}>collezionisti</em>
          </h1>
          <p style={{ fontFamily: "Lora, serif", fontStyle: "italic", color: "rgba(246,242,235,0.5)", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "1.5rem", maxWidth: "500px" }}>
            Condividi la passione, chiedi consiglio, trova risposte da chi ha già restaurato la stessa auto.
          </p>
          <div style={{ display: "flex", gap: "2rem" }}>
            {[{ n: threadCount ?? 0, l: "Discussioni" }, { n: `${memberCount ?? 0}+`, l: "Membri" }].map(s => (
              <div key={s.l} style={{ borderLeft: `2px solid ${C.orange}`, paddingLeft: ".8rem" }}>
                <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "1.8rem", color: C.cream, lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".48rem", letterSpacing: ".12em", textTransform: "uppercase", color: C.muted }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1px", background: C.tan, borderRadius: "14px", overflow: "hidden", marginBottom: "2rem" }}>
          {CATS.map(cat => (
            <Link key={cat.slug} href={cat.slug === activeCat ? "/community" : `/community?cat=${cat.slug}`}
              style={{ background: cat.slug === activeCat ? C.dark : C.white, padding: "1.1rem 1rem", display: "flex", gap: ".7rem", alignItems: "flex-start", textDecoration: "none", color: "inherit" }}>
              <span style={{ fontSize: "2.2rem", flexShrink: 0, lineHeight: 1 }}>{cat.icon}</span>
              <div>
                <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: ".95rem", marginBottom: ".15rem", color: cat.slug === activeCat ? C.cream : C.dark }}>{cat.name}</div>
                <div style={{ fontFamily: "Lora, serif", fontStyle: "italic", fontSize: ".82rem", color: cat.slug === activeCat ? "rgba(246,242,235,0.45)" : C.muted, lineHeight: 1.4 }}>{cat.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1.3rem" }}>
            {activeCat ? <>Categoria: <em style={{ fontStyle: "italic", color: C.orange }}>{CATS.find(c => c.slug === activeCat)?.name}</em></> : "Discussioni recenti"}
          </h2>
          {user && (
            <Link href="/community/new" style={{ fontFamily: "DM Mono, monospace", fontSize: ".62rem", letterSpacing: ".1em", textTransform: "uppercase", background: C.orange, color: C.cream, padding: ".55rem 1.2rem", borderRadius: "100px", textDecoration: "none" }}>+ Scrivi</Link>
          )}
        </div>

        {(threads?.length ?? 0) === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", border: `1px dashed ${C.tan}`, borderRadius: "16px", color: C.muted, marginBottom: "2rem" }}>
            <p style={{ fontFamily: "Lora, serif", fontStyle: "italic", marginBottom: "1rem" }}>Nessuna discussione ancora. Sii il primo a scrivere!</p>
            <Link href={user ? "/community/new" : "/auth/register"} style={{ fontFamily: "DM Mono, monospace", fontSize: ".62rem", letterSpacing: ".1em", textTransform: "uppercase", color: C.orange, textDecoration: "none" }}>
              {user ? "Apri una discussione →" : "Registrati per partecipare →"}
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: C.tan, borderRadius: "14px", overflow: "hidden", marginBottom: "2rem" }}>
            {(threads ?? []).map((t: any) => {
              const author = profiles[t.author_id];
              return (
                <Link key={t.id} href={`/community/${t.slug ?? t.id}`} style={{ background: C.white, padding: "1rem 1.1rem", textDecoration: "none", color: "inherit", display: "flex", gap: ".8rem", alignItems: "flex-start" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: C.light, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {author?.avatar_url
                      ? <img src={author.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: ".9rem", color: C.muted }}>{author?.username?.[0]?.toUpperCase()}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".48rem", letterSpacing: ".1em", textTransform: "uppercase", color: C.orange, marginBottom: ".2rem" }}>
                      {CATS.find(c => c.slug === t.category)?.name ?? t.category}
                    </div>
                    <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "1rem", lineHeight: 1.3, marginBottom: ".3rem" }}>{t.title}</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".48rem", color: C.muted }}>@{author?.username ?? "—"} · {new Date(t.created_at).toLocaleDateString("it-IT")}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "1.1rem" }}>{t.replies_count ?? 0}</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".44rem", color: C.muted }}>risposte</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
