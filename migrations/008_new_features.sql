-- ============================================================
-- 008 - Saved Searches, Part Valuations, Articles, Vehicle Parts
-- Run this in Supabase SQL Editor
-- ============================================================

-- SAVED SEARCHES
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query TEXT DEFAULT '',
  makes TEXT[] DEFAULT '{}',
  conditions TEXT[] DEFAULT '{}',
  min_price INT DEFAULT 0,
  max_price INT DEFAULT 0,
  notify_email BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE saved_searches DISABLE ROW LEVEL SECURITY;
GRANT ALL ON saved_searches TO anon, authenticated, service_role;

-- PART VALUATIONS
CREATE TABLE IF NOT EXISTS part_valuations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  authenticity INT NOT NULL CHECK (authenticity BETWEEN 1 AND 5),
  price_fairness INT NOT NULL CHECK (price_fairness BETWEEN 1 AND 5),
  condition_accuracy INT NOT NULL CHECK (condition_accuracy BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, user_id)
);
ALTER TABLE part_valuations DISABLE ROW LEVEL SECURITY;
GRANT ALL ON part_valuations TO anon, authenticated, service_role;

-- ARTICLES (rubriche)
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,
  cover_image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  makes TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  views_count INT DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
GRANT ALL ON articles TO anon, authenticated, service_role;

-- VEHICLE PARTS (garage pubblico - ricambi installati)
CREATE TABLE IF NOT EXISTS vehicle_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  installed_at DATE,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE vehicle_parts DISABLE ROW LEVEL SECURITY;
GRANT ALL ON vehicle_parts TO anon, authenticated, service_role;

-- Add columns to vehicles for public garage
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS year INT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS model TEXT;

-- Add is_expert to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_expert BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expert_makes TEXT[] DEFAULT '{}';

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_part_valuations_listing ON part_valuations(listing_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_parts_vehicle ON vehicle_parts(vehicle_id);
