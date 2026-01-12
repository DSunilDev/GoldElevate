#!/bin/bash
# Test script to verify backend connectivity

echo "🔍 Testing Backend Connection"
echo "=============================="
echo ""

# Get current IP
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")

echo "📍 Your IP address: $IP"
echo ""

# Test local connection
echo "1️⃣ Testing local connection..."
if curl -s -m 5 "http://$IP:8081/api/health" > /dev/null; then
    echo "   ✅ Backend is reachable locally"
    curl -s "http://$IP:8081/api/health" | python3 -m json.tool 2>/dev/null || curl -s "http://$IP:8081/api/health"
    echo ""
else
    echo "   ❌ Backend not reachable locally"
    echo "   💡 Make sure backend is running: cd backend && npm start"
    exit 1
fi

# Check if port is listening
echo "2️⃣ Checking if port 8081 is listening..."
if lsof -i :8081 | grep LISTEN > /dev/null; then
    echo "   ✅ Port 8081 is listening"
    lsof -i :8081 | grep LISTEN
else
    echo "   ❌ Port 8081 is not listening"
    echo "   💡 Start backend: cd backend && npm start"
    exit 1
fi

echo ""
echo "3️⃣ Testing from phone:"
echo "   📱 Open browser on your phone and go to:"
echo "   http://$IP:8081/api/health"
echo ""
echo "   If you see JSON response, connection works!"
echo "   If not, check:"
echo "   - Phone and computer on same WiFi?"
echo " - macOS Firewall settings (System Settings > Network > Firewall)"
echo "   - Router firewall settings"
echo ""

