#!/bin/bash

echo "🚀 Mobile App Demo - Quick Start"
echo "================================"
echo ""

# Check if backend is running
echo "📡 Checking backend..."
if curl -s http://localhost:8081/api/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "⚠️  Backend not running"
    echo "   Starting backend..."
    cd ../backend
    npm start &
    sleep 3
    cd ../mobile-app
fi

echo ""
echo "📱 Starting mobile app..."
echo ""
echo "1. Install Expo Go app on your phone:"
echo "   Android: https://play.google.com/store/apps/details?id=host.exp.exponent"
echo "   iOS: https://apps.apple.com/app/expo-go/id982107779"
echo ""
echo "2. Scan the QR code that appears"
echo ""
echo "3. App will load on your phone!"
echo ""

# Start Expo
npx expo start
