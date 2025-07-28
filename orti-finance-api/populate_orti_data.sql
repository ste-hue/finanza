-- Popolamento Database ORTI con categorie e subcategorie base
-- Esegui DOPO aver creato lo schema con supabase_schema.sql

-- Inserimento compagnia ORTI
INSERT INTO companies (name, description) VALUES 
('ORTI', 'Gruppo ORTI - Strutture turistiche');

-- Ottieni l'ID della compagnia ORTI per i foreign keys
-- (In Supabase puoi usare questa query per ottenere l'ID)
-- SELECT id FROM companies WHERE name = 'ORTI';

-- Per questo script useremo una variabile (da sostituire con l'ID reale)
-- SOSTITUIRE 'ORTI_COMPANY_ID' con l'UUID reale della compagnia

-- === CATEGORIE ENTRATE ===
INSERT INTO categories (company_id, name, type_id, sort_order) VALUES 
((SELECT id FROM companies WHERE name = 'ORTI'), 'Entrate Hotel', 'revenue', 1),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Entrate Residence', 'revenue', 2),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Entrate CVM', 'revenue', 3),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Entrate Supermercato', 'revenue', 4),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Rientro Sospesi', 'revenue', 5),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Caparre Intur', 'revenue', 6),
((SELECT id FROM companies WHERE name = 'ORTI'), 'TOTALE ENTRATE', 'revenue', 7);

-- === CATEGORIE USCITE ===
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
((SELECT id FROM companies WHERE name = 'ORTI'), 'Deposito Fitto', 'expense', 21),
((SELECT id FROM companies WHERE name = 'ORTI'), 'TOTALE USCITE', 'expense', 22);

-- === CATEGORIE CALCOLI E SALDI ===
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

-- === SUBCATEGORIE SALARI E STIPENDI ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Salari e Stipendi'), 'SALARI', 1),
((SELECT id FROM categories WHERE name = 'Salari e Stipendi'), 'F24', 2);

-- === SUBCATEGORIE MATERIE PRIME/CONSUMO ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Materie Prime/Consumo'), 'A. MIGLIORE', 1),
((SELECT id FROM categories WHERE name = 'Materie Prime/Consumo'), 'BEVERAGE', 2),
((SELECT id FROM categories WHERE name = 'Materie Prime/Consumo'), 'MATERIALI DI CONSUMO', 3),
((SELECT id FROM categories WHERE name = 'Materie Prime/Consumo'), 'MATERIALE DI MANUTENZIONE', 4),
((SELECT id FROM categories WHERE name = 'Materie Prime/Consumo'), 'LAVANDERIA', 5);

-- === SUBCATEGORIE UTENZE ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Utenze'), 'Energia elettrica', 1),
((SELECT id FROM categories WHERE name = 'Utenze'), 'Gas', 2),
((SELECT id FROM categories WHERE name = 'Utenze'), 'Ausino', 3),
((SELECT id FROM categories WHERE name = 'Utenze'), 'Vodafone', 4),
((SELECT id FROM categories WHERE name = 'Utenze'), 'Connectivia', 5);

-- === SUBCATEGORIE COMMISSIONI PORTALI ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Commissioni Portali'), 'Commissioni Booking', 1),
((SELECT id FROM categories WHERE name = 'Commissioni Portali'), 'Commissioni Expedia', 2);

-- === SUBCATEGORIE TASSE E IMPOSTE ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Tasse e Imposte'), 'IMU', 1),
((SELECT id FROM categories WHERE name = 'Tasse e Imposte'), 'IMPOSTE', 2),
((SELECT id FROM categories WHERE name = 'Tasse e Imposte'), 'TARI HOTEL', 3),
((SELECT id FROM categories WHERE name = 'Tasse e Imposte'), 'IVA', 4),
((SELECT id FROM categories WHERE name = 'Tasse e Imposte'), 'IMPOSTA DI SOGGIORNO HP', 5),
((SELECT id FROM categories WHERE name = 'Tasse e Imposte'), 'IMPOSTA DI SOGGIORNO AR', 6),
((SELECT id FROM categories WHERE name = 'Tasse e Imposte'), 'IMPOSTA DI SOGGIORNO CVM', 7),
((SELECT id FROM categories WHERE name = 'Tasse e Imposte'), 'TARI RESIDENCE', 8),
((SELECT id FROM categories WHERE name = 'Tasse e Imposte'), 'TARI CVM', 9);

-- === SUBCATEGORIE MUTUI E FINANZIAMENTI ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Mutui e Finanziamenti'), 'Mutuo MPS', 1),
((SELECT id FROM categories WHERE name = 'Mutui e Finanziamenti'), 'Mutuo Intesa', 2);

-- === SUBCATEGORIE CANONI E SERVIZI ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Canoni e servizi'), 'Proxima Service', 1),
((SELECT id FROM categories WHERE name = 'Canoni e servizi'), 'Hoxell', 2),
((SELECT id FROM categories WHERE name = 'Canoni e servizi'), 'Sistemi (E_solver)', 3),
((SELECT id FROM categories WHERE name = 'Canoni e servizi'), 'Zucchetti', 4),
((SELECT id FROM categories WHERE name = 'Canoni e servizi'), 'Pin App', 5),
((SELECT id FROM categories WHERE name = 'Canoni e servizi'), 'Spiagge', 6),
((SELECT id FROM categories WHERE name = 'Canoni e servizi'), 'Altamira', 7),
((SELECT id FROM categories WHERE name = 'Canoni e servizi'), 'Amalfi Web', 8),
((SELECT id FROM categories WHERE name = 'Canoni e servizi'), 'Commissioni Transato Pos', 9),
((SELECT id FROM categories WHERE name = 'Canoni e servizi'), 'Software tecnology', 10),
((SELECT id FROM categories WHERE name = 'Canoni e servizi'), 'Commissioni e spese Bancarie Varie', 11),
((SELECT id FROM categories WHERE name = 'Canoni e servizi'), 'Noleggio Tesla', 12);

-- === SUBCATEGORIE GODIMENTO BENI DI TERZI ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Godimento Beni di Terzi'), 'Fitto Ramo d'' Azienda', 1),
((SELECT id FROM categories WHERE name = 'Godimento Beni di Terzi'), 'Fitto AR', 2),
((SELECT id FROM categories WHERE name = 'Godimento Beni di Terzi'), 'Fitto CVM', 3);

-- === SUBCATEGORIE CONSULENZE ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Consulenze'), 'Consulenza del lavoro', 1),
((SELECT id FROM categories WHERE name = 'Consulenze'), 'Consulenza fiscale', 2),
((SELECT id FROM categories WHERE name = 'Consulenze'), 'Consulenza legale', 3);

-- === SUBCATEGORIE VARIE ED EVENTUALI ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Varie ed Eventuali'), 'Cantiere Carotenuto?', 1);

-- === SUBCATEGORIE RISTRUTTURAZIONE APT SDP JR ===
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
((SELECT id FROM categories WHERE name = 'Ristr. Apt SDP Jr'), 'MIELE RI.BA DAL 31/05/2025', 1),
((SELECT id FROM categories WHERE name = 'Ristr. Apt SDP Jr'), 'ALESSIO', 2),
((SELECT id FROM categories WHERE name = 'Ristr. Apt SDP Jr'), 'S.T.E.', 3),
((SELECT id FROM categories WHERE name = 'Ristr. Apt SDP Jr'), 'PITTORE', 4),
((SELECT id FROM categories WHERE name = 'Ristr. Apt SDP Jr'), 'INFISSI ROMANO', 5),
((SELECT id FROM categories WHERE name = 'Ristr. Apt SDP Jr'), 'SANTELIA IMPIANTI', 6),
((SELECT id FROM categories WHERE name = 'Ristr. Apt SDP Jr'), 'NUSCO', 7),
((SELECT id FROM categories WHERE name = 'Ristr. Apt SDP Jr'), 'ARCHITETTO', 8);

-- === CONTI BANCARI ===
INSERT INTO bank_accounts (company_id, name, account_type) VALUES 
((SELECT id FROM companies WHERE name = 'ORTI'), 'Banca Sella', 'checking'),
((SELECT id FROM companies WHERE name = 'ORTI'), 'MPS', 'checking'),
((SELECT id FROM companies WHERE name = 'ORTI'), 'Intesa', 'checking');

-- === LINEE DI FINANZIAMENTO ===
INSERT INTO financing_lines (company_id, name, total_amount, maturity_months, financing_type) VALUES 
((SELECT id FROM companies WHERE name = 'ORTI'), 'Fin. MPS 60 mesi', 500000.00, 60, 'credit_line'); 