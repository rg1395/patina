-- Indice full-text per ricerca veloce su listings
-- Usa pg_trgm per similarità e tsvector per ricerca per parole

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Aggiorna search_vector per tutti gli annunci esistenti
UPDATE listings SET search_vector =
  to_tsvector('italian',
    coalesce(title, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(array_to_string(compatible_makes, ' '), '') || ' ' ||
    coalesce(part_number, '')
  );

-- Trigger per aggiornare search_vector automaticamente
CREATE OR REPLACE FUNCTION update_listing_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('italian',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(array_to_string(NEW.compatible_makes, ' '), '') || ' ' ||
    coalesce(NEW.part_number, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listing_search_vector_update
  BEFORE INSERT OR UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_listing_search_vector();

-- Indici per performance
CREATE INDEX IF NOT EXISTS listings_search_vector_idx ON listings USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS listings_title_trgm_idx ON listings USING GIN(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS listings_status_created_idx ON listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS listings_makes_idx ON listings USING GIN(compatible_makes);
CREATE INDEX IF NOT EXISTS listings_price_idx ON listings(price_cents);
