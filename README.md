# 🏢 ORTI Finance Dashboard

Sistema completo di gestione finanziaria per ORTI con supporto multi-azienda, dashboard in tempo reale e sistema di previsioni vs. reali.

## 📊 **STATO CORRENTE (29 Luglio 2025)**

### ✅ **FUNZIONALITÀ IMPLEMENTATE**

- **Dashboard Multi-Tab** con architettura moderna (Dashboard, Previsioni, Analytics, Dati)
- **Calcoli Finanziari Corretti**: Entrate €2.786.743, Uscite €2.694.314, Risultato Netto €92.428
- **Sistema Predicted vs. Actual** con campo `is_projection` per tracking delle previsioni
- **Integrazione Supabase** completa con API layer robusto
- **UI Zen Design** con animazioni e glassmorphism
- **Entry Edit Dialog** per modificare valori previsti/reali
- **Calcoli Mensili Dinamici** con differenze corrette

### 🎯 **PROSSIMO STEP: STRUTTURA GERARCHICA COLLASSABILE**

**OBIETTIVO**: Trasformare la vista flat attuale in struttura ad albero:

```
💸 USCITE
▼ Salari e Stipendi     [602.104€]    ← LIVELLO 1 (collassabile)
  ├─ SALARI            [329.052€]     ← LIVELLO 2 (collassabile)
  ├─ F24               [145.000€]     ← LIVELLO 2 (collassabile)
  └─ Salari e Stipendi [128.052€]     ← LIVELLO 2 (collassabile)

▼ Utenze               [209.071€]     ← LIVELLO 1 (collassabile)
  ├─ Energia elettrica [xxx€]         ← LIVELLO 2
  ├─ Gas               [xxx€]         ← LIVELLO 2
  └─ Vodafone          [xxx€]         ← LIVELLO 2

💰 ENTRATE
▼ Entrate Hotel        [2.248.850€]   ← LIVELLO 1 (collassabile)
  ├─ Booking.com       [xxx€]         ← LIVELLO 2 (se disponibile)
  └─ Diretti           [xxx€]         ← LIVELLO 2 (se disponibile)
```

## 📁 **ARCHITETTURA PROGETTO**

```
finanza/
├── orti-finance-compass/           # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── FinancialApp.tsx       # Container principale multi-tab
│   │   │   ├── ZenFinancialDashboard.tsx  # Dashboard finanziario
│   │   │   ├── EntryEditDialog.tsx    # Dialog per edit valori
│   │   │   └── ui/                    # shadcn/ui components
│   │   ├── hooks/
│   │   │   ├── useFinCalSupabase.ts   # Hook gestione Supabase
│   │   │   └── useFinCal.ts           # Hook legacy (da deprecated)
│   │   ├── lib/
│   │   │   ├── financeApi.ts          # API layer per Supabase
│   │   │   ├── financeService.ts      # Service layer 
│   │   │   └── supabase.ts            # Client e types Supabase
│   │   └── types/
│   │       └── fincal.ts              # Type definitions
│   └── package.json
├── orti-finance-api/               # Scripts Python per gestione dati
│   ├── unified_orti_finance.py        # Script import Excel → Supabase
│   ├── import_2024_2026_data.py       # Import dati 2024-2026
│   └── supabase_schema.sql            # Schema database
└── Piano Finanziario Jul 24 2025.xlsx  # Source Excel di riferimento
```

## 🗄️ **DATABASE SUPABASE**

### **Schema Gerarchico**

```sql
companies: ORTI + future aziende
├── categories: Categorie principali (Salari e Stipendi, Utenze, etc.)
│   └── subcategories: Sottocategorie (SALARI, Gas, etc.)
│       └── entries: Valori mensili con is_projection flag
```

### **Tabelle Principali**

- **`companies`**: Aziende (ORTI attualmente)
- **`categories`**: Categorie padre (12 principali per uscite, 6 per entrate)
- **`subcategories`**: Sottocategorie figlie
- **`entries`**: Valori mensili con `is_projection` per predicted/actual

## 🚀 **TECNOLOGIE**

### **Frontend**

- **React 18** + **TypeScript** + **Vite**
- **shadcn/ui** + **Radix UI** per componenti
- **Tailwind CSS** per styling
- **Supabase Client** per database

### **Backend**

- **Supabase** (PostgreSQL managed)
- **Python Scripts** per import/export Excel
- **FastAPI** (legacy, da rimuovere)

### **Styling & UX**

- **Zen Design System** con animazioni fluide
- **Glassmorphism** e gradienti
- **Responsive Design** ottimizzato
- Animazioni CSS: `zen-fade-in`, `zen-slide-up`, `zen-breathe`

## 🔧 **SETUP & AVVIO**

### **1. Supabase Setup**

```bash
# Configurare le variabili d'ambiente
cp .env.example .env.local
# Aggiungere SUPABASE_URL e SUPABASE_ANON_KEY
```

### **2. Frontend**

```bash
cd orti-finance-compass
npm install
npm run dev    # http://localhost:8080 (o 8081/8082 se occupato)
```

### **3. Import Dati**

```bash
cd orti-finance-api
python unified_orti_finance.py    # Import Excel → Supabase
```

## 🐛 **PROBLEMI RISOLTI**

### **✅ Calcoli Totali Duplicati**

- **Problema**: Due chiamate API duplicate a `getFinancialData()`
- **Soluzione**: Calcolo locale dei totali da singola chiamata API

### **✅ Differenze sempre 0€**

- **Problema**: Mapping errato `revenue` → `revenues` nei totali
- **Soluzione**: Mapping corretto nei calcoli mensili

### **✅ Query Supabase 400 Error**

- **Problema**: Deep nested join ordering non supportato
- **Soluzione**: Client-side sorting per `categoryType` e `month`

### **✅ Struttura Excel Mismatch**

- **Problema**: Hardcoded categories non matching Excel
- **Soluzione**: Struttura dinamica basata su database

## 📈 **DATI ATTUALI (2025)**

- **Entrate Totali**: €2.786.743 (Lug-Dic principalmente)
- **Uscite Totali**: €2.694.314 (distribuite 12 mesi)
- **Risultato Netto**: €92.428 positivo
- **Cash Flow Medio**: €223.878/mese

## 🎯 **ROADMAP IMMEDIATA**

### **1. Struttura Gerarchica (PRIORITÀ ALTA)**

- [ ] Implementare collapsing/expanding per categorie
- [ ] 3 livelli per uscite, 2 livelli per entrate
- [ ] State management per expanded/collapsed
- [ ] Animazioni smooth per transizioni

### **2. Predicted vs. Actual System**

- [ ] UI per distinguere visivamente predicted vs actual
- [ ] Workflow per aggiornare predictions → actual values
- [ ] Variance tracking e alerts

### **3. Multi-Tab Completamento**

- [ ] Tab "Previsioni": forecast engine
- [ ] Tab "Analytics": grafici e trend
- [ ] Tab "Dati": import/export tools

### **4. Performance & UX**

- [ ] Lazy loading per grandi dataset
- [ ] Caching intelligente
- [ ] Mobile responsiveness ottimizzata

## 🔗 **URL & ACCESSI**

- **App**: http://localhost:8080/
- **Supabase Dashboard**: [supabase.com](https://supabase.com)
- **Excel Source**: `Piano Finanziario Jul 24 2025.xlsx`

---

**📝 Last Updated**: 29 Luglio 2025
**🚀 Status**: Development Ready
**👨‍💻 Next Session**: Implementazione struttura gerarchica collassabile
