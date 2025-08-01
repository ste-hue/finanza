-- Aggiungi categorie entrate mancanti
INSERT INTO categories (company_id, name, type_id, sort_order)
VALUES 
  ((SELECT id FROM companies WHERE name = 'ORTI'), 'Rientro Sospesi', 'revenue', 5),
  ((SELECT id FROM companies WHERE name = 'ORTI'), 'Caparre Intur', 'revenue', 6)
ON CONFLICT DO NOTHING;

-- Aggiungi sottocategorie Main per queste
INSERT INTO subcategories (category_id, name, sort_order)
SELECT c.id, 'Main', 0
FROM categories c
WHERE c.name IN ('Rientro Sospesi', 'Caparre Intur')
  AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE s.category_id = c.id
  );

-- Verifica le categorie inserite
SELECT c.id, c.name, c.type_id, c.sort_order
FROM categories c
JOIN companies co ON c.company_id = co.id
WHERE co.name = 'ORTI'
  AND c.name IN ('Rientro Sospesi', 'Caparre Intur');