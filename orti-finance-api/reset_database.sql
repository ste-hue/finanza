-- 🎯 ORTI FINANCE - SCRIPT DI RESET UNIFICATO v3.0
-- Pulisce e ripopola il database per la company 'ORTI' in un colpo solo.
-- Questo script è idempotente e sicuro da eseguire più volte.

BEGIN;

-- ============================================================================
-- PASSO 1: PULIZIA COMPLETA DEI DATI ESISTENTI PER 'ORTI'
-- ============================================================================

-- Assicura che la compagnia ORTI esista, altrimenti la crea.
INSERT INTO companies (name, description) VALUES ('ORTI', 'Gruppo ORTI - Strutture turistiche') ON CONFLICT (name) DO NOTHING;

-- Trova l'ID della compagnia ORTI
DO $$
DECLARE
  orti_company_id UUID;
BEGIN
  SELECT id INTO orti_company_id FROM companies WHERE name = 'ORTI';

  -- Elimina le entries
  DELETE FROM entries WHERE subcategory_id IN (
      SELECT sc.id FROM subcategories sc
      JOIN categories c ON sc.category_id = c.id
      WHERE c.company_id = orti_company_id
  );

  -- Elimina le subcategories
  DELETE FROM subcategories WHERE category_id IN (
      SELECT id FROM categories WHERE company_id = orti_company_id
  );

  -- Elimina le categories
  DELETE FROM categories WHERE company_id = orti_company_id;

-- ============================================================================
-- PASSO 2: RICOSTRUZIONE DELLA STRUTTURA OTTIMIZZATA
-- ============================================================================

-- 💰 ENTRATE (Struttura semplice a 1 livello)
INSERT INTO categories (company_id, name, type_id, sort_order) VALUES
(orti_company_id, 'Entrate Hotel', 'revenue', 1),
(orti_company_id, 'Entrate Residence', 'revenue', 2),
(orti_company_id, 'Entrate CVM', 'revenue', 3),
(orti_company_id, 'Entrate Supermercato', 'revenue', 4),
(orti_company_id, 'Rientro Sospesi', 'revenue', 5),
(orti_company_id, 'Caparre Intur', 'revenue', 6);

-- 💸 USCITE (Struttura logica a 2 livelli)
INSERT INTO categories (company_id, name, type_id, sort_order) VALUES
(orti_company_id, 'Salari e Stipendi', 'expense', 10),
(orti_company_id, 'Utenze', 'expense', 11),
(orti_company_id, 'Tasse e Imposte', 'expense', 12),
(orti_company_id, 'Commissioni Portali', 'expense', 13),
(orti_company_id, 'Consulenze', 'expense', 14),
(orti_company_id, 'Godimento Beni di Terzi', 'expense', 15),
(orti_company_id, 'Materie Prime e Consumo', 'expense', 16),
(orti_company_id, 'Mutui e Finanziamenti', 'expense', 17),
(orti_company_id, 'Canoni e Servizi', 'expense', 18),
(orti_company_id, 'Progetti Speciali', 'expense', 19),
(orti_company_id, 'Varie ed Eventuali', 'expense', 20);

-- 🏦 CONTI BANCARI E SALDI
INSERT INTO categories (company_id, name, type_id, sort_order) VALUES
(orti_company_id, 'Saldo MPS', 'balance', 31),
(orti_company_id, 'Saldo Intesa', 'balance', 32),
(orti_company_id, 'CASSA CONTANTI', 'balance', 33);

-- ============================================================================
-- PASSO 3: INSERIMENTO DELLE SUBCATEGORIE
-- ============================================================================

-- Subcategorie per ENTRATE (una subcategoria 'Main' per semplicità)
INSERT INTO subcategories (category_id, name, sort_order)
SELECT id, 'Main', 1 FROM categories WHERE company_id = orti_company_id AND type_id = 'revenue';

-- Subcategorie per SALDI
INSERT INTO subcategories (category_id, name, sort_order)
SELECT id, 'Saldo', 1 FROM categories WHERE company_id = orti_company_id AND type_id = 'balance';

-- Subcategorie dettagliate per USCITE
INSERT INTO subcategories (category_id, name, sort_order) VALUES
((SELECT id FROM categories WHERE name = 'Salari e Stipendi' AND company_id=orti_company_id), 'Salari Dipendenti', 1),
((SELECT id FROM categories WHERE name = 'Salari e Stipendi' AND company_id=orti_company_id), 'Stipendi Vari', 2),
((SELECT id FROM categories WHERE name = 'Salari e Stipendi' AND company_id=orti_company_id), 'F24 e Contributi', 3),
((SELECT id FROM categories WHERE name = 'Utenze' AND company_id=orti_company_id), 'Energia Elettrica', 1),
((SELECT id FROM categories WHERE name = 'Utenze' AND company_id=orti_company_id), 'Gas', 2),
((SELECT id FROM categories WHERE name = 'Utenze' AND company_id=orti_company_id), 'Ausino', 3),
((SELECT id FROM categories WHERE name = 'Tasse e Imposte' AND company_id=orti_company_id), 'IMU, IMPOSTE, IVA', 1),
((SELECT id FROM categories WHERE name = 'Tasse e Imposte' AND company_id=orti_company_id), 'TARI (Hotel/Res/CVM)', 2),
((SELECT id FROM categories WHERE name = 'Tasse e Imposte' AND company_id=orti_company_id), 'Imposta di Soggiorno', 3),
((SELECT id FROM categories WHERE name = 'Commissioni Portali' AND company_id=orti_company_id), 'Commissioni Booking', 1),
((SELECT id FROM categories WHERE name = 'Commissioni Portali' AND company_id=orti_company_id), 'Commissioni Expedia', 2),
((SELECT id FROM categories WHERE name = 'Consulenze' AND company_id=orti_company_id), 'Consulenza del Lavoro', 1),
((SELECT id FROM categories WHERE name = 'Consulenze' AND company_id=orti_company_id), 'Consulenza Fiscale', 2),
((SELECT id FROM categories WHERE name = 'Godimento Beni di Terzi' AND company_id=orti_company_id), 'Fitto Ramo d''Azienda', 1),
((SELECT id FROM categories WHERE name = 'Godimento Beni di Terzi' AND company_id=orti_company_id), 'Fitto AR/CVM', 2),
((SELECT id FROM categories WHERE name = 'Materie Prime e Consumo' AND company_id=orti_company_id), 'Forniture Alimentari', 1),
((SELECT id FROM categories WHERE name = 'Materie Prime e Consumo' AND company_id=orti_company_id), 'Materiali Consumo/Manutenzione', 2),
((SELECT id FROM categories WHERE name = 'Materie Prime e Consumo' AND company_id=orti_company_id), 'Lavanderia', 3),
((SELECT id FROM categories WHERE name = 'Mutui e Finanziamenti' AND company_id=orti_company_id), 'Mutuo MPS', 1),
((SELECT id FROM categories WHERE name = 'Mutui e Finanziamenti' AND company_id=orti_company_id), 'Mutuo Intesa', 2),
((SELECT id FROM categories WHERE name = 'Canoni e Servizi' AND company_id=orti_company_id), 'Software e Gestionali', 1),
((SELECT id FROM categories WHERE name = 'Canoni e Servizi' AND company_id=orti_company_id), 'Commissioni Bancarie/POS', 2),
((SELECT id FROM categories WHERE name = 'Canoni e Servizi' AND company_id=orti_company_id), 'Servizi Web e Marketing', 3),
((SELECT id FROM categories WHERE name = 'Canoni e Servizi' AND company_id=orti_company_id), 'Altri Canoni (Noleggi, etc)', 4),
((SELECT id FROM categories WHERE name = 'Progetti Speciali' AND company_id=orti_company_id), 'Ristrutturazione Apt SDP Jr', 1),
((SELECT id FROM categories WHERE name = 'Progetti Speciali' AND company_id=orti_company_id), 'Deposito Fitto', 2),
((SELECT id FROM categories WHERE name = 'Varie ed Eventuali' AND company_id=orti_company_id), 'Spese Varie', 1);

END $$;
COMMIT;
