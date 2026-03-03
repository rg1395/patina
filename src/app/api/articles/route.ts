import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/db";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdmin();
  // Only experts or admins can write articles
  const { data: profile } = await admin.from("profiles").select("is_expert,role").eq("id", user.id).single();
  if (!profile?.is_expert && profile?.role !== "admin") {
    return NextResponse.json({ error: "Solo gli esperti possono pubblicare articoli" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.title || !body.body) {
    return NextResponse.json({ error: "Titolo e testo obbligatori" }, { status: 400 });
  }

  const baseSlug = slugify(body.title);
  const slug = `${baseSlug}-${Date.now()}`;

  const { data, error } = await admin.from("articles").insert({
    author_id: user.id,
    title: body.title,
    slug,
    excerpt: body.excerpt || null,
    body: body.body,
    cover_image_url: body.cover_image_url || null,
    tags: body.tags || [],
    makes: body.makes || [],
    status: profile?.role === "admin" ? "published" : "draft",
    published_at: profile?.role === "admin" ? new Date().toISOString() : null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdmin();
  const body = await req.json();
  const { id, status } = body;

  // Only admin can publish
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Solo gli admin possono pubblicare" }, { status: 403 });
  }

  const { data, error } = await admin.from("articles")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
