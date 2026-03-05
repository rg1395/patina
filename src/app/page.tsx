import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/db";
import Link from "next/link";
import { C, euros, CONDITION, MAKES } from "@/lib/design";

const S = {
  serif: { fontFamily: "Playfair Display, serif" },
  mono:  { fontFamily: "DM Mono, monospace" },
  body:  { fontFamily: "Lora, serif" },
};

// ─── shared micro-styles ──────────────────────────────────────
const eyebrow = (light = false): React.CSSProperties => ({
  fontFamily: "DM Mono, monospace", fontSize: ".6rem", letterSpacing: ".2em",
  textTransform: "uppercase", color: C.orange, marginBottom: ".7rem",
  display: "flex", alignItems: "center", gap: ".8rem",
});
const pill = (dark = false): React.CSSProperties => ({
  fontFamily: "DM Mono, monospace", fontSize: ".62rem", letterSpacing: ".1em",
  textTransform: "uppercase", background: dark ? C.dark : C.orange, color: C.cream,
  padding: ".9rem 2rem", borderRadius: "100px", textDecoration: "none",
  display: "inline-block", border: "none", cursor: "pointer",
});
const ghost = (light = false): React.CSSProperties => ({
  fontFamily: "DM Mono, monospace", fontSize: ".62rem", letterSpacing: ".1em",
  textTransform: "uppercase", color: light ? "rgba(246,242,235,0.4)" : "rgba(20,18,16,0.4)",
  textDecoration: "none",
});

// ─── Listing card (dark version for listings grid) ────────────
function DarkListingCard({ l, featured }: { l: any; featured?: boolean }) {
  return (
    <Link href={`/listings/${l.slug ?? l.id}`} style={{
      background: "rgba(246,242,235,.025)", border: "1px solid rgba(200,184,152,.08)",
      borderRadius: "14px", overflow: "hidden", textDecoration: "none", color: "inherit",
      display: "flex", flexDirection: "column",
      transition: "background .25s, transform .3s cubic-bezier(.34,1.56,.64,1)",
    }}>
      <div style={{
        aspectRatio: featured ? "16/9" : "4/3", background: "#100e0c",
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem",
      }}>
        {l.cover_image_url
          ? <img src={l.cover_image_url} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ opacity: .15 }}>🔧</span>}
        {l.condition && (
          <span style={{
            position: "absolute", bottom: ".7rem", left: ".7rem",
            fontFamily: "DM Mono, monospace", fontSize: ".46rem", letterSpacing: ".1em",
            textTransform: "uppercase", background: l.condition === "nos" ? C.orange : "rgba(246,242,235,.12)",
            color: C.cream, padding: ".2rem .6rem", borderRadius: "100px",
          }}>
            {CONDITION[l.condition] ?? l.condition}
          </span>
        )}
      </div>
      <div style={{ padding: "1.1rem 1.2rem 1.3rem", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".48rem", letterSpacing: ".12em", textTransform: "uppercase", color: C.orange, marginBottom: ".35rem" }}>
          {l.compatible_makes?.slice(0, 2).join(", ") ?? ""}{l.location_city ? ` · ${l.location_city}` : ""}
        </div>
        <div style={{ ...S.serif, fontWeight: 700, fontSize: featured ? "1.15rem" : ".97rem", lineHeight: 1.3, marginBottom: "auto", paddingBottom: ".8rem", color: C.cream }}>
          {l.title}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(200,184,152,.08)", paddingTop: ".8rem" }}>
          <span style={{ ...S.serif, fontWeight: 900, fontSize: featured ? "1.4rem" : "1.15rem", color: "#E07040" }}>
            {euros(l.price_cents)}
          </span>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: ".44rem", color: "rgba(246,242,235,.25)" }}>
            {l.views_count ? `${l.views_count} visite` : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Listing card (cream background for NOS section) ──────────
function LightListingCard({ l }: { l: any }) {
  return (
    <Link href={`/listings/${l.slug ?? l.id}`} style={{
      background: C.white, borderRadius: "14px", overflow: "hidden",
      textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column",
      boxShadow: "0 1px 6px rgba(0,0,0,.07)",
      transition: "transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s",
    }}>
      <div style={{ aspectRatio: "4/3", background: C.light, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>
        {l.cover_image_url
          ? <img src={l.cover_image_url} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ opacity: .12, fontSize: "3.5rem" }}>🔩</span>}
        <span style={{ position: "absolute", bottom: ".6rem", left: ".6rem", fontFamily: "DM Mono, monospace", fontSize: ".46rem", letterSpacing: ".1em", textTransform: "uppercase", background: C.orange, color: C.cream, padding: ".2rem .55rem", borderRadius: "100px" }}>NOS</span>
      </div>
      <div style={{ padding: "1rem 1.1rem 1.2rem", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".48rem", letterSpacing: ".12em", textTransform: "uppercase", color: C.orange, marginBottom: ".3rem" }}>
          {l.compatible_makes?.slice(0, 2).join(", ") ?? ""}
        </div>
        <div style={{ ...S.serif, fontWeight: 700, fontSize: ".95rem", lineHeight: 1.3, marginBottom: "auto", paddingBottom: ".7rem" }}>{l.title}</div>
        <div style={{ ...S.serif, fontWeight: 900, fontSize: "1.15rem", color: C.orange }}>{euros(l.price_cents)}</div>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const admin = getAdmin();

  const [
    { data: listings },
    { data: nos },
    { count: totalListings },
    { data: threads },
    { data: articles },
    { data: events },
  ] = await Promise.all([
    supabase.from("listings").select("id,title,price_cents,cover_image_url,slug,condition,compatible_makes,location_city,views_count").eq("status", "active").order("created_at", { ascending: false }).limit(5),
    supabase.from("listings").select("id,title,price_cents,cover_image_url,slug,compatible_makes").eq("status", "active").eq("condition", "nos").order("created_at", { ascending: false }).limit(4),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
    admin.from("forum_threads").select("id,title,category,slug,author_id,created_at,replies_count").order("created_at", { ascending: false }).limit(4),
    admin.from("articles").select("id,title,slug,tags,author_id,published_at,views_count").eq("status", "published").order("published_at", { ascending: false }).limit(3),
    supabase.from("events").select("id,title,city,event_date,country").gte("event_date", new Date().toISOString().split("T")[0]).order("event_date", { ascending: true }).limit(3),
  ]);

  const ticker = ["Weber 40 DCOE", "Alfa GTA", "Ferrari 250", "Ducati Bevel", "Lancia Delta", "Porsche 356", "Fiat 500", "Abarth", "MV Agusta", "NOS", "Pistoni originali", "Testata Fulvia"];
  const tickerItems = [...ticker, ...ticker, ...ticker];

  const featuredListing = (listings ?? [])[0];
  const restListings = (listings ?? []).slice(1);

  const PILLARS = [
    { num: "01", icon: "🔩", name: "Ricambi & NOS", desc: "Migliaia di ricambi originali, NOS e restaurati. Motori, carburatori, carrozzeria, elettronica. Tutto quello che cerchi, venduto da chi capisce.", href: "/search" },
    { num: "02", icon: "💬", name: "Community", desc: "Un forum serio per persone serie. Tecnica, mercato, storia, raduni. Con esperti verificati che rispondono — non troll che sparano.", href: "/community" },
    { num: "03", icon: "📖", name: "Rubriche tecniche", desc: "Guide scritte da chi sa. Come riconoscere un falso. Come valutare un NOS. Come restaurare senza rovinare. Una biblioteca viva.", href: "/rubriche" },
    { num: "04", icon: "🏁", name: "Raduni & Garage", desc: "Calendario raduni in tutta Europa. Il tuo garage digitale. Chi possiede il tuo stesso veicolo. La comunità di chi vive la passione.", href: "/events" },
  ];

  const CATS = ["tecnica", "mercato", "storia", "raduni", "officine", "generale"];
  const catNames: Record<string, string> = {
    tecnica: "Tecnica", mercato: "Mercato", storia: "Storia",
    raduni: "Raduni", officine: "Officine", generale: "Generale",
  };

  return (
    <div style={{ background: C.dark }}>

      {/* ══════════════════════════════════════════
          HERO — editorial split
      ══════════════════════════════════════════ */}
      <section style={{ minHeight: "100svh", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,400px),1fr))", position: "relative", overflow: "hidden" }} id="heroSection">

        {/* Grain overlay */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E")`, backgroundSize: "200px 200px", opacity: .5, pointerEvents: "none" }} />

        {/* Left — massive type */}
        <div id="heroText" style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "8rem 3.5rem 4.5rem", position: "relative", zIndex: 2 }}>
          <div style={{ ...eyebrow() }}>
            <span style={{ width: "28px", height: "1px", background: C.orange, flexShrink: 0 }} />
            La casa dei collezionisti europei
          </div>
          <h1 style={{ ...S.serif, fontWeight: 900, fontSize: "clamp(3.5rem,6.5vw,7.5rem)", lineHeight: .9, letterSpacing: "-.04em", color: C.cream, marginBottom: "2rem" }}>
            <span style={{ display: "block", animation: "fadeUp .8s .1s ease both" }}>Compra.</span>
            <span style={{ display: "block", fontStyle: "italic", color: C.orange, animation: "fadeUp .8s .2s ease both" }}>Vendi.</span>
            <span style={{ display: "block", animation: "fadeUp .8s .3s ease both" }}>Connettiti.</span>
            <span style={{ display: "block", fontStyle: "italic", fontSize: ".5em", color: "rgba(246,242,235,.35)", animation: "fadeUp .8s .4s ease both" }}>Vivi la passione.</span>
          </h1>
          <p style={{ ...S.body, fontStyle: "italic", fontSize: "1.1rem", color: "rgba(246,242,235,.52)", lineHeight: 1.75, maxWidth: "420px", marginBottom: "2.5rem", animation: "fadeUp .8s .5s ease both" }}>
            Ricambi rari, community appassionata, rubriche tecniche, raduni in tutta Europa. Tutto quello che un collezionista ha sempre cercato —&nbsp;in un solo posto.
          </p>
          <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap", alignItems: "center", animation: "fadeUp .8s .6s ease both" }}>
            <Link href="/search" style={{ ...pill(), fontSize: ".68rem" }}>Esplora Patina →</Link>
            <Link href="/auth/register" style={{ ...ghost(true) }}>Registrati gratis</Link>
          </div>
        </div>

        {/* Right — editorial mosaic */}
        <div id="heroMosaic" style={{ display: "grid", gridTemplateRows: "55% 45%", gridTemplateColumns: "1fr 1fr", gap: "2px", background: "rgba(200,184,152,.06)", position: "relative", zIndex: 2 }}>

          {/* Big listing preview */}
          {featuredListing ? (
            <Link href={`/listings/${featuredListing.slug ?? featuredListing.id}`} style={{ gridColumn: "1/-1", position: "relative", overflow: "hidden", display: "flex", textDecoration: "none", color: "inherit", background: "#0a0806" }}>
              {featuredListing.cover_image_url
                ? <img src={featuredListing.cover_image_url} alt={featuredListing.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: .7 }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontFamily: "DM Mono, monospace", fontSize: ".6rem", letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(246,242,235,.15)" }}>Nessuna immagine</span></div>}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,8,6,.95) 0%, transparent 50%)" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1.5rem 1.8rem" }}>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".48rem", letterSpacing: ".14em", textTransform: "uppercase", color: C.orange, marginBottom: ".4rem" }}>
                  {CONDITION[featuredListing.condition] ?? ""} · {featuredListing.compatible_makes?.[0] ?? ""}
                </div>
                <div style={{ ...S.serif, fontWeight: 700, fontSize: "1.15rem", color: C.cream, lineHeight: 1.25, marginBottom: ".4rem" }}>{featuredListing.title}</div>
                <div style={{ ...S.serif, fontWeight: 900, fontSize: "1.3rem", color: "#E07040" }}>{euros(featuredListing.price_cents)}</div>
              </div>
            </Link>
          ) : (
            <div style={{ gridColumn: "1/-1", background: "#0a0806", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "6rem", opacity: .06 }}>🔧</span>
            </div>
          )}

          {/* Rubrica preview */}
          <Link href="/rubriche" style={{ position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end", textDecoration: "none", color: "inherit", background: "#10100e", padding: "1.2rem" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1a1612 0%, #0e0e0c 100%)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".46rem", letterSpacing: ".14em", textTransform: "uppercase", color: C.orange, marginBottom: ".3rem" }}>Rubriche · Tecnica</div>
              <div style={{ ...S.serif, fontWeight: 700, fontSize: ".88rem", color: C.cream, lineHeight: 1.3 }}>
                {(articles ?? [])[0]?.title ?? "Come riconoscere un Weber falso — 5 segnali certi"}
              </div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".42rem", color: "rgba(246,242,235,.3)", marginTop: ".4rem" }}>
                {(articles ?? [])[0]?.views_count ?? 1240} letture
              </div>
            </div>
          </Link>

          {/* Events preview */}
          <Link href="/events" style={{ position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end", textDecoration: "none", color: "inherit", background: "#120e0a", padding: "1.2rem" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #180e08 0%, #0c0c0a 100%)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".46rem", letterSpacing: ".14em", textTransform: "uppercase", color: C.orange, marginBottom: ".3rem" }}>Raduno · Europa</div>
              <div style={{ ...S.serif, fontWeight: 700, fontSize: ".88rem", color: C.cream, lineHeight: 1.3 }}>
                {(events ?? [])[0]?.title ?? "Mille Miglia 2026 — Brescia"}
              </div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".42rem", color: "rgba(246,242,235,.3)", marginTop: ".4rem" }}>
                {(events ?? [])[0]?.city ?? "Brescia"}
                {(events ?? [])[0]?.event_date ? ` · ${new Date((events ?? [])[0].event_date).toLocaleDateString("it-IT", { day: "2-digit", month: "long" })}` : ""}
              </div>
            </div>
          </Link>
        </div>

        {/* Vertical divider */}
        <div style={{ position: "absolute", top: 0, left: "50%", bottom: 0, width: "1px", background: "rgba(200,184,152,.07)", zIndex: 3 }} />

        <style>{`
          @keyframes fadeUp { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:translateY(0) } }
          @keyframes ticker { 0% { transform:translateX(0) } 100% { transform:translateX(-50%) } }
          @media(max-width:900px) {
            #heroSection { grid-template-columns:1fr!important; }
            #heroMosaic { display:none!important; }
            #heroText { padding:7rem 1.8rem 4rem!important; min-height:100svh; justify-content:flex-end; }
          }
        `}</style>
      </section>

      {/* ══════════════════════════════════════════
          TICKER
      ══════════════════════════════════════════ */}
      <div style={{ background: C.orange, overflow: "hidden", padding: ".55rem 0" }}>
        <div style={{ display: "flex", animation: "ticker 40s linear infinite", width: "max-content" }}>
          {tickerItems.map((t, i) => (
            <span key={i} style={{ fontFamily: "DM Mono, monospace", fontSize: ".58rem", letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(246,242,235,.8)", padding: "0 2.5rem", whiteSpace: "nowrap" }}>
              {t} ·
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          UNIVERSE — 4 pillars
      ══════════════════════════════════════════ */}
      <section style={{ background: C.cream, color: C.dark, padding: "7rem 2rem", position: "relative", overflow: "hidden" }}>
        {/* Big background word */}
        <div style={{ position: "absolute", fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(8rem,18vw,22rem)", color: "rgba(20,18,16,.035)", letterSpacing: "-.06em", lineHeight: 1, top: "50%", left: "50%", transform: "translate(-50%,-50%)", whiteSpace: "nowrap", pointerEvents: "none", userSelect: "none", zIndex: 0 }}>
          PATINA
        </div>

        <div style={{ maxWidth: "1400px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "end", marginBottom: "5rem" }} id="universeHeader">
            <div>
              <div style={{ ...eyebrow() }}>Non solo un marketplace</div>
              <h2 style={{ ...S.serif, fontWeight: 900, fontStyle: "italic", fontSize: "clamp(2.5rem,5vw,4rem)", lineHeight: 1.0, letterSpacing: "-.03em" }}>
                Tutto quello che<br />un collezionista<br /><span style={{ fontStyle: "normal", color: C.orange }}>ha sempre voluto</span>
              </h2>
            </div>
            <p style={{ ...S.body, fontStyle: "italic", fontSize: "1.1rem", color: C.muted, lineHeight: 1.8, alignSelf: "end" }}>
              Patina nasce da una domanda semplice: perché non esiste un posto dove i veri appassionati di auto e moto d'epoca possano comprare, vendere, imparare, incontrarsi e raccontarsi? Adesso esiste.
            </p>
          </div>

          {/* Pillars */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", borderTop: `1px solid rgba(20,18,16,.1)` }} id="pillarsGrid">
            {PILLARS.map((p, i) => (
              <Link key={p.num} href={p.href} className="pillar-link" style={{
                borderRight: i < 3 ? `1px solid rgba(20,18,16,.1)` : "none",
                padding: "2.5rem 2rem", display: "block", textDecoration: "none", color: "inherit",
              }}>
                <div style={{ ...S.serif, fontWeight: 900, fontStyle: "italic", fontSize: "4rem", color: "rgba(20,18,16,.07)", lineHeight: 1, marginBottom: "1rem" }}>{p.num}</div>
                <span style={{ fontSize: "2.6rem", display: "block", marginBottom: "1rem", lineHeight: 1 }}>{p.icon}</span>
                <div style={{ ...S.serif, fontWeight: 700, fontSize: "1.2rem", marginBottom: ".65rem" }}>{p.name}</div>
                <p style={{ ...S.body, fontStyle: "italic", fontSize: ".9rem", color: C.muted, lineHeight: 1.7 }}>{p.desc}</p>
                <span className="pillar-arrow" style={{ fontFamily: "DM Mono, monospace", fontSize: ".55rem", letterSpacing: ".1em", textTransform: "uppercase", color: C.orange, display: "block", marginTop: "1.5rem" }}>Scopri →</span>
              </Link>
            ))}
          </div>

          {/* Stats bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", border: `1px solid rgba(20,18,16,.1)`, borderRadius: "14px", overflow: "hidden", marginTop: "3rem" }} id="statsBar">
            {[
              { n: `${totalListings ?? 0}+`, l: "Ricambi attivi" },
              { n: "12k+", l: "Collezionisti" },
              { n: "340+", l: "Marche" },
              { n: "€2.4M", l: "Scambiati" },
            ].map((s, i) => (
              <div key={s.l} style={{ padding: "1.8rem 2rem", borderRight: i < 3 ? `1px solid rgba(20,18,16,.1)` : "none", textAlign: "center" }}>
                <div style={{ ...S.serif, fontWeight: 900, fontSize: "2.2rem", color: C.orange, lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".52rem", letterSpacing: ".12em", textTransform: "uppercase", color: C.muted, marginTop: ".4rem" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @media(max-width:1024px){#universeHeader{grid-template-columns:1fr!important}#pillarsGrid{grid-template-columns:1fr 1fr!important}#statsBar{grid-template-columns:1fr 1fr!important}}
          @media(max-width:600px){#pillarsGrid{grid-template-columns:1fr!important}#statsBar{grid-template-columns:1fr 1fr!important}}
        `}</style>
      </section>

      {/* ══════════════════════════════════════════
          LISTINGS — editorial asymmetric grid
      ══════════════════════════════════════════ */}
      <section className="listings-section" style={{ background: C.dark, padding: "7rem 2rem" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
            <div>
              <div style={{ ...eyebrow() }}>Appena pubblicati</div>
              <h2 style={{ ...S.serif, fontWeight: 900, fontSize: "clamp(2rem,4vw,3rem)", letterSpacing: "-.03em", lineHeight: 1, color: C.cream }}>
                Ricambi in <em style={{ fontStyle: "italic", color: C.orange }}>evidenza</em>
              </h2>
            </div>
            <Link href="/search" style={{ fontFamily: "DM Mono, monospace", fontSize: ".55rem", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(246,242,235,.3)", textDecoration: "none", whiteSpace: "nowrap" }}>
              Vedi tutti i {totalListings ?? 0} ricambi →
            </Link>
          </div>

          {(listings?.length ?? 0) === 0 ? (
            <div style={{ textAlign: "center", padding: "6rem 2rem", border: `1px dashed rgba(200,184,152,.15)`, borderRadius: "16px" }}>
              <p style={{ ...S.body, fontStyle: "italic", color: "rgba(246,242,235,.35)", fontSize: "1.1rem", marginBottom: "1.5rem" }}>Nessun annuncio ancora. Sii il primo a pubblicare.</p>
              <Link href="/listings/new" style={{ ...pill() }}>Pubblica ora →</Link>
            </div>
          ) : (
            <>
              {/* Featured wide */}
              {featuredListing && (
                <div style={{ marginBottom: "1px" }}>
                  <DarkListingCard l={featuredListing} featured />
                </div>
              )}
              {/* Grid of rest */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "1px", background: "rgba(200,184,152,.06)", borderRadius: "0 0 14px 14px", overflow: "hidden" }}>
                {restListings.map((l: any) => (
                  <DarkListingCard key={l.id} l={l} />
                ))}
              </div>
            </>
          )}

          {/* Search bar */}
          <style>{`
            @media (max-width: 600px) {
              .search-row { flex-direction: column !important; border-radius: 16px !important; padding: .5rem !important; }
              .search-select { display: none !important; }
              .search-divider { display: none !important; }
              .search-btn { width: 100% !important; border-radius: 12px !important; padding: .9rem !important; text-align: center; }
            }
          `}</style>
          <form action="/search" method="GET" style={{ marginTop: "2rem" }}>
            <div className="search-row" style={{ display: "flex", background: "rgba(246,242,235,.05)", border: "1px solid rgba(200,184,152,.12)", borderRadius: "100px", padding: ".35rem", gap: ".3rem", alignItems: "center" }}>
              <select name="makes" className="search-select" style={{ fontFamily: "DM Mono, monospace", fontSize: ".58rem", letterSpacing: ".08em", textTransform: "uppercase", padding: "0 1rem", background: "transparent", color: "rgba(246,242,235,.4)", border: "none", outline: "none", cursor: "pointer" }}>
                <option value="" style={{ color: C.dark, background: "#fff" }}>Tutte le marche</option>
                {MAKES.map(m => <option key={m} value={m} style={{ color: C.dark, background: "#fff" }}>{m}</option>)}
              </select>
              <div className="search-divider" style={{ width: "1px", height: "18px", background: "rgba(200,184,152,.15)", flexShrink: 0 }} />
              <input name="q" type="text" placeholder="Cerca ricambi…" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.cream, fontFamily: "Lora, serif", fontStyle: "italic", fontSize: "1rem", padding: ".7rem 1rem", minWidth: 0 }} />
              <button type="submit" className="search-btn" style={{ background: C.orange, color: C.cream, border: "none", borderRadius: "100px", padding: ".8rem 1.8rem", fontFamily: "DM Mono, monospace", fontSize: ".62rem", letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>Cerca</button>
            </div>
            <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginTop: "1rem" }}>
              {["NOS", "Carburazione", "Motore", "Ducati", "Alfa Romeo", "Ferrari"].map(t => (
                <Link key={t} href={`/search?q=${t}`} style={{ fontFamily: "DM Mono, monospace", fontSize: ".5rem", letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(246,242,235,.28)", border: "1px solid rgba(200,184,152,.14)", padding: ".28rem .75rem", borderRadius: "100px", textDecoration: "none" }}>{t}</Link>
              ))}
            </div>
          </form>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          NOS SECTION — cream background
      ══════════════════════════════════════════ */}
      {(nos?.length ?? 0) > 0 && (
        <section style={{ background: C.cream, color: C.dark, padding: "6rem 2rem" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem" }}>
              <div>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".58rem", letterSpacing: ".15em", textTransform: "uppercase", color: C.orange, marginBottom: ".5rem" }}>New Old Stock</div>
                <h2 style={{ ...S.serif, fontWeight: 900, fontStyle: "italic", fontSize: "clamp(1.8rem,4vw,2.8rem)", letterSpacing: "-.02em", lineHeight: 1 }}>
                  Pezzi <span style={{ fontStyle: "normal", color: C.orange }}>mai usati</span>
                </h2>
              </div>
              <Link href="/search?cond=nos" style={{ fontFamily: "DM Mono, monospace", fontSize: ".56rem", letterSpacing: ".12em", textTransform: "uppercase", color: C.muted, textDecoration: "none", whiteSpace: "nowrap" }}>Tutti i NOS →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1.2rem" }}>
              {(nos ?? []).map((l: any) => <LightListingCard key={l.id} l={l} />)}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          COMMUNITY + RUBRICHE — side by side
      ══════════════════════════════════════════ */}
      <section style={{ background: C.cream, color: C.dark, padding: "6rem 2rem", borderTop: `1px solid rgba(20,18,16,.08)` }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".58rem", letterSpacing: ".2em", textTransform: "uppercase", color: C.orange, marginBottom: ".5rem" }}>Community viva</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "start" }} id="communityGrid">

            {/* Forum threads */}
            <div>
              <h2 style={{ ...S.serif, fontWeight: 900, fontStyle: "italic", fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.0, letterSpacing: "-.03em", marginBottom: "1rem" }}>
                Il forum dei <em style={{ fontStyle: "normal", color: C.orange }}>veri</em> collezionisti
              </h2>
              <p style={{ ...S.body, fontStyle: "italic", color: C.muted, fontSize: "1.05rem", lineHeight: 1.75, marginBottom: "2rem" }}>
                Niente spam, niente bot. Solo persone che sanno di cosa parlano — e esperti verificati che rispondono con competenza.
              </p>

              <div>
                {(threads?.length ?? 0) === 0 ? (
                  <div style={{ ...S.body, fontStyle: "italic", color: C.muted }}>Nessuna discussione ancora.</div>
                ) : (threads ?? []).map((t: any, i: number) => (
                  <Link key={t.id} href={`/community/${t.slug ?? t.id}`} style={{ display: "flex", gap: "1rem", alignItems: "flex-start", padding: "1rem 0", borderBottom: i < (threads?.length ?? 0) - 1 ? `1px solid rgba(20,18,16,.1)` : "none", textDecoration: "none", color: "inherit" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.orange, flexShrink: 0, marginTop: ".45rem" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".46rem", letterSpacing: ".1em", textTransform: "uppercase", color: C.orange, marginBottom: ".2rem" }}>
                        {catNames[t.category] ?? t.category}
                      </div>
                      <div style={{ ...S.serif, fontWeight: 700, fontSize: ".97rem", lineHeight: 1.3, marginBottom: ".2rem" }}>{t.title}</div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".44rem", color: C.muted }}>
                        {new Date(t.created_at).toLocaleDateString("it-IT")} · {t.replies_count ?? 0} risposte
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <Link href="/community" style={{ fontFamily: "DM Mono, monospace", fontSize: ".58rem", letterSpacing: ".12em", textTransform: "uppercase", color: C.orange, textDecoration: "none", display: "inline-block", marginTop: "1.5rem" }}>
                Entra nel forum →
              </Link>
            </div>

            {/* Rubriche */}
            <div>
              <h2 style={{ ...S.serif, fontWeight: 900, fontStyle: "italic", fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.0, letterSpacing: "-.03em", marginBottom: "1rem" }}>
                Rubriche dagli <em style={{ fontStyle: "normal", color: C.orange }}>esperti</em>
              </h2>
              <p style={{ ...S.body, fontStyle: "italic", color: C.muted, fontSize: "1.05rem", lineHeight: 1.75, marginBottom: "2rem" }}>
                Guide scritte da chi ci lavora. Niente Wikipedia, niente AI. Solo esperienza vera.
              </p>

              {/* Featured article */}
              {(articles?.length ?? 0) > 0 && (
                <Link href={`/rubriche/${(articles ?? [])[0].slug}`} style={{ display: "block", background: C.dark, borderRadius: "14px", overflow: "hidden", textDecoration: "none", color: "inherit", marginBottom: "1rem" }}>
                  <div style={{ height: "160px", background: "linear-gradient(135deg,#1a1612,#0e0e0c)" }}></div>
                  <div style={{ padding: "1.2rem 1.4rem 1.5rem" }}>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".46rem", letterSpacing: ".12em", textTransform: "uppercase", color: C.orange, marginBottom: ".4rem" }}>
                      {((articles ?? [])[0].tags ?? []).slice(0, 2).join(" · ") || "Rubrica"}
                    </div>
                    <div style={{ ...S.serif, fontWeight: 900, fontSize: "1.1rem", color: C.cream, lineHeight: 1.25, marginBottom: ".4rem" }}>{(articles ?? [])[0].title}</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".44rem", color: "rgba(246,242,235,.3)" }}>
                      {(articles ?? [])[0].views_count ?? 0} letture
                    </div>
                  </div>
                </Link>
              )}

              {/* Mini list */}
              {(articles ?? []).slice(1).map((a: any, i: number) => (
                <Link key={a.id} href={`/rubriche/${a.slug}`} style={{ display: "flex", gap: ".9rem", alignItems: "center", padding: ".8rem 0", borderBottom: i < (articles?.length ?? 0) - 2 ? `1px solid rgba(20,18,16,.1)` : "none", textDecoration: "none", color: "inherit" }}>
                  <div style={{ ...S.serif, fontWeight: 900, fontStyle: "italic", fontSize: "1.4rem", color: "rgba(20,18,16,.15)", flexShrink: 0, width: "28px", lineHeight: 1 }}>{String(i + 2).padStart(2, "0")}</div>
                  <div>
                    <div style={{ ...S.serif, fontWeight: 700, fontSize: ".9rem", lineHeight: 1.3, marginBottom: ".15rem" }}>{a.title}</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".44rem", color: C.muted }}>{a.views_count ?? 0} letture</div>
                  </div>
                </Link>
              ))}

              <div style={{ display: "flex", gap: ".8rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
                <Link href="/rubriche" style={{ fontFamily: "DM Mono, monospace", fontSize: ".58rem", letterSpacing: ".12em", textTransform: "uppercase", color: C.dark, textDecoration: "none", display: "inline-block", border: `1px solid rgba(20,18,16,.2)`, padding: ".5rem 1.3rem", borderRadius: "100px" }}>Tutte le rubriche →</Link>
                <Link href="/rubriche#suggerisci" style={{ fontFamily: "DM Mono, monospace", fontSize: ".58rem", letterSpacing: ".12em", textTransform: "uppercase", color: C.orange, textDecoration: "none", display: "inline-block", border: `1px solid rgba(196,97,44,.3)`, padding: ".5rem 1.3rem", borderRadius: "100px" }}>Proponi una rubrica →</Link>
              </div>
            </div>
          </div>
        </div>
        <style>{`@media(max-width:900px){#communityGrid{grid-template-columns:1fr!important;gap:3rem!important}}`}</style>
      </section>

      {/* ══════════════════════════════════════════
          EVENTS — orange strip
      ══════════════════════════════════════════ */}
      <section style={{ background: C.orange, padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
            <h2 style={{ ...S.serif, fontWeight: 900, fontStyle: "italic", fontSize: "clamp(2rem,4vw,2.8rem)", color: C.cream, letterSpacing: "-.02em", lineHeight: 1 }}>
              Raduni in<br /><span style={{ fontStyle: "normal", color: "rgba(246,242,235,.55)" }}>tutta Europa</span>
            </h2>
            <Link href="/events" style={{ fontFamily: "DM Mono, monospace", fontSize: ".55rem", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(246,242,235,.5)", textDecoration: "none" }}>
              Calendario completo →
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: "1px", background: "rgba(246,242,235,.12)", borderRadius: "12px", overflow: "hidden" }} id="eventsGrid">
            {(events?.length ?? 0) === 0 ? (
              <div style={{ gridColumn: "1/-1", padding: "3rem", textAlign: "center" }}>
                <p style={{ ...S.body, fontStyle: "italic", color: "rgba(246,242,235,.5)" }}>Nessun evento in programma. <Link href="/events" style={{ color: C.cream, textDecoration: "none" }}>Suggerisci un raduno →</Link></p>
              </div>
            ) : (
              <>
                {(events ?? []).map((e: any) => (
                  <div key={e.id} style={{ background: "rgba(246,242,235,.06)", padding: "1.8rem 1.5rem" }}>
                    <div style={{ marginBottom: "1.2rem" }}>
                      <div style={{ ...S.serif, fontWeight: 900, fontSize: "3rem", color: C.cream, lineHeight: 1 }}>
                        {new Date(e.event_date).getDate()}
                      </div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".5rem", letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(246,242,235,.5)" }}>
                        {new Date(e.event_date).toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
                      </div>
                    </div>
                    <div style={{ ...S.serif, fontWeight: 700, fontSize: "1rem", color: C.cream, lineHeight: 1.3, marginBottom: ".5rem" }}>{e.title}</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".48rem", letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(246,242,235,.45)" }}>
                      {e.country === "IT" ? "🇮🇹" : e.country === "GB" ? "🇬🇧" : e.country === "DE" ? "🇩🇪" : "🏁"} {e.city}
                    </div>
                  </div>
                ))}
                {/* Suggest slot */}
                <Link href="/events" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: ".8rem", padding: "2rem", border: "1.5px dashed rgba(246,242,235,.2)", textDecoration: "none", margin: "0" }}>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: ".6rem", letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(246,242,235,.4)", textAlign: "center" }}>Suggerisci un raduno →</span>
                </Link>
              </>
            )}
          </div>
        </div>
        <style>{`@media(max-width:900px){#eventsGrid{grid-template-columns:1fr 1fr!important}}`}</style>
      </section>

      {/* ══════════════════════════════════════════
          GARAGE TEASER
      ══════════════════════════════════════════ */}
      <section style={{ background: C.dark, padding: "7rem 2rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: "-2rem", top: "50%", transform: "translateY(-50%)", fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "clamp(10rem,20vw,22rem)", color: "rgba(246,242,235,.018)", letterSpacing: "-.06em", pointerEvents: "none", userSelect: "none", lineHeight: 1 }}>
          GARAGE
        </div>
        <div style={{ maxWidth: "1400px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "center" }} id="garageGrid">
            <div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".58rem", letterSpacing: ".2em", textTransform: "uppercase", color: C.orange, marginBottom: ".8rem" }}>Garage digitale</div>
              <h2 style={{ ...S.serif, fontWeight: 900, fontStyle: "italic", fontSize: "clamp(2rem,4vw,3.5rem)", lineHeight: 1.0, letterSpacing: "-.03em", color: C.cream, marginBottom: "1.2rem" }}>
                Il tuo veicolo.<br />La tua <em style={{ fontStyle: "normal", color: C.orange }}>storia</em>.
              </h2>
              <p style={{ ...S.body, fontStyle: "italic", color: "rgba(246,242,235,.5)", fontSize: "1.05rem", lineHeight: 1.75, marginBottom: "2rem" }}>
                Carica le foto del tuo restauro. Cataloga ogni ricambio installato. Trova chi possiede lo stesso modello e scambiatevi consigli, pezzi, conoscenza.
              </p>
              <Link href="/garage" style={{ ...pill(), textDecoration: "none" }}>Crea il tuo garage →</Link>
            </div>

            {/* Garage mock UI */}
            <div style={{ background: "rgba(246,242,235,.03)", border: "1px solid rgba(200,184,152,.1)", borderRadius: "16px", overflow: "hidden" }}>
              <div style={{ background: "rgba(200,184,152,.06)", padding: "1rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(200,184,152,.08)" }}>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: ".55rem", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(246,242,235,.5)" }}>Il mio garage</span>
                <span style={{ ...S.serif, fontWeight: 900, fontSize: ".9rem", color: C.orange }}>3 veicoli</span>
              </div>
              {[
                { icon: "🚗", name: "Alfa Romeo GTV 2.0", year: "1976", parts: "12 ricambi catalogati" },
                { icon: "🏍️", name: "Ducati 750 GT Bevel", year: "1974", parts: "7 ricambi catalogati" },
              ].map((v, i) => (
                <div key={i} style={{ padding: "1.2rem", borderBottom: "1px solid rgba(200,184,152,.06)", display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div style={{ width: "52px", height: "38px", borderRadius: "8px", background: "rgba(200,184,152,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", flexShrink: 0 }}>{v.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...S.serif, fontWeight: 700, fontSize: ".9rem", color: C.cream, marginBottom: ".2rem" }}>{v.name} ({v.year})</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".46rem", color: "rgba(246,242,235,.35)" }}>{v.parts}</div>
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: ".44rem", letterSpacing: ".08em", textTransform: "uppercase", background: "rgba(196,97,44,.15)", color: C.orange, padding: ".2rem .55rem", borderRadius: "100px", flexShrink: 0 }}>Pubblico</span>
                </div>
              ))}
              <div style={{ padding: "1.2rem", display: "flex", gap: "1rem", alignItems: "center", opacity: .4 }}>
                <div style={{ width: "52px", height: "38px", borderRadius: "8px", border: `1px dashed rgba(200,184,152,.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0, fontWeight: 300, color: "rgba(246,242,235,.4)" }}>+</div>
                <div style={{ ...S.body, fontStyle: "italic", fontSize: ".85rem", color: "rgba(246,242,235,.35)" }}>Aggiungi un veicolo…</div>
              </div>
            </div>
          </div>
        </div>
        <style>{`@media(max-width:900px){#garageGrid{grid-template-columns:1fr!important}}`}</style>
      </section>

      {/* ══════════════════════════════════════════
          CTA FINALE
      ══════════════════════════════════════════ */}
      <section style={{ background: C.cream, color: C.dark, padding: "9rem 2rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 60% at 50% 100%, rgba(196,97,44,.09) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: "700px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: ".6rem", letterSpacing: ".22em", textTransform: "uppercase", color: C.orange, marginBottom: "1.2rem" }}>Sei nel posto giusto</div>
          <h2 style={{ ...S.serif, fontWeight: 900, fontStyle: "italic", fontSize: "clamp(3rem,7vw,6rem)", lineHeight: .9, letterSpacing: "-.04em", marginBottom: "1.8rem" }}>
            <span style={{ display: "block" }}>La passione</span>
            <span style={{ display: "block", fontStyle: "normal", color: C.orange }}>merita un posto</span>
            <span style={{ display: "block" }}>degno di lei.</span>
          </h2>
          <p style={{ ...S.body, fontStyle: "italic", fontSize: "1.15rem", color: C.muted, lineHeight: 1.75, marginBottom: "2.5rem" }}>
            Unisciti a 12.000 collezionisti che comprano, vendono, discutono e si incontrano su Patina. Gratis, sempre.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth/register" style={{ ...pill(true), fontSize: ".7rem", padding: "1.1rem 2.5rem" }}>Registrati gratis →</Link>
            <Link href="/search" style={{ ...ghost(), border: `1.5px solid rgba(20,18,16,.2)`, padding: "1.1rem 2rem", borderRadius: "100px", fontSize: ".68rem" }}>Esplora senza registrarti</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
