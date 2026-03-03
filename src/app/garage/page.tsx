import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { C, euros, CONDITION } from "@/lib/design";

const S = { serif:{fontFamily:"Playfair Display, serif"}, mono:{fontFamily:"DM Mono, monospace"}, body:{fontFamily:"Lora, serif"} };

const POOL_COLORS: Record<string, string> = {
  "Alfa Romeo":"#C4622D","Ferrari":"#C0392B","Ducati":"#E74C3C","Porsche":"#2C3E50","BMW":"#1A5276","Fiat":"#154360","Lancia":"#1F618D","Maserati":"#1A5276","MV Agusta":"#1B2631","Moto Guzzi":"#B7950B","Volkswagen":"#1F618D",
};

export default async function GaragePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/garage");

  const [{ data: profile }, { data: vehicles }, { data: listings }, { data: saved }, { data: myPools }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("vehicles").select("*").eq("owner_id", user.id).order("created_at",{ascending:false}),
    supabase.from("listings").select("*").eq("seller_id", user.id).order("created_at",{ascending:false}),
    supabase.from("saved_listings").select("listing:listings(id,title,price_cents,cover_image_url,slug,condition)").eq("user_id", user.id).limit(6),
    supabase.from("pool_members").select("pool:pools(id,slug,display_name,members_count,make)").eq("user_id", user.id).order("created_at",{ascending:false}),
  ]);

  const p = profile as any;
  const activeListings = (listings??[]).filter((l:any)=>l.status==="active");
  const totalValue = activeListings.reduce((s:number, l:any)=>s+l.price_cents, 0);
  const pools = (myPools??[]).map((m:any)=>m.pool).filter(Boolean);

  return (
    <div>
      {/* Header */}
      <div style={{ background:C.dark, padding:"3rem 1.5rem 2.5rem" }}>
        <div style={{ maxWidth:"1280px", margin:"0 auto" }}>
          <div style={{ fontFamily:"DM Mono, monospace", fontSize:".58rem", letterSpacing:".15em", textTransform:"uppercase", color:C.orange, marginBottom:".5rem" }}>Il tuo garage</div>
          <h1 style={{ ...S.serif, fontWeight:900, fontStyle:"italic", fontSize:"clamp(1.8rem,6vw,2.8rem)", color:C.cream, marginBottom:"1.5rem" }}>
            Ciao, <span style={{ color:C.orange }}>{p?.full_name?.split(" ")[0]??p?.username}</span>
          </h1>
          <div style={{ display:"flex", gap:"1.5rem", flexWrap:"wrap" }}>
            {[{label:"Veicoli",value:(vehicles?.length??0).toString()},{label:"Annunci attivi",value:activeListings.length.toString()},{label:"Valore totale",value:euros(totalValue)},{label:"Pool",value:pools.length.toString()}].map(s=>(
              <div key={s.label} style={{ borderLeft:`2px solid ${C.orange}`, paddingLeft:".8rem" }}>
                <div style={{ ...S.serif, fontWeight:900, fontSize:"1.6rem", color:C.cream }}>{s.value}</div>
                <div style={{ fontFamily:"DM Mono, monospace", fontSize:".48rem", letterSpacing:".1em", textTransform:"uppercase", color:C.muted }}>{s.label}</div>
              </div>
            ))}
          </div>
          {p?.username&&(
            <div style={{ marginTop:"1.2rem" }}>
              <Link href={`/garage/${p.username}`} style={{ fontFamily:"DM Mono, monospace", fontSize:".55rem", letterSpacing:".1em", textTransform:"uppercase", color:"rgba(246,242,235,0.35)", textDecoration:"none", border:"1px solid rgba(255,255,255,0.1)", padding:".4rem .9rem", borderRadius:"100px" }}>
                Vedi garage pubblico →
              </Link>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth:"1280px", margin:"0 auto", padding:"2.5rem 1.5rem" }}>

        {/* Pools */}
        {pools.length>0&&(
          <div style={{ marginBottom:"3rem" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.2rem" }}>
              <h2 style={{ ...S.serif, fontWeight:700, fontStyle:"italic", fontSize:"1.4rem" }}>I tuoi <span style={{ color:C.orange }}>pool</span></h2>
              <Link href="/pools" style={{ fontFamily:"DM Mono, monospace", fontSize:".55rem", letterSpacing:".1em", textTransform:"uppercase", color:C.muted, textDecoration:"none" }}>Tutti →</Link>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:"1rem" }}>
              {pools.slice(0,8).map((pool:any)=>(
                <Link key={pool.id} href={`/pools/${pool.slug}`} style={{ textDecoration:"none", color:"inherit" }}>
                  <div style={{ background:POOL_COLORS[pool.make]??C.dark, padding:"1.2rem", borderRadius:"14px 14px 0 0", minHeight:"70px", display:"flex", alignItems:"flex-end", position:"relative" }}>
                    <span style={{ position:"absolute", top:".5rem", right:".5rem", fontFamily:"DM Mono, monospace", fontSize:".42rem", letterSpacing:".06em", background:C.orange, color:C.cream, padding:".1rem .4rem", borderRadius:"100px" }}>✓</span>
                    <div style={{ ...S.serif, fontWeight:900, fontSize:".9rem", color:C.cream, lineHeight:1.1 }}>{pool.display_name}</div>
                  </div>
                  <div style={{ background:C.white, padding:".45rem 1rem", borderRadius:"0 0 14px 14px" }}>
                    <span style={{ fontFamily:"DM Mono, monospace", fontSize:".44rem", color:C.muted }}>{pool.members_count} membri</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Vehicles */}
        <div style={{ marginBottom:"3rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.2rem" }}>
            <h2 style={{ ...S.serif, fontWeight:700, fontStyle:"italic", fontSize:"1.4rem" }}>I tuoi <span style={{ color:C.orange }}>veicoli</span></h2>
            <Link href="/garage/add-vehicle" style={{ fontFamily:"DM Mono, monospace", fontSize:".6rem", letterSpacing:".1em", textTransform:"uppercase", background:C.orange, color:C.cream, padding:".5rem 1.1rem", borderRadius:"100px", textDecoration:"none" }}>+ Aggiungi</Link>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:"1.2rem" }}>
            {(vehicles??[]).map((v:any)=>(
              <div key={v.id} style={{ background:C.white, borderRadius:"16px", overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>
                <div style={{ aspectRatio:"16/9", background:C.light, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2.5rem" }}>
                  {v.cover_image_url?<img src={v.cover_image_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />:null}
                </div>
                <div style={{ padding:"1rem" }}>
                  <div style={{ fontFamily:"DM Mono, monospace", fontSize:".46rem", letterSpacing:".1em", textTransform:"uppercase", color:C.orange, marginBottom:".2rem" }}>{v.type}</div>
                  <div style={{ ...S.serif, fontWeight:700, fontSize:"1rem", marginBottom:".15rem" }}>{v.make} {v.model??""}</div>
                  <div style={{ fontFamily:"DM Mono, monospace", fontSize:".46rem", color:C.muted, marginBottom:".8rem" }}>{v.year}{v.color?` · ${v.color}`:""}</div>
                  <Link href={`/garage/edit-vehicle/${v.id}`} style={{ fontFamily:"DM Mono, monospace", fontSize:".52rem", letterSpacing:".08em", textTransform:"uppercase", color:C.muted, textDecoration:"none", border:`1px solid ${C.tan}`, padding:".3rem .7rem", borderRadius:"100px" }}>Modifica →</Link>
                </div>
              </div>
            ))}
            <Link href="/garage/add-vehicle" style={{ background:C.light, border:`2px dashed ${C.tan}`, borderRadius:"16px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"160px", textDecoration:"none", color:C.muted, gap:".5rem" }}>
              <span style={{ fontSize:"1.5rem", opacity:.4 }}>+</span>
              <span style={{ fontFamily:"DM Mono, monospace", fontSize:".55rem", letterSpacing:".1em", textTransform:"uppercase" }}>Aggiungi veicolo</span>
            </Link>
          </div>
        </div>

        {/* Listings */}
        <div style={{ marginBottom:"3rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.2rem" }}>
            <h2 style={{ ...S.serif, fontWeight:700, fontStyle:"italic", fontSize:"1.4rem" }}>I tuoi <span style={{ color:C.orange }}>annunci</span></h2>
            <Link href="/listings/new" style={{ fontFamily:"DM Mono, monospace", fontSize:".6rem", letterSpacing:".1em", textTransform:"uppercase", background:C.dark, color:C.cream, padding:".5rem 1.1rem", borderRadius:"100px", textDecoration:"none" }}>+ Pubblica</Link>
          </div>
          {(listings?.length??0)===0?(
            <div style={{ textAlign:"center", padding:"3rem 2rem", border:`1px dashed ${C.tan}`, borderRadius:"16px", color:C.muted }}>
              <p style={{ ...S.body, fontStyle:"italic", marginBottom:"1rem" }}>Nessun annuncio ancora.</p>
              <Link href="/listings/new" style={{ fontFamily:"DM Mono, monospace", fontSize:".6rem", letterSpacing:".1em", textTransform:"uppercase", color:C.orange, textDecoration:"none" }}>Pubblica il primo →</Link>
            </div>
          ):(
            <div style={{ display:"flex", flexDirection:"column", gap:"1px", background:C.tan, borderRadius:"16px", overflow:"hidden" }}>
              {(listings??[]).map((l:any)=>(
                <div key={l.id} style={{ background:C.white, display:"flex", gap:"1rem", alignItems:"center", padding:"1rem 1.2rem" }}>
                  <div style={{ width:"68px", height:"52px", background:C.light, borderRadius:"8px", flexShrink:0, overflow:"hidden" }}>
                    {l.cover_image_url?<img src={l.cover_image_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />:null}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ ...S.serif, fontWeight:700, fontSize:".95rem", marginBottom:".2rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.title}</div>
                    <div style={{ display:"flex", gap:".8rem", alignItems:"center" }}>
                      <span style={{ ...S.serif, fontWeight:700, fontSize:"1rem", color:C.orange }}>{euros(l.price_cents)}</span>
                      <span style={{ fontFamily:"DM Mono, monospace", fontSize:".46rem", letterSpacing:".08em", textTransform:"uppercase", color: l.status==="active"?"#2d7a2d":C.muted }}>{l.status}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:".5rem", flexShrink:0 }}>
                    <Link href={`/listings/${l.slug??l.id}`} style={{ fontFamily:"DM Mono, monospace", fontSize:".5rem", letterSpacing:".08em", textTransform:"uppercase", color:C.orange, textDecoration:"none" }}>Vedi</Link>
                    {l.status!=="sold"&&l.status!=="deleted"&&<Link href={`/listings/edit/${l.slug??l.id}`} style={{ fontFamily:"DM Mono, monospace", fontSize:".5rem", letterSpacing:".08em", textTransform:"uppercase", color:C.muted, textDecoration:"none" }}>Modifica</Link>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved */}
        {(saved?.length??0)>0&&(
          <div>
            <h2 style={{ ...S.serif, fontWeight:700, fontStyle:"italic", fontSize:"1.4rem", marginBottom:"1.2rem" }}>Annunci <span style={{ color:C.orange }}>salvati</span></h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"1rem" }}>
              {(saved??[]).map((s:any)=>{
                const l=s.listing; if(!l) return null;
                return (
                  <Link key={l.id} href={`/listings/${l.slug??l.id}`} style={{ background:C.white, borderRadius:"14px", overflow:"hidden", textDecoration:"none", color:"inherit", display:"flex", gap:".8rem", padding:"1rem", alignItems:"center", boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>
                    <div style={{ width:"52px", height:"40px", background:C.light, flexShrink:0, borderRadius:"6px", overflow:"hidden" }}>
                      {l.cover_image_url?<img src={l.cover_image_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />:null}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ ...S.serif, fontWeight:700, fontSize:".88rem", lineHeight:1.2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.title}</div>
                      <div style={{ ...S.serif, fontWeight:700, fontSize:".9rem", color:C.orange }}>{euros(l.price_cents)}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {pools.length===0&&(vehicles?.length??0)===0&&(
          <div style={{ background:C.dark, padding:"1.5rem 2rem", borderRadius:"16px", display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"2rem", gap:"1rem", flexWrap:"wrap" }}>
            <div>
              <div style={{ ...S.serif, fontWeight:700, fontSize:"1.1rem", color:C.cream, marginBottom:".3rem" }}>Entra nei pool della tua marca</div>
              <div style={{ ...S.body, fontStyle:"italic", color:"rgba(246,242,235,0.5)", fontSize:".9rem" }}>Aggiungi un veicolo e verrai assegnato automaticamente.</div>
            </div>
            <Link href="/garage/add-vehicle" style={{ fontFamily:"DM Mono, monospace", fontSize:".6rem", letterSpacing:".1em", textTransform:"uppercase", background:C.orange, color:C.cream, padding:".7rem 1.5rem", borderRadius:"100px", textDecoration:"none", whiteSpace:"nowrap" }}>Aggiungi veicolo →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
