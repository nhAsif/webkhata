#!/bin/bash
# WebKhata — Development startup script
# Run this from the project root

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Colour helpers ───────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
RESET='\033[0m'

echo -e "${CYAN}=== WebKhata Dev Server ===${RESET}"
echo ""
echo -e "  Backend  → ${GREEN}http://localhost:6540${RESET}"
echo -e "  Frontend → ${GREEN}http://localhost:5173${RESET}"
echo ""

# ── Kill anything already holding our ports ──────────────────────────────────
free_port() {
    local port="$1"
    # fuser is available on this system; fall back to ss+kill if needed
    if fuser -k "${port}/tcp" 2>/dev/null; then
        echo -e "${YELLOW}[startup] Killed stale process on port $port${RESET}"
    fi
    # Wait until the port is actually free (up to 3 s)
    local tries=0
    while ss -tlnp 2>/dev/null | grep -q ":${port} " && [ $tries -lt 6 ]; do
        sleep 0.5
        tries=$((tries + 1))
    done
}

free_port 6540
free_port 5173

# ── Cleanup trap ─────────────────────────────────────────────────────────────
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo -e "\n${YELLOW}Shutting down WebKhata…${RESET}"

    for pid in "$BACKEND_PID" "$FRONTEND_PID"; do
        [ -z "$pid" ] && continue
        # Kill the child's entire process group (covers uvicorn reloader children)
        pgid=$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d ' ')
        if [ -n "$pgid" ] && [ "$pgid" != "0" ]; then
            kill -TERM -"$pgid" 2>/dev/null || true
        else
            kill -TERM "$pid" 2>/dev/null || true
        fi
    done

    # Give processes up to 3 s to exit gracefully, then force-kill
    sleep 1
    for pid in "$BACKEND_PID" "$FRONTEND_PID"; do
        [ -z "$pid" ] && continue
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${RED}[cleanup] Force-killing PID $pid${RESET}"
            kill -KILL "$pid" 2>/dev/null || true
        fi
    done

    echo -e "${GREEN}All servers stopped. Goodbye!${RESET}"
    exit 0
}

trap cleanup INT TERM

# ── Backend ──────────────────────────────────────────────────────────────────
cd "$BASE_DIR/backend"

if [ ! -f "tutor.db" ]; then
    echo "[Backend] First run — database will be auto-created."
fi

if [ -d "$BASE_DIR/.venv" ]; then
    # shellcheck disable=SC1091
    source "$BASE_DIR/.venv/bin/activate"
fi

echo "[Backend] Installing dependencies…"
pip install -r requirements.txt -q

echo "[Backend] Starting uvicorn…"
uvicorn main:app --host 0.0.0.0 --port 6540 --reload &
BACKEND_PID=$!

# ── Frontend ─────────────────────────────────────────────────────────────────
cd "$BASE_DIR/frontend"

echo "[Frontend] Installing npm packages…"
npm install --silent

echo "[Frontend] Building updated code…"
npm run build --silent

echo "[Frontend] Starting Vite dev server…"
npm run dev &
FRONTEND_PID=$!

# ── Ready ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}✅ WebKhata is running!${RESET}"
echo -e "   Tutor Portal : ${CYAN}http://localhost:5173${RESET}"
echo -e "   API Docs     : ${CYAN}http://localhost:6540/docs${RESET}"
echo -e "   Default login: admin / changeme"
echo ""
echo -e "Press ${YELLOW}Ctrl+C${RESET} to stop both servers."

# Wait — the trap fires on Ctrl+C before wait returns
wait "$BACKEND_PID" "$FRONTEND_PID"
