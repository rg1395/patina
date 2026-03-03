import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { thread_id, body } = await request.json();
  if (!body?.trim()) return NextResponse.json({ error: "Risposta vuota." }, { status: 400 });

  const { error: err } = await admin.from("forum_replies").insert({
    thread_id, author_id: user.id, body: body.trim(),
  });
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  // Aggiorna contatore e timestamp
  await admin.from("forum_threads").update({
    replies_count: admin.from("forum_threads").select("replies_count"),
    last_reply_at: new Date().toISOString(),
  }).eq("id", thread_id);

  // Semplice increment
  const { data: t } = await admin.from("forum_threads").select("replies_count").eq("id", thread_id).single();
  if (t) await admin.from("forum_threads").update({ replies_count: (t.replies_count ?? 0) + 1 }).eq("id", thread_id);

  return NextResponse.json({ ok: true });
}
