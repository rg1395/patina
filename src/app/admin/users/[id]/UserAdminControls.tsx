"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { C, mono } from "@/lib/design";

export default function UserAdminControls({ userId, isVerified }: { userId: string; isVerified: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggleVerified = async () => {
    setLoading(true);
    await supabase.from("profiles").update({ is_verified: !isVerified }).eq("id", userId);
    setLoading(false);
    router.refresh();
  };

  const suspendUser = async () => {
    if (!confirm("Sospendere questo utente? Tutti i suoi annunci verranno messi in pausa.")) return;
    setLoading(true);
    await supabase.from("listings").update({ status: "paused" as any }).eq("seller_id", userId).eq("status", "active");
    setLoading(false);
    router.refresh();
  };

  return (
    <div style={{ background: "#1e1a16", padding: "1.2rem", display: "flex", gap: "0.6rem" }}>
      <button onClick={toggleVerified} disabled={loading}
        style={{ ...mono, fontSize: "0.55rem", padding: "0.6rem 1rem", background: isVerified ? "#2C3E50" : "#1E8449", color: "#fff", border: "none", cursor: "pointer" }}>
        {isVerified ? "Rimuovi verifica" : "✓ Verifica utente"}
      </button>
      <button onClick={suspendUser} disabled={loading}
        style={{ ...mono, fontSize: "0.55rem", padding: "0.6rem 1rem", background: "#C0392B", color: "#fff", border: "none", cursor: "pointer" }}>
        Sospendi utente
      </button>
    </div>
  );
}
