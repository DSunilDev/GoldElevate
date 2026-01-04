#!/bin/bash

echo "🚀 Starting Gold Elevate App in Web Browser"
echo "============================================"
echo ""

# Check if backend is running
echo "📡 Checking backend server..."
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Backend server is already running on port 8081"
else
    echo "⚠️  Backend server is not running"
    echo "   Please start it manually: cd backend && npm start"
    echo ""
    read -p "Do you want to start the backend now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📡 Starting backend server..."
        cd backend
        npm start &
        BACKEND_PID=$!
        echo "✅ Backend started (PID: $BACKEND_PID)"
        cd ..
        sleep 3
    else
        echo "⚠️  Please start the backend server first in another terminal:"
        echo "   cd backend && npm start"
        exit 1
    fi
fi

echo ""
echo "🌐 Starting mobile app in web mode..."
echo ""

cd mobile-app

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start Expo in web mode
echo "🚀 Starting Expo web server..."
echo "   Press Ctrl+C to stop"
echo ""

npx expo start --web

