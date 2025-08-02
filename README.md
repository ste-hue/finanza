
# 🚀 ORTI Finance Compass - Cursor Rules e README Ottimizzati

## 📁 Struttura Cursor Rules Proposta

```
.cursor/rules/
├── mcp-workflow.mdc          # Workflow MCP-first principale
├── sequential-thinking.mdc    # Regole per pensiero sequenziale
├── supabase-operations.mdc   # Operazioni Supabase standard
├── financial-logic.mdc       # Logica business finanziaria
├── performance.mdc           # Ottimizzazioni e best practices
├── database/
│   ├── migrations.mdc        # Gestione migrazioni
│   ├── queries.mdc          # Pattern query ottimizzate
│   └── integrity.mdc        # Validazione integrità dati
├── frontend/
│   ├── react-patterns.mdc   # Pattern React/TypeScript
│   ├── hooks.mdc            # Custom hooks Supabase
│   └── ui-components.mdc    # Componenti UI/UX
└── edge-functions/
    ├── deployment.mdc       # Deploy e test
    └── calfin-analysis.mdc  # Logica analisi finanziaria
```

## 📝 Cursor Rules Ottimizzate

### `.cursor/rules/mcp-workflow.mdc`

```markdown
---
description: MCP-First Development Workflow for ORTI Finance
alwaysApply: true
---

# MCP-First Development Protocol

## Workflow Initialization
ALWAYS start new features with:
1. `list_tables` - Understand current schema
2. `execute_sql "SELECT * FROM {table} LIMIT 5"` - Explore data structure
3. Sequential Thinking MCP for complex features
4. `create_branch "feature/{name}"` - Isolated development

## Data Exploration Pattern
Before ANY code implementation:
```sql
-- Step 1: Schema understanding
execute_sql "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'"

-- Step 2: Data sampling
execute_sql "SELECT * FROM {table} ORDER BY created_at DESC LIMIT 10"

-- Step 3: Data integrity check
execute_sql "SELECT COUNT(*), COUNT(DISTINCT id) FROM {table}"
```

## Type Generation Workflow

```bash
# Generate types before coding
generate_typescript_type "entries"
generate_typescript_type "categories"
generate_typescript_type "monthly_totals"
```

## Deployment Checklist

1. `list_branches` - Verify current branch
2. `execute_sql` - Test data integrity
3. `get_logs` - Check for errors
4. `merge_branch "main"` - Deploy to production
5. `deploy_edge_function` - Update functions

```

### `.cursor/rules/sequential-thinking.mdc`
```markdown
---
description: Sequential Thinking for Complex Financial Features
globs: ["**/*.tsx", "**/*.ts"]
---

# Sequential Thinking Protocol

## Complex Feature Breakdown
When implementing features involving:
- Multiple database tables
- Financial calculations
- State management
- Real-time updates

USE Sequential Thinking MCP:
1. Break down the problem into atomic steps
2. Let the LLM build reasoning chains
3. Validate each step before proceeding
4. Document the thought process

## Example Pattern
```

THOUGHT 1: "Need to calculate monthly projections"
→ THOUGHT 2: "Must differentiate current/consolidated/projection months"
→ THOUGHT 3: "Require entries table JOIN with categories"
→ THOUGHT 4: "Need to handle is_projection field correctly"
→ IMPLEMENTATION: Based on complete thought chain

```

## Integration Points
- Before complex SQL queries
- Before state management decisions
- When designing new hooks
- For performance optimization strategies
```

### `.cursor/rules/financial-logic.mdc`

```markdown
---
description: Financial Business Logic Rules
globs: ["**/finance/**", "**/hooks/useSupabaseFinance.ts"]
---

# Financial Data Integrity Rules

## Month Status Logic
```typescript
// CRITICAL: Month status depends on data, not just dates
const getMonthStatus = (month: MonthData): MonthStatus => {
  const currentDate = new Date();
  const monthDate = new Date(month.year, month.month - 1);
  
  if (isSameMonth(monthDate, currentDate)) return 'current';
  if (monthDate > currentDate) return 'projections';
  
  // Past month - check for projections
  const hasProjections = month.entries.some(e => e.is_projection);
  return hasProjections ? 'current' : 'consolidated';
};
```

## Validation Queries

Before ANY financial calculation:

```sql
-- Verify data integrity
execute_sql "
  SELECT 
    year, month, is_projection,
    COUNT(*) as entry_count,
    SUM(CASE WHEN type = 'revenue' THEN value ELSE 0 END) as total_revenue,
    SUM(CASE WHEN type = 'expense' THEN value ELSE 0 END) as total_expenses
  FROM entries
  GROUP BY year, month, is_projection
  ORDER BY year DESC, month DESC
"
```

## Category Ordering

ALWAYS maintain sort_order consistency:

```sql
-- After reordering
execute_sql "
  UPDATE categories 
  SET sort_order = CASE id
    WHEN $1 THEN $2
    WHEN $3 THEN $4
    -- ... more cases
  END
  WHERE id IN ($1, $3, ...)
"
```

```

### `.cursor/rules/performance.mdc`
```markdown
---
description: Performance Optimization Patterns
alwaysApply: true
---

# Performance First Development

## Query Optimization
```sql
-- PREFER: Specific columns with indexes
execute_sql "
  SELECT id, name, value, is_projection 
  FROM entries 
  WHERE year = $1 AND month = $2
  ORDER BY created_at DESC
"

-- AVOID: SELECT * without limits
```

## React Optimization Checklist

* [ ] UseMemo for expensive calculations
* [ ] UseCallback for event handlers
* [ ] React.memo for static components
* [ ] Proper dependency arrays
* [ ] Debounce user inputs
* [ ] Virtualize long lists

## Supabase Real-time Pattern

```typescript
// Optimized subscription
const subscription = supabase
  .channel('entries-changes')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'entries',
      filter: `year=eq.${currentYear}` // Filter at DB level
    }, 
    handleChange
  )
  .subscribe()
```

## Cache Strategy

* Cache static data (categories) in React Query
* Use optimistic updates for better UX
* Implement stale-while-revalidate pattern
* Clear cache on significant changes

```

## 📋 README.md Ottimizzato

```markdown
# ORTI Finance Compass - Development Guide

## 🚀 Quick Start con MCP

### Setup Iniziale
```bash
# 1. Verifica connessione Supabase
execute_sql "SELECT current_database()"

# 2. Esplora schema
list_tables

# 3. Genera types TypeScript
generate_typescript_type "entries"
generate_typescript_type "categories"
```

### 🔄 Development Flow Standard

#### 1. Nuova Feature

```bash
# Crea branch
create_branch "feature/monthly-analysis"

# Esplora dati esistenti
execute_sql "SELECT DISTINCT year, month FROM entries ORDER BY year DESC, month DESC LIMIT 12"

# Sviluppa con Sequential Thinking
# [Il sistema guiderà attraverso il ragionamento step-by-step]
```

#### 2. Test e Validazione

```bash
# Verifica integrità dati
execute_sql "
  SELECT 
    COUNT(*) as total_entries,
    SUM(CASE WHEN is_projection THEN 1 ELSE 0 END) as projections,
    SUM(CASE WHEN value IS NULL THEN 1 ELSE 0 END) as null_values
  FROM entries
"

# Controlla logs
get_logs

# Test edge function locale
# [Implementa logica in locale prima del deploy]
```

#### 3. Deploy

```bash
# Merge alla main
merge_branch "main"

# Deploy edge functions
deploy_edge_function "calfin-analysis"

# Verifica production
get_project_url
```

## 🧠 Sequential Thinking Examples

### Esempio: Implementare Proiezioni Mensili

```
STEP 1: "Analizzare struttura dati attuali"
→ execute_sql "SELECT * FROM entries WHERE is_projection = true LIMIT 5"

STEP 2: "Identificare pattern calcolo"
→ "Le proiezioni usano media ultimi 3 mesi"

STEP 3: "Considerare edge cases"
→ "Gestire mesi senza dati storici"

STEP 4: "Design hook React"
→ "useProjections con memoizzazione"

STEP 5: "Implementare con error handling"
→ [Codice generato basato su reasoning completo]
```

## 🛠️ Troubleshooting Comune

### Problema: Dati inconsistenti

```bash
# Diagnostica
execute_sql "
  SELECT year, month, is_projection, COUNT(*), SUM(value)
  FROM entries
  GROUP BY year, month, is_projection
  HAVING COUNT(*) > 0
  ORDER BY year DESC, month DESC
"

# Fix comuni
execute_sql "UPDATE entries SET is_projection = false WHERE year < EXTRACT(YEAR FROM CURRENT_DATE)"
```

### Problema: Performance lenta

```bash
# Analizza query
execute_sql "EXPLAIN ANALYZE [your slow query]"

# Verifica indici
execute_sql "
  SELECT indexname, indexdef 
  FROM pg_indexes 
  WHERE tablename = 'entries'
"
```

## 📚 Best Practices

### MCP-First Development

1. **MAI** scrivere SQL direttamente nel codice senza prima testarlo con MCP
2. **SEMPRE** usare `generate_typescript_type` per type safety
3. **SEMPRE** validare dati con `execute_sql` prima di implementare logica

### Sequential Thinking

1. Usa per features che coinvolgono 3+ tabelle
2. Usa per logica finanziaria complessa
3. Usa per ottimizzazioni performance
4. Documenta il reasoning nel codice

### Testing Flow

```bash
# 1. Unit test con dati reali
execute_sql "SELECT * FROM entries WHERE [test condition]"

# 2. Integration test
# Testa hooks con dati di esempio

# 3. E2E test
# Verifica UI con proiezioni real-time
```

## 🔐 Security Checklist

* [ ] RLS policies attive
* [ ] Input validation su tutti i form
* [ ] No dati sensibili nei logs
* [ ] API keys in variabili ambiente
* [ ] HTTPS su tutti gli endpoint

## 📈 Performance Metrics

Target da mantenere:

* Query database: < 100ms
* Render React: < 16ms
* Time to Interactive: < 3s
* Bundle size: < 200KB gzipped

Monitora con:

```bash
get_logs
# Analizza query lente e ottimizza
```

## 🤝 Contributing

1. Segui MCP-first workflow
2. Usa Sequential Thinking per features complesse
3. Documenta reasoning nel codice
4. Testa con dati reali production
5. Ottimizza performance prima del merge

---

 **Remember** : MCP comanda, Sequential Thinking ragiona, React visualizza! 🚀

```

## 🎯 Implementazione Consigliata

1. **Fase 1**: Crea le Cursor Rules nella struttura proposta
2. **Fase 2**: Testa il workflow con una feature semplice
3. **Fase 3**: Affina le rules basandoti sui pattern emergenti
4. **Fase 4**: Documenta casi d'uso specifici nel README
5. **Fase 5**: Crea snippets per operazioni comuni

Questo setup massimizza l'efficienza combinando:
- 🔧 MCP per operazioni dirette
- 🧠 Sequential Thinking per complessità
- ⚡ Cursor Rules per automazione
- 📚 Documentazione per onboarding rapido
```
