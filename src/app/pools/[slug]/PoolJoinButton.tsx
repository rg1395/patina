"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { C, mono } from "@/lib/design";

export default function PoolJoinButton({ poolId, isMember, userId }: { poolId: string; isMember: boolean; userId: string | null }) {
  const [member, setMember] = useState(isMember);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const toggle = async () => {
    if (!userId) { router.push("/auth/login"); return; }
    setLoading(true);
    if (member) {
      await supabase.from("pool_members").delete().eq("user_id", userId).eq("pool_id", poolId);
      setMember(false);
    } else {
      await supabase.from("pool_members").insert({ user_id: userId, pool_id: poolId, joined_via: "manual" });
      setMember(true);
    }
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{ ...mono, fontSize: "0.62rem", background: member ? "transparent" : C.orange, color: member ? C.cream : C.cream, border: `1px solid ${member ? "rgba(255,255,255,0.3)" : C.orange}`, padding: "0.7rem 1.5rem", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
    >
      {loading ? "..." : member ? "✓ Nel pool" : "Entra nel pool →"}
    </button>
  );
}
