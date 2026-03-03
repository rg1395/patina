import { getAdmin } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { C, CONDITION, euros } from "@/lib/design";
import { createClient } from "@/lib/supabase/server";

const mono = { fontFamily: "DM Mono, Courier New, monospace" };
const serif = { fontFamily: "Playfair Display, serif" };

export default async function PublicGaragePage({ params }: { params: { username: string } }) {
  const admin = getAdmin();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await admin.from("profiles").select("*").eq("username", params.username).single();
  if (!profile) notFound();

  const p = profile as any;
  const isOwner = user?.id === p.id;

  // Fetch public vehicles (or all if owner)
  const vehicleQuery = admin.from("vehicles").select("*").eq("owner_id", p.id);
  const { data: vehicles } = isOwner
    ? await vehicleQuery.order("created_at", { ascending: false })
    : await vehicleQuery.eq("is_public", true).order("created_at", { ascending: false });

  // For each vehicle, fetch parts
  const vehicleIds = (vehicles ?? []).map((v: any) => v.id);
  const { data: allParts } = vehicleIds.length > 0
    ? await admin.from("vehicle_parts").select("*").in("vehicle_id", vehicleIds).order("installed_at", { ascending: false })
    : { data: [] };

  // Fetch linked listings for parts that have listing_id
  const listingIds = (allParts ?? []).filter((p: any) => p.listing_id).map((p: any) => p.listing_id);
  const { data: linkedListings } = listingIds.length > 0
    ? await admin.from("listings").select("id,title,slug,price_cents,cover_image_url").in("id", listingIds)
    : { data: [] };
  const listingMap: Record<string, any> = Object.fromEntries((linkedListings ?? []).map((l: any) => [l.id, l]));

  // Group parts by vehicle
  const partsByVehicle: Record<string, any[]> = {};
  (allParts ?? []).forEach((part: any) => {
    if (!partsByVehicle[part.vehicle_id]) partsByVehicle[part.vehicle_id] = [];
    partsByVehicle[part.vehicle_id].push(part);
  });

  // Active listings by seller
  const { data: sellerListings } = await admin
    .from("listings")
    .select("id,title,price_cents,cover_image_url,slug,condition,compatible_makes")
    .eq("seller_id", p.id)
    .eq("status", "active")
    .limit(6);

  const publicVehicles = (vehicles ?? []).filter((v: any) => isOwner || v.is_public);

  return (
    <div>
      {/* Header */}
      <div style={{ background: C.dark, padding: "3.5rem 2.5rem" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", gap: "2rem", alignItems: "flex-start" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: C.orange, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {p.avatar_url
              ? <img src={p.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ ...serif, fontWeight: 900, fontSize: "1.8rem", color: C.cream }}>{p.username?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "0.3rem" }}>
              <h1 style={{ ...serif, fontWeight: 900, fontSize: "2rem", color: C.cream }}>
                {p.full_name ?? p.username}
              </h1>
              {p.is_verified && <span style={{ ...mono, fontSize: "0.48rem", background: C.orange, color: C.cream, padding: "0.15rem 0.5rem" }}>✓ Verificato</span>}
              {p.is_expert && <span style={{ ...mono, fontSize: "0.48rem", background: "rgba(196,98,45,0.2)", color: C.orange, border: `1px solid rgba(196,98,45,0.4)`, padding: "0.15rem 0.5rem" }}>✦ Esperto</span>}
            </div>
            <div style={{ ...mono, fontSize: "0.52rem", color: C.muted, marginBottom: "0.6rem" }}>@{p.username}{p.location_city ? ` · ${p.location_city}` : ""}</div>
            {p.bio && <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: "rgba(245,240,232,0.55)", fontSize: "1rem", maxWidth: "500px" }}>{p.bio}</p>}
            <div style={{ display: "flex", gap: "2rem", marginTop: "1rem" }}>
              {[
                { label: "Veicoli", value: publicVehicles.length },
                { label: "Vendite", value: p.sales_count ?? 0 },
                { label: "Valutazione", value: p.rating_avg ? `${p.rating_avg.toFixed(1)}★` : "—" },
              ].map(s => (
                <div key={s.label} style={{ borderLeft: `2px solid ${C.orange}`, paddingLeft: "0.8rem" }}>
                  <div style={{ ...serif, fontWeight: 900, fontSize: "1.3rem", color: C.cream }}>{s.value}</div>
                  <div style={{ ...mono, fontSize: "0.46rem", color: C.muted }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          {isOwner && (
            <Link href="/garage" style={{ ...mono, fontSize: "0.55rem", color: C.muted, textDecoration: "none", border: `1px solid rgba(255,255,255,0.15)`, padding: "0.5rem 1rem", whiteSpace: "nowrap" }}>
              ← Il mio garage
            </Link>
          )}
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 2.5rem" }}>
        {/* VEHICLES */}
        {publicVehicles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", border: `1px dashed ${C.tan}`, marginBottom: "3rem" }}>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: C.muted, fontSize: "1.1rem", marginBottom: "1rem" }}>
              {isOwner ? "Non hai ancora aggiunto veicoli al garage pubblico." : "Nessun veicolo pubblico."}
            </p>
            {isOwner && (
              <Link href="/garage/add-vehicle" style={{ ...mono, fontSize: "0.6rem", color: C.orange, textDecoration: "none" }}>+ Aggiungi veicolo →</Link>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: "4rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ ...serif, fontWeight: 700, fontSize: "1.5rem" }}>
                Il <em style={{ fontStyle: "italic", color: C.orange }}>garage</em>
              </h2>
              {isOwner && (
                <Link href="/garage/add-vehicle" style={{ ...mono, fontSize: "0.58rem", background: C.orange, color: C.cream, padding: "0.5rem 1.1rem", textDecoration: "none" }}>
                  + Aggiungi veicolo
                </Link>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {publicVehicles.map((v: any) => {
                const parts = partsByVehicle[v.id] ?? [];
                return (
                  <div key={v.id} style={{ border: `1px solid ${C.tan}`, background: "white" }}>
                    {/* Vehicle header */}
                    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", background: C.dark }}>
                      <div style={{ aspectRatio: "4/3", background: "#1a1612", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {v.cover_image_url
                          ? <img src={v.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <span style={{ fontSize: "3rem", opacity: 0.2 }}>🚗</span>
                        }
                      </div>
                      <div style={{ padding: "1.5rem 2rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ ...mono, fontSize: "0.5rem", color: C.orange, marginBottom: "0.3rem", textTransform: "uppercase" }}>{v.type}</div>
                        <h3 style={{ ...serif, fontWeight: 900, fontSize: "1.6rem", color: C.cream, marginBottom: "0.4rem" }}>
                          {v.make} {v.model ?? ""}
                        </h3>
                        <div style={{ ...mono, fontSize: "0.52rem", color: C.muted }}>
                          {v.year && `${v.year}`}{v.color ? ` · ${v.color}` : ""}{v.plate ? ` · ${v.plate}` : ""}
                        </div>
                        {v.description && (
                          <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: "rgba(245,240,232,0.5)", fontSize: "0.95rem", marginTop: "0.8rem", maxWidth: "400px" }}>
                            {v.description}
                          </p>
                        )}
                        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", alignItems: "center" }}>
                          <span style={{ ...mono, fontSize: "0.48rem", color: C.muted }}>{parts.length} ricambi documentati</span>
                          {isOwner && (
                            <>
                              <Link href={`/garage/edit-vehicle/${v.id}`} style={{ ...mono, fontSize: "0.5rem", color: C.muted, textDecoration: "none", border: `1px solid rgba(255,255,255,0.15)`, padding: "0.25rem 0.6rem" }}>
                                Modifica
                              </Link>
                              <TogglePublicButton vehicleId={v.id} isPublic={v.is_public} />
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Parts list */}
                    <div style={{ padding: "1.5rem 2rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <div style={{ ...mono, fontSize: "0.52rem", color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          Ricambi installati
                        </div>
                        {isOwner && <AddPartButton vehicleId={v.id} />}
                      </div>

                      {parts.length === 0 ? (
                        <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: C.muted, fontSize: "0.95rem" }}>
                          {isOwner ? "Aggiungi i ricambi installati su questo veicolo." : "Nessun ricambio documentato."}
                        </p>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "1px", background: C.tan, borderRadius: "14px", overflow: "hidden" }}>
                          {parts.map((part: any) => {
                            const linked = part.listing_id ? listingMap[part.listing_id] : null;
                            return (
                              <div key={part.id} style={{ background: C.cream, padding: "0.9rem 1rem", display: "flex", gap: "0.8rem", alignItems: "flex-start" }}>
                                {linked?.cover_image_url && (
                                  <div style={{ width: "42px", height: "32px", flexShrink: 0, overflow: "hidden", background: C.light }}>
                                    <img src={linked.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ ...serif, fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.15rem" }}>{part.name}</div>
                                  {part.description && (
                                    <div style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "0.85rem", color: C.muted, lineHeight: 1.4 }}>{part.description}</div>
                                  )}
                                  <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginTop: "0.3rem", flexWrap: "wrap" }}>
                                    {part.installed_at && (
                                      <span style={{ ...mono, fontSize: "0.42rem", color: C.muted }}>{new Date(part.installed_at).toLocaleDateString("it-IT")}</span>
                                    )}
                                    {linked && (
                                      <Link href={`/listings/${linked.slug}`} style={{ ...mono, fontSize: "0.42rem", color: C.orange, textDecoration: "none" }}>
                                        Vedi annuncio →
                                      </Link>
                                    )}
                                    {isOwner && <DeletePartButton partId={part.id} />}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active listings */}
        {(sellerListings?.length ?? 0) > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ ...serif, fontWeight: 700, fontSize: "1.5rem" }}>
                Annunci <em style={{ fontStyle: "italic", color: C.orange }}>attivi</em>
              </h2>
              <Link href={`/search?seller=${p.username}`} style={{ ...mono, fontSize: "0.55rem", color: C.muted, textDecoration: "none" }}>Vedi tutti →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1px", background: C.tan, borderRadius: "14px", overflow: "hidden" }}>
              {(sellerListings ?? []).map((l: any) => (
                <Link key={l.id} href={`/listings/${l.slug ?? l.id}`} style={{ background: C.cream, textDecoration: "none", color: "inherit" }}>
                  <div style={{ aspectRatio: "4/3", background: C.light, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {l.cover_image_url
                      ? <img src={l.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: "2rem", opacity: 0.2 }}>🔧</span>
                    }
                  </div>
                  <div style={{ padding: "0.8rem 1rem" }}>
                    <div style={{ ...mono, fontSize: "0.48rem", color: C.orange, marginBottom: "0.2rem" }}>{(l.compatible_makes ?? []).slice(0, 2).join(", ")}</div>
                    <div style={{ ...serif, fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.3, marginBottom: "0.5rem" }}>{l.title}</div>
                    <div style={{ ...serif, fontWeight: 900, fontSize: "1.1rem" }}>{euros(l.price_cents)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Client components for interactivity
function TogglePublicButton({ vehicleId, isPublic }: { vehicleId: string; isPublic: boolean }) {
  "use client";
  return (
    <form action="/api/vehicle-parts" method="PATCH" style={{ display: "inline" }}>
      <input type="hidden" name="vehicle_id" value={vehicleId} />
      <input type="hidden" name="is_public" value={(!isPublic).toString()} />
      <button type="button" style={{ fontFamily: "DM Mono, monospace", fontSize: "0.48rem", color: isPublic ? "#2d7a2d" : "var(--muted)", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", padding: "0.25rem 0.6rem", cursor: "pointer" }}>
        {isPublic ? "✓ Pubblico" : "Privato"}
      </button>
    </form>
  );
}

function AddPartButton({ vehicleId }: { vehicleId: string }) {
  return (
    <Link href={`/garage/vehicle/${vehicleId}/add-part`} style={{ fontFamily: "DM Mono, monospace", fontSize: "0.5rem", color: "var(--orange, #C4622D)", textDecoration: "none", border: "1px solid var(--tan, #D4B896)", padding: "0.3rem 0.7rem" }}>
      + Aggiungi ricambio
    </Link>
  );
}

function DeletePartButton({ partId }: { partId: string }) {
  return (
    <span style={{ fontFamily: "DM Mono, monospace", fontSize: "0.42rem", color: "#9a8e82", cursor: "pointer" }}>
      ✕
    </span>
  );
}
