
-- POOLS: gruppi automatici per marca/modello
-- Un pool = una combinazione marca (+ opzionale modello)
-- Gli utenti vengono assegnati ai pool automaticamente

CREATE TABLE pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make TEXT NOT NULL,
  model TEXT,  -- NULL = pool per tutta la marca
  slug TEXT UNIQUE NOT NULL,  -- es. "alfa-romeo" o "alfa-romeo-giulia"
  display_name TEXT NOT NULL,  -- es. "Alfa Romeo" o "Alfa Romeo Giulia"
  members_count INT DEFAULT 0,
  listings_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pools_public_read" ON pools FOR SELECT USING (true);

-- Membership: utente → pool
CREATE TABLE pool_members (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pool_id UUID REFERENCES pools(id) ON DELETE CASCADE,
  joined_via TEXT DEFAULT 'auto',  -- 'auto_garage', 'auto_search', 'manual'
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, pool_id)
);
ALTER TABLE pool_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pool_members_public_read" ON pool_members FOR SELECT USING (true);
CREATE POLICY "pool_members_own_write" ON pool_members FOR ALL USING (auth.uid() = user_id);

-- Chat dedicata per pool (messaggi pubblici nel pool)
CREATE TABLE pool_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pool_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pool_messages_public_read" ON pool_messages FOR SELECT USING (true);
CREATE POLICY "pool_messages_member_insert" ON pool_messages FOR INSERT WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (SELECT 1 FROM pool_members WHERE user_id = auth.uid() AND pool_id = pool_messages.pool_id)
);

-- Enable realtime per pool messages
ALTER PUBLICATION supabase_realtime ADD TABLE pool_messages;

-- Trigger: aggiorna members_count
CREATE OR REPLACE FUNCTION update_pool_members_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE pools SET members_count = members_count + 1 WHERE id = NEW.pool_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE pools SET members_count = GREATEST(0, members_count - 1) WHERE id = OLD.pool_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER pool_members_count_trigger
  AFTER INSERT OR DELETE ON pool_members
  FOR EACH ROW EXECUTE FUNCTION update_pool_members_count();

-- Funzione: auto-join ai pool in base al garage dell'utente
-- Da chiamare dopo inserimento veicolo o cambio profilo
CREATE OR REPLACE FUNCTION auto_join_pools_from_garage(p_user_id UUID) RETURNS void AS $$
DECLARE
  v_make TEXT;
  v_model TEXT;
  v_pool_id UUID;
  v_slug TEXT;
  v_name TEXT;
BEGIN
  -- Per ogni veicolo nel garage
  FOR v_make, v_model IN
    SELECT DISTINCT make, model FROM vehicles WHERE owner_id = p_user_id AND is_public = true
  LOOP
    -- Pool per marca
    v_slug := lower(regexp_replace(unaccent(v_make), '[^a-z0-9]+', '-', 'g'));
    INSERT INTO pools (make, model, slug, display_name)
      VALUES (v_make, NULL, v_slug, v_make)
      ON CONFLICT (slug) DO NOTHING;
    SELECT id INTO v_pool_id FROM pools WHERE slug = v_slug;
    INSERT INTO pool_members (user_id, pool_id, joined_via)
      VALUES (p_user_id, v_pool_id, 'auto_garage')
      ON CONFLICT DO NOTHING;

    -- Pool per marca+modello
    v_slug := lower(regexp_replace(unaccent(v_make || ' ' || v_model), '[^a-z0-9]+', '-', 'g'));
    v_name := v_make || ' ' || v_model;
    INSERT INTO pools (make, model, slug, display_name)
      VALUES (v_make, v_model, v_slug, v_name)
      ON CONFLICT (slug) DO NOTHING;
    SELECT id INTO v_pool_id FROM pools WHERE slug = v_slug;
    INSERT INTO pool_members (user_id, pool_id, joined_via)
      VALUES (p_user_id, v_pool_id, 'auto_garage')
      ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione: auto-join ai pool in base agli annunci salvati
CREATE OR REPLACE FUNCTION auto_join_pools_from_saved(p_user_id UUID) RETURNS void AS $$
DECLARE
  v_make TEXT;
  v_pool_id UUID;
  v_slug TEXT;
BEGIN
  FOR v_make IN
    SELECT DISTINCT unnest(l.compatible_makes)
    FROM saved_listings sl
    JOIN listings l ON l.id = sl.listing_id
    WHERE sl.user_id = p_user_id
  LOOP
    v_slug := lower(regexp_replace(unaccent(v_make), '[^a-z0-9]+', '-', 'g'));
    INSERT INTO pools (make, model, slug, display_name)
      VALUES (v_make, NULL, v_slug, v_make)
      ON CONFLICT (slug) DO NOTHING;
    SELECT id INTO v_pool_id FROM pools WHERE slug = v_slug;
    INSERT INTO pool_members (user_id, pool_id, joined_via)
      VALUES (p_user_id, v_pool_id, 'auto_search')
      ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione: trova pool rilevanti per un annuncio e conta potenziali acquirenti
CREATE OR REPLACE FUNCTION get_pool_reach(p_listing_id UUID)
RETURNS TABLE(pool_id UUID, pool_name TEXT, member_count INT) AS $$
BEGIN
  RETURN QUERY
    SELECT p.id, p.display_name, p.members_count
    FROM pools p
    JOIN listings l ON l.compatible_makes @> ARRAY[p.make]
    WHERE l.id = p_listing_id
    ORDER BY p.members_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Aggiorna listings_count nei pool quando viene pubblicato un annuncio
CREATE OR REPLACE FUNCTION update_pool_listings_count() RETURNS TRIGGER AS $$
DECLARE v_make TEXT; v_pool_id UUID;
BEGIN
  IF NEW.compatible_makes IS NOT NULL THEN
    FOREACH v_make IN ARRAY NEW.compatible_makes LOOP
      UPDATE pools SET listings_count = listings_count + 1
      WHERE make = v_make AND model IS NULL;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER listing_pool_count_trigger
  AFTER INSERT ON listings FOR EACH ROW EXECUTE FUNCTION update_pool_listings_count();
