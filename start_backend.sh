#!/bin/bash
# Permanent backend startup script with CORS fix

cd "$(dirname "$0")/backend"

# Kill any existing backend process
lsof -ti:8081 | xargs kill -9 2>/dev/null
sleep 2

# Start backend server
echo "Starting backend server..."
node server.js

