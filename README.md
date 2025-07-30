# 🏢 ORTI Finance System - Unified Monorepo

Sistema di gestione finanziaria completo per ORTI con architettura unificata.

## 📁 Struttura del Progetto

```
finanza-orti/
├── backend/                  # 🔧 FastAPI Server
│   ├── main.py              # API endpoints (unified)
│   ├── supabase_service.py  # Database service
│   ├── config.py            # Configuration
│   └── requirements.txt     # Python dependencies
├── frontend/                 # ⚛️ React Dashboard  
│   ├── src/
│   │   ├── components/
│   │   │   ├── SimpleFinanceApp.tsx       # 🎯 Main unified component
│   │   │   └── HierarchicalFinanceTree.tsx # 🌳 Tree view component
│   │   └── hooks/
│   │       └── useFinanceAPI.ts           # 🔗 Unified API hook
│   ├── package.json         # Node dependencies
│   └── vite.config.ts       # Build config
├── data/                     # 📊 Data Files
│   └── Piano Finanziario Jul 24 2025.xlsx
├── docs/                     # 📚 Documentation
└── docker-compose.yml       # 🐳 Full stack deployment
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Full Stack (Docker)

```bash
docker-compose up -d
```

## 🎯 Sistema Unificato

### 🔗 API Endpoints (3 essenziali)

- `GET /hierarchy` - Struttura gerarchica completa
- `POST /import` - Import dati da JSON
- `PUT /entry` - Update singola voce

### ⚛️ Frontend Architecture

- **1 Hook**: `useFinanceAPI` - gestisce tutto
- **1 Component**: `SimpleFinanceApp` - interfaccia principale
- **Tree View**: Collassabile Entrate/Uscite gerarchiche

### 📊 Data Flow

```
Excel → JSON → API → Supabase → React → UI
```

## 🛠️ Development

### Backend

```bash
cd backend
python main.py  # Start API server
```

### Frontend

```bash
cd frontend  
npm run dev     # Start dev server
npm run build   # Production build
```

### Database

- Supabase: Structured hierarchy (companies → categories → subcategories → entries)
- Schema: `backend/supabase_schema.sql`

## 📈 Features

- ✅ **Hierarchical Structure**: 3-level finance tree ⭐ **COMPLETATO**
- ✅ **Collapsible Categories**: Interactive expand/collapse with chevrons
- ✅ **Smart Middleware**: Transforms flat DB data into hierarchical UI
- ✅ **Auto-Expand**: Main categories open automatically on load
- ✅ **Real-time Editing**: Click to edit values
- ✅ **Global Controls**: "Espandi Tutto" / "Collassa Tutto" buttons
- ✅ **Visual Indentation**: Clear parent-child relationships
- ✅ **Automatic Totals**: Parent categories calculate from children
- ✅ **JSON Import/Export**: Standard data format
- ✅ **Responsive UI**: Desktop optimized
- ✅ **Cache System**: Performance optimized

## 🎉 **FEATURE COMPLETED: Dashboard Gerarchico**

**29 Luglio 2025**: Implementazione completa della struttura gerarchica collassabile!

### 🌳 **Struttura Finale**

```
💸 USCITE
▼ Canoni e servizi     [totale automatico]    ← Collassabile
  ├─ Proxima Service   [valore reale]         ← Indentato
  ├─ Hoxell           [valore reale]         ← Indentato  
  ├─ Altamira         [valore reale]         ← Indentato
  └─ +9 altri servizi...

▼ Ristr. Apt SDP Jr   [totale automatico]    ← Collassabile
  ├─ MIELE RI.BA      [valore reale]         ← Indentato
  ├─ ALESSIO          [valore reale]         ← Indentato
  └─ +6 altri lavori...

💰 ENTRATE
▼ Entrate Hotel       [647.289€ lug]         ← Valori reali
▼ Entrate Residence   [84.911€ lug]          ← Valori reali
▼ Entrate CVM         [44.241€ lug]          ← Valori reali
```

### 🎛️ **Controlli Interattivi**

- **Chevron Click**: `▼`/`▶` per espandere/collassare singole categorie
- **Pulsanti Globali**: "Espandi Tutto" & "Collassa Tutto"
- **Auto-Espansione**: Categorie principali aperte all'avvio
- **Indentazione Visiva**: 24px per livello per chiarezza massima

## 🔧 Configuration

### Environment Variables

```bash
# Backend (.env)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key

# Frontend (.env.local)  
VITE_API_URL=http://localhost:8000
```

## 📚 Documentation

- **API Docs**: `http://localhost:8000/docs` (FastAPI auto-generated)
- **Project Docs**: `docs/README.md`
- **Data Format**: JSON structure documented in code

## 🏆 Architecture Benefits

- **Single Repository**: Unified versioning and deployment
- **Clear Separation**: Backend/Frontend with descriptive names
- **Simplified Communication**: Direct API calls, no complex abstractions
- **Maintainable**: 3 endpoints, 1 hook, 1 main component
- **Scalable**: Easy to extend and modify

---

**Created with ❤️ for ORTI Finance Management**
