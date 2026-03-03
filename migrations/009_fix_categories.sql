-- ════════════════════════════════════════════════
-- Fix: categories table + listings.category_id
-- ════════════════════════════════════════════════

-- 1. Make category_id nullable (so listing can be saved without category)
ALTER TABLE listings ALTER COLUMN category_id DROP NOT NULL;

-- 2. Insert the categories used in the app (if not already present)
INSERT INTO categories (id, name) VALUES
  (1,  'Motore'),
  (2,  'Carburazione'),
  (3,  'Distribuzione'),
  (4,  'Raffreddamento'),
  (6,  'Carrozzeria'),
  (11, 'Interni'),
  (15, 'Elettrica'),
  (18, 'Trasmissione'),
  (22, 'Frenante'),
  (23, 'Scarico'),
  (24, 'Sospensioni'),
  (25, 'Ruote & Cerchi')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 3. Reset sequence to avoid conflicts
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
