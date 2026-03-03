import { createClient } from "@/lib/supabase/server";
import { getAdmin, fetchProfiles } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { C, euros, CONDITION } from "@/lib/design";
import ListingActions from "@/components/listings/ListingActions";
import BuyButton from "@/components/listings/BuyButton";
import ValuationWidget from "@/components/listings/ValuationWidget";

const mono = { fontFamily: "DM Mono, Courier New, monospace" };
const serif = { fontFamily: "Playfair Display, serif" };
const body = { fontFamily: "Cormorant Garamond, serif" };

export default async function ListingPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = getAdmin();

  // Try by slug first, then by UUID — handles both cases after publish
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  const { data: l } = await admin
    .from("listings")
    .select("*")
    .or(isUUID ? `slug.eq.${slug},id.eq.${slug}` : `slug.eq.${slug}`)
    .maybeSingle();

  if (!l) return notFound();

  const [sellerResult, categoryResult, similarResult, valuationsResult, vehicleOwnersResult] = await Promise.all([
    admin.from("profiles").select("id,username,full_name,avatar_url,bio,rating_avg,rating_count,sales_count,is_verified,location_city,created_at").eq("id", l.seller_id).single(),
    l.category_id ? admin.from("categories").select("id,name_it").eq("id", l.category_id).single() : Promise.resolve({ data: null }),
    admin.from("listings").select("id,title,price_cents,cover_image_url,slug,condition,compatible_makes")
      .eq("status", "active").neq("id", l.id)
      .overlaps("compatible_makes", l.compatible_makes ?? []).limit(4),
    admin.from("part_valuations").select("id,user_id,authenticity,price_fairness,condition_accuracy,comment,is_expert,created_at").eq("listing_id", l.id).order("created_at", { ascending: false }),
    // Chi ha questo veicolo: public vehicles with matching make
    l.compatible_makes?.length > 0
      ? admin.from("vehicles").select("id,make,model,year,cover_image_url,owner_id,is_public").eq("is_public", true).in("make", l.compatible_makes ?? []).limit(6)
      : Promise.resolve({ data: [] }),
  ]);

  // Track view (fire and forget)
  admin.from("listing_views").insert({ listing_id: l.id }).then(() => {});
  admin.from("listings").update({ views_count: (l.views_count ?? 0) + 1 }).eq("id", l.id).then(() => {});

  const seller = sellerResult.data as any;
  const category = categoryResult.data as any;
  const similar = similarResult.data;
  const rawValuations = valuationsResult.data ?? [];
  const vehicleOwners = vehicleOwnersResult.data ?? [];

  // Fetch usernames for valuations
  const valUserIds = rawValuations.map((v: any) => v.user_id).filter((id: string, i: number, arr: string[]) => arr.indexOf(id) === i);
  const valProfiles = valUserIds.length > 0
    ? await admin.from("profiles").select("id,username,is_expert").in("id", valUserIds)
    : { data: [] };
  const valProfileMap: Record<string, any> = Object.fromEntries((valProfiles.data ?? []).map((p: any) => [p.id, p]));
  const valuations = rawValuations.map((v: any) => ({ ...v, username: valProfileMap[v.user_id]?.username ?? null, is_expert: valProfileMap[v.user_id]?.is_expert ?? v.is_expert }));
  const userHasValuated = !!(user && rawValuations.some((v: any) => v.user_id === user.id));

  // Fetch owner profiles for "chi ha questo veicolo"
  const ownerIds = (vehicleOwners ?? []).map((v: any) => v.owner_id).filter((id: string, i: number, arr: string[]) => arr.indexOf(id) === i);
  const ownerProfiles = ownerIds.length > 0
    ? await admin.from("profiles").select("id,username,avatar_url").in("id", ownerIds)
    : { data: [] };
  const ownerMap: Record<string, any> = Object.fromEntries((ownerProfiles.data ?? []).map((p: any) => [p.id, p]));
  const images: string[] = l.images ?? [];
  const mainImg = l.cover_image_url ?? images[0] ?? null;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ background: C.light, borderBottom: `1px solid ${C.tan}`, padding: "0.7rem 2.5rem" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", ...mono, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Link href="/search" style={{ color: C.muted, textDecoration: "none" }}>Ricambi</Link>
          {l.compatible_makes?.[0] && <><span>›</span><Link href={`/search?makes=${l.compatible_makes[0]}`} style={{ color: C.muted, textDecoration: "none" }}>{l.compatible_makes[0]}</Link></>}
          <span>›</span><span style={{ color: C.dark }}>{l.title}</span>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2.5rem", display: "grid", gridTemplateColumns: "1fr 360px", gap: "3rem", alignItems: "start" }}>
        {/* LEFT */}
        <div>
          {/* Main image */}
          <div style={{ aspectRatio: "4/3", background: C.dark, overflow: "hidden", marginBottom: ".8rem", position: "relative", borderRadius: "14px" }}>
            {mainImg
              ? <img src={mainImg} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#2a1f1a,#4a2e1e)" }} />
            }
            <span style={{ position: "absolute", top: "0.8rem", left: "0.8rem", ...mono, fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", background: l.condition === "nos" ? C.orange : C.dark, color: C.cream, padding: "0.25rem 0.6rem" }}>
              {CONDITION[l.condition] ?? l.condition}
            </span>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", overflowX: "auto" }}>
              {images.map((img, i) => (
                <div key={i} style={{ width: "72px", height: "54px", background: C.dark, overflow: "hidden", flexShrink: 0 }}>
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {l.compatible_makes?.map((m: string) => (
              <Link key={m} href={`/search?makes=${m}`} style={{ ...mono, fontSize: "0.52rem", letterSpacing: "0.08em", textTransform: "uppercase", color: C.orange, padding: "0.2rem 0.55rem", border: `1px solid ${C.orange}`, background: "rgba(196,98,45,0.06)", textDecoration: "none" }}>{m}</Link>
            ))}
            {category?.name_it && <span style={{ ...mono, fontSize: "0.52rem", letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, padding: "0.2rem 0.55rem", border: `1px solid ${C.tan}` }}>{category?.name_it}</span>}
          </div>

          <h1 style={{ ...serif, fontWeight: 900, fontSize: "2.2rem", lineHeight: 1.1, marginBottom: "0.5rem" }}>{l.title}</h1>
          <div style={{ ...mono, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, marginBottom: "2rem" }}>
            {l.location_city && `${l.location_city} · `}
            {new Date(l.created_at).toLocaleDateString("it-IT")} · {l.views_count ?? 0} visualizzazioni
          </div>

          {/* Description */}
          {l.description && (
            <div style={{ borderTop: `1px solid ${C.tan}`, paddingTop: "1.5rem", marginBottom: "2rem" }}>
              <div style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: "0.8rem" }}>Descrizione</div>
              <p style={{ ...body, fontSize: "1.05rem", lineHeight: 1.75, whiteSpace: "pre-line" }}>{l.description}</p>
            </div>
          )}

          {/* Specs */}
          <div style={{ borderTop: `1px solid ${C.tan}`, paddingTop: "1.5rem", marginBottom: "2rem" }}>
            <div style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: "0.8rem" }}>Specifiche</div>
            {[
              { k: "Condizione", v: CONDITION[l.condition] ?? l.condition },
              { k: "Numero parte", v: l.part_number ?? "—" },
              { k: "Anno veicolo", v: l.year_from && l.year_to ? `${l.year_from}–${l.year_to}` : l.year_from ?? l.year_to ?? "—" },
              { k: "Compatibile", v: l.compatible_makes?.join(", ") ?? "—" },
              { k: "Modelli", v: l.compatible_models?.join(", ") ?? "—" },
              { k: "Spedizione", v: l.shipping_available ? (l.shipping_cost_cents ? `${euros(l.shipping_cost_cents)}` : "Disponibile") : "Solo ritiro" },
            ].map((r, i) => (
              <div key={r.k} style={{ display: "flex", padding: "0.6rem 0.6rem", background: i % 2 === 0 ? C.light : "transparent", borderBottom: `1px solid ${C.tan}` }}>
                <span style={{ ...mono, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, flex: "0 0 160px" }}>{r.k}</span>
                <span style={{ ...body, fontSize: "0.98rem" }}>{String(r.v)}</span>
              </div>
            ))}
          </div>

          {/* Provenance */}
          {l.provenance_notes && (
            <div style={{ borderTop: `1px solid ${C.tan}`, paddingTop: "1.5rem", marginBottom: "2rem" }}>
              <div style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: "0.8rem" }}>Storia del pezzo</div>
              <p style={{ ...body, fontSize: "1.05rem", fontStyle: "italic", lineHeight: 1.75, borderLeft: `2px solid ${C.orange}`, paddingLeft: "1.2rem" }}>{l.provenance_notes}</p>
            </div>
          )}

          {/* Valutazione community */}
          <div style={{ borderTop: `1px solid ${C.tan}`, paddingTop: "2rem", marginBottom: "2rem" }}>
            <ValuationWidget
              listingId={l.id}
              userId={user?.id ?? null}
              initialValuations={valuations}
              userHasValuated={userHasValuated}
            />
          </div>

          {/* Chi ha questo veicolo */}
          {(vehicleOwners?.length ?? 0) > 0 && (
            <div style={{ borderTop: `1px solid ${C.tan}`, paddingTop: "2rem", marginBottom: "2rem" }}>
              <h3 style={{ ...serif, fontWeight: 700, fontSize: "1.2rem", marginBottom: "0.4rem" }}>
                Chi ha <em style={{ fontStyle: "italic", color: C.orange }}>questo veicolo</em>
              </h3>
              <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "0.95rem", color: C.muted, marginBottom: "1.2rem" }}>
                Collezionisti che possiedono veicoli compatibili con questo ricambio.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1px", background: C.tan, borderRadius: "14px", overflow: "hidden" }}>
                {(vehicleOwners ?? []).slice(0, 6).map((v: any) => {
                  const owner = ownerMap[v.owner_id];
                  return (
                    <Link key={v.id} href={`/garage/${owner?.username ?? v.owner_id}`} style={{ background: C.cream, textDecoration: "none", color: "inherit", padding: "0.8rem", display: "flex", gap: "0.6rem", alignItems: "center" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: C.dark, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {owner?.avatar_url
                          ? <img src={owner.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <span style={{ ...mono, fontSize: "0.5rem", color: C.cream }}>{owner?.username?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div>
                        <div style={{ ...mono, fontSize: "0.5rem", color: C.dark }}>@{owner?.username ?? "—"}</div>
                        <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.82rem", color: C.muted }}>{v.make} {v.model ?? ""} {v.year ? `(${v.year})` : ""}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Similar */}
          {(similar?.length ?? 0) > 0 && (
            <div style={{ borderTop: `1px solid ${C.tan}`, paddingTop: "2rem" }}>
              <h3 style={{ ...serif, fontWeight: 700, fontSize: "1.4rem", marginBottom: "1.2rem" }}>Annunci <em style={{ fontStyle: "italic", color: C.orange }}>simili</em></h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1px", background: C.tan, borderRadius: "14px", overflow: "hidden" }}>
                {(similar ?? []).map((s: any) => (
                  <Link key={s.id} href={`/listings/${s.slug ?? s.id}`} style={{ background: C.cream, textDecoration: "none", color: "inherit", display: "block" }}>
                    <div style={{ aspectRatio: "4/3", background: C.dark, overflow: "hidden" }}>
                      {s.cover_image_url ? <img src={s.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#2a1f1a,#3a2a1a)" }} />}
                    </div>
                    <div style={{ padding: "0.7rem" }}>
                      <div style={{ ...serif, fontWeight: 700, fontSize: "0.88rem", lineHeight: 1.2, marginBottom: "0.3rem" }}>{s.title}</div>
                      <div style={{ ...serif, fontWeight: 700, fontSize: "1rem", color: C.orange }}>{euros(s.price_cents)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ position: "sticky", top: "5rem" }}>
          {/* Price card */}
          <div style={{ border: `1px solid ${C.tan}`, borderRadius: "16px", overflow: "hidden", marginBottom: "1rem" }}>
            <div style={{ background: C.dark, padding: "1.5rem 1.2rem", borderRadius: "16px 16px 0 0" }}>
              <div style={{ ...mono, fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: C.orange, marginBottom: "0.4rem" }}>Prezzo</div>
              <div style={{ ...serif, fontWeight: 900, fontSize: "2.5rem", color: C.cream, lineHeight: 1, marginBottom: "0.3rem" }}>{euros(l.price_cents)}</div>
              {l.is_negotiable && <div style={{ ...mono, fontSize: "0.52rem", letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted }}>Trattabile</div>}
            </div>
            <div style={{ padding: "1.2rem" }}>
              {user?.id === l.seller_id && (
                <Link href={`/listings/edit/${l.slug}`} style={{ ...mono, fontSize:"0.6rem", display:"block", textAlign:"center", border:`1px solid ${C.tan}`, padding:"0.6rem", marginBottom:"0.6rem", textDecoration:"none", color:C.dark }}>Modifica annuncio →</Link>
              )}
              <BuyButton listingId={l.id} priceCents={l.price_cents} isSeller={user?.id === l.seller_id} />
              <ListingActions
                listingId={l.id}
                listingTitle={l.title}
                priceCents={l.price_cents}
                isNegotiable={l.is_negotiable}
                sellerId={l.seller_id}
              />
            </div>
          </div>

          {/* Seller card */}
          {seller && (
            <div style={{ border: `1px solid ${C.tan}`, borderRadius: "16px", padding: "1.2rem", marginBottom: "1rem" }}>
              <div style={{ ...mono, fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, marginBottom: "1rem" }}>Il venditore</div>
              <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", marginBottom: "0.8rem" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: C.dark, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", ...serif, fontWeight: 900, fontSize: "1.1rem", color: C.cream }}>
                  {seller.avatar_url ? <img src={seller.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (seller.full_name ?? seller.username ?? "U")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ ...serif, fontWeight: 700, fontSize: "1rem" }}>{seller.full_name ?? seller.username}</span>
                    {seller.is_verified && <span style={{ ...mono, fontSize: "0.45rem", color: C.orange, border: `1px solid ${C.orange}`, padding: "0.1rem 0.35rem" }}>✓</span>}
                  </div>
                  <div style={{ ...mono, fontSize: "0.5rem", letterSpacing: "0.06em", color: C.muted, textTransform: "uppercase" }}>
                    ★ {seller.rating_avg?.toFixed(1) ?? "—"} · {seller.sales_count ?? 0} vendite
                  </div>
                </div>
              </div>
              {seller.bio && <p style={{ ...body, fontStyle: "italic", fontSize: "0.88rem", color: C.muted, lineHeight: 1.5, marginBottom: "0.8rem" }}>{seller.bio}</p>}
              <Link href={`/profile/${seller.username}`} style={{ ...mono, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: C.dark, textDecoration: "none" }}>Vedi profilo →</Link>
            </div>
          )}

          {/* Trust badges */}
          <div style={{ border: `1px solid ${C.tan}`, borderRadius: "16px", padding: "1rem 1.2rem" }}>
            {[
              { icon: "🔒", t: "Pagamento protetto", d: "Transazioni sicure via Stripe" },
              { icon: "✓", t: "Venditore verificato", d: "Identità e reputazione verificate" },
              { icon: "↩", t: "Supporto acquisti", d: "Assistenza in caso di problemi" },
            ].map(b => (
              <div key={b.t} style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start", marginBottom: "0.7rem" }}>
                <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>{b.icon}</span>
                <div>
                  <div style={{ ...mono, fontSize: "0.52rem", letterSpacing: "0.06em", textTransform: "uppercase", color: C.dark }}>{b.t}</div>
                  <div style={{ ...body, fontSize: "0.82rem", color: C.muted }}>{b.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
