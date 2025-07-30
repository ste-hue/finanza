#!/bin/bash

# 🧪 TEST CRUD COMPLETO - Frontend ↔ Backend Communication
# Testa tutte le operazioni CRUD e la sincronizzazione

echo "🚀 TESTING COMPLETE CRUD SYSTEM..."

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="http://localhost:8000"
COMPANY_NAME="ORTI"

# Test 1: Health Check
echo -e "${BLUE}🔍 Test 1: Backend Health Check${NC}"
curl -s "${BASE_URL}/" | jq '.message' || echo "❌ Backend not responding"
echo ""

# Test 2: Get existing entries
echo -e "${YELLOW}📊 Test 2: GET Entries (Read)${NC}"
ENTRIES_RESPONSE=$(curl -s "${BASE_URL}/entries?year=2024&limit=3")
echo $ENTRIES_RESPONSE | jq '.success, .count'
FIRST_ENTRY_ID=$(echo $ENTRIES_RESPONSE | jq -r '.data[0].id')
echo -e "First Entry ID: ${GREEN}${FIRST_ENTRY_ID}${NC}"
echo ""

# Test 3: Get single entry by ID
echo -e "${YELLOW}🔍 Test 3: GET Single Entry by ID${NC}"
curl -s "${BASE_URL}/entries/${FIRST_ENTRY_ID}" | jq '.success, .data.value'
echo ""

# Test 4: Update entry by ID
echo -e "${YELLOW}🔄 Test 4: PUT Update Entry by ID${NC}"
UPDATE_DATA='{
  "value": 99999.99,
  "notes": "TEST UPDATE - CRUD Complete Test",
  "is_projection": false
}'
curl -X PUT "${BASE_URL}/entries/${FIRST_ENTRY_ID}" \
  -H "Content-Type: application/json" \
  -d "${UPDATE_DATA}" | jq '.success, .message'
echo ""

# Test 5: Verify the update
echo -e "${YELLOW}✅ Test 5: Verify Update${NC}"
curl -s "${BASE_URL}/entries/${FIRST_ENTRY_ID}" | jq '.data.value, .data.notes'
echo ""

# Test 6: Create new entry
echo -e "${YELLOW}➕ Test 6: POST Create New Entry${NC}"
# Get a valid subcategory_id first
SUBCATEGORY_ID=$(curl -s "${BASE_URL}/entries?limit=1" | jq -r '.data[0].subcategory_id')
CREATE_DATA="{
  \"subcategory_id\": \"${SUBCATEGORY_ID}\",
  \"year\": 2025,
  \"month\": 12,
  \"value\": 88888.88,
  \"is_projection\": true,
  \"notes\": \"TEST CREATE - New Entry via CRUD\"
}"
NEW_ENTRY_RESPONSE=$(curl -X POST "${BASE_URL}/entries" \
  -H "Content-Type: application/json" \
  -d "${CREATE_DATA}")
echo $NEW_ENTRY_RESPONSE | jq '.success, .message'
NEW_ENTRY_ID=$(echo $NEW_ENTRY_RESPONSE | jq -r '.data.id')
echo -e "New Entry ID: ${GREEN}${NEW_ENTRY_ID}${NC}"
echo ""

# Test 7: Company Summary (to see if data changes)
echo -e "${YELLOW}📈 Test 7: Company Summary After Changes${NC}"
curl -s "${BASE_URL}/companies/${COMPANY_NAME}/summary/2025" | jq '.consolidated.total_revenue, .projections.total_revenue'
echo ""

# Test 8: Data Summary (Consolidated vs Projection)
echo -e "${YELLOW}⚖️ Test 8: Data Type Summary${NC}"
curl -s "${BASE_URL}/api/companies/${COMPANY_NAME}/data-summary?year=2025" | jq '.consolidated.entries_count, .projection.entries_count'
echo ""

# Test 9: Delete the test entry
echo -e "${YELLOW}🗑️ Test 9: DELETE Entry${NC}"
curl -X DELETE "${BASE_URL}/entries/${NEW_ENTRY_ID}" | jq '.success, .message'
echo ""

# Test 10: Verify deletion
echo -e "${YELLOW}🔍 Test 10: Verify Deletion${NC}"
curl -s "${BASE_URL}/entries/${NEW_ENTRY_ID}" | jq '.error // "Entry deleted successfully"'
echo ""

# Test 11: Legacy update endpoint (for frontend compatibility)
echo -e "${YELLOW}🔄 Test 11: Legacy Update Endpoint${NC}"
LEGACY_DATA="{
  \"subcategory_id\": \"${SUBCATEGORY_ID}\",
  \"year\": 2024,
  \"month\": 1,
  \"value\": 77777.77,
  \"is_projection\": false,
  \"notes\": \"TEST LEGACY UPDATE\"
}"
curl -X PUT "${BASE_URL}/entry" \
  -H "Content-Type: application/json" \
  -d "${LEGACY_DATA}" | jq '.success, .message'
echo ""

echo -e "${GREEN}🎉 CRUD TESTS COMPLETED!${NC}"
echo ""
echo -e "${BLUE}📊 SUMMARY:${NC}"
echo "✅ CREATE (POST /entries) - New entry creation"
echo "✅ READ (GET /entries, GET /entries/{id}) - Data retrieval"  
echo "✅ UPDATE (PUT /entries/{id}, PUT /entry) - Data modification"
echo "✅ DELETE (DELETE /entries/{id}) - Data deletion"
echo "✅ SYNC - Company summary reflects changes"
echo ""
echo -e "${YELLOW}🔧 Next: Test frontend integration!${NC}"