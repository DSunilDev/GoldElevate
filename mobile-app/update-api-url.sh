#!/bin/bash
# Script to update API URL with current machine's IP address

echo "🔍 Finding your machine's IP address..."

# Get IP address (works on macOS and Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - try all network interfaces
    IP=$(ipconfig getifaddr en0 2>/dev/null || \
         ipconfig getifaddr en1 2>/dev/null || \
         ipconfig getifaddr en2 2>/dev/null || \
         ifconfig | grep -E "inet.*broadcast" | grep -v "127.0.0.1" | awk '{print $2}' | head -1 || \
         echo "localhost")
else
    # Linux
    IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
fi

# Verify IP is not localhost
if [ "$IP" == "localhost" ] || [ -z "$IP" ]; then
    # Try alternative method
    IP=$(ifconfig | grep -E "inet [0-9]" | grep -v "127.0.0.1" | awk '{print $2}' | head -1)
fi

if [ "$IP" == "localhost" ] || [ -z "$IP" ]; then
    echo "⚠️  Could not detect IP address. Using localhost."
    IP="localhost"
else
    echo "✅ Found IP address: $IP"
fi

API_URL="http://$IP:8081/api"

echo ""
echo "📝 Updating API URL to: $API_URL"
echo ""

# Update app.config.js
if [ -f "app.config.js" ]; then
    # Backup original
    cp app.config.js app.config.js.bak
    
    # Update the IP address in app.config.js
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS uses BSD sed
        sed -i '' "s|http://[0-9.]*:8081/api|$API_URL|g" app.config.js
        sed -i '' "s|http://172\.28\.37\.188:8081|http://$IP:8081|g" app.config.js
    else
        # Linux uses GNU sed
        sed -i "s|http://[0-9.]*:8081/api|$API_URL|g" app.config.js
        sed -i "s|http://172\.28\.37\.188:8081|http://$IP:8081|g" app.config.js
    fi
    
    echo "✅ Updated app.config.js"
else
    echo "❌ app.config.js not found"
fi

# Update src/config/api.js
if [ -f "src/config/api.js" ]; then
    # Backup original
    cp src/config/api.js src/config/api.js.bak
    
    # Update the IP address in api.js
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|http://[0-9.]*:8081/api|$API_URL|g" src/config/api.js
        sed -i '' "s|http://172\.28\.37\.188:8081|http://$IP:8081|g" src/config/api.js
    else
        sed -i "s|http://[0-9.]*:8081/api|$API_URL|g" src/config/api.js
        sed -i "s|http://172\.28\.37\.188:8081|http://$IP:8081|g" src/config/api.js
    fi
    
    echo "✅ Updated src/config/api.js"
else
    echo "❌ src/config/api.js not found"
fi

# Update PaymentScreen.js if it has hardcoded IP
if [ -f "src/screens/PaymentScreen.js" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|http://172\.28\.37\.188:8081|http://$IP:8081|g" src/screens/PaymentScreen.js
    else
        sed -i "s|http://172\.28\.37\.188:8081|http://$IP:8081|g" src/screens/PaymentScreen.js
    fi
    echo "✅ Updated src/screens/PaymentScreen.js"
fi

echo ""
echo "🎉 API URL updated successfully!"
echo ""
echo "📱 Next steps:"
echo "   1. Make sure your backend is running on port 8081"
echo "   2. Make sure your phone and computer are on the same WiFi network"
echo "   3. Restart Expo: npm start"
echo ""
echo "💡 If the IP address is wrong, you can manually edit:"
echo "   - app.config.js (line 47)"
echo "   - src/config/api.js (lines 50, 54)"
echo "   - src/screens/PaymentScreen.js (lines 653, 654)"

