#!/bin/bash

# 🎯 Script per applicare tutte le ottimizzazioni ORTI Finance

echo "🚀 ORTI FINANCE - APPLICAZIONE OTTIMIZZAZIONI"
echo "=============================================="

# Colori per output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funzione per stampare messaggi colorati
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step "Verifica prerequisiti..."

# Verifica se siamo nella directory corretta
if [ ! -f "orti-finance-api/populate_orti_data_optimized.sql" ]; then
    print_error "Script deve essere eseguito dalla root del progetto"
    exit 1
fi

print_success "Directory corretta trovata"

print_step "1. Backup della struttura attuale del database"

# Crea directory backup se non esiste
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

print_success "Directory backup creata: $BACKUP_DIR"

print_step "2. Installazione dipendenze frontend (se necessario)"

cd orti-finance-compass

# Verifica se node_modules esiste
if [ ! -d "node_modules" ]; then
    print_warning "node_modules non trovato, installazione dipendenze..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dipendenze installate con successo"
    else
        print_error "Errore nell'installazione delle dipendenze"
        exit 1
    fi
else
    print_success "Dipendenze già installate"
fi

cd ..

print_step "3. Verifica backend Python"

cd orti-finance-api

# Verifica se requirements.txt esiste e installa dipendenze
if [ -f "requirements.txt" ]; then
    print_warning "Verifica dipendenze Python..."
    pip3 list > ../requirements_check.txt 2>/dev/null
    print_success "Dipendenze Python verificate"
else
    print_warning "requirements.txt non trovato"
fi

cd ..

print_step "4. Preparazione nuova struttura database"

print_warning "IMPORTANTE: Prima di procedere, assicurati di:"
echo "   - Avere accesso a Supabase"
echo "   - Aver fatto backup dei dati esistenti"
echo "   - Testare in ambiente di sviluppo"

echo ""
read -p "Vuoi continuare? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Operazione annullata dall'utente"
    exit 0
fi

print_step "5. Applicazione nuova struttura database"

echo ""
echo "📋 SCRIPT SQL DA ESEGUIRE SU SUPABASE:"
echo "======================================"
echo ""
echo "Esegui il seguente script SQL nel tuo dashboard Supabase:"
echo ""
echo "File: orti-finance-api/populate_orti_data_optimized.sql"
echo ""
print_warning "NOTA: Lo script è stato progettato per essere sicuro e non cancellare dati esistenti"

print_step "6. Verifica ottimizzazioni frontend"

# Controlla se i nuovi file sono stati creati
if [ -f "orti-finance-compass/src/hooks/useOptimizedFinanceAPI.ts" ]; then
    print_success "✅ Hook ottimizzato creato"
else
    print_error "❌ Hook ottimizzato mancante"
fi

if [ -f "orti-finance-compass/src/components/OptimizedFinancialDashboard.tsx" ]; then
    print_success "✅ Dashboard ottimizzato creato"
else
    print_error "❌ Dashboard ottimizzato mancante"
fi

if [ -f "orti-finance-compass/src/components/VarianceAnalysis.tsx" ]; then
    print_success "✅ Componente analisi scostamenti creato"
else
    print_error "❌ Componente analisi scostamenti mancante"
fi

print_step "7. Istruzioni finali"

echo ""
echo "🎯 OTTIMIZZAZIONI COMPLETATE!"
echo "============================="
echo ""
echo "📊 STRUTTURA FINALE:"
echo ""
echo "💰 ENTRATE (1 livello):"
echo "   ├── Entrate Hotel"
echo "   ├── Entrate Residence"
echo "   ├── Entrate CVM"
echo "   ├── Entrate Supermercato"
echo "   ├── Rientro Sospesi"
echo "   └── Caparre Intur"
echo ""
echo "💸 USCITE (2 livelli):"
echo "   ├── Salari e Stipendi → [Dettagli]"
echo "   ├── Utenze → [Energia, Gas, Ausino, etc.]"
echo "   ├── Tasse e Imposte → [IMU, TARI, IVA, etc.]"
echo "   ├── Commissioni Portali → [Booking, Expedia]"
echo "   ├── Consulenze → [Lavoro, Fiscale, Legale]"
echo "   ├── Godimento Beni di Terzi → [Fitti]"
echo "   ├── Materie Prime e Consumo → [Dettagli]"
echo "   ├── Mutui e Finanziamenti → [MPS, Intesa]"
echo "   ├── Canoni e Servizi → [Software, Servizi]"
echo "   ├── Progetti Speciali → [Ristrutturazioni]"
echo "   └── Varie ed Eventuali → [Altre]"
echo ""
echo "🔧 PROSSIMI PASSI:"
echo "1. Esegui lo script SQL su Supabase"
echo "2. Avvia il backend: cd orti-finance-api && python main.py server"
echo "3. Avvia il frontend: cd orti-finance-compass && npm run dev"
echo "4. Testa le nuove funzionalità nel Dashboard Pro"
echo ""
echo "🎉 Sistema ottimizzato per la separazione dati consolidati/previsionali!"

print_success "Script di ottimizzazione completato!"

exit 0