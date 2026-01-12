#!/bin/bash
# Diagnostic script to check app status

echo "🔍 GoldElevate App Diagnostic"
echo "=============================="
echo ""

echo "1️⃣ Check if Metro is running:"
if lsof -ti:8081 > /dev/null 2>&1; then
    echo "   ✅ Metro bundler is running on port 8081"
else
    echo "   ❌ Metro bundler is NOT running"
    echo "   Run: cd mobile-app && npm start"
fi
echo ""

echo "2️⃣ Check if backend is running:"
if curl -s http://localhost:8081/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend is reachable at localhost:8081"
else
    echo "   ⚠️  Backend might not be running or not reachable"
fi
echo ""

echo "3️⃣ Check API configuration:"
API_URL=$(grep -o "http://[0-9.]*:8081" mobile-app/src/config/api.js 2>/dev/null | head -1)
if [ -n "$API_URL" ]; then
    echo "   📱 API URL in code: $API_URL"
    echo "   Test from phone browser: $API_URL/api/health"
else
    echo "   ⚠️  Could not find API URL in api.js"
fi
echo ""

echo "4️⃣ Check for recent Metro logs:"
echo "   Look in the terminal where you ran 'npm start'"
echo "   You should see logs like:"
echo "   - 🚀 App component rendering..."
echo "   - 🔐 AuthProvider initializing..."
echo "   - 🧭 AuthNavigator rendering..."
echo "   - ✅ NavigationContainer ready"
echo ""

echo "5️⃣ On your phone:"
echo "   - Open Expo Go app"
echo "   - Scan the QR code from Metro terminal"
echo "   - Watch for any error messages"
echo "   - If stuck on loading, shake device → 'Debug Remote JS'"
echo ""

echo "6️⃣ Check device connection:"
echo "   Make sure phone and computer are on the same WiFi network"
echo "   Phone IP should be able to reach: $API_URL"
echo ""

