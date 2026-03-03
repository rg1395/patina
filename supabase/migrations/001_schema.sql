-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location_city TEXT,
  location_country TEXT DEFAULT 'IT',
  website TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  rating_avg DECIMAL(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  sales_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own_write" ON profiles FOR ALL USING (auth.uid() = id);

-- CATEGORIES
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name_it TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL
);
INSERT INTO categories (name_it, slug) VALUES
  ('Motore','motore'),('Carburazione','carburazione'),('Distribuzione','distribuzione'),
  ('Raffreddamento','raffreddamento'),('Carrozzeria','carrozzeria'),('Interni','interni'),
  ('Elettrica','elettrica'),('Trasmissione','trasmissione'),('Frenante','frenante'),
  ('Scarico','scarico'),('Sospensioni','sospensioni'),('Ruote e Cerchi','ruote-cerchi');

-- LISTINGS
CREATE TYPE listing_condition AS ENUM ('nos','original_used','restored','needs_restore');
CREATE TYPE listing_status AS ENUM ('active','sold','paused','deleted');
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  condition listing_condition NOT NULL DEFAULT 'original_used',
  price_cents INT NOT NULL,
  is_negotiable BOOLEAN DEFAULT TRUE,
  status listing_status DEFAULT 'active',
  compatible_makes TEXT[],
  compatible_models TEXT[],
  year_from INT,
  year_to INT,
  part_number TEXT,
  images TEXT[],
  cover_image_url TEXT,
  location_city TEXT,
  location_country TEXT DEFAULT 'IT',
  shipping_available BOOLEAN DEFAULT TRUE,
  shipping_cost_cents INT,
  provenance_notes TEXT,
  views_count INT DEFAULT 0,
  saves_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings_public_read" ON listings FOR SELECT USING (status != 'deleted');
CREATE POLICY "listings_own_write" ON listings FOR ALL USING (auth.uid() = seller_id);

CREATE OR REPLACE FUNCTION generate_listing_slug() RETURNS TRIGGER AS $$
DECLARE slug_base TEXT; new_slug TEXT; counter INT := 0;
BEGIN
  slug_base := lower(regexp_replace(unaccent(NEW.title), '[^a-z0-9]+', '-', 'g'));
  slug_base := trim(both '-' from slug_base);
  slug_base := substring(slug_base, 1, 60);
  new_slug := slug_base;
  WHILE EXISTS (SELECT 1 FROM listings WHERE slug = new_slug AND id != NEW.id) LOOP
    counter := counter + 1; new_slug := slug_base || '-' || counter;
  END LOOP;
  NEW.slug := new_slug; RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER listing_slug_trigger BEFORE INSERT ON listings FOR EACH ROW WHEN (NEW.slug IS NULL) EXECUTE FUNCTION generate_listing_slug();

-- VEHICLES
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'car',
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL,
  color TEXT,
  chassis_number TEXT,
  engine_code TEXT,
  restoration_status TEXT,
  notes TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles_public_read" ON vehicles FOR SELECT USING (is_public = TRUE);
CREATE POLICY "vehicles_own_write" ON vehicles FOR ALL USING (auth.uid() = owner_id);

-- SAVED LISTINGS
CREATE TABLE saved_listings (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_own" ON saved_listings FOR ALL USING (auth.uid() = user_id);

-- CONVERSATIONS + MESSAGES
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (listing_id, buyer_id)
);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv_participants" ON conversations FOR ALL USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_participants" ON messages FOR ALL USING (
  EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid()))
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- OFFERS
CREATE TYPE offer_status AS ENUM ('pending','accepted','declined','expired');
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_cents INT NOT NULL,
  message TEXT,
  status offer_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '72 hours'
);
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offers_participants" ON offers FOR ALL USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- REVIEWS
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewed_id UUID NOT NULL REFERENCES profiles(id),
  listing_id UUID REFERENCES listings(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (reviewer_id, listing_id)
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_own_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- FORUM
CREATE TABLE forum_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  body TEXT NOT NULL,
  category TEXT DEFAULT 'generale',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  replies_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  upvotes_count INT DEFAULT 0,
  last_reply_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "threads_public_read" ON forum_threads FOR SELECT USING (true);
CREATE POLICY "threads_auth_insert" ON forum_threads FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "threads_own_update" ON forum_threads FOR UPDATE USING (auth.uid() = author_id);

CREATE OR REPLACE FUNCTION generate_thread_slug() RETURNS TRIGGER AS $$
DECLARE slug_base TEXT; new_slug TEXT; counter INT := 0;
BEGIN
  slug_base := lower(regexp_replace(unaccent(NEW.title), '[^a-z0-9]+', '-', 'g'));
  slug_base := trim(both '-' from slug_base);
  slug_base := substring(slug_base, 1, 60);
  new_slug := slug_base;
  WHILE EXISTS (SELECT 1 FROM forum_threads WHERE slug = new_slug AND id != NEW.id) LOOP
    counter := counter + 1; new_slug := slug_base || '-' || counter;
  END LOOP;
  NEW.slug := new_slug; RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER thread_slug_trigger BEFORE INSERT ON forum_threads FOR EACH ROW WHEN (NEW.slug IS NULL) EXECUTE FUNCTION generate_thread_slug();

CREATE TABLE forum_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  upvotes_count INT DEFAULT 0,
  is_solution BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "replies_public_read" ON forum_replies FOR SELECT USING (true);
CREATE POLICY "replies_auth_insert" ON forum_replies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "replies_own_update" ON forum_replies FOR UPDATE USING (auth.uid() = author_id);

CREATE OR REPLACE FUNCTION increment_replies() RETURNS TRIGGER AS $$
BEGIN
  UPDATE forum_threads SET replies_count = replies_count + 1, last_reply_at = NOW() WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER on_reply_insert AFTER INSERT ON forum_replies FOR EACH ROW EXECUTE FUNCTION increment_replies();

CREATE TABLE forum_upvotes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, thread_id)
);
ALTER TABLE forum_upvotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "upvotes_own" ON forum_upvotes FOR ALL USING (auth.uid() = user_id);

-- WORKSHOPS
CREATE TABLE workshops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'IT',
  phone TEXT,
  email TEXT,
  website TEXT,
  specializations TEXT[],
  is_verified BOOLEAN DEFAULT FALSE,
  rating_avg DECIMAL(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workshops_public_read" ON workshops FOR SELECT USING (true);

-- EVENTS
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  city TEXT,
  country TEXT DEFAULT 'IT',
  event_date DATE NOT NULL,
  event_end_date DATE,
  cover_image_url TEXT,
  website TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  attendees_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_public_read" ON events FOR SELECT USING (true);
CREATE POLICY "events_auth_insert" ON events FOR INSERT WITH CHECK (auth.uid() = organizer_id);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid() = user_id);

-- STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('listings','listings',true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars','avatars',true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicles','vehicles',true) ON CONFLICT DO NOTHING;
CREATE POLICY "storage_public_read" ON storage.objects FOR SELECT USING (bucket_id IN ('listings','avatars','vehicles'));
CREATE POLICY "storage_auth_upload" ON storage.objects FOR INSERT WITH CHECK (auth.role()='authenticated' AND bucket_id IN ('listings','avatars','vehicles'));
CREATE POLICY "storage_own_delete" ON storage.objects FOR DELETE USING (auth.role()='authenticated');

-- SEED DATA
INSERT INTO workshops (name, description, city, specializations, is_verified) VALUES
  ('Officina Brera Classic','Specializzati in restauro Alfa Romeo e Lancia dal 1978.','Milano',ARRAY['Alfa Romeo','Lancia','Fiat'],true),
  ('Fratelli Rossi Moto','Officina storica per moto italiane d''epoca.','Bologna',ARRAY['Ducati','MV Agusta','Moto Guzzi'],true),
  ('Ferrari Classic Service','Assistenza Ferrari e Maserati storici.','Modena',ARRAY['Ferrari','Maserati'],true),
  ('VW Klassik','Restauro VW e Porsche d''epoca.','Torino',ARRAY['Volkswagen','Porsche'],true);

INSERT INTO events (title, description, location, city, event_date, is_featured) VALUES
  ('Mille Miglia 2025','La corsa di regolarità più famosa del mondo.','Brescia — Roma — Brescia','Brescia','2025-05-15',true),
  ('Concorso d''Eleganza Villa d''Este','Il concorso di eleganza più prestigioso d''Italia.','Villa d''Este, Cernobbio','Como','2025-05-23',true),
  ('Auto e Moto d''Epoca Padova','La più grande fiera italiana di veicoli storici.','Quartiere Fieristico','Padova','2025-10-23',true),
  ('Coppa d''Oro delle Dolomiti','Rally storico tra le vette dolomitiche.','Cortina d''Ampezzo','Belluno','2025-07-18',false);
