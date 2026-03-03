"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { C, mono } from "@/lib/design";

type Msg = { id: string; body: string; created_at: string; author: { username: string; avatar_url: string | null } | null };

export default function PoolChat({ poolId, initialMessages, userId, isMember }: {
  poolId: string; initialMessages: Msg[]; userId: string | null; isMember: boolean;
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase.channel(`pool-${poolId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pool_messages", filter: `pool_id=eq.${poolId}` },
        async (payload) => {
          const { data: msg } = await supabase
            .from("pool_messages")
            .select("id,body,created_at,author:profiles(username,avatar_url)")
            .eq("id", payload.new.id)
            .single();
          if (msg) setMessages(prev => [...prev, msg as any]);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [poolId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !userId) return;
    setSending(true);
    await supabase.from("pool_messages").insert({ pool_id: poolId, author_id: userId, body: text.trim() });
    setText(""); setSending(false);
  };

  return (
    <div style={{ border: `1px solid ${C.tan}`, display: "flex", flexDirection: "column", height: "520px" }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", margin: "auto", color: C.muted }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>💬</div>
            <div style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "0.9rem" }}>Nessun messaggio ancora.</div>
            <div style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: "0.85rem" }}>Sii il primo a scrivere.</div>
          </div>
        )}
        {messages.map(msg => {
          const isMe = !!(userId && (msg as any).author_id === userId);
          return (
            <div key={msg.id} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", flexDirection: isMe ? "row-reverse" : "row" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: C.dark, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {(msg.author as any)?.avatar_url
                  ? <img src={(msg.author as any).avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ ...mono, fontSize: "0.45rem", color: C.cream }}>{(msg.author as any)?.username?.[0]?.toUpperCase() ?? "?"}</span>
                }
              </div>
              <div style={{ maxWidth: "75%" }}>
                <div style={{ ...mono, fontSize: "0.45rem", color: C.muted, marginBottom: "0.2rem", textAlign: isMe ? "right" : "left" }}>
                  {(msg.author as any)?.username ?? "—"}
                </div>
                <div style={{ background: isMe ? C.orange : C.light, color: isMe ? C.cream : C.dark, padding: "0.5rem 0.75rem", fontFamily: "Cormorant Garamond, serif", fontSize: "0.95rem", lineHeight: 1.4 }}>
                  {msg.body}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!userId ? (
        <div style={{ padding: "0.8rem 1rem", borderTop: `1px solid ${C.tan}`, textAlign: "center" }}>
          <Link href="/auth/login" style={{ ...mono, fontSize: "0.55rem", color: C.orange, textDecoration: "none" }}>Accedi per scrivere →</Link>
        </div>
      ) : !isMember ? (
        <div style={{ padding: "0.8rem 1rem", borderTop: `1px solid ${C.tan}`, textAlign: "center" }}>
          <div style={{ ...mono, fontSize: "0.52rem", color: C.muted }}>Unisciti al pool per scrivere</div>
        </div>
      ) : (
        <form onSubmit={send} style={{ borderTop: `1px solid ${C.tan}`, display: "flex" }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Scrivi nel pool..."
            style={{ flex: 1, fontFamily: "Cormorant Garamond, serif", fontSize: "0.95rem", padding: "0.7rem 0.9rem", border: "none", background: "transparent", outline: "none", color: C.dark }}
          />
          <button type="submit" disabled={sending || !text.trim()} style={{ ...mono, fontSize: "0.55rem", background: text.trim() ? C.orange : C.light, color: text.trim() ? C.cream : C.muted, padding: "0 1rem", border: "none", cursor: text.trim() ? "pointer" : "default", transition: "background 0.15s" }}>
            →
          </button>
        </form>
      )}
    </div>
  );
}
