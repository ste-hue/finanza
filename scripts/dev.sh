#!/bin/bash

# 🚀 ORTI Finance - Development Script
# Runs both backend and frontend in parallel

set -e

echo "🏢 Starting ORTI Finance System - Development Mode"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run backend
run_backend() {
    echo -e "${BLUE}🔧 Starting Backend (FastAPI)...${NC}"
    cd backend
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
        python -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
    pip install -r requirements.txt
    
    # Start server
    echo -e "${GREEN}🚀 Backend running on http://localhost:8000${NC}"
    uvicorn main:app --reload --port 8000
}

# Function to run frontend
run_frontend() {
    echo -e "${BLUE}⚛️ Starting Frontend (React)...${NC}"
    cd frontend
    
    # Install dependencies
    echo -e "${YELLOW}📦 Installing Node dependencies...${NC}"
    npm install
    
    # Start dev server
    echo -e "${GREEN}🚀 Frontend running on http://localhost:5173${NC}"
    npm run dev
}

# Check if argument is provided
case "$1" in
    "backend"|"be")
        run_backend
        ;;
    "frontend"|"fe")
        run_frontend
        ;;
    ""|"both")
        echo -e "${YELLOW}🔀 Starting both services in parallel...${NC}"
        
        # Run backend in background
        (run_backend) &
        BACKEND_PID=$!
        
        # Wait a bit for backend to start
        sleep 3
        
        # Run frontend in background
        (run_frontend) &
        FRONTEND_PID=$!
        
        # Wait for both processes
        echo -e "${GREEN}✅ Both services started!${NC}"
        echo -e "${BLUE}🔧 Backend: http://localhost:8000${NC}"
        echo -e "${BLUE}⚛️ Frontend: http://localhost:5173${NC}"
        echo -e "${YELLOW}💡 Press Ctrl+C to stop both services${NC}"
        
        wait $BACKEND_PID $FRONTEND_PID
        ;;
    *)
        echo "Usage: $0 [backend|frontend|both]"
        echo "  backend  - Run only backend"
        echo "  frontend - Run only frontend" 
        echo "  both     - Run both services (default)"
        exit 1
        ;;
esac 