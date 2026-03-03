"use client";
import { useRouter } from "next/navigation";
import { C } from "@/lib/design";

export default function SortSelect({ current, base }: { current: string; base: string }) {
  const router = useRouter();
  return (
    <select
      value={current}
      onChange={e => {
        const p = new URLSearchParams(base);
        p.set("sort", e.target.value);
        router.push(`/search?${p.toString()}`);
      }}
      style={{ fontFamily: "DM Mono, Courier New, monospace", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.45rem 0.8rem", border: `1px solid ${C.tan}`, background: C.cream, color: C.dark, cursor: "pointer", outline: "none" }}
    >
      <option value="newest">Più recenti</option>
      <option value="price_asc">Prezzo crescente</option>
      <option value="price_desc">Prezzo decrescente</option>
      <option value="most_viewed">Più visti</option>
    </select>
  );
}
