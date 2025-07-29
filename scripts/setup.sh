#!/bin/bash

# 🏗️ ORTI Finance - Setup Script
# Initializes the entire system from scratch

set -e

echo "🏗️ ORTI Finance System - Initial Setup"
echo "======================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check prerequisites
check_prereqs() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found. Please install Node.js 18+ first.${NC}"
        exit 1
    fi
    
    if ! command -v python &> /dev/null; then
        echo -e "${RED}❌ Python not found. Please install Python 3.11+ first.${NC}"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}⚠️ Docker not found. Docker features will be unavailable.${NC}"
    fi
    
    echo -e "${GREEN}✅ Prerequisites check completed${NC}"
}

# Setup environment
setup_env() {
    echo -e "${BLUE}🔧 Setting up environment...${NC}"
    
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}📝 Creating .env file from template...${NC}"
        cp .env.example .env
        echo -e "${RED}⚠️ Please edit .env file with your Supabase credentials!${NC}"
    else
        echo -e "${GREEN}✅ .env file already exists${NC}"
    fi
}

# Setup backend
setup_backend() {
    echo -e "${BLUE}🔧 Setting up backend...${NC}"
    cd backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}📦 Creating Python virtual environment...${NC}"
        python -m venv venv
    fi
    
    # Activate and install dependencies
    echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    
    echo -e "${GREEN}✅ Backend setup completed${NC}"
    cd ..
}

# Setup frontend
setup_frontend() {
    echo -e "${BLUE}⚛️ Setting up frontend...${NC}"
    cd frontend
    
    echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
    npm install
    
    echo -e "${GREEN}✅ Frontend setup completed${NC}"
    cd ..
}

# Create additional directories
setup_dirs() {
    echo -e "${BLUE}📁 Creating additional directories...${NC}"
    
    mkdir -p logs
    mkdir -p backup
    mkdir -p temp
    
    echo -e "${GREEN}✅ Directory structure created${NC}"
}

# Setup git hooks (optional)
setup_git() {
    echo -e "${BLUE}📝 Setting up git configuration...${NC}"
    
    # Create .gitignore if it doesn't exist
    if [ ! -f ".gitignore" ]; then
        cat > .gitignore << EOF
# Environment files
.env
.env.local
.env.production

# Dependencies
backend/venv/
frontend/node_modules/

# Build outputs
frontend/dist/
frontend/build/

# Logs
logs/
*.log

# Temporary files
temp/
*.tmp

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Database
*.db
*.sqlite

# Backup files
backup/
EOF
        echo -e "${GREEN}✅ .gitignore created${NC}"
    fi
}

# Main setup function
main() {
    echo -e "${BLUE}🚀 Starting complete setup...${NC}"
    
    check_prereqs
    setup_env
    setup_dirs
    setup_backend
    setup_frontend
    setup_git
    
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "${YELLOW}1. Edit .env file with your Supabase credentials${NC}"
    echo -e "${YELLOW}2. Run './scripts/dev.sh' to start development${NC}"
    echo -e "${YELLOW}3. Open http://localhost:5173 in your browser${NC}"
}

# Run main function
main