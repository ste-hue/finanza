# Scripts per ORTI Finance Compass

## 🚀 Setup

### 1. Installa le dipendenze Python
```bash
pip install -r requirements.txt
```

### 2. Configura le credenziali Supabase
```bash
export SUPABASE_KEY='tua-api-key'
```

## 📊 Import Dati da Excel

### Uso base:
```bash
python import_financial_data.py
```

### Con file specifico:
```bash
python import_financial_data.py "Piano Finanziario Jul 24 2025.xlsx"
```

## 🗄️ Aggiungi Categorie Mancanti

Esegui lo script SQL in Supabase:
```bash
# Vai nella dashboard Supabase > SQL Editor
# Copia e incolla il contenuto di add-missing-categories.sql
# Esegui la query
```

## 📝 Note Importanti

1. **Backup**: Fai sempre un backup dei dati prima di eseguire import massivi
2. **Categorie**: Assicurati che tutte le categorie esistano nel DB prima dell'import
3. **Excel Format**: Il file Excel deve avere:
   - Sheet chiamato "Piano Finanziario"
   - Una riga con i nomi dei mesi
   - Prima colonna con i nomi delle categorie
4. **Proiezioni**: I dati da luglio 2025 in poi sono marcati come proiezioni

## 🔧 Troubleshooting

### Errore "Company 'ORTI' non trovata"
Assicurati che la company ORTI esista nel database.

### Errore "Categoria non trovata"
Esegui prima lo script SQL `add-missing-categories.sql`.

### Errore di autenticazione
Verifica che la SUPABASE_KEY sia corretta e abbia i permessi necessari.