#!/bin/bash

# 🔄 ORTI Finance: Reset Database + Import JSON
# Uso: ./reset-and-import.sh mio_file.json

set -e  # Exit on any error

echo "🔄 ORTI FINANCE: RESET DATABASE + IMPORT JSON"
echo "=============================================="

# Check arguments
if [ $# -eq 0 ]; then
    echo "❌ ERRORE: Specificare file JSON da importare"
    echo ""
    echo "💡 USAGE:"
    echo "   ./reset-and-import.sh mio_file.json"
    echo ""
    echo "📋 ESEMPIO FILE JSON:"
    echo "   cp quick_import_example.json miei_dati.json"
    echo "   # Modifica miei_dati.json con i tuoi dati"
    echo "   ./reset-and-import.sh miei_dati.json"
    echo ""
    exit 1
fi

JSON_FILE="$1"

# Check if JSON file exists
if [ ! -f "$JSON_FILE" ]; then
    echo "❌ ERRORE: File $JSON_FILE non trovato!"
    echo ""
    echo "📋 FILE DISPONIBILI:"
    ls -la *.json 2>/dev/null || echo "   Nessun file .json trovato"
    echo ""
    exit 1
fi

echo "📁 File JSON: $JSON_FILE"
echo "🔍 Controllo formato JSON..."

# Validate JSON syntax
if ! cat "$JSON_FILE" | jq empty > /dev/null 2>&1; then
    echo "❌ ERRORE: $JSON_FILE non è un JSON valido!"
    echo "💡 Controlla la sintassi con: cat $JSON_FILE | jq ."
    exit 1
fi

echo "✅ JSON valido!"

# Check if backend is running
echo "🔍 Controllo Backend..."
if ! curl -s "http://localhost:8000" > /dev/null; then
    echo "❌ ERRORE: Backend non attivo su http://localhost:8000"
    echo ""
    echo "🚀 AVVIA IL BACKEND:"
    echo "   ./orti start    # oppure"
    echo "   cd orti-finance-api && python main.py server"
    echo ""
    exit 1
fi

echo "✅ Backend attivo!"

# Extract company name from JSON
COMPANY_NAME=$(cat "$JSON_FILE" | jq -r '.company_name // "ORTI"')
echo "🏢 Company: $COMPANY_NAME"

echo ""
echo "⚠️  ATTENZIONE: Stai per CANCELLARE tutti i dati esistenti!"
echo "📊 Nuovo import: $(cat "$JSON_FILE" | jq -r '.data | length') gruppi di dati"
echo ""
read -p "🤔 Continuare? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Operazione annullata."
    exit 0
fi

echo ""
echo "🗑️  STEP 1: RESET DATABASE..."

# Reset database
RESET_RESPONSE=$(curl -s -X DELETE "http://localhost:8000/api/companies/$COMPANY_NAME/reset-entries?confirm=true")
RESET_SUCCESS=$(echo "$RESET_RESPONSE" | jq -r '.success // false')

if [ "$RESET_SUCCESS" = "true" ]; then
    DELETED_COUNT=$(echo "$RESET_RESPONSE" | jq -r '.deleted_entries // 0')
    echo "✅ Database azzerato! Eliminate $DELETED_COUNT entries"
else
    echo "❌ ERRORE nel reset:"
    echo "$RESET_RESPONSE" | jq '.'
    exit 1
fi

echo ""
echo "📥 STEP 2: IMPORT NUOVI DATI..."

# Import new data
IMPORT_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/companies/$COMPANY_NAME/bulk-import" \
    -H "Content-Type: application/json" \
    -d @"$JSON_FILE")

IMPORT_SUCCESS=$(echo "$IMPORT_RESPONSE" | jq -r '.success // false')

if [ "$IMPORT_SUCCESS" = "true" ]; then
    IMPORTED_COUNT=$(echo "$IMPORT_RESPONSE" | jq -r '.total_imported // 0')
    echo "✅ Import completato! Importate $IMPORTED_COUNT entries"
    
    # Show summary
    echo ""
    echo "📊 RIASSUNTO OPERAZIONE:"
    echo "   🗑️  Entries eliminate: $DELETED_COUNT"
    echo "   📥 Entries importate: $IMPORTED_COUNT"
    echo "   🔄 Variazione netta: $((IMPORTED_COUNT - DELETED_COUNT))"
    
    # Show errors if any
    ERRORS=$(echo "$IMPORT_RESPONSE" | jq -r '.errors // [] | length')
    if [ "$ERRORS" -gt 0 ]; then
        echo ""
        echo "⚠️  AVVISI ($ERRORS errori):"
        echo "$IMPORT_RESPONSE" | jq -r '.errors[]' | head -5
    fi
    
else
    echo "❌ ERRORE nell'import:"
    echo "$IMPORT_RESPONSE" | jq '.'
    exit 1
fi

echo ""
echo "🎉 OPERAZIONE COMPLETATA!"
echo ""
echo "🌐 ACCESSO SISTEMA:"
echo "   Frontend: http://localhost:8080"
echo "   Backend:  http://localhost:8000"
echo ""
echo "⚡ TEST QUICK:"
echo "   curl -s \"http://localhost:8000/companies/$COMPANY_NAME/summary/2025\" | jq '.summary.consolidated.total_revenue'"
echo ""
echo "🔍 VERIFICA DATI:"
echo "   Vai su http://localhost:8080 → click 'Real-time CRUD Demo'"
echo "   Osserva i colori: Verde=Consolidato, Arancione=Previsionale"
echo ""