# 🎨 STRATEGIA UX: Consolidato vs Previsionale

## 🎯 PROBLEMA DA RISOLVERE
- ❌ Evitare che l'utente veda totali che sommano "Consolidato + Previsionale" 
- ✅ Differenziare chiaramente i due tipi di dati
- 🔍 Permettere filtri intuitivi per vedere solo quello che serve

## 🎨 VISUAL DESIGN SYSTEM

### **1. 🌈 COLOR CODING**
```typescript
const DATA_THEME = {
  consolidated: {
    primary: '#10B981', // Verde (dati reali/verificari)
    background: '#ECFDF5',
    border: '#A7F3D0',
    icon: '✅',
    label: 'Consolidato'
  },
  projection: {
    primary: '#F59E0B', // Arancione (stime/previsioni)
    background: '#FFFBEB', 
    border: '#FDE68A',
    icon: '🔮',
    label: 'Previsionale'
  },
  variance: {
    positive: '#10B981', // Verde per varianze positive 
    negative: '#EF4444', // Rosso per varianze negative
    neutral: '#6B7280'   // Grigio per zero
  }
}
```

### **2. 📊 DASHBOARD LAYOUT**
```
┌─────────────────────────────────────────────────────────────┐
│  🎛️ CONTROLLI FILTRO                                         │
│  ○ Mostra Solo Consolidato  ○ Solo Previsionale  ○ Entrambi │
│  ○ View: Separata          ○ View: Affiancata                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────┬─────────────────────────┐
│  ✅ CONSOLIDATO (Reale) │  🔮 PREVISIONALE (Stima)│
│  🟢 Totale: €1,234,567  │  🟠 Totale: €1,456,789  │
│                         │                         │
│  📈 Entrate Hotel       │  📈 Entrate Hotel       │
│  Gennaio: €15,420       │  Luglio: €802,060       │
│  Febbraio: €22,850      │  Agosto: €884,990       │
│                         │                         │
│  📉 Salari              │  📉 Salari              │
│  Dicembre: -€45,000     │  Luglio: -€95,000       │
└─────────────────────────┴─────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ⚖️ ANALISI VARIANZA (Solo per periodi sovrapposti)        │
│  📊 Marzo 2025: Consolidato vs Previsionale                │
│  Entrate Hotel: €45,000 vs €42,000 = +€3,000 🟢          │
└─────────────────────────────────────────────────────────────┘
```

### **3. 🏷️ BADGE SYSTEM**
```typescript  
// Componente Badge per ogni entry
<Badge variant={entry.is_projection ? 'projection' : 'consolidated'}>
  {entry.is_projection ? '🔮 Previsionale' : '✅ Consolidato'}
</Badge>

// Totali separati sempre
<TotalCard type="consolidated">
  <Icon>✅</Icon>
  <Label>Totale Consolidato</Label>
  <Value color="green">€1,234,567</Value>
</TotalCard>

<TotalCard type="projection">
  <Icon>🔮</Icon>
  <Label>Totale Previsionale</Label>
  <Value color="orange">€1,456,789</Value>
</TotalCard>
```

### **4. 📅 TIMELINE VIEW**
```
2024        2025        2026
├──────────┼──────────┼──────────┤
✅✅✅✅✅    ✅✅🔮🔮🔮    🔮🔮🔮🔮🔮
Gen Feb Mar Apr Mag   Gen Feb Mar Apr Mag

📊 Legenda:
✅ = Dati Consolidati (reali)
🔮 = Dati Previsionali (stime)
```

## 🎛️ CONTROLLI UTENTE

### **1. TOGGLE FILTERS**
```typescript
const [viewMode, setViewMode] = useState<'separated' | 'combined' | 'consolidated' | 'projection'>('separated');

// UI Controls
<ToggleGroup value={viewMode} onValueChange={setViewMode}>
  <ToggleGroupItem value="consolidated">Solo Consolidato ✅</ToggleGroupItem>
  <ToggleGroupItem value="projection">Solo Previsionale 🔮</ToggleGroupItem>
  <ToggleGroupItem value="separated">Separati</ToggleGroupItem>
  <ToggleGroupItem value="combined">Varianza ⚖️</ToggleGroupItem>
</ToggleGroup>
```

### **2. WARNING SYSTEM**
```typescript
// ⚠️ Warning quando si tenta di sommare consolidato + previsionale
{showingBothTypes && (
  <Alert variant="warning">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Attenzione!</AlertTitle>
    <AlertDescription>
      Stai visualizzando insieme dati <strong>Consolidati</strong> e <strong>Previsionali</strong>. 
      I totali mostrati sono separati per evitare somme errate.
    </AlertDescription>
  </Alert>
)}
```

## 🚀 IMPLEMENTAZIONE FRONTEND

### **Componenti da creare:**
1. `<DataTypeToggle />` - Filtri per tipo dati
2. `<ConsolidatedCard />` - Card per dati consolidati  
3. `<ProjectionCard />` - Card per dati previsionali
4. `<VarianceAnalysis />` - Componente per analisi scostamenti
5. `<TimelineView />` - Vista temporale con colori differenziati

### **Hook personalizzato:**
```typescript
const useFinancialData = (filters: FilterOptions) => {
  const [consolidated, setConsolidated] = useState([]);
  const [projections, setProjections] = useState([]);
  const [variance, setVariance] = useState([]);
  
  // Logica per separare i dati e calcolare varianze
  return { consolidated, projections, variance, totals };
}
```

## ✅ RISULTATI ATTESI
- 🚫 **Mai più totali errati** (consolidato + previsionale)
- 🎯 **Chiarezza immediata** del tipo di dato visualizzato
- 🔍 **Filtri intuitivi** per analisi mirate
- ⚖️ **Analisi varianza** per controllo stime vs realtà