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

  const { title, body, category } = await request.json();
  if (!title?.trim() || !body?.trim()) return NextResponse.json({ error: "Titolo e contenuto obbligatori." }, { status: 400 });

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) + "-" + Date.now().toString(36);

  const { data: thread, error: err } = await admin.from("forum_threads").insert({
    author_id: user.id,
    title: title.trim(),
    body: body.trim(),
    category,
    slug,
    last_reply_at: new Date().toISOString(),
  }).select("slug,id").single();

  if (err) { console.error("FORUM ERROR:", err); return NextResponse.json({ error: err.message }, { status: 500 }); }
  return NextResponse.json({ slug: thread.slug ?? thread.id });
}
