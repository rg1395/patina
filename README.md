# Patina — Setup Guide

## 1. Supabase — SQL Editor

Lancia le migration nell'ordine:
```
001_schema.sql
002_pools.sql
003_escrow.sql
004_notifications_realtime.sql
005_email_trigger.sql        ← richiede pg_net (abilita in Extensions)
006_fulltext_search.sql
007_search_vector_column.sql
```

## 2. Variabili d'ambiente

Copia `.env.local` e compila:

```env
# Supabase (obbligatorio)
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   ← Settings → API → service_role

# Sito
NEXT_PUBLIC_SITE_URL=https://patina.eu  (o http://localhost:3000 in dev)

# Stripe (per pagamenti reali)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (email transazionali)
RESEND_API_KEY=re_...

# Admin
ADMIN_EMAILS=tuo@email.com,altro@email.com
```

## 3. Supabase Auth

Dashboard → Authentication → URL Configuration:
- Site URL: `https://patina.eu`
- Redirect URLs: `https://patina.eu/auth/callback`

## 4. Storage buckets

Già creati dalla migration 001. Verifica in Dashboard → Storage che esistano: `listings`, `avatars`, `vehicles`.

## 5. Edge Function (email)

```bash
npx supabase functions deploy send-email
npx supabase secrets set RESEND_API_KEY=re_...
npx supabase secrets set SITE_URL=https://patina.eu
```

## 6. Stripe webhook

Nel Stripe Dashboard → Webhooks → aggiungi endpoint:
`https://patina.eu/api/webhooks/stripe`

Events da ascoltare:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `transfer.created`

## 7. Deploy su Vercel

```bash
npx vercel
```

Aggiungi tutte le env vars su Vercel Dashboard → Settings → Environment Variables.

## 8. Admin

Vai su `/admin` con l'email configurata in `ADMIN_EMAILS`.

---

## Struttura pagine

| URL | Descrizione |
|-----|-------------|
| `/` | Homepage |
| `/search` | Ricerca con filtri e paginazione |
| `/listings/new` | Pubblica annuncio |
| `/listings/[slug]` | Dettaglio annuncio con acquisto escrow |
| `/listings/edit/[slug]` | Modifica annuncio |
| `/messages` | Lista conversazioni |
| `/messages/[id]` | Chat real-time |
| `/garage` | Dashboard personale |
| `/garage/add-vehicle` | Aggiungi veicolo |
| `/garage/edit-vehicle/[id]` | Modifica veicolo |
| `/profile/[username]` | Profilo pubblico |
| `/profile/edit` | Modifica profilo + avatar |
| `/reviews/new` | Lascia recensione |
| `/escrow` | Lista transazioni |
| `/escrow/[id]` | Dettaglio transazione |
| `/pools` | Pool per marca |
| `/pools/[slug]` | Pool con feed + chat |
| `/community` | Forum |
| `/community/[slug]` | Thread |
| `/workshops` | Officine verificate |
| `/events` | Raduni ed eventi |
| `/about` | Chi siamo / Privacy / Termini |
| `/admin` | Pannello admin (solo admin) |
| `/admin/listings/[id]` | Gestione annuncio |
| `/admin/disputes/[id]` | Risolvi disputa |
| `/admin/users/[id]` | Gestione utente |
| `/auth/login` | Login |
| `/auth/register` | Registrazione |
| `/auth/forgot-password` | Recupera password |
| `/auth/reset-password` | Nuova password |
