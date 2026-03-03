import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { source } = await request.json(); // "garage" | "saved"

  if (source === "garage") {
    await supabase.rpc("auto_join_pools_from_garage", { p_user_id: user.id });
  } else {
    await supabase.rpc("auto_join_pools_from_saved", { p_user_id: user.id });
  }

  return NextResponse.json({ ok: true });
}
