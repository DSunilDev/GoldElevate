#!/bin/bash

echo "🚀 Starting Gold Investment Mobile App..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your API URL"
    echo ""
fi

# Check backend
echo "🔍 Checking backend server..."
if curl -s http://localhost:8081/api/health > /dev/null; then
    echo "✅ Backend is running"
else
    echo "⚠️  Backend not running. Please start it:"
    echo "   cd ../backend && npm start"
    echo ""
fi

echo ""
echo "📱 Starting React Native..."
echo ""

# Start Metro bundler
npm start

