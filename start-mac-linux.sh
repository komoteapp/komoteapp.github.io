#!/usr/bin/env bash
echo "==================================================="
echo "  KOMOTE - Kindle KOReader Remote (Local Server)"
echo "==================================================="
echo ""
echo "Starting local HTTP server for full Bluetooth & Gamepad support..."
echo ""

if command -v python3 &>/dev/null; then
    echo "Python 3 detected. Starting server at http://localhost:8088 ..."
    (sleep 1 && (open http://localhost:8088 2>/dev/null || xdg-open http://localhost:8088 2>/dev/null || termux-open-url http://localhost:8088 2>/dev/null)) &
    python3 -m http.server 8088
elif command -v python &>/dev/null; then
    echo "Python detected. Starting server at http://localhost:8088 ..."
    (sleep 1 && (open http://localhost:8088 2>/dev/null || xdg-open http://localhost:8088 2>/dev/null)) &
    python -m http.server 8088
elif command -v npx &>/dev/null; then
    echo "Node.js detected. Starting server at http://localhost:8088 ..."
    (sleep 1 && (open http://localhost:8088 2>/dev/null || xdg-open http://localhost:8088 2>/dev/null)) &
    npx serve -l 8088
else
    echo "No local python or node server found. Opening index.html directly..."
    open index.html 2>/dev/null || xdg-open index.html 2>/dev/null
fi
