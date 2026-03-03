-- ESCROW TRANSACTIONS
-- Flusso: buyer paga → fondi in escrow → seller spedisce → buyer conferma → fondi rilasciati
-- Stripe Payment Intent ID conservato per riconciliazione

CREATE TYPE escrow_status AS ENUM (
  'pending_payment',    -- buyer deve pagare
  'payment_held',       -- pagamento ricevuto, in attesa di spedizione
  'shipped',            -- seller ha dichiarato spedizione
  'delivered',          -- buyer ha confermato ricezione → rilascio fondi
  'disputed',           -- controversia aperta
  'refunded',           -- rimborsato al buyer
  'completed'           -- fondi rilasciati al seller
);

CREATE TABLE escrow_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id),
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),

  -- Importi in centesimi
  amount_cents INT NOT NULL,           -- prezzo concordato
  commission_cents INT NOT NULL,       -- 8% di Patina
  seller_payout_cents INT NOT NULL,    -- amount - commission

  -- Stripe
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,            -- quando i fondi vengono rilasciati al seller

  -- Stato
  status escrow_status DEFAULT 'pending_payment',

  -- Tracciamento
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  tracking_number TEXT,
  carrier TEXT,
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  disputed_at TIMESTAMPTZ,
  dispute_reason TEXT,
  refunded_at TIMESTAMPTZ,

  -- Scadenze
  ship_by TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 days',    -- seller deve spedire entro 5gg
  confirm_by TIMESTAMPTZ,                                     -- buyer deve confermare entro 7gg dalla spedizione

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escrow_participants" ON escrow_transactions
  FOR ALL USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Log di ogni cambio di stato
CREATE TABLE escrow_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES escrow_transactions(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,  -- 'payment_received', 'marked_shipped', 'confirmed_delivery', 'dispute_opened', etc.
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE escrow_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escrow_events_participants" ON escrow_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM escrow_transactions t WHERE t.id = transaction_id AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid()))
  );

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_escrow_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER escrow_updated_at BEFORE UPDATE ON escrow_transactions FOR EACH ROW EXECUTE FUNCTION update_escrow_updated_at();
