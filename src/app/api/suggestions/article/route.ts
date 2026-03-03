import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/db";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { title, description } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Titolo obbligatorio" }, { status: 400 });

  const admin = getAdmin();

  const slug = `proposta-${title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").slice(0, 50)}-${Date.now()}`;

  // Save as a draft article with a marker in title
  const { error } = await admin.from("articles").insert({
    author_id: user.id,
    title: `[Proposta] ${title.trim()}`,
    slug,
    excerpt: description?.trim() || null,
    body: description?.trim() || "Proposta inviata dalla community.",
    status: "draft",
    tags: ["proposta"],
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
