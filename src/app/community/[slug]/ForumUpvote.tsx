"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { C, mono } from "@/lib/design";

export default function ForumUpvote({ threadId, upvotes, userId }: { threadId: string; upvotes: number; userId: string | null }) {
  const [count, setCount] = useState(upvotes);
  const [voted, setVoted] = useState(false);
  const supabase = createClient();

  const toggle = async () => {
    if (!userId) { window.location.href = "/auth/login"; return; }
    if (voted) {
      await supabase.from("forum_upvotes").delete().eq("user_id", userId).eq("thread_id", threadId);
      await supabase.from("forum_threads").update({ upvotes_count: count - 1 }).eq("id", threadId);
      setCount(c => c - 1); setVoted(false);
    } else {
      await supabase.from("forum_upvotes").insert({ user_id: userId, thread_id: threadId });
      await supabase.from("forum_threads").update({ upvotes_count: count + 1 }).eq("id", threadId);
      setCount(c => c + 1); setVoted(true);
    }
  };

  return (
    <button onClick={toggle} style={{ ...mono, fontSize: "0.6rem", background: voted ? C.orange : "transparent", color: voted ? C.cream : C.muted, border: `1px solid ${voted ? C.orange : C.tan}`, padding: "0.4rem 0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
      ▲ {count}
    </button>
  );
}
