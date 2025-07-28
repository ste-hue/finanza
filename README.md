# 🏢 ORTI Finance System

Sistema finanziario completo per la gestione multi-azienda con export personalizzati e analisi avanzate.

## 📁 Struttura Progetto

```
finanza/
├── orti-finance-compass/     # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/       # Componenti UI
│   │   ├── hooks/           # Custom hooks
│   │   ├── types/           # Definizioni TypeScript
│   │   └── pages/           # Pagine applicazione
│   └── package.json
├── orti-finance-api/        # Backend FastAPI + Python
│   ├── main.py             # API principale
│   ├── venv/               # Ambiente virtuale
│   └── requirements.txt
└── README.md
```

## 🚀 Avvio Rapido

### Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- **Virtualenvwrapper** configurato

### 1. Backend API (Terminal 1)

```bash
cd finanza/orti-finance-api
workon hotelops_env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend React (Terminal 2)

```bash
cd finanza/orti-finance-compass
npm install
npm run dev
```

### 3. Accesso Applicazione

- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs
- **API Health**: http://localhost:8000/health

## ✨ Funzionalità

### 🎯 **Frontend (React + TypeScript)**

- ✅ **Dashboard Multi-Azienda** - Gestione illimitata aziende
- ✅ **Calendario Finanziario** - Vista mensile entrate/uscite
- ✅ **Analytics Avanzate** - Grafici e proiezioni
- ✅ **UI Zen Design** - Interfaccia moderna e pulita
- ✅ **Import/Export** - Gestione dati ORTI
- ✅ **Local Storage** - Persistenza dati offline

### 🔧 **Backend (FastAPI + Python)**

- ✅ **Export Excel** - Proiezioni finanziarie formattate
- ✅ **CORS Configurato** - Integrazione sicura con React
- ✅ **API RESTful** - Endpoint standardizzati
- ✅ **Documentazione Auto** - Swagger UI integrata
- ✅ **Health Checks** - Monitoraggio sistema

## 🛠️ Tecnologie

### Frontend Stack

- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool veloce
- **Tailwind CSS** - Styling utility-first
- **shadcn/ui** - Componenti enterprise
- **TanStack Query** - Data fetching & caching
- **React Hook Form + Zod** - Form validation

### Backend Stack

- **FastAPI** - Framework API moderno
- **Pandas** - Data manipulation
- **OpenPyXL** - Excel generation
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation

## 📊 API Endpoints

### GET `/export/previsioni`

Genera e scarica file Excel con proiezioni finanziarie

**Response**: File `.xlsx` con:

- Proiezioni mensili Entrate/Uscite/Saldo
- Formattazione professionale
- Header personalizzato ORTI SRL
- Nome file con timestamp

**Esempio Frontend:**

```typescript
const downloadExcel = async () => {
  const response = await fetch("http://localhost:8000/export/previsioni");
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "proiezioni.xlsx";
  a.click();
};
```

## 🔄 Workflow Sviluppo

### 1. **Data Validation & API** (FOCUS ATTUALE)

- [X] Backend FastAPI base
- [X] Export Excel endpoint
- [X] CORS configurazione
- [ ] Zod schemas frontend
- [ ] Error handling robusto
- [ ] Validation API payload

### 2. **Prossimi Step**

- [ ] Endpoint per import dati JSON ORTI
- [ ] API per CRUD aziende/transazioni
- [ ] Autenticazione e sicurezza
- [ ] Database persistente (SQLite/PostgreSQL)
- [ ] Test automatizzati
- [ ] Docker deployment

## 🚨 Note Importanti

### Ambiente di Sviluppo

- **Backend**: Usa `hotelops_env` (virtualenvwrapper)
- **Frontend**: Vite dev server porta 5173
- **API**: FastAPI porta 8000
- **CORS**: Configurato per localhost:5173

### Dati

- **Frontend**: Local Storage browser
- **Backend**: In-memory (per ora)
- **Export**: Excel generato dinamicamente

## 🔧 Troubleshooting

### Backend non parte

```bash
# Verifica ambiente
workon hotelops_env
pip list | grep fastapi

# Se mancano dipendenze
pip install fastapi uvicorn pandas openpyxl
```

### Frontend errori TypeScript

```bash
# Reinstalla dipendenze
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors

Verifica che:

- Backend su porta 8000
- Frontend su porta 5173
- CORS configurato per `http://localhost:5173`

---

**Sviluppato per**: ORTI SRL
**Versione**: 1.0.0
**Team**: Full-Stack TypeScript + Python
**Contatto**: Sistema finanziario multi-azienda enterprise
