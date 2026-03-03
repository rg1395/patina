import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM = "Patina <noreply@patina.eu>";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: EmailPayload) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  return res.ok;
}

function emailTemplate(title: string, body: string, cta?: { label: string; url: string }) {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:2rem;font-weight:900;color:#1A1612;">Patin<span style="color:#C4622D;">a</span></span>
    </div>
    <div style="background:#fff;padding:40px;border-top:3px solid #C4622D;">
      <h1 style="font-size:1.5rem;color:#1A1612;margin:0 0 16px;">${title}</h1>
      <div style="color:#7A6E63;line-height:1.7;font-size:1rem;">${body}</div>
      ${cta ? `<div style="text-align:center;margin-top:32px;"><a href="${cta.url}" style="display:inline-block;background:#C4622D;color:#F5F0E8;padding:12px 28px;text-decoration:none;font-family:monospace;font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;">${cta.label} →</a></div>` : ""}
    </div>
    <div style="text-align:center;margin-top:24px;font-size:0.75rem;color:#7A6E63;font-family:monospace;">
      © ${new Date().getFullYear()} Patina · <a href="https://patina.eu" style="color:#C4622D;">patina.eu</a>
    </div>
  </div>
</body></html>`;
}

serve(async (req) => {
  const { type, data } = await req.json();
  const siteUrl = Deno.env.get("SITE_URL") ?? "https://patina.eu";

  switch (type) {
    case "new_message": {
      const { to_email, sender_username, listing_title, conversation_id } = data;
      await sendEmail({
        to: to_email,
        subject: `Nuovo messaggio da @${sender_username} — Patina`,
        html: emailTemplate(
          "Hai un nuovo messaggio",
          `<p><strong>@${sender_username}</strong> ti ha scritto${listing_title ? ` riguardo a <em>${listing_title}</em>` : ""}.</p>`,
          { label: "Leggi il messaggio", url: `${siteUrl}/messages/${conversation_id}` }
        ),
      });
      break;
    }
    case "offer_received": {
      const { to_email, buyer_username, listing_title, amount, listing_id } = data;
      await sendEmail({
        to: to_email,
        subject: `Nuova offerta su "${listing_title}" — Patina`,
        html: emailTemplate(
          "Hai ricevuto un'offerta",
          `<p><strong>@${buyer_username}</strong> ha fatto un'offerta di <strong>${amount}</strong> per il tuo annuncio <em>${listing_title}</em>.</p>`,
          { label: "Vedi l'offerta", url: `${siteUrl}/listings/${listing_id}` }
        ),
      });
      break;
    }
    case "payment_received": {
      const { to_email, listing_title, escrow_id } = data;
      await sendEmail({
        to: to_email,
        subject: `Pagamento confermato — ${listing_title}`,
        html: emailTemplate(
          "Il pagamento è stato ricevuto",
          `<p>Il pagamento per <em>${listing_title}</em> è stato confermato e trattenuto in escrow. Puoi procedere con la spedizione.</p><p>Ricorda di inserire il numero di tracking per proteggere la transazione.</p>`,
          { label: "Vai alla transazione", url: `${siteUrl}/escrow/${escrow_id}` }
        ),
      });
      break;
    }
    case "item_shipped": {
      const { to_email, listing_title, tracking_number, carrier, escrow_id } = data;
      await sendEmail({
        to: to_email,
        subject: `Il tuo ordine è stato spedito — ${listing_title}`,
        html: emailTemplate(
          "Articolo spedito",
          `<p>Il venditore ha spedito <em>${listing_title}</em>${carrier ? ` tramite <strong>${carrier}</strong>` : ""}${tracking_number ? `. Tracking: <strong>${tracking_number}</strong>` : ""}.</p><p>Una volta ricevuto, conferma la ricezione per rilasciare il pagamento al venditore.</p>`,
          { label: "Conferma ricezione", url: `${siteUrl}/escrow/${escrow_id}` }
        ),
      });
      break;
    }
    case "payout_released": {
      const { to_email, amount, listing_title } = data;
      await sendEmail({
        to: to_email,
        subject: `Pagamento rilasciato — ${amount}`,
        html: emailTemplate(
          "Pagamento in arrivo",
          `<p>L'acquirente ha confermato la ricezione di <em>${listing_title}</em>. <strong>${amount}</strong> sono stati rilasciati e saranno accreditati sul tuo conto entro 2-3 giorni lavorativi.</p>`,
        ),
      });
      break;
    }
    case "dispute_opened": {
      const { to_email, reason, escrow_id } = data;
      await sendEmail({
        to: to_email,
        subject: "Disputa aperta sulla tua transazione — Patina",
        html: emailTemplate(
          "È stata aperta una disputa",
          `<p>È stata aperta una disputa su una tua transazione. Motivo: <em>${reason}</em></p><p>Il team Patina esaminerà il caso e vi contatterà entro 48 ore.</p>`,
          { label: "Vedi la transazione", url: `${siteUrl}/escrow/${escrow_id}` }
        ),
      });
      break;
    }
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
});
