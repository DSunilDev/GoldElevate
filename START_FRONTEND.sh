#!/bin/bash
# Frontend startup script with cache clearing

cd "$(dirname "$0")/mobile-app"

echo "Clearing frontend cache..."
rm -rf node_modules/.cache .expo web/.next .expo-shared 2>/dev/null

echo "Starting frontend server..."
PORT=19006 npm start -- --web --clear
