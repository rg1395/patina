-- Aggiunge colonna search_vector se non esiste
ALTER TABLE listings ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Popola per gli annunci esistenti
UPDATE listings SET search_vector =
  to_tsvector('italian',
    coalesce(title, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(array_to_string(compatible_makes, ' '), '') || ' ' ||
    coalesce(part_number, '')
  );
