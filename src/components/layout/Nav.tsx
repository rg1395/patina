"use client";
import NotificationBell from "./NotificationBell";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef } from "react";
import { C } from "@/lib/design";

const NAV_LINKS = [
  { href: "/search",    label: "Ricambi" },
  { href: "/community", label: "Community" },
  { href: "/events",    label: "Raduni" },
  { href: "/rubriche",  label: "Rubriche" },
  { href: "/workshops", label: "Officine" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser]         = useState<any>(null);
  const [unread, setUnread]     = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobOpen, setMobOpen]   = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUnread(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
      if (s?.user) fetchUnread(s.user.id); else setUnread(0);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => { setMobOpen(false); }, [pathname]);

  const fetchUnread = async (uid: string) => {
    try {
      const { data: convs } = await supabase.from("conversations").select("id").or(`buyer_id.eq.${uid},seller_id.eq.${uid}`);
      if (!convs?.length) return;
      const { count } = await supabase.from("messages").select("id", { count: "exact", head: true })
        .eq("is_read", false).neq("sender_id", uid).in("conversation_id", convs.map((c: any) => c.id));
      setUnread(count ?? 0);
    } catch {}
  };

  const signOut = async () => { setMenuOpen(false); setMobOpen(false); await supabase.auth.signOut(); router.push("/"); router.refresh(); };
  const active = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));
  const lk = (a: boolean): React.CSSProperties => ({
    fontFamily: "DM Mono, monospace", fontSize: ".62rem", letterSpacing: ".14em", textTransform: "uppercase", textDecoration: "none",
    color: a ? C.cream : "rgba(246,242,235,0.38)", transition: "color .2s",
  });

  return (
    <>
      <nav style={{ position:"sticky", top:0, zIndex:200, background:"rgba(20,18,16,0.97)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", borderBottom:"1px solid rgba(200,184,152,0.1)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 1.5rem", height:"60px" }}>
        <Link href="/" style={{ fontFamily:"Playfair Display, serif", fontWeight:900, fontSize:"1.4rem", color:C.cream, letterSpacing:"-.02em", textDecoration:"none" }}>
          Patin<span style={{ color:C.orange }}>a</span>
        </Link>

        {/* Desktop links */}
        <div style={{ display:"flex", gap:"1.8rem" }} id="desktopNav">
          {NAV_LINKS.map(({ href, label }) => <Link key={href} href={href} style={lk(active(href))}>{label}</Link>)}
        </div>

        {/* Right */}
        <div style={{ display:"flex", gap:".8rem", alignItems:"center" }}>
          {user ? (
            <>
              <Link href="/messages" style={{ ...lk(active("/messages")), position:"relative" }} id="msgLink">
                Messaggi
                {unread > 0 && <span style={{ position:"absolute", top:"-8px", right:"-10px", background:C.orange, color:C.cream, borderRadius:"50%", width:"16px", height:"16px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".42rem" }}>{unread>9?"9+":unread}</span>}
              </Link>
              <NotificationBell userId={user.id} />
              <Link href="/listings/new" style={{ fontFamily:"DM Mono, monospace", fontSize:".62rem", letterSpacing:".1em", textTransform:"uppercase", background:C.orange, color:C.cream, padding:".5rem 1.2rem", borderRadius:"100px", textDecoration:"none" }} id="pubBtn">+ Pubblica</Link>
              <div ref={menuRef} style={{ position:"relative" }}>
                <button onClick={() => setMenuOpen(!menuOpen)} style={{ ...lk(false), background:"none", border:"none", cursor:"pointer", padding:".3rem .4rem" }}>Account ▾</button>
                {menuOpen && (
                  <div style={{ position:"absolute", right:0, top:"calc(100% + .5rem)", background:"#1e1a17", border:"1px solid rgba(200,184,152,0.12)", borderRadius:"12px", minWidth:"210px", zIndex:300, boxShadow:"0 16px 40px rgba(0,0,0,.4)", overflow:"hidden" }}>
                    {[{href:"/profile",label:"Il mio profilo"},{href:"/garage",label:"Garage"},{href:"/messages",label:"Messaggi"},{href:"/search/saved",label:"Ricerche salvate"}].map(({ href, label }) => (
                      <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{ display:"block", fontFamily:"DM Mono, monospace", fontSize:".6rem", letterSpacing:".1em", textTransform:"uppercase", color:"rgba(246,242,235,0.55)", padding:".85rem 1.1rem", textDecoration:"none", borderBottom:"1px solid rgba(200,184,152,0.08)" }}>{label}</Link>
                    ))}
                    <button onClick={signOut} style={{ display:"block", width:"100%", textAlign:"left", fontFamily:"DM Mono, monospace", fontSize:".6rem", letterSpacing:".1em", textTransform:"uppercase", color:"rgba(246,242,235,0.3)", padding:".85rem 1.1rem", background:"none", border:"none", cursor:"pointer" }}>Esci</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" style={lk(false)} id="loginLink">Accedi</Link>
              <Link href="/auth/register" style={{ fontFamily:"DM Mono, monospace", fontSize:".62rem", letterSpacing:".1em", textTransform:"uppercase", background:C.orange, color:C.cream, padding:".5rem 1.2rem", borderRadius:"100px", textDecoration:"none" }}>Registrati</Link>
            </>
          )}
          {/* Hamburger */}
          <button onClick={() => setMobOpen(!mobOpen)} style={{ background:"none", border:"none", cursor:"pointer", color:C.cream, fontSize:"1.3rem", padding:".2rem", display:"none" }} id="hamburger">
            {mobOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile full-screen menu */}
      {mobOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:199, background:"rgba(20,18,16,0.99)", backdropFilter:"blur(12px)", display:"flex", flexDirection:"column", padding:"5rem 2rem 2rem", animation:"fadeIn .2s ease" }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} style={{ fontFamily:"Playfair Display, serif", fontWeight:700, fontStyle:"italic", fontSize:"2.2rem", color: active(href) ? C.orange : C.cream, textDecoration:"none", padding:".65rem 0", borderBottom:"1px solid rgba(200,184,152,0.08)" }}>
              {label}
            </Link>
          ))}
          <div style={{ marginTop:"2rem", display:"flex", flexDirection:"column", gap:".8rem" }}>
            {user ? (
              <>
                {[{href:"/profile",label:"Profilo"},{href:"/garage",label:"Garage"},{href:"/messages",label:"Messaggi"}].map(({href,label})=>(
                  <Link key={href} href={href} style={{ fontFamily:"DM Mono, monospace", fontSize:".62rem", letterSpacing:".1em", textTransform:"uppercase", color:"rgba(246,242,235,0.4)", textDecoration:"none" }}>{label}</Link>
                ))}
                <button onClick={signOut} style={{ fontFamily:"DM Mono, monospace", fontSize:".62rem", letterSpacing:".1em", textTransform:"uppercase", color:"rgba(246,242,235,0.28)", background:"none", border:"none", cursor:"pointer", textAlign:"left", padding:0 }}>Esci</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" style={{ fontFamily:"DM Mono, monospace", fontSize:".65rem", letterSpacing:".1em", textTransform:"uppercase", color:"rgba(246,242,235,0.45)", textDecoration:"none" }}>Accedi</Link>
                <Link href="/auth/register" style={{ fontFamily:"DM Mono, monospace", fontSize:".65rem", letterSpacing:".1em", textTransform:"uppercase", background:C.orange, color:C.cream, padding:".75rem 1.5rem", borderRadius:"100px", textDecoration:"none", display:"inline-block" }}>Registrati</Link>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (min-width:768px){#desktopNav{display:flex!important}#msgLink,#loginLink,#pubBtn{display:flex!important}#hamburger{display:none!important}}
        @media (max-width:767px){#desktopNav{display:none!important}#msgLink,#loginLink,#pubBtn{display:none!important}#hamburger{display:block!important}}
      `}</style>
    </>
  );
}
