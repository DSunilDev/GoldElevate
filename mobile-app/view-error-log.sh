#!/bin/bash
# Script to help view error logs from Expo

echo "🔍 Viewing Error Logs"
echo "======================"
echo ""

echo "1️⃣ Check Metro Bundler Logs:"
echo "   Look in the terminal where you ran 'npm start'"
echo "   Look for any red error messages"
echo ""

echo "2️⃣ View Error Log on Phone:"
echo "   - Tap 'View error log' button on the error screen"
echo "   - Or shake device → 'Show Dev Menu' → 'Show Element Inspector'"
echo ""

echo "3️⃣ Check React Native Debugger:"
echo "   - Shake device in Expo Go"
echo "   - Select 'Debug Remote JS'"
echo "   - Open Chrome DevTools (chrome://inspect)"
echo ""

echo "4️⃣ Check Logcat (Android):"
echo "   adb logcat | grep -i 'error\|exception\|fatal'"
echo ""

echo "5️⃣ Enable Verbose Logging:"
echo "   In Metro terminal, press 'd' to open developer menu"
echo "   Or set environment variable:"
echo "   REACT_NATIVE_LOG_LEVEL=verbose npm start"
echo ""

echo "6️⃣ Check for Network Errors:"
echo "   Test backend from phone browser:"
echo "   http://192.168.0.109:8081/api/health"
echo ""

