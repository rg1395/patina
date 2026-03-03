import Link from "next/link";
import { C } from "@/lib/design";

export default function Footer() {
  const mn: React.CSSProperties = { fontFamily:"DM Mono, monospace", fontSize:".5rem", letterSpacing:".15em", textTransform:"uppercase" };
  return (
    <footer style={{ background:C.dark, color:C.cream, padding:"4rem 1.5rem 2rem", borderTop:"1px solid rgba(200,184,152,0.08)" }}>
      <div style={{ maxWidth:"1280px", margin:"0 auto" }}>
        <div style={{ marginBottom:"2.5rem" }}>
          <div style={{ fontFamily:"Playfair Display, serif", fontWeight:900, fontSize:"2rem", letterSpacing:"-.02em", marginBottom:".6rem" }}>Patin<span style={{ color:C.orange }}>a</span></div>
          <p style={{ fontFamily:"Lora, serif", fontStyle:"italic", color:"rgba(246,242,235,0.3)", fontSize:".95rem", lineHeight:1.65, maxWidth:"300px" }}>
            Il marketplace europeo dei ricambi d'epoca. Per chi capisce il valore della storia.
          </p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"2rem", marginBottom:"3rem" }}>
          <div>
            <div style={{ ...mn, color:"rgba(246,242,235,0.22)", marginBottom:".8rem" }}>Marketplace</div>
            {[{href:"/search",label:"Cerca ricambi"},{href:"/search?cond=nos",label:"NOS"},{href:"/listings/new",label:"Vendi un ricambio"},{href:"/garage",label:"Il mio garage"}].map(({href,label})=>(
              <Link key={href} href={href} style={{ display:"block", fontFamily:"Lora, serif", fontStyle:"italic", fontSize:".95rem", color:"rgba(246,242,235,0.38)", textDecoration:"none", marginBottom:".4rem" }}>{label}</Link>
            ))}
          </div>
          <div>
            <div style={{ ...mn, color:"rgba(246,242,235,0.22)", marginBottom:".8rem" }}>Community</div>
            {[{href:"/community",label:"Forum"},{href:"/rubriche",label:"Rubriche"},{href:"/events",label:"Raduni"},{href:"/workshops",label:"Officine"}].map(({href,label})=>(
              <Link key={href} href={href} style={{ display:"block", fontFamily:"Lora, serif", fontStyle:"italic", fontSize:".95rem", color:"rgba(246,242,235,0.38)", textDecoration:"none", marginBottom:".4rem" }}>{label}</Link>
            ))}
          </div>
        </div>

        <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:"1.5rem", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
          <span style={{ ...mn, color:"rgba(246,242,235,0.18)", fontSize:".46rem" }}>© {new Date().getFullYear()} Patina — Tutti i diritti riservati</span>
          <span style={{ fontFamily:"Lora, serif", fontStyle:"italic", fontSize:".85rem", color:"rgba(246,242,235,0.2)" }}>Made with ♥ for classic cars</span>
        </div>
      </div>
    </footer>
  );
}
