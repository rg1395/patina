import Link from "next/link";
import { C, mono } from "@/lib/design";
export default function NotFound() {
  return (
    <div style={{ minHeight:"70vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.cream }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontFamily:"Playfair Display, serif",fontWeight:900,fontSize:"8rem",color:C.light,lineHeight:1 }}>404</div>
        <h1 style={{ fontFamily:"Playfair Display, serif",fontWeight:900,fontSize:"2rem",marginBottom:"0.5rem" }}>Pagina non trovata</h1>
        <p style={{ fontFamily:"Cormorant Garamond, serif",fontStyle:"italic",color:C.muted,marginBottom:"2rem" }}>La pagina che cerchi non esiste o è stata rimossa.</p>
        <Link href="/" style={{ ...mono,background:C.orange,color:C.cream,padding:"0.8rem 2rem",textDecoration:"none" }}>Torna alla home →</Link>
      </div>
    </div>
  );
}
