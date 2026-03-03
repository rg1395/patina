import Link from "next/link";
import { C, mono } from "@/lib/design";
export default function AboutPage() {
  return (
    <div>
      <div style={{ background:C.dark,padding:"5rem 2.5rem",textAlign:"center" }}>
        <div style={{ maxWidth:"760px",margin:"0 auto" }}>
          <div style={{ ...mono,fontSize:"0.58rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.orange,marginBottom:"1rem" }}>Chi siamo</div>
          <h1 style={{ fontFamily:"Playfair Display, serif",fontWeight:900,fontSize:"3.5rem",color:C.cream,lineHeight:1.0,marginBottom:"1.5rem" }}>
            Nati dalla <em style={{ fontStyle:"italic",color:C.orange }}>passione.</em>
          </h1>
          <p style={{ fontFamily:"Cormorant Garamond, serif",fontStyle:"italic",fontSize:"1.25rem",color:"rgba(245,240,232,0.7)",lineHeight:1.7 }}>
            Patina nasce dalla frustrazione di non trovare un posto serio dove comprare e vendere ricambi d\'epoca. Un posto dove chi vende conosce la storia del pezzo, e chi compra trova quello che cerca davvero.
          </p>
        </div>
      </div>
      <section style={{ maxWidth:"860px",margin:"0 auto",padding:"5rem 2.5rem" }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4rem",marginBottom:"5rem" }}>
          <div>
            <h2 style={{ fontFamily:"Playfair Display, serif",fontWeight:900,fontSize:"2rem",marginBottom:"1rem" }}>La nostra <em style={{ fontStyle:"italic",color:C.orange }}>missione</em></h2>
            <p style={{ fontFamily:"Cormorant Garamond, serif",fontSize:"1.05rem",lineHeight:1.75,color:C.muted }}>Connettere i custodi di auto e moto storiche con i ricambi giusti. Ogni pezzo venduto su Patina è un pezzo strappato all\'oblio.</p>
          </div>
          <div>
            <h2 style={{ fontFamily:"Playfair Display, serif",fontWeight:900,fontSize:"2rem",marginBottom:"1rem" }}>Come ci <em style={{ fontStyle:"italic",color:C.orange }}>finanziamo</em></h2>
            <p style={{ fontFamily:"Cormorant Garamond, serif",fontSize:"1.05rem",lineHeight:1.75,color:C.muted }}>Prendiamo una commissione dell\'8% solo sulle transazioni completate. Nessuna quota mensile, nessun costo di pubblicazione.</p>
          </div>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"2px",background:C.tan,marginBottom:"5rem" }}>
          {[{n:"2024",l:"Anno di fondazione"},{n:"8%",l:"Commissione sul venduto"},{n:"EU",l:"Spedizioni europee"}].map(s=>(
            <div key={s.l} style={{ background:C.cream,padding:"2rem",textAlign:"center" }}>
              <div style={{ fontFamily:"Playfair Display, serif",fontWeight:900,fontSize:"2.5rem",color:C.orange,marginBottom:"0.3rem" }}>{s.n}</div>
              <div style={{ ...mono,fontSize:"0.55rem",color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em" }}>{s.l}</div>
            </div>
          ))}
        </div>
        {[
          {id:"commissioni",title:"Commissioni",text:"Pubblicazione annunci gratuita. Commissione dell\'8% solo sulle vendite completate. Nessun costo fisso. Pagamento protetto incluso. Se non vendi, non paghi nulla."},
          {id:"privacy",title:"Privacy",text:"I tuoi dati sono trattati nel rispetto del GDPR. Non vendiamo dati a terze parti. Dati conservati su server europei. Hai diritto di accesso, rettifica e cancellazione. Scrivi a privacy@patina.eu."},
          {id:"termini",title:"Termini di servizio",text:"Sei responsabile dell\'accuratezza dei tuoi annunci. I ricambi devono corrispondere alla descrizione. Le transazioni avvengono tra privati. Ci riserviamo il diritto di rimuovere annunci non conformi e sospendere account scorretti."},
        ].map(s=>(
          <div key={s.id} id={s.id} style={{ borderTop:`1px solid ${C.tan}`,paddingTop:"3rem",marginBottom:"3rem" }}>
            <h2 style={{ fontFamily:"Playfair Display, serif",fontWeight:900,fontSize:"2rem",marginBottom:"1rem" }}>{s.title}</h2>
            <p style={{ fontFamily:"Cormorant Garamond, serif",fontSize:"1.05rem",lineHeight:1.75,color:C.muted }}>{s.text}</p>
          </div>
        ))}
      </section>
      <section style={{ background:C.dark,padding:"4rem 2.5rem",textAlign:"center" }}>
        <h2 style={{ fontFamily:"Playfair Display, serif",fontWeight:900,fontSize:"2rem",color:C.cream,marginBottom:"1rem" }}>Hai domande?</h2>
        <p style={{ fontFamily:"Cormorant Garamond, serif",fontStyle:"italic",color:"rgba(245,240,232,0.6)",marginBottom:"1.5rem" }}>Scrivici a info@patina.eu</p>
        <Link href="/community" style={{ ...mono,background:C.orange,color:C.cream,padding:"0.8rem 2rem",textDecoration:"none" }}>Vai alla community →</Link>
      </section>
    </div>
  );
}
