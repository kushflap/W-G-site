#!/bin/sh
cd "$(dirname "$0")"
echo "Starting Wrath & Glory Campaign Manager..."
python3 -m http.server 8000 --bind 0.0.0.0
