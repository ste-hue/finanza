#!/bin/bash

# 🚀 ORTI Finance - Avvio Completo Sistema
# Avvia Backend + Frontend sulla porta 8080

echo "🔥 AVVIO ORTI FINANCE SYSTEM..."

# Colori per output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Kill existing processes
echo -e "${YELLOW}🧹 Pulizia processi esistenti...${NC}"
killall node python3 python 2>/dev/null || true
sleep 2

# Start Backend API (Port 8000)
echo -e "${BLUE}🔧 Avvio Backend API (Port 8000)...${NC}"
cd orti-finance-api
python main.py server &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Check backend health
echo -e "${YELLOW}🔍 Controllo Backend...${NC}"
if curl -s "http://localhost:8000" | grep -q "ORTI Finance"; then
    echo -e "${GREEN}✅ Backend attivo su http://localhost:8000${NC}"
else
    echo -e "${RED}❌ Backend non risponde${NC}"
    exit 1
fi

# Start Frontend (Port 8080)
echo -e "${BLUE}🎨 Avvio Frontend (Port 8080)...${NC}"
cd orti-finance-compass
VITE_PORT=8080 npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 5

# Check frontend health
echo -e "${YELLOW}🔍 Controllo Frontend...${NC}"
if curl -s "http://localhost:8080" | grep -q "DOCTYPE"; then
    echo -e "${GREEN}✅ Frontend attivo su http://localhost:8080${NC}"
else
    echo -e "${RED}❌ Frontend non risponde${NC}"
fi

echo ""
echo -e "${GREEN}🎉 ORTI FINANCE SYSTEM AVVIATO!${NC}"
echo ""
echo -e "${BLUE}📍 ACCESSI:${NC}"
echo -e "   🎨 Frontend: ${GREEN}http://localhost:8080${NC}"
echo -e "   🔧 Backend:  ${GREEN}http://localhost:8000${NC}"
echo ""
echo -e "${BLUE}🧪 TEST QUICK:${NC}"
echo -e "   📊 API Status: curl http://localhost:8000"
echo -e "   ⚡ CRUD Demo:  Vai su http://localhost:8080 e click 'Real-time CRUD Demo'"
echo ""
echo -e "${YELLOW}⚙️ PROCESSI:${NC}"
echo -e "   Backend PID:  ${BACKEND_PID}"
echo -e "   Frontend PID: ${FRONTEND_PID}"
echo ""
echo -e "${RED}🛑 Per fermare tutto: killall node python3${NC}"
echo ""

# Keep script running to show logs
echo -e "${BLUE}📋 Log in tempo reale (Ctrl+C per uscire):${NC}"
echo ""

# Monitor both processes
wait