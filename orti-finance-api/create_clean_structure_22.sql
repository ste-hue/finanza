-- 🎯 STRUTTURA PULITA ORTI - 22 CATEGORIE ESATTE
-- Elimina tutto e ricrea la struttura perfetta

-- ============================================================================
-- PULIZIA COMPLETA
-- ============================================================================

-- Elimina entries (già fatto)
DELETE FROM entries WHERE subcategory_id IN (
    SELECT sc.id FROM subcategories sc 
    JOIN categories c ON sc.category_id = c.id 
    WHERE c.company_id = (SELECT id FROM companies WHERE name = 'ORTI')
);

-- Elimina subcategories
DELETE FROM subcategories WHERE category_id IN (
    SELECT id FROM categories WHERE company_id = (SELECT id FROM companies WHERE name = 'ORTI')
);

-- Elimina categories
DELETE FROM categories WHERE company_id = (SELECT id FROM companies WHERE name = 'ORTI');

-- ============================================================================
-- RICOSTRUZIONE PULITA
-- ============================================================================

-- Assicura che esista la company ORTI
INSERT INTO companies (name, description) VALUES 
('ORTI', 'Gruppo ORTI - Strutture turistiche')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 💰 ENTRATE (6 categorie)
-- ============================================================================

INSERT INTO categories (company_id, name, type_id, sort_order) VALUES 
((SELECT id FROM companies WHERE name = 'ORTI'), 'Entrate Hotel', 'revenue', 1),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Entrate Residence', 'revenue', 2),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Entrate CVM', 'revenue', 3),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Entrate Supermercato', 'revenue', 4),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Rientro Sospesi', 'revenue', 5),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Caparre Intur', 'revenue', 6);

-- Subcategorie Entrate (una "Totale" per categoria)
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Entrate Hotel' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Totale', 1),
((SELECT id FROM categories WHERE name = 'Entrate Residence' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Totale', 1),
((SELECT id FROM categories WHERE name = 'Entrate CVM' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Totale', 1),
((SELECT id FROM categories WHERE name = 'Entrate Supermercato' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Totale', 1),
((SELECT id FROM categories WHERE name = 'Rientro Sospesi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Totale', 1),
((SELECT id FROM categories WHERE name = 'Caparre Intur' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Totale', 1);

-- ============================================================================
-- 💸 USCITE (12 categorie)
-- ============================================================================

INSERT INTO categories (company_id, name, type_id, sort_order) VALUES 
((SELECT id FROM companies WHERE name = 'ORTI'), 'Salari e Stipendi', 'expense', 10),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Utenze', 'expense', 11),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Materie Prime/Consumo', 'expense', 12),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Tasse e Imposte', 'expense', 13),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Commissioni Portali', 'expense', 14),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Mutui e Finanziamenti', 'expense', 15),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Consulenze', 'expense', 16),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Godimento Beni di Terzi', 'expense', 17),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Varie ed Eventuali', 'expense', 18),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Canoni e servizi', 'expense', 19),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Ristr. Apt SDP Jr', 'expense', 20),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Deposito Fitto', 'expense', 21);

-- Subcategorie Uscite (una "Totale" per categoria)
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Salari e Stipendi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Totale', 1),
((SELECT id FROM categories WHERE name = 'Utenze' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Totale', 1),
((SELECT id FROM categories WHERE name = 'Materie Prime/Consumo' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Totale', 1),
((SELECT id FROM categories WHERE name = 'Tasse e Imposte' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Totale', 1),
((SELECT id FROM categories WHERE name = 'Commissioni Portali' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Totale', 1),
((SELECT id FROM categories WHERE name = 'Mutui e Finanziamenti' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Totale', 1),
((SELECT id FROM categories WHERE name = 'Consulenze' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Totale', 1),
((SELECT id FROM categories WHERE name = 'Godimento Beni di Terzi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Totale', 1),
((SELECT id FROM categories WHERE name = 'Varie ed Eventuali' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Totale', 1),
((SELECT id FROM categories WHERE name = 'Canoni e servizi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Totale', 1),
((SELECT id FROM categories WHERE name = 'Ristr. Apt SDP Jr' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Totale', 1),
((SELECT id FROM categories WHERE name = 'Deposito Fitto' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Totale', 1);

-- ============================================================================
-- 🏦 SALDI (4 categorie)
-- ============================================================================

INSERT INTO categories (company_id, name, type_id, sort_order) VALUES 
((SELECT id FROM companies WHERE name = 'ORTI'), 'Saldo Banca Sella', 'balance', 30),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Saldo MPS', 'balance', 31),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Saldo Intesa', 'balance', 32),
((SELECT id FROM companies WHERE name = 'ORTI'), 'CASSA CONTANTI', 'balance', 33);

-- Subcategorie Saldi (una "Saldo" per categoria)
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Saldo Banca Sella' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Saldo', 1),
((SELECT id FROM categories WHERE name = 'Saldo MPS' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Saldo', 1),
((SELECT id FROM categories WHERE name = 'Saldo Intesa' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Saldo', 1),
((SELECT id FROM categories WHERE name = 'CASSA CONTANTI' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Saldo', 1);

-- ============================================================================
-- VERIFICA FINALE
-- ============================================================================

-- Conta le categorie create
SELECT 
    type_id,
    COUNT(*) as count
FROM categories 
WHERE company_id = (SELECT id FROM companies WHERE name = 'ORTI')
GROUP BY type_id
ORDER BY type_id;

-- Lista completa
SELECT 
    c.name as categoria,
    c.type_id,
    sc.name as subcategoria
FROM categories c 
JOIN subcategories sc ON c.id = sc.category_id
WHERE c.company_id = (SELECT id FROM companies WHERE name = 'ORTI')
ORDER BY c.sort_order;

-- TOTALE: 22 categorie, 22 subcategorie, 0 entries