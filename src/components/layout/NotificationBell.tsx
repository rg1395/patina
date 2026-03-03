"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { C, mono } from "@/lib/design";

export default function NotificationBell({ userId }: { userId: string }) {
  const supabase = createClient();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifs.filter(n => !n.is_read).length;

  useEffect(() => {
    fetchNotifs();
    const channel = supabase.channel("notifs-" + userId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => fetchNotifs()
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const fetchNotifs = async () => {
    const { data } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(12);
    setNotifs(data ?? []);
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const ICONS: Record<string, string> = {
    offer_received: "💰", item_shipped: "📦", delivery_confirmed: "✓",
    payout_released: "💸", dispute_opened: "⚠️", payment_received: "✓",
    escrow_pending: "🔒", new_message: "💬", default: "🔔",
  };

  const LINKS: Record<string, (n: any) => string> = {
    offer_received: n => `/listings/${n.data?.listing_id ?? ""}`,
    item_shipped: n => `/escrow/${n.data?.escrow_id ?? ""}`,
    payout_released: n => `/escrow/${n.data?.escrow_id ?? ""}`,
    payment_received: n => `/escrow/${n.data?.escrow_id ?? ""}`,
    escrow_pending: n => `/escrow/${n.data?.escrow_id ?? ""}`,
    dispute_opened: n => `/escrow/${n.data?.escrow_id ?? ""}`,
    new_message: n => `/messages/${n.data?.conversation_id ?? ""}`,
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1, padding: "0.2rem" }}>
        🔔
        {unread > 0 && (
          <span style={{ position: "absolute", top: "-6px", right: "-6px", background: C.orange, color: C.cream, borderRadius: "50%", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", ...mono, fontSize: "0.42rem" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 0.6rem)", width: "320px", background: "#fff", border: `1px solid ${C.tan}`, zIndex: 300, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem 1rem", borderBottom: `1px solid ${C.light}` }}>
            <span style={{ ...mono, fontSize: "0.55rem", color: C.dark }}>Notifiche</span>
            {unread > 0 && <button onClick={markAllRead} style={{ ...mono, fontSize: "0.48rem", color: C.muted, background: "none", border: "none", cursor: "pointer" }}>Segna tutte lette</button>}
          </div>

          {notifs.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", color: C.muted }}>Nessuna notifica</div>
          ) : (
            <div style={{ maxHeight: "360px", overflowY: "auto" }}>
              {notifs.map(n => {
                const linkFn = LINKS[n.type];
                const href = linkFn ? linkFn(n) : null;
                const icon = ICONS[n.type] ?? ICONS.default;
                const content = (
                  <div onClick={() => { markRead(n.id); setOpen(false); }}
                    style={{ display: "flex", gap: "0.7rem", padding: "0.8rem 1rem", background: n.is_read ? "#fff" : C.light, borderBottom: `1px solid ${C.light}`, cursor: "pointer" }}>
                    <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: "0.1rem" }}>{icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "0.82rem", marginBottom: "0.1rem", color: C.dark }}>{n.title}</div>
                      {n.body && <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.82rem", color: C.muted, lineHeight: 1.3 }}>{n.body}</div>}
                      <div style={{ ...mono, fontSize: "0.42rem", color: C.muted, marginTop: "0.2rem" }}>{new Date(n.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    {!n.is_read && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.orange, flexShrink: 0, marginTop: "0.3rem" }} />}
                  </div>
                );
                return href ? <Link key={n.id} href={href} style={{ textDecoration: "none", display: "block" }}>{content}</Link> : <div key={n.id}>{content}</div>;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
