import { createClient } from "@/lib/supabase/server";
import { getAdmin, fetchProfiles } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { C } from "@/lib/design";
import ForumReplyForm from "./ForumReplyForm";
import ForumUpvote from "./ForumUpvote";

const mono = { fontFamily: "DM Mono, Courier New, monospace" };

export default async function ThreadPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = getAdmin();

  let { data: thread } = await admin.from("forum_threads").select("*").eq("slug", slug).single();
  if (!thread) {
    const { data: t2 } = await admin.from("forum_threads").select("*").eq("id", slug).single();
    thread = t2;
  }
  if (!thread) notFound();

  const { data: replies } = await admin.from("forum_replies").select("*").eq("thread_id", thread.id).order("created_at", { ascending: true });
  const allIds = [thread.author_id, ...(replies ?? []).map((r: any) => r.author_id)];
  const profiles = await fetchProfiles(admin, allIds);

  const t = thread as any;
  const author = profiles[t.author_id];

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "3rem 2rem" }}>
      <Link href="/community" style={{ ...mono, fontSize: "0.55rem", color: C.muted, textDecoration: "none" }}>← Community</Link>
      <div style={{ marginTop: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ ...mono, fontSize: "0.5rem", color: C.orange, marginBottom: "0.5rem" }}>{t.category?.toUpperCase()}</div>
        <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "2rem", lineHeight: 1.2, marginBottom: "1rem" }}>{t.title}</h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: C.dark, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {author?.avatar_url ? <img src={author.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <span style={{ ...mono, fontSize: "0.45rem", color: C.cream }}>{author?.username?.[0]?.toUpperCase()}</span>}
            </div>
            <Link href={`/profile/${author?.username}`} style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.9rem", color: C.dark, textDecoration: "none" }}>@{author?.username}</Link>
          </div>
          <span style={{ ...mono, fontSize: "0.45rem", color: C.muted }}>{new Date(t.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}</span>
          <span style={{ ...mono, fontSize: "0.45rem", color: C.muted }}>{t.views_count ?? 0} visualizzazioni</span>
          <span style={{ ...mono, fontSize: "0.45rem", color: C.muted }}>{(replies ?? []).length} risposte</span>
        </div>
      </div>

      <div style={{ background: C.light, padding: "1.5rem 2rem", marginBottom: "2rem", borderLeft: `3px solid ${C.orange}` }}>
        <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.05rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{t.body}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
          <ForumUpvote threadId={t.id} upvotes={t.upvotes_count ?? 0} userId={user?.id ?? null} />
        </div>
      </div>

      {(replies ?? []).length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ ...mono, fontSize: "0.55rem", color: C.muted, marginBottom: "1rem" }}>{(replies ?? []).length} {(replies ?? []).length === 1 ? "risposta" : "risposte"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: C.tan, borderRadius: "14px", overflow: "hidden" }}>
            {(replies ?? []).map((r: any) => {
              const ra = profiles[r.author_id];
              return (
                <div key={r.id} style={{ background: C.cream, padding: "1.2rem 1.5rem" }}>
                  <div style={{ display: "flex", gap: "0.8rem", alignItems: "flex-start" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: C.dark, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {ra?.avatar_url ? <img src={ra.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <span style={{ ...mono, fontSize: "0.45rem", color: C.cream }}>{ra?.username?.[0]?.toUpperCase()}</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", marginBottom: "0.5rem" }}>
                        <Link href={`/profile/${ra?.username}`} style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.9rem", color: C.dark, textDecoration: "none", fontWeight: 600 }}>@{ra?.username}</Link>
                        <span style={{ ...mono, fontSize: "0.42rem", color: C.muted }}>{new Date(r.created_at).toLocaleDateString("it-IT")}</span>
                        {r.is_solution && <span style={{ ...mono, fontSize: "0.42rem", color: "#1E8449", border: "1px solid #1E8449", padding: "0.1rem 0.4rem" }}>✓ Soluzione</span>}
                      </div>
                      <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{r.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {user ? (
        <ForumReplyForm threadId={t.id} threadSlug={slug} />
      ) : (
        <div style={{ textAlign: "center", padding: "2rem", border: `1px dashed ${C.tan}` }}>
          <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: C.muted, marginBottom: "1rem" }}>Accedi per partecipare alla discussione.</p>
          <Link href="/auth/login" style={{ ...mono, fontSize: "0.6rem", color: C.orange, textDecoration: "none" }}>Accedi →</Link>
        </div>
      )}
    </div>
  );
}
