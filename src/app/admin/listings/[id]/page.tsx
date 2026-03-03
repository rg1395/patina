import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { C, euros, mono, CONDITION } from "@/lib/design";
import AdminListingControls from "./AdminListingControls";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim());

export default async function AdminListingPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/");

  const { data: l } = await supabase.from("listings").select("*,seller:profiles(id,username,email:id,rating_avg,sales_count)").eq("id", id).single();
  if (!l) redirect("/admin");

  return (
    <div style={{ minHeight: "100vh", background: C.dark, padding: "2.5rem" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <Link href="/admin" style={{ ...mono, fontSize: "0.55rem", color: C.muted, textDecoration: "none" }}>← Admin</Link>
        <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "1.8rem", color: C.cream, margin: "1.5rem 0 2rem" }}>{l.title}</h1>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5px", background: "rgba(255,255,255,0.05)", marginBottom: "2rem" }}>
          {[
            { k: "ID", v: l.id },
            { k: "Status", v: l.status },
            { k: "Prezzo", v: euros(l.price_cents) },
            { k: "Condizione", v: CONDITION[l.condition] ?? l.condition },
            { k: "Venditore", v: `@${(l.seller as any)?.username}` },
            { k: "Views", v: l.views_count },
            { k: "Creato", v: new Date(l.created_at).toLocaleDateString("it-IT") },
            { k: "Marche", v: l.compatible_makes?.join(", ") ?? "—" },
          ].map(r => (
            <div key={r.k} style={{ background: "#1e1a16", padding: "0.8rem 1.2rem", display: "flex", justifyContent: "space-between" }}>
              <span style={{ ...mono, fontSize: "0.5rem", color: C.muted }}>{r.k}</span>
              <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.9rem", color: C.cream }}>{r.v}</span>
            </div>
          ))}
        </div>
        {l.description && <div style={{ background: "#1e1a16", padding: "1.2rem", marginBottom: "2rem" }}><p style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(245,240,232,0.7)", lineHeight: 1.6 }}>{l.description}</p></div>}
        <AdminListingControls listingId={l.id} currentStatus={l.status} />
      </div>
    </div>
  );
}
