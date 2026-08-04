#!/usr/bin/env bash
# ============================================
# Radar — Quick Setup Script
# Run from the project root: bash setup.sh
# ============================================
set -e

echo "=== Radar Setup ==="

# --- Backend ---
echo ""
echo "[1/5] Setting up Python virtual environment..."
if [ ! -d "backend/venv" ]; then
    python -m venv backend/venv
    echo "  Created backend/venv"
else
    echo "  backend/venv already exists"
fi

echo ""
echo "[2/5] Installing Python dependencies..."
backend/venv/Scripts/pip install -r backend/requirements.txt --quiet

echo ""
echo "[3/5] Initializing database..."
backend/venv/Scripts/python -c "
import sys; sys.path.insert(0, 'backend')
from tools.db import init_db
init_db()
print('  Database initialized.')
"

echo ""
echo "[4/5] Setting up .env..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "  Created backend/.env from .env.example"
    echo "  >>> EDIT backend/.env with your values before running! <<<"
else
    echo "  backend/.env already exists"
fi

# --- Frontend ---
echo ""
echo "[5/5] Setting up frontend..."
if command -v npm &> /dev/null; then
    cd frontend && npm install --silent && cd ..
    echo "  Frontend dependencies installed."
else
    echo "  npm not found — skip frontend setup."
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To run Radar:"
echo "  1. Edit backend/.env with your API keys"
echo "  2. Start Ollama (if using local LLM): ollama serve"
echo "  3. Start backend:  cd backend && venv/Scripts/uvicorn api:app --reload --port 8000"
echo "  4. Start frontend: cd frontend && npm run dev"
echo "  5. (Optional) Start scheduler: cd backend && venv/Scripts/python scheduler.py"
