#!/bin/bash

# 🚀 ORTI Finance - One Script to Rule Them All
# Unified script: setup, start, stop, test - Supabase Cloud + Direct execution

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

API_PORT=8000
FRONTEND_PORT=8080
BASE_URL="http://localhost:${API_PORT}"

print_header() {
    echo "🚀 ORTI FINANCE - Unified System"
    echo "==============================="
    echo ""
}

check_deps() {
    echo -e "${BLUE}🔍 Checking dependencies...${NC}"
    
    command -v python3 >/dev/null 2>&1 || { echo -e "${RED}❌ Python3 required${NC}"; exit 1; }
    command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js required${NC}"; exit 1; }
    command -v curl >/dev/null 2>&1 || { echo -e "${RED}❌ curl required${NC}"; exit 1; }
    
    echo -e "${GREEN}✅ Dependencies OK${NC}"
}

kill_existing() {
    echo -e "${YELLOW}🧹 Cleaning existing processes...${NC}"
    pkill -f "python.*main.py" 2>/dev/null || true
    pkill -f "node.*vite" 2>/dev/null || true
    sleep 2
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

setup_backend() {
    echo -e "${BLUE}🔧 Setting up backend...${NC}"
    cd orti-finance-api
    
    if [ ! -f "requirements.txt" ]; then
        echo -e "${RED}❌ requirements.txt not found${NC}"
        exit 1
    fi
    
    pip3 install -r requirements.txt >/dev/null 2>&1 || {
        echo -e "${YELLOW}⚠️ Installing backend dependencies...${NC}"
        pip3 install -r requirements.txt
    }
    cd ..
    echo -e "${GREEN}✅ Backend ready${NC}"
}

setup_frontend() {
    echo -e "${BLUE}⚛️ Setting up frontend...${NC}"
    cd orti-finance-compass
    
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
        npm install
    fi
    cd ..
    echo -e "${GREEN}✅ Frontend ready${NC}"
}

start_services() {
    echo -e "${BLUE}🚀 Starting services...${NC}"
    
    # Start backend
    echo -e "${YELLOW}Starting backend on port ${API_PORT}...${NC}"
    cd orti-finance-api
    python3 main.py server &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend
    echo -e "${YELLOW}Waiting for backend...${NC}"
    for i in {1..10}; do
        if curl -s "${BASE_URL}/" >/dev/null 2>&1; then
            break
        fi
        sleep 1
    done
    
    if ! curl -s "${BASE_URL}/" >/dev/null 2>&1; then
        echo -e "${RED}❌ Backend failed to start${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    echo -e "${GREEN}✅ Backend running on ${BASE_URL}${NC}"
    
    # Start frontend
    echo -e "${YELLOW}Starting frontend on port ${FRONTEND_PORT}...${NC}"
    cd orti-finance-compass
    VITE_PORT=${FRONTEND_PORT} npm run dev >/dev/null 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for frontend
    sleep 3
    echo -e "${GREEN}✅ Frontend running on http://localhost:${FRONTEND_PORT}${NC}"
    
    echo ""
    echo -e "${GREEN}🎉 ORTI Finance System Running!${NC}"
    echo -e "${BLUE}📍 Access Points:${NC}"
    echo -e "   🎨 Frontend: http://localhost:${FRONTEND_PORT}"
    echo -e "   🔧 Backend:  ${BASE_URL}"
    echo ""
    echo -e "${YELLOW}PIDs: Backend=${BACKEND_PID}, Frontend=${FRONTEND_PID}${NC}"
    echo -e "${RED}Stop: Ctrl+C or './run.sh stop'${NC}"
    
    # Keep running
    trap 'echo -e "\n${YELLOW}Stopping services...${NC}"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT
    wait
}

run_tests() {
    echo -e "${BLUE}🧪 Running CRUD tests...${NC}"
    
    # Health check
    if ! curl -s "${BASE_URL}/" | grep -q "ORTI Finance"; then
        echo -e "${RED}❌ Backend not responding${NC}"
        return 1
    fi
    
    # Get first entry for tests
    ENTRIES=$(curl -s "${BASE_URL}/entries?year=2024&limit=1")
    FIRST_ID=$(echo $ENTRIES | python3 -c "import sys,json; data=json.load(sys.stdin); print(data['data'][0]['id'] if data.get('data') else 'none')" 2>/dev/null || echo "none")
    
    if [ "$FIRST_ID" = "none" ]; then
        echo -e "${YELLOW}⚠️ No test data found${NC}"
        return 0
    fi
    
    # Test READ
    echo -e "${YELLOW}Testing READ...${NC}"
    curl -s "${BASE_URL}/entries/${FIRST_ID}" | grep -q '"success":true' && echo -e "${GREEN}✅ READ OK${NC}" || echo -e "${RED}❌ READ FAILED${NC}"
    
    # Test UPDATE
    echo -e "${YELLOW}Testing UPDATE...${NC}"
    UPDATE_DATA='{"value": 99999.99, "notes": "TEST UPDATE", "is_projection": false}'
    curl -s -X PUT "${BASE_URL}/entries/${FIRST_ID}" -H "Content-Type: application/json" -d "${UPDATE_DATA}" | grep -q '"success":true' && echo -e "${GREEN}✅ UPDATE OK${NC}" || echo -e "${RED}❌ UPDATE FAILED${NC}"
    
    echo -e "${GREEN}🎯 Tests completed${NC}"
}

show_status() {
    echo -e "${BLUE}📊 System Status:${NC}"
    
    # Check backend
    if curl -s "${BASE_URL}/" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend: Running on ${BASE_URL}${NC}"
    else
        echo -e "${RED}❌ Backend: Not running${NC}"
    fi
    
    # Check frontend
    if curl -s "http://localhost:${FRONTEND_PORT}" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend: Running on http://localhost:${FRONTEND_PORT}${NC}"
    else
        echo -e "${RED}❌ Frontend: Not running${NC}"
    fi
    
    # Check processes
    BACKEND_PROC=$(pgrep -f "python.*main.py" | wc -l)
    FRONTEND_PROC=$(pgrep -f "node.*vite" | wc -l)
    echo -e "${YELLOW}Processes: Backend=${BACKEND_PROC}, Frontend=${FRONTEND_PROC}${NC}"
}

case "${1:-start}" in
    "start"|"")
        print_header
        check_deps
        kill_existing
        setup_backend
        setup_frontend
        start_services
        ;;
    "stop")
        echo -e "${RED}🛑 Stopping ORTI Finance...${NC}"
        kill_existing
        echo -e "${GREEN}✅ Stopped${NC}"
        ;;
    "restart")
        $0 stop
        sleep 2
        $0 start
        ;;
    "test")
        print_header
        run_tests
        ;;
    "status")
        print_header
        show_status
        ;;
    "setup")
        print_header
        check_deps
        setup_backend
        setup_frontend
        echo -e "${GREEN}🎉 Setup complete! Run './run.sh start'${NC}"
        ;;
    *)
        echo "Usage: $0 [start|stop|restart|test|status|setup]"
        echo ""
        echo "Commands:"
        echo "  start    - Start the complete system (default)"
        echo "  stop     - Stop all services"  
        echo "  restart  - Restart everything"
        echo "  test     - Run CRUD tests"
        echo "  status   - Show system status"
        echo "  setup    - Setup dependencies only"
        exit 1
        ;;
esac