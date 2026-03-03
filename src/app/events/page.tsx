import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { C } from "@/lib/design";
import SuggestForm from "@/app/community/SuggestForm";

const S = { serif:{fontFamily:"Playfair Display, serif"}, mono:{fontFamily:"DM Mono, monospace"}, body:{fontFamily:"Lora, serif"} };

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = new Date().toISOString().split("T")[0];
  const [{ data: events }, { data: past }] = await Promise.all([
    supabase.from("events").select("*").gte("event_date", today).order("event_date",{ascending:true}),
    supabase.from("events").select("*").lt("event_date", today).order("event_date",{ascending:false}).limit(6),
  ]);

  const fmt = (d: string, opts: any) => new Date(d).toLocaleDateString("it-IT", opts);

  return (
    <div>
      {/* Hero */}
      <div style={{ background:C.dark, padding:"3.5rem 1.5rem 3rem" }}>
        <div style={{ maxWidth:"1280px", margin:"0 auto" }}>
          <div style={{ fontFamily:"DM Mono, monospace", fontSize:".6rem", letterSpacing:".18em", textTransform:"uppercase", color:C.orange, marginBottom:".5rem" }}>Calendario</div>
          <h1 style={{ ...S.serif, fontWeight:900, fontStyle:"italic", fontSize:"clamp(2rem,7vw,3.5rem)", color:C.cream, lineHeight:.98, letterSpacing:"-.02em", marginBottom:".8rem" }}>
            Raduni ed <span style={{ color:C.orange }}>eventi</span>
          </h1>
          <p style={{ ...S.body, fontStyle:"italic", color:"rgba(246,242,235,0.5)", fontSize:"1.05rem", lineHeight:1.6, maxWidth:"500px", marginBottom:"1.5rem" }}>
            I migliori raduni, concorsi e fiere di auto e moto storiche in Italia e Europa.
          </p>
          <Link href="/community#suggerisci" style={{ fontFamily:"DM Mono, monospace", fontSize:".62rem", letterSpacing:".1em", textTransform:"uppercase", background:C.orange, color:C.cream, padding:".6rem 1.4rem", borderRadius:"100px", textDecoration:"none" }}>
            🏁 Suggerisci un raduno
          </Link>
        </div>
      </div>

      <div style={{ maxWidth:"1280px", margin:"0 auto", padding:"2.5rem 1.5rem" }}>
        <h2 style={{ ...S.serif, fontWeight:700, fontStyle:"italic", fontSize:"1.5rem", marginBottom:"1.5rem" }}>
          Prossimi <span style={{ color:C.orange }}>eventi</span>
        </h2>

        {(events?.length??0)===0?(
          <div style={{ textAlign:"center", padding:"4rem 2rem", border:`1px dashed ${C.tan}`, borderRadius:"16px", color:C.muted, marginBottom:"3rem" }}>
            <p style={{ ...S.body, fontStyle:"italic" }}>Nessun evento programmato. Torna a breve.</p>
          </div>
        ):(
          <div style={{ display:"flex", flexDirection:"column", gap:"1px", background:C.tan, borderRadius:"16px", overflow:"hidden", marginBottom:"3rem" }}>
            {(events??[]).map((e:any)=>(
              <div key={e.id} style={{ background:C.white, padding:"1.2rem 1.5rem", display:"flex", gap:"1.2rem", alignItems:"flex-start" }}>
                <div style={{ background:C.dark, color:C.cream, padding:".6rem .9rem", textAlign:"center", flexShrink:0, borderRadius:"10px", minWidth:"54px" }}>
                  <div style={{ ...S.serif, fontWeight:900, fontSize:"1.5rem", lineHeight:1 }}>{new Date(e.event_date).getDate()}</div>
                  <div style={{ fontFamily:"DM Mono, monospace", fontSize:".44rem", letterSpacing:".1em", textTransform:"uppercase", color:C.orange }}>{fmt(e.event_date,{month:"short"})}</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:".5rem", alignItems:"center", marginBottom:".25rem", flexWrap:"wrap" }}>
                    {e.is_featured&&<span style={{ fontFamily:"DM Mono, monospace", fontSize:".46rem", letterSpacing:".08em", textTransform:"uppercase", background:C.orange, color:C.cream, padding:".15rem .45rem", borderRadius:"100px" }}>In evidenza</span>}
                    <h3 style={{ ...S.serif, fontWeight:700, fontSize:"1.1rem" }}>{e.title}</h3>
                  </div>
                  <div style={{ fontFamily:"DM Mono, monospace", fontSize:".52rem", letterSpacing:".06em", textTransform:"uppercase", color:C.muted, marginBottom:".4rem" }}>
                    {e.city}{e.country!=="IT"?` · ${e.country}`:""}
                  </div>
                  {e.description&&<p style={{ ...S.body, fontStyle:"italic", fontSize:".95rem", color:C.muted, lineHeight:1.5 }}>{e.description}</p>}
                </div>
                {e.website&&<a href={e.website} target="_blank" rel="noopener" style={{ fontFamily:"DM Mono, monospace", fontSize:".52rem", letterSpacing:".08em", textTransform:"uppercase", color:C.orange, textDecoration:"none", flexShrink:0 }}>Sito →</a>}
              </div>
            ))}
          </div>
        )}

        {(past?.length??0)>0&&(
          <>
            <h2 style={{ ...S.serif, fontWeight:700, fontStyle:"italic", fontSize:"1.4rem", color:C.muted, marginBottom:"1.2rem" }}>
              Eventi <span style={{ color:C.muted }}>passati</span>
            </h2>
            <div style={{ display:"flex", flexDirection:"column", gap:"1px", background:C.tan, borderRadius:"16px", overflow:"hidden" }}>
              {(past??[]).map((e:any)=>(
                <div key={e.id} style={{ background:C.light, padding:"0.9rem 1.5rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ ...S.serif, fontWeight:700, fontSize:".95rem", color:C.muted }}>{e.title}</span>
                  <span style={{ fontFamily:"DM Mono, monospace", fontSize:".5rem", letterSpacing:".06em", textTransform:"uppercase", color:C.muted }}>{fmt(e.event_date,{day:"2-digit",month:"short",year:"numeric"})} · {e.city}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Suggest event form */}
        <div id="suggerisci" style={{ marginTop: "3rem" }}>
          <SuggestForm user={user} defaultTab="raduno" />
        </div>
      </div>
    </div>
  );
}
