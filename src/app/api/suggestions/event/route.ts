import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/db";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { title, location, date, description } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Titolo obbligatorio" }, { status: 400 });

  const admin = getAdmin();

  // Parse date if provided
  let event_date: string | null = null;
  if (date) {
    // Try to parse Italian date formats: "15 Giugno 2026", "15/06/2026", ISO
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      event_date = parsed.toISOString().split("T")[0];
    } else {
      // Store as description note if unparseable
      event_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // +30 days fallback
    }
  } else {
    event_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  }

  const city = location?.trim() || "Italia";

  const { data, error } = await admin.from("events").insert({
    title: title.trim(),
    description: [description, date ? `Data indicata: ${date}` : null].filter(Boolean).join(" — ") || null,
    city,
    event_date,
    country: "IT",
    is_featured: false,
    suggested_by: user.id,
  }).select("id").single();

  if (error) {
    // Fallback: if events table doesn't have suggested_by, retry without it
    const { error: err2 } = await admin.from("events").insert({
      title: title.trim(),
      description: [description, date ? `Data indicata: ${date}` : null, `Suggerito da: ${user.email}`].filter(Boolean).join(" — ") || null,
      city,
      event_date,
      country: "IT",
      is_featured: false,
    });
    if (err2) return NextResponse.json({ error: err2.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
