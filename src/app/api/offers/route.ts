import { rateLimit } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  if (!rateLimit(user.id, 10, 3600)) return NextResponse.json({ error: "Troppe richieste. Riprova tra un'ora." }, { status: 429 });
  const body = await request.json();
  const { listing_id, amount_cents, message } = body;
  if (!listing_id || !amount_cents || amount_cents <= 0) return NextResponse.json({ error: "Dati mancanti." }, { status: 400 });
  const { data: listing } = await supabase.from("listings").select("id,seller_id,price_cents,status").eq("id", listing_id).single();
  if (!listing || listing.status !== "active") return NextResponse.json({ error: "Annuncio non disponibile." }, { status: 400 });
  if (listing.seller_id === user.id) return NextResponse.json({ error: "Non puoi fare offerte sui tuoi annunci." }, { status: 400 });
  if (amount_cents > listing.price_cents) return NextResponse.json({ error: "L\'offerta supera il prezzo richiesto." }, { status: 400 });
  const { error } = await supabase.from("offers").insert({ listing_id, buyer_id: user.id, seller_id: listing.seller_id, amount_cents, message: message || null });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from("notifications").insert({ user_id: listing.seller_id, type: "offer_received", title: "Nuova offerta ricevuta", body: `Hai ricevuto un\'offerta di €${(amount_cents/100).toLocaleString("it-IT")}` });
  return NextResponse.json({ ok: true });
}
