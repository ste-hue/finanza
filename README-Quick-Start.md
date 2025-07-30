# 🚀 ORTI Finance - Quick Start

## ⚡ COMANDI RAPIDI

### 🟢 Avvio Sistema Completo
```bash
./start-orti.sh
```
**Avvia:**
- 🔧 Backend API su `http://localhost:8000`
- 🎨 Frontend React su `http://localhost:8080`

### 🔴 Stop Sistema
```bash
./stop-orti.sh
```
**Ferma tutti i processi**

### 🧪 Test Rapido
```bash
# Test Backend
curl http://localhost:8000

# Test Frontend
open http://localhost:8080
```

---

## 📍 ACCESSI RAPIDI

| Servizio | URL | Descrizione |
|----------|-----|-------------|
| **🎨 Frontend** | http://localhost:8080 | App React principale |
| **🔧 Backend API** | http://localhost:8000 | API FastAPI |
| **⚡ CRUD Demo** | http://localhost:8080 → "Real-time CRUD Demo" | Test editing dati |
| **📊 API Status** | http://localhost:8000/status | Info API endpoints |

---

## 🎯 FUNZIONALITÀ PRINCIPALI

### ✅ CRUD Completo
- **CREATE**: Nuove entries finanziarie
- **READ**: Visualizzazione dati con filtri
- **UPDATE**: Modifica valori esistenti  
- **DELETE**: Eliminazione entries

### 📊 Tipi di Dati
- **✅ Consolidato**: Dati reali verificati (verde)
- **🔮 Previsionale**: Stime e proiezioni (arancione)
- **⚖️ Varianza**: Confronto Consolidato vs Previsionale

### 🏗️ Struttura Database
- **22 Categorie**: 7 Entrate + 12 Uscite + 3 Banche
- **Entries**: Dati mensili per categoria
- **Real-time**: Sync automatico Frontend ↔ Backend

---

## 🧪 TESTING

### Test API Completo
```bash
./test_crud_complete.sh
```

### Test Import Dati
```bash
curl -X POST "http://localhost:8000/api/companies/ORTI/bulk-import" \
  -H "Content-Type: application/json" \
  -d @quick_import_example.json
```

### Test HTML Semplice
```bash
open test_frontend_api.html
```

---

## 🔧 DEVELOPMENT

### Logs in Tempo Reale
```bash
# Backend logs
tail -f orti-finance-api/server.log

# Frontend con hot reload già attivo
```

### Database Status
```bash
# Via MCP Supabase tools
curl http://localhost:8000/status
```

---

## 🚨 TROUBLESHOOTING

### Porte Occupate
```bash
# Check porte
lsof -i :8000  # Backend
lsof -i :8080  # Frontend

# Force kill
./stop-orti.sh
```

### Reset Database
```bash
curl -X POST "http://localhost:8000/cleanup"
curl -X POST "http://localhost:8000/import/historical-complete"
```

### Errori Comuni
- **401 Unauthorized**: Usa API Backend invece di Supabase diretto
- **Connection refused**: Avvia con `./start-orti.sh`
- **Port in use**: Ferma con `./stop-orti.sh` prima

---

## 📚 FILES IMPORTANTI

```
📁 finanza/
├── 🚀 start-orti.sh          # Avvio sistema
├── 🛑 stop-orti.sh           # Stop sistema  
├── 🧪 test_crud_complete.sh  # Test completo
├── 📊 quick_import_example.json # Esempio import
├── 🏗️ orti-finance-api/      # Backend FastAPI
└── 🎨 orti-finance-compass/   # Frontend React
```

---

## 🎯 NEXT STEPS

1. **Vai su http://localhost:8080**
2. **Click "⚡ Real-time CRUD Demo"**
3. **Testa editing valori**
4. **Osserva sync automatico**

**Il sistema è pronto per l'uso! 🚀**