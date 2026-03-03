import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { C, MAKES } from "@/lib/design";

const S = { serif:{fontFamily:"Playfair Display, serif"}, mono:{fontFamily:"DM Mono, monospace"} };

const COLORS: Record<string,string> = {
  "Alfa Romeo":"#C4622D","Ferrari":"#C0392B","Ducati":"#E74C3C","Porsche":"#2C3E50","BMW":"#1A5276","Fiat":"#154360","Lancia":"#1F618D","Maserati":"#1A5276","MV Agusta":"#1B2631","Moto Guzzi":"#B7950B","Volkswagen":"#1F618D",
};

export default async function PoolsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: pools } = await supabase.from("pools").select("*").is("model",null).order("members_count",{ascending:false}).limit(24);

  let myPoolIds: string[] = [];
  if (user) {
    const { data: mine } = await supabase.from("pool_members").select("pool_id").eq("user_id",user.id);
    myPoolIds = (mine??[]).map((m:any)=>m.pool_id);
  }

  return (
    <div>
      <div style={{ background:C.dark, padding:"3.5rem 1.5rem 3rem" }}>
        <div style={{ maxWidth:"1280px", margin:"0 auto" }}>
          <div style={{ fontFamily:"DM Mono, monospace", fontSize:".6rem", letterSpacing:".18em", textTransform:"uppercase", color:C.orange, marginBottom:".5rem" }}>Pool</div>
          <h1 style={{ ...S.serif, fontWeight:900, fontStyle:"italic", fontSize:"clamp(2rem,7vw,3.5rem)", color:C.cream, lineHeight:.98, letterSpacing:"-.02em", marginBottom:".8rem" }}>
            Connettiti con chi ha <span style={{ color:C.orange }}>la tua stessa auto</span>
          </h1>
          <p style={{ fontFamily:"Lora, serif", fontStyle:"italic", color:"rgba(246,242,235,0.5)", fontSize:"1.05rem", lineHeight:1.6, maxWidth:"500px" }}>
            Aggiungi un veicolo al tuo garage e entra automaticamente nel pool di quella marca. Condividi, chiedi, vendi a chi capisce davvero.
          </p>
        </div>
      </div>

      <div style={{ maxWidth:"1280px", margin:"0 auto", padding:"2.5rem 1.5rem" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"1.2rem" }}>
          {(pools??[]).map((pool:any)=>{
            const isMember = myPoolIds.includes(pool.id);
            const bg = COLORS[pool.make]??C.dark;
            return (
              <Link key={pool.id} href={`/pools/${pool.slug}`} style={{ textDecoration:"none", color:"inherit" }}>
                <div style={{ background:bg, padding:"1.5rem 1.3rem", borderRadius:"14px 14px 0 0", minHeight:"90px", display:"flex", alignItems:"flex-end", position:"relative" }}>
                  {isMember&&<span style={{ position:"absolute", top:".6rem", right:".6rem", fontFamily:"DM Mono, monospace", fontSize:".42rem", letterSpacing:".06em", textTransform:"uppercase", background:C.orange, color:C.cream, padding:".12rem .4rem", borderRadius:"100px" }}>✓ Membro</span>}
                  <div style={{ ...S.serif, fontWeight:900, fontSize:"1rem", color:C.cream, lineHeight:1.1 }}>{pool.display_name}</div>
                </div>
                <div style={{ background:C.white, padding:".55rem 1.3rem", borderRadius:"0 0 14px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontFamily:"DM Mono, monospace", fontSize:".46rem", color:C.muted }}>{pool.members_count} membri</span>
                  <span style={{ fontFamily:"DM Mono, monospace", fontSize:".46rem", color:C.orange }}>→</span>
                </div>
              </Link>
            );
          })}
          {(pools?.length??0)===0&&(
            <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"5rem 2rem", border:`1px dashed ${C.tan}`, borderRadius:"16px", color:C.muted }}>
              <p style={{ fontFamily:"Lora, serif", fontStyle:"italic" }}>Nessun pool ancora. Aggiungi un veicolo al garage per iniziare.</p>
            </div>
          )}
        </div>
        {!user&&(
          <div style={{ background:C.dark, borderRadius:"16px", padding:"2rem", marginTop:"2.5rem", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
            <div>
              <div style={{ ...S.serif, fontWeight:700, fontSize:"1.1rem", color:C.cream, marginBottom:".3rem" }}>Hai un'auto d'epoca?</div>
              <p style={{ fontFamily:"Lora, serif", fontStyle:"italic", color:"rgba(246,242,235,0.5)", fontSize:".9rem" }}>Registrati, aggiungi il tuo veicolo e unisciti automaticamente al pool giusto.</p>
            </div>
            <Link href="/auth/register" style={{ fontFamily:"DM Mono, monospace", fontSize:".6rem", letterSpacing:".1em", textTransform:"uppercase", background:C.orange, color:C.cream, padding:".7rem 1.5rem", borderRadius:"100px", textDecoration:"none", whiteSpace:"nowrap" }}>Registrati gratis →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
