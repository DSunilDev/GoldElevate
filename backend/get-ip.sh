#!/bin/bash

# Get the current machine's IP address on the local network
echo "Finding your machine's IP address..."
echo ""

# Try different methods to get IP
if command -v ipconfig &> /dev/null; then
    # macOS
    IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "Not found")
    echo "Your IP address (en0/en1): $IP"
elif command -v hostname &> /dev/null; then
    # Linux/Unix fallback
    IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "Not found")
    echo "Your IP address: $IP"
fi

echo ""
echo "If the IP above doesn't match 192.168.0.107, update mobile-app/src/config/api.js"
echo "with the correct IP address."

