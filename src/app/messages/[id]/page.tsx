"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { C, euros } from "@/lib/design";

const mono = { fontFamily: "DM Mono, Courier New, monospace" };
const serif = { fontFamily: "Playfair Display, serif" };

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [conv, setConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = `/auth/login?redirect=/messages/${id}`; return; }
      setUser(session.user);

      const { data: c } = await supabase.from("conversations")
        .select(`id, buyer_id, seller_id,
          buyer:profiles!conversations_buyer_id_fkey(id,username,full_name,avatar_url),
          seller:profiles!conversations_seller_id_fkey(id,username,full_name,avatar_url),
          listing:listings(id,title,cover_image_url,price_cents,slug)`)
        .eq("id", id).single();

      if (!c || (c.buyer_id !== session.user.id && c.seller_id !== session.user.id)) {
        router.push("/messages"); return;
      }
      setConv(c);

      const { data: msgs } = await supabase.from("messages")
        .select("*,sender:profiles(id,username,avatar_url)")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      setMessages(msgs ?? []);

      // Mark as read
      supabase.from("messages").update({ is_read: true }).eq("conversation_id", id).neq("sender_id", session.user.id);

      setLoading(false);

      // Realtime subscription
      const channel = supabase.channel(`conv-${id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
          (payload: any) => {
            setMessages(prev => [...prev, payload.new]);
            supabase.from("messages").update({ is_read: true }).eq("id", payload.new.id).neq("sender_id", session.user.id);
          })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };
    init();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !user || sending) return;
    setSending(true);
    const text = body.trim();
    setBody("");
    await supabase.from("messages").insert({ conversation_id: id, sender_id: user.id, body: text });
    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", id);
    setSending(false);
  };

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ ...mono, fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted }}>Caricamento...</span>
    </div>
  );

  if (!conv) return null;

  const other = conv.buyer_id === user?.id ? conv.seller : conv.buyer;
  const listing = conv.listing;

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "1.5rem 2rem", display: "flex", flexDirection: "column", height: "calc(100vh - 80px)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", paddingBottom: "1rem", borderBottom: `1px solid ${C.tan}`, flexShrink: 0 }}>
        <Link href="/messages" style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, textDecoration: "none" }}>← Messaggi</Link>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: C.dark, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", ...serif, fontWeight: 900, fontSize: "0.85rem", color: C.cream }}>
            {other?.avatar_url ? <img src={other.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (other?.username ?? "?")[0].toUpperCase()}
          </div>
          <span style={{ ...serif, fontWeight: 700, fontSize: "1rem" }}>{other?.full_name ?? other?.username}</span>
        </div>
        {listing && (
          <Link href={`/listings/${listing.slug ?? listing.id}`} style={{ display: "flex", gap: "0.6rem", alignItems: "center", border: `1px solid ${C.tan}`, padding: "0.4rem 0.8rem", textDecoration: "none", color: "inherit", marginLeft: "1rem" }}>
            {listing.cover_image_url && <div style={{ width: "32px", height: "24px", overflow: "hidden", background: C.dark }}><img src={listing.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
            <div>
              <div style={{ ...mono, fontSize: "0.48rem", letterSpacing: "0.06em", textTransform: "uppercase", color: C.orange, maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{listing.title}</div>
              <div style={{ ...serif, fontWeight: 700, fontSize: "0.85rem" }}>{euros(listing.price_cents)}</div>
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 0", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: C.muted, padding: "3rem" }}>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic" }}>Inizia la conversazione qui sotto.</p>
          </div>
        )}
        {messages.map((m: any) => {
          const isMe = m.sender_id === user?.id;
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", gap: "0.5rem", alignItems: "flex-end" }}>
              {!isMe && (
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: C.dark, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", ...serif, fontWeight: 900, fontSize: "0.65rem", color: C.cream }}>
                  {m.sender?.avatar_url ? <img src={m.sender.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (m.sender?.username ?? "?")[0].toUpperCase()}
                </div>
              )}
              <div style={{ maxWidth: "65%" }}>
                <div style={{ background: isMe ? C.dark : C.light, color: isMe ? C.cream : C.dark, padding: "0.75rem 1rem", fontFamily: "Cormorant Garamond, serif", fontSize: "1rem", lineHeight: 1.5, borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px" }}>
                  {m.body}
                </div>
                <div style={{ ...mono, fontSize: "0.45rem", letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted, marginTop: "0.25rem", textAlign: isMe ? "right" : "left" }}>
                  {new Date(m.created_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} style={{ display: "flex", gap: "0.75rem", paddingTop: "1rem", borderTop: `1px solid ${C.tan}`, flexShrink: 0 }}>
        <input
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Scrivi un messaggio..."
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e as any); } }}
          style={{ flex: 1, fontFamily: "Cormorant Garamond, serif", fontSize: "1rem", padding: "0.8rem 1rem", border: `1px solid ${C.tan}`, background: "#fff", color: C.dark, outline: "none" }}
        />
        <button type="submit" disabled={!body.trim() || sending} style={{ ...mono, fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", background: body.trim() && !sending ? C.orange : C.muted, color: C.cream, padding: "0.8rem 1.5rem", border: "none", cursor: body.trim() ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}>
          Invia →
        </button>
      </form>
    </div>
  );
}
