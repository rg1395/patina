"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { C, mono } from "@/lib/design";

export default function PoolReach({ listingId, makes }: { listingId: string; makes: string[] }) {
  const supabase = createClient();
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.rpc("get_pool_reach", { p_listing_id: listingId });
      setPools(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [listingId]);

  if (loading || pools.length === 0) return null;

  const totalReach = pools.reduce((sum: number, p: any) => sum + (p.member_count ?? 0), 0);

  return (
    <div style={{ border: `1px solid ${C.tan}`, padding: "1rem 1.2rem", marginTop: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
        <div style={{ ...mono, fontSize: "0.55rem", color: C.muted }}>Portata del tuo annuncio</div>
        <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 900, fontSize: "1.3rem", color: C.orange }}>{totalReach}</div>
      </div>
      <div style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "0.9rem", color: C.muted, marginBottom: "0.8rem" }}>
        appassionati nei pool compatibili verranno notificati
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        {pools.slice(0, 4).map((p: any) => (
          <div key={p.pool_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link href={`/pools/${p.pool_name?.toLowerCase().replace(/\s+/g, '-')}`} style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.9rem", color: C.dark, textDecoration: "none" }}>
              {p.pool_name}
            </Link>
            <span style={{ ...mono, fontSize: "0.48rem", color: C.muted }}>{p.member_count} membri</span>
          </div>
        ))}
      </div>
    </div>
  );
}
