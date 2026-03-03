"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/lib/design";

const mono = { fontFamily: "DM Mono, Courier New, monospace" };

export default function DeleteSavedSearch({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Eliminare questa ricerca salvata?")) return;
    setLoading(true);
    await fetch("/api/saved-searches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
    setLoading(false);
  };

  return (
    <button onClick={handleDelete} disabled={loading} style={{ ...mono, fontSize: "0.52rem", color: C.muted, background: "transparent", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1 }}>
      {loading ? "..." : "✕ Elimina"}
    </button>
  );
}
