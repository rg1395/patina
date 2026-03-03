import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/db";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, title, location, date, description } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Titolo obbligatorio" }, { status: 400 });

  const admin = getAdmin();

  // Create a thread in the appropriate category
  const category = type === "raduno" ? "raduni" : "tecnica";
  const fullTitle = type === "raduno"
    ? `[Suggerimento Raduno] ${title}`
    : `[Proposta Rubrica] ${title}`;

  const body_text = [
    description,
    location ? `📍 Luogo: ${location}` : null,
    date ? `📅 Data: ${date}` : null,
  ].filter(Boolean).join("\n\n");

  const slug = `${type}-${Date.now()}`;

  const { error } = await admin.from("threads").insert({
    author_id: user.id,
    title: fullTitle,
    slug,
    body: body_text || "Nessuna descrizione aggiuntiva.",
    category,
    status: "open",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
