# 🚀 **SUPABASE EDGE FUNCTIONS - Guida Completa**

## 📋 **Panoramica**

Le **Edge Functions** sono serverless functions che girano sui server edge di Supabase, permettendo:

- **⚡ Calcoli complessi** server-side (evitando overhead client)
- **🔐 Operazioni sicure** con accesso diretto al database
- **🌍 Bassa latenza** grazie alla distribuzione geografica
- **📊 Elaborazioni batch** e import massivi

---

## 🏗️ **Architettura Integrata**

```
React Frontend (Zen Interface)
    ↓
📅 Calendario CRUD → Supabase Client → Database
📊 Analytics Tab → Edge Functions → Database  
🔮 Proiezioni → AI/ML Models (future)
📤 Dati → Import/Export Tools
```

---

## 🧠 **Edge Functions Implementate**

### **1. 🌊 Previsioni Stagionali**
```typescript
calculateSeasonalForecast(year: 2025, category: 'Entrate Hotel')
```
- **Input**: Anno + Categoria
- **Output**: Pattern stagionale + previsioni mensili
- **Algoritmo**: Media mobile su ultimi 3 anni
- **Confidenza**: Basata su quantità dati storici

### **2. 💰 Analisi ROI**
```typescript
calculateROI(investment: 50000, period: 12, category: 'Entrate Hotel')
```
- **Input**: Investimento + Periodo + Categoria target
- **Output**: ROI%, Payback period, Valutazione positiva/negativa
- **Calcolo**: ((Revenue - Investment) / Investment) * 100

### **3. 📋 Import Massivo**
```typescript
bulkImport(entries: EntryData[])
```
- **Input**: Array di voci finanziarie
- **Output**: Report successi/errori + dettagli
- **Validazione**: Controllo categorie + UUID resolution
- **Transazioni**: Atomiche per ogni voce

### **4. 📄 Generazione Report**
```typescript  
generateReport(year: 2025, format: 'json'|'pdf')
```
- **Input**: Anno + Formato
- **Output**: Report completo aggregato
- **Dati**: Totali, breakdown mensile, categorie
- **Formati**: JSON (implementato), PDF (placeholder)

### **5. 📊 Confronto Multi-Anno**
```typescript
compareYears(years: [2023, 2024, 2025])
```
- **Input**: Lista anni da confrontare
- **Output**: Performance + identificazione miglior anno
- **Metriche**: Revenues, Expenses, Profit, Margin%

---

## 🚀 **Come Usare dall'Interfaccia**

### **📅 Tab Calendario**
- **CRUD diretto** su celle del calendario
- **Click su cella** → modalità edit → Enter per salvare
- **Real-time sync** automatico

### **📊 Tab Analytics** 
- **Pannello Edge Functions** integrato
- **4 sezioni**: Previsioni, ROI, Report, Confronti
- **Form intuitivi** + risultati in tempo reale
- **Toast notifications** per feedback

---

## ⚙️ **Deployment Edge Functions**

### **1. Setup Supabase CLI**
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref udeavsfewakatewsphfw
```

### **2. Deploy Edge Function**
```bash
# Deploy the calfin-analysis function
supabase functions deploy calfin-analysis --project-ref udeavsfewakatewsphfw

# Verify deployment
supabase functions list
```

### **3. Test Edge Function**
```bash
# Test locally
supabase functions serve

# Test deployed function
curl -X POST 'https://udeavsfewakatewsphfw.supabase.co/functions/v1/calfin-analysis' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"action": "seasonal_forecast", "data": {"year": 2025, "category": "Entrate Hotel"}}'
```

---

## 🔧 **Configurazione Ambiente**

### **Environment Variables**
Le Edge Functions accedono automaticamente a:
- `SUPABASE_URL`: URL del progetto
- `SUPABASE_ANON_KEY`: Chiave anonima  
- `SUPABASE_SERVICE_ROLE_KEY`: Chiave admin (se necessario)

### **Permissions**
- **Row Level Security**: Abilitata per sicurezza
- **Authentication**: Tramite Authorization header
- **Database Access**: Via client Supabase interno

---

## 📊 **Esempi Pratici**

### **Frontend Call (React)**
```typescript
import { useEdgeFunctions } from '@/hooks/useEdgeFunctions'

const { calculateSeasonalForecast } = useEdgeFunctions()

// Calcola previsioni per Entrate Hotel 2025
const forecast = await calculateSeasonalForecast(2025, 'Entrate Hotel')

console.log('Confidenza:', forecast.confidence)
console.log('Previsioni:', forecast.forecast)
```

### **Raw HTTP Call**
```javascript
const response = await fetch('/functions/v1/calfin-analysis', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'roi_analysis',
    data: { investment: 50000, period: 12, category: 'Entrate Hotel' }  
  })
})

const result = await response.json()
```

---

## 🎯 **Use Cases Ideali**

### **✅ Perfetto per Edge Functions**
- **Calcoli pesanti** (algoritmi complessi, ML)
- **Import batch** (migliaia di record)
- **Report generation** (aggregazioni complesse)
- **Validazioni business** (regole complesse)
- **Integrazioni esterne** (API terze parti)

### **❌ Meglio Client-Side**
- **CRUD semplici** (insert/update singolo)
- **Real-time updates** (subscriptions)
- **UI interactions** (validazioni form)
- **Navigazione** (routing, state management)

---

## 🔍 **Monitoring & Debug**

### **Logs Supabase**
```bash
# View function logs
supabase functions logs calfin-analysis

# Real-time logs
supabase functions logs calfin-analysis --tail
```

### **Error Handling**
- **Try-catch** su ogni operazione
- **HTTP status codes** appropriati (400, 500)
- **Structured errors** con timestamp
- **Client notifications** via toast

---

## 🚀 **Estensioni Future**

### **🤖 AI Integration**
- **Sequential Thinking** MCP per analisi avanzate
- **ML Models** per forecasting accurato
- **NLP** per interpretazione dati

### **📊 Advanced Analytics**
- **Cohort analysis** per retention clienti
- **Seasonal decomposition** statistica
- **Monte Carlo** simulations per rischi

### **🔗 External APIs**
- **Banking APIs** per sync automatico
- **Accounting software** integration
- **Business intelligence** connectors

---

**🎉 Le Edge Functions sono ora integrate e pronte per l'uso nell'interfaccia zen di ORTI Finance!**

Dashboard disponibile su: **http://localhost:8080** → Tab Analytics 📊