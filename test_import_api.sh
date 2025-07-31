#!/bin/bash

# 🧪 SCRIPT TEST API IMPORT - ORTI Finance
# Test degli endpoint per import dati consolidati vs previsionali

echo "🚀 Testing ORTI Finance Import API..."

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL base dell'API
BASE_URL="http://localhost:8000"
COMPANY_NAME="ORTI"

echo -e "${BLUE}📡 Base URL: ${BASE_URL}${NC}"
echo -e "${BLUE}🏢 Company: ${COMPANY_NAME}${NC}"
echo ""

# Test 1: Verifica stato server
echo -e "${YELLOW}🔍 Test 1: Server Health Check${NC}"
curl -s "${BASE_URL}/health" | jq '.' || echo "❌ Server not responding"
echo ""

# Test 2: Summary prima dell'import
echo -e "${YELLOW}📊 Test 2: Data Summary (Before Import)${NC}"
curl -s "${BASE_URL}/api/companies/${COMPANY_NAME}/data-summary?year=2024" | jq '.'
echo ""

# Test 3: Bulk import dei dati
echo -e "${YELLOW}🚀 Test 3: Bulk Import Data${NC}"
curl -X POST "${BASE_URL}/api/companies/${COMPANY_NAME}/bulk-import" \
  -H "Content-Type: application/json" \
  -d @quick_import_example.json | jq '.'
echo ""

# Test 4: Summary dopo l'import
echo -e "${YELLOW}📊 Test 4: Data Summary (After Import)${NC}"
curl -s "${BASE_URL}/api/companies/${COMPANY_NAME}/data-summary?year=2024" | jq '.'
echo ""

# Test 5: Summary 2025 (per vedere le previsioni)
echo -e "${YELLOW}🔮 Test 5: Projections Summary 2025${NC}"
curl -s "${BASE_URL}/api/companies/${COMPANY_NAME}/data-summary?year=2025" | jq '.'
echo ""

# Test 6: Company summary completo
echo -e "${YELLOW}📈 Test 6: Complete Company Summary${NC}"
curl -s "${BASE_URL}/api/companies/${COMPANY_NAME}/summary?year=2024" | jq '.consolidated.total_revenue, .consolidated.total_expenses'
echo ""

# Test 7: Varianza analysis (se disponibile)
echo -e "${YELLOW}⚖️ Test 7: Variance Analysis${NC}"
curl -s "${BASE_URL}/api/companies/${COMPANY_NAME}/variance/2025/7" | jq '.' || echo "No variance data for July 2025"
echo ""

echo -e "${GREEN}✅ Test completati!${NC}"
echo ""
echo -e "${BLUE}💡 PROSSIMI PASSI:${NC}"
echo "1. Controlla i risultati dei test"
echo "2. Verifica che consolidated e projection siano separati"
echo "3. Testa il frontend con questi dati"
echo ""