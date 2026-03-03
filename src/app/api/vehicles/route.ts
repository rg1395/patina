import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // Verifica sessione utente
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const body = await request.json();
  const { type, make, model, year, color, chassis_number, engine_code, restoration_status, notes, is_public, id } = body;

  if (id) {
    // UPDATE
    const { error } = await admin.from("vehicles").update({
      type, make, model, year, color: color || null,
      chassis_number: chassis_number || null,
      engine_code: engine_code || null,
      restoration_status, notes: notes || null, is_public,
    }).eq("id", id).eq("owner_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // INSERT
    const { error } = await admin.from("vehicles").insert({
      owner_id: user.id, type, make, model, year,
      color: color || null, chassis_number: chassis_number || null,
      engine_code: engine_code || null, restoration_status,
      notes: notes || null, is_public,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-join pools
  try {
    await admin.rpc("auto_join_pools_from_garage", { p_user_id: user.id });
  } catch {}

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { id } = await request.json();
  const { error } = await admin.from("vehicles").delete().eq("id", id).eq("owner_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
