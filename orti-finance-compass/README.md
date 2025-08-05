# 🏢 ORTI Finance Compass - Sistema Multi-Compagnia

Sistema di gestione finanziaria avanzato per multiple compagnie con supporto completo per dati separati, consolidamento mensile e analisi avanzate.

## 🎯 **Panoramica del Sistema**

ORTI Finance Compass è un dashboard finanziario completo che supporta la gestione di **multiple compagnie** con:
- **Dati completamente separati** per ogni compagnia
- **Selettore dinamico** delle compagnie
- **Consolidamento mensile** per compagnia
- **Amministrazione** categorie e sottocategorie
- **Import/Export** dati per compagnia
- **Analisi varianze** e proiezioni

---

## 🚀 **Funzionalità Principali**

### 🏢 **Multi-Compagnia**
- ✅ **Selettore dinamico** nel titolo principale
- ✅ **Aggiunta nuove compagnie** tramite dropdown
- ✅ **Dati isolati** - ogni compagnia ha le sue categorie e dati
- ✅ **Cambio compagnia real-time** - tutte le pagine si aggiornano

### 📊 **Dashboard Finanziario**
- ✅ **Vista consolidata/previsionale/combinata**
- ✅ **Editing inline** dei valori
- ✅ **Drag & drop** per riordinare categorie
- ✅ **Totali automatici** e calcoli in tempo reale
- ✅ **Design responsive** desktop/mobile

### ⚙️ **Amministrazione**
- ✅ **Gestione categorie** per compagnia
- ✅ **Sottocategorie dinamiche**
- ✅ **CRUD completo** (Create, Read, Update, Delete)
- ✅ **Ordinamento** categorie

### 📈 **Consolidamento**
- ✅ **Consolidamento mensile** per compagnia
- ✅ **Analisi varianze** previsto vs. reale
- ✅ **Storico events** consolidamento
- ✅ **Backfill proiezioni** automatico

### 📁 **Import/Export**
- ✅ **Export Excel** filtrato per compagnia
- ✅ **Import dati** da Excel
- ✅ **Validazione** automatica importazioni

---

## 🛠 **Architettura Tecnica**

### **Frontend Stack**
- **React 18** + **TypeScript**
- **Vite** per build e dev server
- **Shadcn/UI** + **Tailwind CSS** per styling
- **Recharts** per grafici
- **DnD Kit** per drag & drop

### **Backend Stack**
- **Supabase** (PostgreSQL + Auth + Realtime)
- **Row Level Security (RLS)** per sicurezza
- **Edge Functions** per elaborazioni avanzate

### **Hooks Personalizzati**
- `useSupabaseFinance(year, companyName)` - Hook principale per dati finanziari
- `useConsolidation()` - Gestione consolidamento mensile
- `useAuth()` - Autenticazione utenti

---

## 🗄️ **Schema Database**

### **Tabelle Principali**

```sql
-- Compagnie
companies (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE,
  description TEXT,
  created_at TIMESTAMP
)

-- Categorie per compagnia
categories (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name TEXT,
  type_id TEXT ('revenue'|'expense'|'balance'),
  sort_order INTEGER,
  is_calculated BOOLEAN
)

-- Sottocategorie
subcategories (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES categories(id),
  name TEXT,
  sort_order INTEGER
)

-- Entries finanziarie
entries (
  id UUID PRIMARY KEY,
  subcategory_id UUID REFERENCES subcategories(id),
  year INTEGER,
  month INTEGER,
  value DECIMAL,
  is_projection BOOLEAN, -- false=consolidato, true=previsionale
  notes TEXT
)
```

### **Separazione Dati**
Ogni compagnia ha:
- **Categorie proprie** (ORTI: Hotel/CVM/Residence, INTUR: Servizi Turistici/Trasporti)
- **Entries isolate** tramite foreign key cascade
- **Consolidamenti indipendenti**

---

## 🎮 **Come Usare il Sistema**

### **1. Selezionare Compagnia**
1. Clicca su **"ORTI Finance"** nel titolo (alto sinistra)
2. Seleziona compagnia esistente o **"Aggiungi Compagnia"**
3. Tutte le pagine si aggiornano automaticamente

### **2. Dashboard Principale**
- **Visualizza/Modifica** dati finanziari
- **Cambia vista**: Consolidato, Previsionale, Tutti
- **Editing inline**: Clicca su cella → modifica → Enter
- **Selettore anno**: [2024] **2025** [2026]

### **3. Pagina Admin**
- **Gestisci categorie** della compagnia corrente
- **Aggiungi/Rimuovi** categorie e sottocategorie
- **Riordina** tramite frecce su/giù

### **4. Consolidamento**
- **Consolida mesi** per compagnia corrente
- **Analizza varianze** previsto vs. reale
- **Storico consolidamenti** con dettagli

---

## 💻 **Setup Sviluppo**

### **Prerequisiti**
- Node.js 18+
- Account Supabase
- Git

### **Installazione**
```bash
# Clone repository
git clone <repository-url>
cd orti-finance-compass

# Installa dipendenze
npm install

# Setup ambiente
cp .env.example .env.local
# Configura VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# Avvia sviluppo
npm run dev
```

### **Build Produzione**
```bash
npm run build
npm run preview
```

---

## 🔧 **Configurazione Supabase**

### **Environment Variables**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### **Politiche RLS**
```sql
-- Esempio policy per entries
CREATE POLICY "Users can view entries" ON entries 
FOR SELECT USING (true);

CREATE POLICY "Users can insert entries" ON entries 
FOR INSERT WITH CHECK (true);
```

---

## 📱 **Design Responsive**

### **Desktop** (>768px)
- Layout completo con sidebar
- Tabelle full-width
- Tutte le funzionalità visibili

### **Mobile** (≤768px)
- **Cards compatte** per categorie
- **Bottom navigation**
- **Swipe gestures** per navigazione
- **Modal compatti** per editing

---

## 🎨 **Sistema Colori**

### **Colori Finanziari**
- 🟢 **Verde**: Entrate/Ricavi (`text-green-400`, `text-green-700`)
- 🔴 **Rosso**: Uscite/Costi (`text-red-400`, `text-red-700`)
- 🟣 **Viola**: Saldi Bancari (`text-purple-400`, `text-purple-700`)

### **Stati UI**
- 🔵 **Blu**: Compagnia selezionata, pulsanti primari
- ⚫ **Grigio**: Modalità dark, testi secondari
- 🟡 **Giallo**: Warning, attenzioni

---

## 🔍 **Funzioni Avanzate**

### **Calcoli Automatici**
```typescript
// Vista-specific calculations
switch (viewMode) {
  case 'consolidated': return categoryData.consolidated
  case 'projections': return categoryData.projections  
  case 'combined': return consolidated + projections
}
```

### **Real-time Updates**
```typescript
// Supabase subscription per aggiornamenti real-time
const subscription = supabase
  .channel('entries-changes')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'entries' 
  }, loadData)
  .subscribe()
```

### **Ottimizzazioni Performance**
- ✅ **Memoizzazione** calcoli costosi
- ✅ **useCallback** per event handlers
- ✅ **Lazy loading** componenti pesanti
- ✅ **Debouncing** per input frequenti

---

## 🐛 **Debugging & Troubleshooting**

### **Problemi Comuni**

**1. Dati non salvano**
- Verifica che `selectedCompany` sia passato correttamente
- Controlla console per errori di validazione
- Verifica policies RLS Supabase

**2. Cambio compagnia non funziona**
- Hook `useSupabaseFinance` deve ricevere `companyName`
- Verifica dipendenze `useCallback`
- Reload pagina se necessario

**3. Errori di build**
- Verifica TypeScript types
- Controlla import mancanti
- Pulisci cache: `rm -rf node_modules/.vite`

### **Debug Console**
```typescript
// Enable debug mode
localStorage.setItem('DEBUG', 'finance:*')

// Console logs per tracking
console.log('💾 Saving entry:', entryData)
console.log('🔄 Loading data for company:', companyName)
```

---

## 🚀 **Roadmap Future**

### **V2.0 - Funzionalità Avanzate**
- [ ] **Dashboard grafici** con Recharts
- [ ] **Previsioni AI** basate su storico
- [ ] **Multi-currency** support
- [ ] **Reportistica PDF** automatica
- [ ] **API REST** per integrazioni

### **V2.1 - UX Miglioramenti**
- [ ] **Bulk editing** multiple celle
- [ ] **Template** categorie predefinite
- [ ] **Temi** personalizzabili
- [ ] **Shortcuts** tastiera

### **V2.2 - Enterprise**
- [ ] **Multi-tenant** completo
- [ ] **Audit logs** modifiche
- [ ] **Backup** automatici
- [ ] **SSO** integrazione

---

## 👥 **Team & Contributi**

### **Sviluppato da**
- **Development**: AI Assistant + User
- **Architecture**: Multi-company system
- **Database**: Supabase PostgreSQL
- **UI/UX**: Shadcn/UI + Tailwind

### **Come Contribuire**
1. Fork del repository
2. Feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Pull Request

---

## 📄 **Licenza**

Questo progetto è rilasciato sotto licenza MIT. Vedi il file `LICENSE` per dettagli.

---

## 📞 **Supporto**

Per supporto tecnico o domande:
- 📧 **Email**: [inserire email]
- 💬 **Issues**: GitHub Issues
- 📖 **Docs**: Questo README

---

**🎉 ORTI Finance Compass - La soluzione completa per la gestione finanziaria multi-compagnia!**

*Ultimo aggiornamento: Gennaio 2025*