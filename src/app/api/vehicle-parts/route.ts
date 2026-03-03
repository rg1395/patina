import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/db";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { vehicle_id, name, description, listing_id, installed_at } = body;
  if (!vehicle_id || !name) return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 });

  const admin = getAdmin();
  // Verify ownership
  const { data: vehicle } = await admin.from("vehicles").select("owner_id").eq("id", vehicle_id).single();
  if (vehicle?.owner_id !== user.id) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { data, error } = await admin.from("vehicle_parts").insert({
    vehicle_id,
    name,
    description: description || null,
    listing_id: listing_id || null,
    installed_at: installed_at || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const admin = getAdmin();

  // Verify ownership through vehicle
  const { data: part } = await admin.from("vehicle_parts")
    .select("vehicle_id, vehicles(owner_id)")
    .eq("id", id)
    .single();

  const owner = (part?.vehicles as any)?.owner_id;
  if (owner !== user.id) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { error } = await admin.from("vehicle_parts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Toggle vehicle public/private
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicle_id, is_public } = await req.json();
  const admin = getAdmin();

  const { data: vehicle } = await admin.from("vehicles").select("owner_id").eq("id", vehicle_id).single();
  if (vehicle?.owner_id !== user.id) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { data, error } = await admin.from("vehicles")
    .update({ is_public })
    .eq("id", vehicle_id)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
