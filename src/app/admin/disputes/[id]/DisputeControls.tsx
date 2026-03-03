"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { C, mono } from "@/lib/design";

export default function DisputeControls({ escrowId, buyerId, sellerId }: { escrowId: string; buyerId: string; sellerId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  const resolve = async (winner: "buyer" | "seller") => {
    setLoading(true);
    const newStatus = winner === "buyer" ? "refunded" : "completed";
    await supabase.from("escrow_transactions").update({ status: newStatus as any, completed_at: new Date().toISOString() }).eq("id", escrowId);
    await supabase.from("escrow_events").insert({ transaction_id: escrowId, event_type: `admin_resolved_${winner}`, data: { note: adminNote || null } });

    const notifUserId = winner === "buyer" ? buyerId : sellerId;
    const otherUserId = winner === "buyer" ? sellerId : buyerId;
    await supabase.from("notifications").insert([
      { user_id: notifUserId, type: "dispute_resolved", title: "Disputa risolta a tuo favore", body: adminNote || "Il team Patina ha esaminato il caso e ha deciso a tuo favore." },
      { user_id: otherUserId, type: "dispute_resolved", title: "Disputa risolta", body: adminNote || "Il team Patina ha esaminato il caso." },
    ]);
    setLoading(false);
    router.push("/admin");
  };

  return (
    <div style={{ background: "#1e1a16", padding: "1.5rem" }}>
      <div style={{ ...mono, fontSize: "0.55rem", color: C.muted, marginBottom: "1rem" }}>Risolvi disputa</div>
      <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Nota per le parti (opzionale)" rows={3}
        style={{ width: "100%", fontFamily: "Cormorant Garamond, serif", fontSize: "0.95rem", padding: "0.7rem", background: "#2a1f1a", border: "1px solid rgba(255,255,255,0.1)", color: C.cream, outline: "none", resize: "vertical", marginBottom: "1rem" }} />
      <div style={{ display: "flex", gap: "0.8rem" }}>
        <button onClick={() => resolve("buyer")} disabled={loading}
          style={{ ...mono, flex: 1, fontSize: "0.58rem", padding: "0.8rem", background: "#1F618D", color: "#fff", border: "none", cursor: "pointer" }}>
          Rimborsa acquirente
        </button>
        <button onClick={() => resolve("seller")} disabled={loading}
          style={{ ...mono, flex: 1, fontSize: "0.58rem", padding: "0.8rem", background: "#1E8449", color: "#fff", border: "none", cursor: "pointer" }}>
          Rilascia al venditore
        </button>
      </div>
    </div>
  );
}
