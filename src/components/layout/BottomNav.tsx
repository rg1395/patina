"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { C } from "@/lib/design";

export default function BottomNav() {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  const item = (href: string, icon: string, label: string) => (
    <Link href={href} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:".18rem", padding:".45rem .2rem", textDecoration:"none" }}>
      <span style={{ fontSize:"1.25rem", lineHeight:1 }}>{icon}</span>
      <span style={{ fontFamily:"DM Mono, monospace", fontSize:".42rem", letterSpacing:".08em", textTransform:"uppercase", color: active(href) ? C.orange : "rgba(246,242,235,0.32)" }}>{label}</span>
    </Link>
  );

  return (
    <>
      <nav style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:200, background:"rgba(20,18,16,0.97)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", borderTop:"1px solid rgba(200,184,152,0.1)", display:"flex", alignItems:"center", paddingBottom:"env(safe-area-inset-bottom)" }} id="bottomNav">
        {item("/search", "🔍", "Ricambi")}
        {item("/community", "💬", "Forum")}
        {/* Center publish */}
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Link href="/listings/new" style={{ width:"50px", height:"50px", borderRadius:"50%", background:C.orange, display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", fontSize:"1.5rem", marginTop:"-18px", boxShadow:`0 4px 16px rgba(196,97,44,.45)` }}>
            +
          </Link>
        </div>
        {item("/rubriche", "📖", "Rubriche")}
        {item("/garage", "🧰", "Garage")}
      </nav>
      <style>{`@media(min-width:768px){#bottomNav{display:none!important}}`}</style>
    </>
  );
}
