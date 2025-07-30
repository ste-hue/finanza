-- 🎯 ORTI DATABASE RISTRUTTURATO - OTTIMIZZATO PER LA GESTIONE
-- Struttura migliorata: ENTRATE (1 livello) + USCITE (2 livelli logici)
-- Elimina duplicati e organizza logicamente le categorie

-- Pulisci dati esistenti per ricominciare
-- DELETE FROM entries WHERE subcategory_id IN (SELECT id FROM subcategories WHERE category_id IN (SELECT id FROM categories WHERE company_id = (SELECT id FROM companies WHERE name = 'ORTI')));
-- DELETE FROM subcategories WHERE category_id IN (SELECT id FROM categories WHERE company_id = (SELECT id FROM companies WHERE name = 'ORTI'));
-- DELETE FROM categories WHERE company_id = (SELECT id FROM companies WHERE name = 'ORTI');

-- Inserimento compagnia ORTI (se non esiste)
INSERT INTO companies (name, description) VALUES 
('ORTI', 'Gruppo ORTI - Strutture turistiche')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 💰 ENTRATE - STRUTTURA A 1 LIVELLO (SEMPLIFICATA)
-- ============================================================================

INSERT INTO categories (company_id, name, type_id, sort_order) VALUES 
((SELECT id FROM companies WHERE name = 'ORTI'), 'Entrate Hotel', 'revenue', 1),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Entrate Residence', 'revenue', 2),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Entrate CVM', 'revenue', 3),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Entrate Supermercato', 'revenue', 4),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Rientro Sospesi', 'revenue', 5),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Caparre Intur', 'revenue', 6);

-- Subcategorie principali per entrate (una per categoria per semplicità)
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Entrate Hotel' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Main', 1),
((SELECT id FROM categories WHERE name = 'Entrate Residence' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Main', 1),
((SELECT id FROM categories WHERE name = 'Entrate CVM' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Main', 1),
((SELECT id FROM categories WHERE name = 'Entrate Supermercato' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Main', 1),
((SELECT id FROM categories WHERE name = 'Rientro Sospesi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Main', 1),
((SELECT id FROM categories WHERE name = 'Caparre Intur' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Main', 1);

-- ============================================================================
-- 💸 USCITE - STRUTTURA A 2 LIVELLI (CATEGORIA → DETTAGLIO)
-- ============================================================================

-- LIVELLO 1: MACRO-CATEGORIE USCITE
INSERT INTO categories (company_id, name, type_id, sort_order) VALUES 
((SELECT id FROM companies WHERE name = 'ORTI'), 'Salari e Stipendi', 'expense', 10),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Utenze', 'expense', 11),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Tasse e Imposte', 'expense', 12),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Commissioni Portali', 'expense', 13),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Consulenze', 'expense', 14),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Godimento Beni di Terzi', 'expense', 15),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Materie Prime e Consumo', 'expense', 16),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Mutui e Finanziamenti', 'expense', 17),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Canoni e Servizi', 'expense', 18),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Progetti Speciali', 'expense', 19),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Varie ed Eventuali', 'expense', 20);

-- LIVELLO 2: DETTAGLI PER OGNI MACRO-CATEGORIA

-- === SALARI E STIPENDI ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Salari e Stipendi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Salari Dipendenti', 1),
((SELECT id FROM categories WHERE name = 'Salari e Stipendi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Stipendi Vari', 2),
((SELECT id FROM categories WHERE name = 'Salari e Stipendi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'F24 e Contributi', 3);

-- === UTENZE ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Utenze' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Energia Elettrica', 1),
((SELECT id FROM categories WHERE name = 'Utenze' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Gas', 2),
((SELECT id FROM categories WHERE name = 'Utenze' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Ausino', 3),
((SELECT id FROM categories WHERE name = 'Utenze' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Vodafone', 4),
((SELECT id FROM categories WHERE name = 'Utenze' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Connectivia', 5);

-- === TASSE E IMPOSTE ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Tasse e Imposte' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'IMU, IMPOSTE, IVA', 1),
((SELECT id FROM categories WHERE name = 'Tasse e Imposte' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'TARI HOTEL/RESIDENCE/CVM', 2),
((SELECT id FROM categories WHERE name = 'Tasse e Imposte' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'IMPOSTA DI SOGGIORNO (HP/AR/CVM)', 3);

-- === COMMISSIONI PORTALI ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Commissioni Portali' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Commissioni Booking', 1),
((SELECT id FROM categories WHERE name = 'Commissioni Portali' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Commissioni Expedia', 2);

-- === CONSULENZE ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Consulenze' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Consulenza del Lavoro', 1),
((SELECT id FROM categories WHERE name = 'Consulenze' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Consulenza Fiscale', 2),
((SELECT id FROM categories WHERE name = 'Consulenze' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Consulenza Legale', 3);

-- === GODIMENTO BENI DI TERZI ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Godimento Beni di Terzi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Fitto Ramo d''Azienda', 1),
((SELECT id FROM categories WHERE name = 'Godimento Beni di Terzi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Fitto AR', 2),
((SELECT id FROM categories WHERE name = 'Godimento Beni di Terzi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Fitto CVM', 3);

-- === MATERIE PRIME E CONSUMO ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Materie Prime e Consumo' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'A. MIGLIORE', 1),
((SELECT id FROM categories WHERE name = 'Materie Prime e Consumo' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'BEVERAGE', 2),
((SELECT id FROM categories WHERE name = 'Materie Prime e Consumo' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'MATERIALI DI CONSUMO', 3),
((SELECT id FROM categories WHERE name = 'Materie Prime e Consumo' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'MATERIALE DI MANUTENZIONE', 4),
((SELECT id FROM categories WHERE name = 'Materie Prime e Consumo' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'LAVANDERIA', 5);

-- === MUTUI E FINANZIAMENTI ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Mutui e Finanziamenti' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Mutuo MPS', 1),
((SELECT id FROM categories WHERE name = 'Mutui e Finanziamenti' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Mutuo Intesa', 2);

-- === CANONI E SERVIZI ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Canoni e Servizi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Proxima Service', 1),
((SELECT id FROM categories WHERE name = 'Canoni e Servizi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Hoxell', 2),
((SELECT id FROM categories WHERE name = 'Canoni e Servizi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Sistemi (E_solver)', 3),
((SELECT id FROM categories WHERE name = 'Canoni e Servizi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Zucchetti', 4),
((SELECT id FROM categories WHERE name = 'Canoni e Servizi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Pin App', 5),
((SELECT id FROM categories WHERE name = 'Canoni e Servizi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Spiagge', 6),
((SELECT id FROM categories WHERE name = 'Canoni e Servizi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Altamira', 7),
((SELECT id FROM categories WHERE name = 'Canoni e Servizi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Amalfi Web', 8),
((SELECT id FROM categories WHERE name = 'Canoni e Servizi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Commissioni Transato Pos', 9),
((SELECT id FROM categories WHERE name = 'Canoni e Servizi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Software Technology', 10),
((SELECT id FROM categories WHERE name = 'Canoni e Servizi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Commissioni e Spese Bancarie Varie', 11),
((SELECT id FROM categories WHERE name = 'Canoni e Servizi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Noleggio Tesla', 12);

-- === PROGETTI SPECIALI ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Progetti Speciali' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Ristrutturazione Apt SDP Jr', 1),
((SELECT id FROM categories WHERE name = 'Progetti Speciali' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Deposito Fitto', 2);

-- Dettagli ristrutturazione (sottocategorie del progetto speciale)
-- Per semplicità, useremo le subcategories esistenti ma raggruppate sotto "Progetti Speciali"

-- === VARIE ED EVENTUALI ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Varie ed Eventuali' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Cantiere Carotenuto', 1),
((SELECT id FROM categories WHERE name = 'Varie ed Eventuali' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Altre', 2);

-- ============================================================================
-- 📊 CATEGORIE SPECIALI (CALCOLI E SALDI)
-- ============================================================================

INSERT INTO categories (company_id, name, type_id, is_calculated, sort_order) VALUES 
((SELECT id FROM companies WHERE name = 'ORTI'), 'DIFF. Entrate-Uscite', 'calculation', true, 30);

INSERT INTO categories (company_id, name, type_id, sort_order) VALUES 
((SELECT id FROM companies WHERE name = 'ORTI'), 'Saldo Banca Sella', 'balance', 31),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Saldo MPS', 'balance', 32),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Saldo Intesa', 'balance', 33),
((SELECT id FROM companies WHERE name = 'ORTI'), 'TOTALE BANCHE', 'balance', 34),
((SELECT id FROM companies WHERE name = 'ORTI'), 'CASSA CONTANTI', 'balance', 35);

INSERT INTO categories (company_id, name, type_id, is_calculated, sort_order) VALUES 
((SELECT id FROM companies WHERE name = 'ORTI'), 'CASH FLOW', 'calculation', true, 36);

INSERT INTO categories (company_id, name, type_id, sort_order) VALUES 
((SELECT id FROM companies WHERE name = 'ORTI'), 'Fin. MPS 60 mesi', 'financing', 37),
((SELECT id FROM companies WHERE name = 'ORTI'), 'TOTALE AFFIDAMENTI', 'financing', 38);

INSERT INTO categories (company_id, name, type_id, is_calculated, sort_order) VALUES 
((SELECT id FROM companies WHERE name = 'ORTI'), 'CASH FLOW CON AFFID.', 'calculation', true, 39);

-- Subcategorie per saldi (una per categoria)
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Saldo Banca Sella' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Main', 1),
((SELECT id FROM categories WHERE name = 'Saldo MPS' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Main', 1),
((SELECT id FROM categories WHERE name = 'Saldo Intesa' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Main', 1),
((SELECT id FROM categories WHERE name = 'CASSA CONTANTI' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Main', 1),
((SELECT id FROM categories WHERE name = 'Fin. MPS 60 mesi' AND company_id = (SELECT id FROM companies WHERE name = 'ORTI')), 'Main', 1);

-- ============================================================================
-- 🏦 CONTI BANCARI E FINANZIAMENTI
-- ============================================================================

INSERT INTO bank_accounts (company_id, name, account_type) VALUES 
((SELECT id FROM companies WHERE name = 'ORTI'), 'Banca Sella', 'checking'),
((SELECT id FROM companies WHERE name = 'ORTI'), 'MPS', 'checking'),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Intesa', 'checking')
ON CONFLICT DO NOTHING;

INSERT INTO financing_lines (company_id, name, total_amount, maturity_months, financing_type) VALUES 
((SELECT id FROM companies WHERE name = 'ORTI'), 'Fin. MPS 60 mesi', 500000.00, 60, 'credit_line')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 🎯 RISULTATO FINALE
-- ============================================================================
-- 
-- STRUTTURA OTTIMIZZATA OTTENUTA:
--
-- 💰 ENTRATE (1 livello - semplice):
--   ├── Entrate Hotel
--   ├── Entrate Residence  
--   ├── Entrate CVM
--   ├── Entrate Supermercato
--   ├── Rientro Sospesi
--   └── Caparre Intur
--
-- 💸 USCITE (2 livelli - organizzate logicamente):
--   ├── Salari e Stipendi
--   │   ├── Salari Dipendenti
--   │   ├── Stipendi Vari
--   │   └── F24 e Contributi
--   ├── Utenze
--   │   ├── Energia Elettrica
--   │   ├── Gas
--   │   ├── Ausino
--   │   ├── Vodafone
--   │   └── Connectivia
--   ├── Tasse e Imposte
--   │   ├── IMU, IMPOSTE, IVA
--   │   ├── TARI HOTEL/RESIDENCE/CVM
--   │   └── IMPOSTA DI SOGGIORNO (HP/AR/CVM)
--   ├── Commissioni Portali
--   │   ├── Commissioni Booking
--   │   └── Commissioni Expedia
--   ├── Consulenze
--   │   ├── Consulenza del Lavoro
--   │   ├── Consulenza Fiscale
--   │   └── Consulenza Legale
--   ├── Godimento Beni di Terzi
--   │   ├── Fitto Ramo d'Azienda
--   │   ├── Fitto AR
--   │   └── Fitto CVM
--   ├── Materie Prime e Consumo
--   │   ├── A. MIGLIORE
--   │   ├── BEVERAGE
--   │   ├── MATERIALI DI CONSUMO
--   │   ├── MATERIALE DI MANUTENZIONE
--   │   └── LAVANDERIA
--   ├── Mutui e Finanziamenti
--   │   ├── Mutuo MPS
--   │   └── Mutuo Intesa
--   ├── Canoni e Servizi
--   │   ├── Proxima Service
--   │   ├── Hoxell
--   │   ├── Sistemi (E_solver)
--   │   ├── Zucchetti
--   │   ├── Pin App
--   │   ├── Spiagge
--   │   ├── Altamira
--   │   ├── Amalfi Web
--   │   ├── Commissioni Transato Pos
--   │   ├── Software Technology
--   │   ├── Commissioni e Spese Bancarie Varie
--   │   └── Noleggio Tesla
--   ├── Progetti Speciali
--   │   ├── Ristrutturazione Apt SDP Jr
--   │   └── Deposito Fitto
--   └── Varie ed Eventuali
--       ├── Cantiere Carotenuto
--       └── Altre
--
-- ✅ VANTAGGI:
-- - Struttura logica e pulita
-- - Entrate semplificate (un solo livello)
-- - Uscite ben organizzate (2 livelli)  
-- - Eliminati i duplicati
-- - Compatibile con backend esistente
-- - Pronta per separazione consolidati/previsionali