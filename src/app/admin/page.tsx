import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { C, euros, mono } from "@/lib/design";

// Lista admin hardcoded — in produzione usa un campo is_admin nella tabella profiles
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean);

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Verifica admin
  const { data: { user: fullUser } } = await supabase.auth.getUser();
  if (!ADMIN_EMAILS.includes(fullUser?.email ?? "")) redirect("/");

  // Stats
  const [
    { count: totalUsers },
    { count: totalListings },
    { count: activeListings },
    { count: totalMessages },
    { count: openDisputes },
    { data: recentListings },
    { data: recentUsers },
    { data: disputes },
    { data: flaggedListings },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("listings").select("id", { count: "exact", head: true }).neq("status", "deleted"),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("messages").select("id", { count: "exact", head: true }),
    supabase.from("escrow_transactions").select("id", { count: "exact", head: true }).eq("status", "disputed"),
    supabase.from("listings").select("id,title,slug,price_cents,status,seller:profiles(username),created_at").neq("status","deleted").order("created_at",{ascending:false}).limit(10),
    supabase.from("profiles").select("id,username,email:id,created_at,rating_avg,sales_count").order("created_at",{ascending:false}).limit(10),
    supabase.from("escrow_transactions").select("*,listing:listings(title),buyer:profiles!escrow_transactions_buyer_id_fkey(username),seller:profiles!escrow_transactions_seller_id_fkey(username)").eq("status","disputed"),
    supabase.from("listings").select("id,title,slug,views_count,price_cents,seller:profiles(username)").eq("status","active").order("views_count",{ascending:false}).limit(5),
  ]);

  const statCards = [
    { label: "Utenti totali", value: totalUsers ?? 0, color: C.dark },
    { label: "Annunci attivi", value: activeListings ?? 0, color: C.orange },
    { label: "Messaggi inviati", value: totalMessages ?? 0, color: "#1F618D" },
    { label: "Dispute aperte", value: openDisputes ?? 0, color: openDisputes ? "#C0392B" : C.muted },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.dark }}>
      <div style={{ background: "#111", borderBottom: `1px solid rgba(255,255,255,0.08)`, padding: "1rem 2.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/" style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "1.2rem", color: C.cream, textDecoration: "none" }}>Patin<span style={{ color: C.orange }}>a</span></Link>
          <span style={{ ...mono, fontSize: "0.5rem", color: C.orange, border: `1px solid ${C.orange}`, padding: "0.15rem 0.5rem" }}>Admin</span>
        </div>
        <Link href="/" style={{ ...mono, fontSize: "0.55rem", color: C.muted, textDecoration: "none" }}>← Sito</Link>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2.5rem" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.5px", background: "rgba(255,255,255,0.05)", marginBottom: "2.5rem" }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background: "#1e1a16", padding: "1.5rem" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "2.5rem", color: s.color, marginBottom: "0.3rem" }}>{s.value.toLocaleString("it-IT")}</div>
              <div style={{ ...mono, fontSize: "0.52rem", color: "rgba(245,240,232,0.4)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>

          {/* Dispute aperte */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ ...mono, fontSize: "0.58rem", color: (openDisputes ?? 0) > 0 ? "#E74C3C" : C.muted, marginBottom: "1rem" }}>
              ⚠ Dispute aperte ({openDisputes ?? 0})
            </div>
            {(disputes ?? []).length === 0 ? (
              <div style={{ background: "#1e1a16", padding: "1.5rem", fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: C.muted }}>Nessuna disputa aperta.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5px", background: "rgba(255,255,255,0.05)" }}>
                {(disputes ?? []).map((d: any) => (
                  <div key={d.id} style={{ background: "#1e1a16", padding: "1rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "0.95rem", color: C.cream, marginBottom: "0.2rem" }}>{(d.listing as any)?.title}</div>
                      <div style={{ ...mono, fontSize: "0.48rem", color: C.muted }}>
                        @{(d.buyer as any)?.username} → @{(d.seller as any)?.username} · {euros(d.amount_cents)}
                      </div>
                      {d.dispute_reason && <div style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "0.82rem", color: "#E74C3C", marginTop: "0.2rem" }}>{d.dispute_reason}</div>}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <AdminResolveButtons escrowId={d.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ultimi annunci */}
          <div>
            <div style={{ ...mono, fontSize: "0.58rem", color: C.muted, marginBottom: "1rem" }}>Ultimi annunci</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5px", background: "rgba(255,255,255,0.05)" }}>
              {(recentListings ?? []).map((l: any) => (
                <div key={l.id} style={{ background: "#1e1a16", padding: "0.8rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Link href={`/listings/${l.slug}`} target="_blank" style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.9rem", color: C.cream, textDecoration: "none" }}>{l.title}</Link>
                    <div style={{ ...mono, fontSize: "0.45rem", color: C.muted }}>@{(l.seller as any)?.username} · {euros(l.price_cents)}</div>
                  </div>
                  <AdminListingActions listingId={l.id} status={l.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Ultimi utenti */}
          <div>
            <div style={{ ...mono, fontSize: "0.58rem", color: C.muted, marginBottom: "1rem" }}>Ultimi utenti registrati</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5px", background: "rgba(255,255,255,0.05)" }}>
              {(recentUsers ?? []).map((u: any) => (
                <div key={u.id} style={{ background: "#1e1a16", padding: "0.8rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Link href={`/profile/${u.username}`} target="_blank" style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.9rem", color: C.cream, textDecoration: "none" }}>@{u.username}</Link>
                    <div style={{ ...mono, fontSize: "0.45rem", color: C.muted }}>{new Date(u.created_at).toLocaleDateString("it-IT")} · ★ {u.rating_avg?.toFixed(1) ?? "—"} · {u.sales_count} vendite</div>
                  </div>
                  <Link href={`/admin/users/${u.id}`} style={{ ...mono, fontSize: "0.48rem", color: C.muted, textDecoration: "none" }}>Dettaglio →</Link>
                </div>
              ))}
            </div>
          </div>

          {/* Annunci più visti */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ ...mono, fontSize: "0.58rem", color: C.muted, marginBottom: "1rem" }}>Annunci più visti</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "1.5px", background: "rgba(255,255,255,0.05)" }}>
              {(flaggedListings ?? []).map((l: any) => (
                <div key={l.id} style={{ background: "#1e1a16", padding: "1rem" }}>
                  <div style={{ ...mono, fontSize: "0.58rem", color: C.orange, marginBottom: "0.3rem" }}>{l.views_count} views</div>
                  <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.88rem", color: C.cream, lineHeight: 1.3, marginBottom: "0.3rem" }}>{l.title}</div>
                  <div style={{ ...mono, fontSize: "0.45rem", color: C.muted }}>@{(l.seller as any)?.username} · {euros(l.price_cents)}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Placeholder components — in produzione con Server Actions
function AdminResolveButtons({ escrowId }: { escrowId: string }) {
  return (
    <div style={{ display: "flex", gap: "0.4rem" }}>
      <Link href={`/admin/disputes/${escrowId}`} style={{ fontFamily: "DM Mono, monospace", fontSize: "0.48rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#F5F0E8", background: "#C4622D", padding: "0.3rem 0.6rem", textDecoration: "none" }}>Esamina</Link>
    </div>
  );
}

function AdminListingActions({ listingId, status }: { listingId: string; status: string }) {
  return (
    <div style={{ display: "flex", gap: "0.4rem" }}>
      <Link href={`/admin/listings/${listingId}`} style={{ fontFamily: "DM Mono, monospace", fontSize: "0.48rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(245,240,232,0.5)", textDecoration: "none" }}>Dettaglio</Link>
    </div>
  );
}
