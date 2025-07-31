# 🚀 ORTI Finance - Sistema Gestione Finanziaria v3.0

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/orti-finance/releases)
[![Status](https://img.shields.io/badge/status-production_ready-green.svg)](http://localhost:8080)
[![API](https://img.shields.io/badge/API-active-success.svg)](http://localhost:8000)

**Sistema unificato per la pianificazione e analisi finanziaria della società turistica ORTI, semplificato per massima stabilità e chiarezza.**

---

## ⚡ Quick Start & Setup

Segui questi passaggi per avere il sistema funzionante in 5 minuti.

### **1. Configura le tue credenziali Supabase**

Crea un file `.env` nella root del progetto copiando da `.env.example`:

```bash
cp .env.example .env
```

Apri il file `.env` e inserisci le tue credenziali Supabase. Questo funziona sia per **Supabase Cloud** (consigliato per usare tool come MCP) che per un'istanza **Docker locale**.

```dotenv
# File: .env
# Inserisci qui le tue credenziali Supabase
SUPABASE_URL="https://tuo-progetto.supabase.co"
SUPABASE_ANON_KEY="tua_anon_key_pubblica"
DATABASE_URL="postgresql://postgres:[LA-TUA-PASSWORD]@db.tuo-progetto.supabase.co:5432/postgres"
```

### **2. Setup e Avvio**

Usa lo script unificato `./orti` per gestire tutto il ciclo di vita dell'applicazione.

```bash
# Rendi lo script eseguibile (solo la prima volta)
chmod +x ./orti

# Installa le dipendenze di backend e frontend
./orti setup

# Resetta il database con la struttura e i dati corretti (idempotente)
./orti db:reset

# Avvia l'intero sistema!
./orti start
```

**🎯 Sistema pronto! Vai su: http://localhost:8080**

---

## 🎮 Comandi Principali

Tutte le operazioni sono gestite tramite lo script `./orti`.

| **Comando**      | **Descrizione**                                                              |
|------------------|------------------------------------------------------------------------------|
| `./orti start`   | 🚀 **Avvia tutto** (Backend API su porta 8000 + Frontend su porta 8080).    |
| `./orti stop`    | 🛑 **Ferma tutto**, terminando i processi di backend e frontend.            |
| `./orti status`  | 📊 **Controlla lo stato** dei servizi e dei processi attivi.                |
| `./orti test`    | 🧪 **Esegue un test CRUD** di base per verificare la connessione all'API.   |
| `./orti db:reset`| 🔄 **Pulisce e ripopola il database** ORTI con la struttura dati ottimizzata.|
| `./orti setup`   | 🔧 **Installa/aggiorna le dipendenze** (`requirements.txt` e `node_modules`).|

---

## 🏗️ Architettura Semplificata

Per risolvere problemi di stabilità e sincronizzazione, l'architettura è stata chiarificata:

`🎨 Frontend (React) → 🔧 Backend (FastAPI) → 🗃️ Database (Supabase)`

- **Flusso Dati Chiaro**: Il frontend comunica **esclusivamente** con il backend FastAPI. Il backend gestisce tutta la logica di business e l'interazione con Supabase.
- **Sincronizzazione Dati**: Le funzionalità "real-time" sono gestite in modo robusto. Dopo ogni operazione di modifica (creazione, aggiornamento, cancellazione), il frontend **ricarica automaticamente i dati aggiornati** dal backend. Questo approccio, noto come *fetch-after-mutation*, garantisce che la UI rifletta sempre lo stato reale del database, eliminando le inconsistenze precedenti.
- **Niente Polling**: È stato rimosso il polling inefficiente. La UI si aggiorna solo quando necessario.

### **Stack Tecnologico**

- 🎨 **Frontend**: React + TypeScript + Vite + Tailwind CSS
- 🔧 **Backend**: Python 3.11 + FastAPI + Pydantic
- 🗃️ **Database**: Supabase (PostgreSQL)
- 🚀 **Gestione**: Script `./orti` unificato

---

## 🎯 Obiettivi e Funzionalità Core

- ✅ **Aggregazione** entrate e uscite multi-anno.
- 🔄 **Distinzione netta** tra dati **Consolidati** (`is_projection=false`) e **Previsionali** (`is_projection=true`).
- ⚖️ **Calcolo Varianza** automatico tra previsioni e dati reali.
- 📈 **Dashboard strategiche** per analisi di business.

---

## 🔧 Troubleshooting

- **Errore "Port in use"**:
  ```bash
  ./orti stop && ./orti start
  ```
- **Dati non sincronizzati o errati**:
  ```bash
  ./orti db:reset
  ```
- **Errore di connessione al database**:
  1. Verifica che il file `.env` contenga le credenziali corrette.
  2. Assicurati che la tua istanza Supabase (cloud o locale) sia in esecuzione.
  3. Controlla le policy RLS (Row Level Security) sul tuo database Supabase.

---

## 📞 Documentazione API

- **Documentazione Interattiva**: http://localhost:8000/docs
- **Schema OpenAPI**: http://localhost:8000/openapi.json