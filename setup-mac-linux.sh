#!/usr/bin/env bash
# ===================================================================
#             SUBMIND AUDIO STUDIO - DESKTOP SETUP
#             Engineered by Asfand Mustafa
# ===================================================================

set -e

echo "==================================================================="
echo "            SUBMIND AUDIO STUDIO - DESKTOP SETUP"
echo "            Engineered by Asfand Mustafa"
echo "==================================================================="
echo ""

echo "[1/4] Checking Node.js environment..."
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js (v18+) via https://nodejs.org or 'brew install node'"
    exit 1
fi

echo "[OK] Node.js $(node -v) detected."
echo ""

echo "[2/4] Installing project dependencies..."
npm install
echo "[OK] Dependencies installed successfully."
echo ""

echo "[3/4] Building production bundles..."
npm run build || echo "[WARNING] Build warning, continuing to dev mode..."
echo ""

echo "[4/4] Starting Submind Audio Studio..."
echo "Opening http://localhost:3000 in your browser..."

if which xdg-open > /dev/null; then
    (sleep 2 && xdg-open "http://localhost:3000") &
elif which open > /dev/null; then
    (sleep 2 && open "http://localhost:3000") &
fi

npm run dev
