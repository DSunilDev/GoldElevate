#!/bin/bash

echo "📱 Getting crash logs from Android device..."
echo ""

# Clear logcat
adb logcat -c

echo "🚀 Starting app..."
adb shell am force-stop com.goldelevate
adb shell am start -n com.goldelevate/.MainActivity

echo "⏳ Waiting 5 seconds for crash..."
sleep 5

echo ""
echo "📋 Crash logs:"
echo "=============="
adb logcat -d | grep -E "(FATAL|AndroidRuntime|Exception|Error|goldelevate)" | tail -100

echo ""
echo "📋 Full AndroidRuntime stack trace:"
echo "===================================="
adb logcat -d | grep -A 50 "AndroidRuntime" | tail -100

