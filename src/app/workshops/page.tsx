import { createClient } from "@/lib/supabase/server";
import { C, mono } from "@/lib/design";
import WorkshopCard from "./WorkshopCard";

export default async function WorkshopsPage() {
  const supabase = await createClient();
  const { data: workshops } = await supabase.from("workshops").select("*").order("is_verified", { ascending: false }).order("rating_avg", { ascending: false });

  return (
    <div>
      <div style={{ background: C.dark, padding: "4rem 2.5rem" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.15em", textTransform: "uppercase", color: C.orange, marginBottom: "0.5rem" }}>Directory</div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "2.5rem", color: C.cream, marginBottom: "1rem" }}>
            Officine <em style={{ fontStyle: "italic", color: C.orange }}>Verificate</em>
          </h1>
          <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: "rgba(245,240,232,0.6)", fontSize: "1.1rem", maxWidth: "500px" }}>
            Officine specializzate in restauro di auto e moto d'epoca, selezionate dalla community Patina.
          </p>
        </div>
      </div>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 2.5rem" }}>
        {(workshops?.length ?? 0) === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem", border: `1px dashed ${C.tan}`, color: C.muted }}>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic" }}>Nessuna officina ancora. Siamo in fase di raccolta delle candidature.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr),1fr)", gap: "1px", background: C.tan, borderRadius: "14px", overflow: "hidden" }}>
            {(workshops ?? []).map((w: any) => <WorkshopCard key={w.id} w={w} />)}
          </div>
        )}
      </div>
    </div>
  );
}
