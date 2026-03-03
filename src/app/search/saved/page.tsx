import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { C } from "@/lib/design";
import DeleteSavedSearch from "./DeleteSavedSearch";

const mono = { fontFamily: "DM Mono, Courier New, monospace" };
const serif = { fontFamily: "Playfair Display, serif" };

export default async function SavedSearchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/search/saved");

  const admin = getAdmin();
  const { data: searches } = await admin
    .from("saved_searches")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  function buildUrl(s: any): string {
    const p = new URLSearchParams();
    if (s.query) p.set("q", s.query);
    if (s.makes?.length) s.makes.forEach((m: string) => p.append("makes", m));
    if (s.conditions?.length) s.conditions.forEach((c: string) => p.append("cond", c));
    if (s.min_price > 0) p.set("minP", s.min_price.toString());
    if (s.max_price > 0) p.set("maxP", s.max_price.toString());
    return `/search?${p.toString()}`;
  }

  return (
    <div>
      <div style={{ background: C.dark, padding: "3rem 2.5rem" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <Link href="/garage" style={{ ...mono, fontSize: "0.52rem", color: C.muted, textDecoration: "none" }}>← Garage</Link>
          <div style={{ ...mono, fontSize: "0.58rem", color: C.orange, marginTop: "1rem", marginBottom: "0.5rem" }}>Notifiche</div>
          <h1 style={{ ...serif, fontWeight: 900, fontSize: "2.2rem", color: C.cream }}>
            Ricerche <em style={{ fontStyle: "italic" }}>salvate</em>
          </h1>
          <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: "rgba(245,240,232,0.55)", marginTop: "0.5rem" }}>
            Riceverai una notifica quando escono nuovi annunci che corrispondono ai tuoi criteri.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "3rem 2.5rem" }}>
        {(searches?.length ?? 0) === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", border: `1px dashed ${C.tan}` }}>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: C.muted, fontSize: "1.1rem", marginBottom: "1rem" }}>
              Nessuna ricerca salvata ancora.
            </p>
            <Link href="/search" style={{ ...mono, fontSize: "0.6rem", color: C.orange, textDecoration: "none" }}>
              Vai alla ricerca →
            </Link>
          </div>
        ) : (
          <div>
            <div style={{ ...mono, fontSize: "0.52rem", color: C.muted, marginBottom: "1.5rem" }}>
              {searches!.length} di 10 ricerche salvate
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: C.tan, borderRadius: "14px", overflow: "hidden" }}>
              {searches!.map((s: any) => (
                <div key={s.id} style={{ background: C.white, padding: "1.2rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...serif, fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.3rem" }}>{s.name}</div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {s.query && <span style={{ ...mono, fontSize: "0.48rem", color: C.muted, border: `1px solid ${C.tan}`, borderRadius: "14px", padding: "0.1rem 0.35rem" }}>"{s.query}"</span>}
                      {(s.makes ?? []).map((m: string) => <span key={m} style={{ ...mono, fontSize: "0.48rem", color: C.orange, border: `1px solid ${C.tan}`, borderRadius: "14px", padding: "0.1rem 0.35rem" }}>{m}</span>)}
                      {(s.conditions ?? []).map((c: string) => <span key={c} style={{ ...mono, fontSize: "0.48rem", color: C.muted, border: `1px solid ${C.tan}`, borderRadius: "14px", padding: "0.1rem 0.35rem" }}>{c}</span>)}
                      {s.min_price > 0 && <span style={{ ...mono, fontSize: "0.48rem", color: C.muted, border: `1px solid ${C.tan}`, borderRadius: "14px", padding: "0.1rem 0.35rem" }}>da €{s.min_price}</span>}
                      {s.max_price > 0 && <span style={{ ...mono, fontSize: "0.48rem", color: C.muted, border: `1px solid ${C.tan}`, borderRadius: "14px", padding: "0.1rem 0.35rem" }}>fino €{s.max_price}</span>}
                    </div>
                    <div style={{ ...mono, fontSize: "0.44rem", color: C.muted, marginTop: "0.4rem" }}>
                      Creata il {new Date(s.created_at).toLocaleDateString("it-IT")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", flexShrink: 0 }}>
                    <Link href={buildUrl(s)} style={{ ...mono, fontSize: "0.55rem", color: C.orange, textDecoration: "none", border: `1px solid ${C.tan}`, borderRadius: "14px", padding: "0.4rem 0.8rem" }}>
                      Cerca ora →
                    </Link>
                    <DeleteSavedSearch id={s.id} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1.5rem" }}>
              <Link href="/search" style={{ ...mono, fontSize: "0.58rem", color: C.orange, textDecoration: "none" }}>+ Nuova ricerca salvata →</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
