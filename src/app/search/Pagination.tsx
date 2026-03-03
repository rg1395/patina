"use client";
import { useRouter } from "next/navigation";
import { C, mono } from "@/lib/design";

export default function Pagination({ current, total, perPage, base }: { current: number; total: number; perPage: number; base: string }) {
  const router = useRouter();
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;

  const go = (p: number) => {
    const params = new URLSearchParams(base);
    params.set("page", p.toString());
    router.push(`/search?${params.toString()}`);
  };

  const visible = Array.from({ length: pages }, (_, i) => i + 1).filter(p => p === 1 || p === pages || Math.abs(p - current) <= 2);

  return (
    <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", marginTop: "2rem", alignItems: "center" }}>
      <button onClick={() => go(current - 1)} disabled={current === 1}
        style={{ ...mono, fontSize: "0.58rem", padding: "0.5rem 0.8rem", background: "transparent", border: `1px solid ${C.tan}`, cursor: current === 1 ? "not-allowed" : "pointer", color: current === 1 ? C.tan : C.dark }}>←</button>

      {visible.map((p, i) => {
        const prev = visible[i - 1];
        return (
          <span key={p} style={{ display: "contents" }}>
            {prev && p - prev > 1 && <span style={{ ...mono, fontSize: "0.58rem", color: C.muted, padding: "0 0.3rem" }}>…</span>}
            <button onClick={() => go(p)}
              style={{ ...mono, fontSize: "0.58rem", padding: "0.5rem 0.8rem", background: p === current ? C.orange : "transparent", color: p === current ? C.cream : C.dark, border: `1px solid ${p === current ? C.orange : C.tan}`, cursor: "pointer" }}>{p}</button>
          </span>
        );
      })}

      <button onClick={() => go(current + 1)} disabled={current === pages}
        style={{ ...mono, fontSize: "0.58rem", padding: "0.5rem 0.8rem", background: "transparent", border: `1px solid ${C.tan}`, cursor: current === pages ? "not-allowed" : "pointer", color: current === pages ? C.tan : C.dark }}>→</button>
    </div>
  );
}
