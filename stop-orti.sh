#!/bin/bash

# 🛑 ORTI Finance - Stop Sistema
# Ferma tutti i processi Backend + Frontend

echo "🛑 FERMANDO ORTI FINANCE SYSTEM..."

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🧹 Terminando processi...${NC}"

# Kill all related processes
killall node 2>/dev/null && echo -e "${GREEN}✅ Node processes terminated${NC}" || echo -e "${YELLOW}⚠️ No Node processes found${NC}"

killall python3 2>/dev/null && echo -e "${GREEN}✅ Python3 processes terminated${NC}" || echo -e "${YELLOW}⚠️ No Python3 processes found${NC}"

killall python 2>/dev/null && echo -e "${GREEN}✅ Python processes terminated${NC}" || echo -e "${YELLOW}⚠️ No Python processes found${NC}"

# Check if ports are free
sleep 2

echo ""
echo -e "${YELLOW}🔍 Verifica porte...${NC}"

if ! lsof -i :8000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Port 8000 (Backend) is free${NC}"
else
    echo -e "${RED}⚠️ Port 8000 still in use${NC}"
fi

if ! lsof -i :8080 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Port 8080 (Frontend) is free${NC}"
else
    echo -e "${RED}⚠️ Port 8080 still in use${NC}"
fi

echo ""
echo -e "${GREEN}🎯 ORTI Finance fermato!${NC}"
echo -e "${YELLOW}💡 Per riavviare: ./start-orti.sh${NC}"