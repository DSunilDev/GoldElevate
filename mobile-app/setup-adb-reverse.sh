#!/bin/bash

# Setup adb reverse port forwarding for Android development
# This forwards port 8081 (Metro bundler) and 3000 (backend) from device to host

echo "🔧 Setting up adb reverse port forwarding..."
echo ""

# Check if adb is installed
if ! command -v adb &> /dev/null; then
    echo "❌ adb not found. Please install Android SDK Platform Tools:"
    echo "   brew install android-platform-tools"
    echo "   OR download from: https://developer.android.com/studio/releases/platform-tools"
    exit 1
fi

# Check if device is connected
DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l | tr -d ' ')

if [ "$DEVICES" -eq "0" ]; then
    echo "❌ No Android device/emulator connected"
    echo ""
    echo "Please:"
    echo "1. Connect your Android device via USB"
    echo "2. Enable USB debugging on your device"
    echo "3. Run this script again"
    exit 1
fi

echo "✅ Found $DEVICES device(s) connected"
echo ""

# Remove existing reverse rules
echo "Cleaning up existing port forwarding..."
adb reverse --remove tcp:8081 2>/dev/null || true
adb reverse --remove tcp:3000 2>/dev/null || true

# Set up reverse port forwarding
echo "Setting up reverse port forwarding:"
echo "  - localhost:8081 -> device:8081 (Metro bundler)"
echo "  - localhost:3000 -> device:3000 (Backend server)"
adb reverse tcp:8081 tcp:8081
adb reverse tcp:3000 tcp:3000

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Port forwarding set up successfully!"
    echo ""
    echo "Now your mobile app can use:"
    echo "  - http://localhost:8081 (for Metro bundler)"
    echo "  - http://localhost:3000 (for backend API)"
    echo ""
    echo "To verify, run: adb reverse --list"
    echo ""
    echo "⚠️  Note: You need to run this script every time you reconnect your device"
    echo "   Or add it to your startup scripts"
else
    echo ""
    echo "❌ Failed to set up port forwarding"
    exit 1
fi

