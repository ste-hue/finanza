-- Schema Database ORTI Finance per Supabase - VERSIONE SEMPLIFICATA
-- 4 tabelle essenziali per iniziare rapidamente

-- 1. Companies (ORTI + future aziende)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Categories (Entrate Hotel, Salari e Stipendi, etc.)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category_type VARCHAR(20) NOT NULL CHECK (category_type IN ('revenue', 'expense', 'balance', 'financing')),
    is_total BOOLEAN DEFAULT FALSE,
    is_calculated BOOLEAN DEFAULT FALSE,
    parent_id UUID REFERENCES categories(id), -- Per subcategorie come "SALARI" sotto "Salari e Stipendi"
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Monthly Entries (valori mensili per ogni categoria/subcategoria)
CREATE TABLE entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    value DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_projection BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, year, month)
);

-- 4. Bank Accounts & Financing (semplificato in una tabella)
CREATE TABLE financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('bank', 'financing')),
    current_balance DECIMAL(15,2) DEFAULT 0,
    credit_limit DECIMAL(15,2) DEFAULT 0, -- Per affidamenti
    interest_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici essenziali
CREATE INDEX idx_entries_category_date ON entries(category_id, year, month);
CREATE INDEX idx_categories_company ON categories(company_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- View semplificata per export e report
CREATE VIEW company_data_view AS
SELECT 
    c.name as company_name,
    cat.name as category_name,
    cat.category_type,
    parent.name as parent_category,
    e.year,
    e.month,
    e.value,
    e.is_projection,
    e.notes
FROM companies c
JOIN categories cat ON c.id = cat.company_id
LEFT JOIN categories parent ON cat.parent_id = parent.id
LEFT JOIN entries e ON cat.id = e.category_id
ORDER BY c.name, cat.sort_order, e.year, e.month;

-- Trigger per updated_at automatico
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entries_updated_at 
    BEFORE UPDATE ON entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_accounts_updated_at 
    BEFORE UPDATE ON financial_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 