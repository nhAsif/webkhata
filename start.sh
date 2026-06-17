#!/bin/sh
# WebKhata — Development startup script
# Run this from the project root

set -e

echo "=== WebKhata Dev Server ==="
echo ""
echo "Starting backend on http://localhost:6540"
echo "Starting frontend on http://localhost:5173"
echo ""

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

# Backend
cd "$BASE_DIR/backend"
if [ ! -f "tutor.db" ]; then
    echo "[Backend] First run — database will be auto-created."
fi

# Check for virtual env
if [ -d "../.venv" ]; then
    . ../.venv/bin/activate
fi

echo "[Backend] Installing dependencies..."
pip install -r requirements.txt -q

echo "[Backend] Starting uvicorn..."
uvicorn main:app --host 0.0.0.0 --port 6540 --reload &
BACKEND_PID=$!

# Frontend
cd "$BASE_DIR/frontend"
echo "[Frontend] Installing npm packages..."
npm install --silent

echo "[Frontend] Starting Vite dev server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ WebKhata is running!"
echo "   Tutor Portal: http://localhost:5173"
echo "   API Docs:     http://localhost:6540/docs"
echo "   Default login: admin / changeme"
echo ""
echo "Press Ctrl+C to stop both servers."

cleanup() {
    echo -e "\nShutting down WebKhata servers..."
    # Kill the entire process group
    kill 0
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT TERM

# Wait for background jobs
wait
