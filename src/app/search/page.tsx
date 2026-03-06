import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { C, euros, CONDITION, MAKES, CATEGORIES } from "@/lib/design";
import SortSelect from "./SortSelect";
import SaveSearchButton from "@/components/search/SaveSearchButton";
import Pagination from "./Pagination";

const S = { serif:{fontFamily:"Playfair Display, serif"}, mono:{fontFamily:"DM Mono, monospace"} };
type Props = { searchParams: Record<string, string | string[]> };
function arr(v: string | string[] | undefined): string[] { if (!v) return []; return Array.isArray(v) ? v : [v]; }

export default async function SearchPage({ searchParams }: Props) {
  const params = searchParams;
  const q    = typeof params.q    === "string" ? params.q    : "";
  const makes = arr(params.makes);
  const conds = arr(params.cond);
  const sort  = typeof params.sort === "string" ? params.sort : "newest";
  const minP  = typeof params.minP === "string" ? Number(params.minP) : 0;
  const maxP  = typeof params.maxP === "string" ? Number(params.maxP) : 0;
  const page  = typeof params.page === "string" ? Math.max(1, parseInt(params.page)) : 1;
  const perPage = 24;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let query = supabase.from("listings")
    .select("id,title,condition,price_cents,cover_image_url,location_city,compatible_makes,slug,views_count", { count: "exact" })
    .eq("status","active");

  if (q) query = query.ilike("title", `%${q}%`);
  if (makes.length) query = query.overlaps("compatible_makes", makes);
  if (conds.length) query = query.in("condition", conds);
  if (minP > 0) query = query.gte("price_cents", minP * 100);
  if (maxP > 0) query = query.lte("price_cents", maxP * 100);

  switch (sort) {
    case "price_asc":  query = query.order("price_cents", {ascending:true});  break;
    case "price_desc": query = query.order("price_cents", {ascending:false}); break;
    case "most_viewed": query = query.order("views_count", {ascending:false}); break;
    default: query = query.order("created_at", {ascending:false});
  }

  const { data, count } = await query.range((page-1)*perPage, page*perPage-1);
  const listings = data ?? [];
  const total = count ?? 0;
  const base = new URLSearchParams();
  if (q) base.set("q", q);
  makes.forEach(m => base.append("makes", m));
  conds.forEach(c => base.append("cond", c));
  if (minP) base.set("minP", String(minP));
  if (maxP) base.set("maxP", String(maxP));

  return (
    <div>
      {/* Search hero */}
      <div style={{ background:C.dark, padding:"2rem 1.5rem" }}>
        <div style={{ maxWidth:"1280px", margin:"0 auto" }}>
          <form action="/search" method="GET">
            <div style={{ display:"flex", background:"rgba(246,242,235,0.07)", border:"1px solid rgba(200,184,152,0.18)", borderRadius:"100px", padding:".3rem", gap:".3rem", overflow:"hidden", minWidth:0 }}>
              <select name="makes" defaultValue={makes[0]??""} style={{ fontFamily:"DM Mono, monospace", fontSize:".58rem", letterSpacing:".08em", textTransform:"uppercase", padding:"0 .5rem", background:"transparent", color:C.cream, border:"none", outline:"none", cursor:"pointer", flexShrink:0, maxWidth:"130px" }}>
                <option value="" style={{ color:C.dark, background:"#fff" }}>Tutte le marche</option>
                {MAKES.map(m=><option key={m} value={m} style={{ color:C.dark, background:"#fff" }}>{m}</option>)}
              </select>
              <input name="q" defaultValue={q} type="text" placeholder="Cerca ricambi..." style={{ flex:1, background:"transparent", border:"none", outline:"none", color:C.cream, fontFamily:"Lora, serif", fontStyle:"italic", fontSize:"1rem", padding:".65rem .3rem", minWidth:0, width:0, minWidth:0, width:0 }} />
              <button type="submit" style={{ background:C.orange, color:C.cream, border:"none", borderRadius:"100px", padding:".7rem 1rem", fontFamily:"DM Mono, monospace", fontSize:".6rem", letterSpacing:".1em", textTransform:"uppercase", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>Cerca</button>
            </div>
          </form>
        </div>
      </div>

      <div style={{ maxWidth:"1280px", margin:"0 auto", padding:"clamp(0.8rem,3vw,1.5rem)", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,240px),1fr))", gap:"2rem", alignItems:"start" }} id="searchLayout">
        {/* Sidebar filters */}
        <div style={{ position:"sticky", top:"70px" }} id="filterSidebar">
          <div style={{ fontFamily:"DM Mono, monospace", fontSize:".58rem", letterSpacing:".12em", textTransform:"uppercase", color:C.muted, marginBottom:"1rem" }}>Filtra</div>

          {/* Marche */}
          <div style={{ marginBottom:"1.5rem" }}>
            <div style={{ fontFamily:"DM Mono, monospace", fontSize:".54rem", letterSpacing:".1em", textTransform:"uppercase", color:C.dark, marginBottom:".6rem" }}>Marca</div>
            <div style={{ display:"flex", flexDirection:"column", gap:".3rem" }}>
              {MAKES.slice(0,10).map(m=>(
                <Link key={m} href={`/search?makes=${m}${q?`&q=${q}`:""}`} style={{ fontFamily:"Lora, serif", fontStyle:"italic", fontSize:".9rem", color: makes.includes(m) ? C.orange : C.muted, textDecoration:"none", padding:".2rem 0" }}>
                  {makes.includes(m)?"✓ ":""}{m}
                </Link>
              ))}
            </div>
          </div>

          {/* Condizione */}
          <div style={{ marginBottom:"1.5rem" }}>
            <div style={{ fontFamily:"DM Mono, monospace", fontSize:".54rem", letterSpacing:".1em", textTransform:"uppercase", color:C.dark, marginBottom:".6rem" }}>Condizione</div>
            {Object.entries(CONDITION).map(([k,v])=>(
              <Link key={k} href={`/search?cond=${k}${q?`&q=${q}`:""}`} style={{ display:"block", fontFamily:"Lora, serif", fontStyle:"italic", fontSize:".9rem", color: conds.includes(k) ? C.orange : C.muted, textDecoration:"none", padding:".2rem 0" }}>
                {conds.includes(k)?"✓ ":""}{v}
              </Link>
            ))}
          </div>

          {/* Category */}
          <div>
            <div style={{ fontFamily:"DM Mono, monospace", fontSize:".54rem", letterSpacing:".1em", textTransform:"uppercase", color:C.dark, marginBottom:".6rem" }}>Categoria</div>
            {CATEGORIES.slice(0,8).map(c=>(
              <Link key={c.id} href={`/search?cat=${c.id}${q?`&q=${q}`:""}`} style={{ display:"block", fontFamily:"Lora, serif", fontStyle:"italic", fontSize:".9rem", color:C.muted, textDecoration:"none", padding:".2rem 0" }}>{c.name}</Link>
            ))}
          </div>
        </div>

        {/* Results */}
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.2rem", flexWrap:"wrap", gap:".8rem" }}>
            <div>
              <span style={{ ...S.serif, fontWeight:700, fontSize:"1.2rem" }}>{total.toLocaleString("it-IT")}</span>
              <span style={{ fontFamily:"Lora, serif", fontStyle:"italic", color:C.muted, marginLeft:".5rem" }}>ricambi trovati{q?` per "${q}"`:""}.</span>
            </div>
            <div style={{ display:"flex", gap:".7rem", alignItems:"center" }}>
              <SaveSearchButton userId={user?.id??null} query={q} makes={makes} conditions={conds} minPrice={minP} maxPrice={maxP} />
              <SortSelect base={base.toString()} current={sort} />
            </div>
          </div>

          {/* Active filters */}
          {(makes.length>0||conds.length>0||q)&&(
            <div style={{ display:"flex", gap:".4rem", flexWrap:"wrap", marginBottom:"1rem" }}>
              {makes.map(m=>(
                <Link key={m} href={`/search?${new URLSearchParams({...Object.fromEntries(base),makes:""})}`} style={{ fontFamily:"DM Mono, monospace", fontSize:".5rem", letterSpacing:".08em", textTransform:"uppercase", color:C.orange, border:`1px solid ${C.orange}`, padding:".2rem .6rem", borderRadius:"100px", textDecoration:"none" }}>{m} ✕</Link>
              ))}
              {conds.map(c=>(
                <Link key={c} href={`/search?${new URLSearchParams({...Object.fromEntries(base),cond:""})}`} style={{ fontFamily:"DM Mono, monospace", fontSize:".5rem", letterSpacing:".08em", textTransform:"uppercase", color:C.muted, border:`1px solid ${C.tan}`, padding:".2rem .6rem", borderRadius:"100px", textDecoration:"none" }}>{CONDITION[c]??c} ✕</Link>
              ))}
            </div>
          )}

          {listings.length===0?(
            <div style={{ textAlign:"center", padding:"5rem 2rem", border:`1px dashed ${C.tan}`, borderRadius:"16px", color:C.muted }}>
              <p style={{ fontFamily:"Lora, serif", fontStyle:"italic", marginBottom:"1rem" }}>Nessun ricambio trovato.</p>
              <Link href="/search" style={{ fontFamily:"DM Mono, monospace", fontSize:".6rem", letterSpacing:".1em", textTransform:"uppercase", color:C.orange, textDecoration:"none" }}>Vedi tutti i ricambi →</Link>
            </div>
          ):(
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:"1.2rem" }}>
              {listings.map((l:any)=>(
                <Link key={l.id} href={`/listings/${l.slug??l.id}`} style={{ background:C.white, borderRadius:"16px", overflow:"hidden", textDecoration:"none", color:"inherit", display:"flex", flexDirection:"column", boxShadow:"0 1px 4px rgba(0,0,0,.06)", transition:"transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s" }}>
                  <div style={{ aspectRatio:"4/3", background:C.light, overflow:"hidden", position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {l.cover_image_url?<img src={l.cover_image_url} alt={l.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />:null}
                    {l.condition&&<span style={{ position:"absolute", bottom:".6rem", left:".6rem", fontFamily:"DM Mono, monospace", fontSize:".5rem", letterSpacing:".08em", textTransform:"uppercase", background:l.condition==="nos"?C.orange:C.dark, color:C.cream, padding:".2rem .55rem", borderRadius:"100px" }}>{CONDITION[l.condition]??l.condition}</span>}
                  </div>
                  <div style={{ padding:"1rem", flex:1, display:"flex", flexDirection:"column" }}>
                    <div style={{ fontFamily:"DM Mono, monospace", fontSize:".5rem", letterSpacing:".1em", textTransform:"uppercase", color:C.orange, marginBottom:".3rem" }}>{l.compatible_makes?.slice(0,2).join(", ")??""}{l.location_city?` · ${l.location_city}`:""}</div>
                    <div style={{ ...S.serif, fontWeight:700, fontSize:".95rem", lineHeight:1.3, marginBottom:"auto", paddingBottom:".7rem" }}>{l.title}</div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ ...S.serif, fontWeight:900, fontSize:"1.15rem", color:C.orange }}>{euros(l.price_cents)}</span>
                      <span style={{ fontFamily:"DM Mono, monospace", fontSize:".44rem", color:C.muted }}>{l.views_count??0} visite</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div style={{ marginTop:"2rem" }}>
            <Pagination total={total} perPage={perPage} current={page} base={base.toString()} />
          </div>
        </div>
      </div>
      <style>{`@media(max-width:767px){#searchLayout{grid-template-columns:1fr!important}#filterSidebar{display:none!important}}`}</style>
    </div>
  );
}
