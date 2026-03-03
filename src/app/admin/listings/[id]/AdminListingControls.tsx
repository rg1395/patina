"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { C, mono } from "@/lib/design";

export default function AdminListingControls({ listingId, currentStatus }: { listingId: string; currentStatus: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  const setStatus = async (status: string) => {
    setLoading(true);
    await supabase.from("listings").update({ status: status as any }).eq("id", listingId);
    setLoading(false);
    router.refresh();
  };

  const statuses = ["active","paused","sold","deleted"];

  return (
    <div style={{ background: "#1e1a16", padding: "1.5rem" }}>
      <div style={{ ...mono, fontSize: "0.55rem", color: C.muted, marginBottom: "1rem" }}>Azioni admin</div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {statuses.filter(s => s !== currentStatus).map(s => (
          <button key={s} onClick={() => setStatus(s)} disabled={loading}
            style={{ ...mono, fontSize: "0.55rem", padding: "0.5rem 1rem", background: s === "deleted" ? "#C0392B" : s === "active" ? "#1E8449" : "#2C3E50", color: "#fff", border: "none", cursor: "pointer" }}>
            Imposta: {s}
          </button>
        ))}
      </div>
    </div>
  );
}
