#!/usr/bin/env bash
echo "Launching Submind Audio Studio at http://localhost:3000..."
if which xdg-open > /dev/null; then
    (sleep 1 && xdg-open "http://localhost:3000") &
elif which open > /dev/null; then
    (sleep 1 && open "http://localhost:3000") &
fi
npm run dev
