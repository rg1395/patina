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

  const body = await request.json();
  const { id, category_id, ...payload } = body;

  // Generate slug from title if not present
  const slug = payload.slug ?? (
    (payload.title ?? "ricambio")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60)
    + "-" + Date.now().toString(36)
  );

  // category_id excluded until categories table is populated via migration 009
  const safePayload = { ...payload, slug };

  if (id) {
    const { error: err } = await admin.from("listings").update({ ...safePayload, updated_at: new Date().toISOString() }).eq("id", id).eq("seller_id", user.id);
    if (err) { console.error("LISTING UPDATE ERROR:", err); return NextResponse.json({ error: err.message }, { status: 500 }); }
    return NextResponse.json({ ok: true });
  } else {
    const { data, error: err } = await admin.from("listings").insert({ ...safePayload, seller_id: user.id }).select("slug,id").single();
    if (err) { console.error("LISTING INSERT ERROR:", err); return NextResponse.json({ error: err.message }, { status: 500 }); }
    // Use slug if actually saved, otherwise id (UUID) — detail page handles both
    const redirect = (data.slug && data.slug === slug) ? data.slug : data.id;
    return NextResponse.json({ slug: redirect });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  const { id } = await request.json();
  const { error } = await admin.from("listings").update({ status: "deleted" }).eq("id", id).eq("seller_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
