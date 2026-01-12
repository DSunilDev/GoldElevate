#!/bin/bash

# Quick APK installation script for Android phone

set -e

cd "$(dirname "$0")"

APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

echo "📱 GoldElevate APK Installer"
echo "============================"
echo ""

# Check if APK exists
if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK not found at: $APK_PATH"
    echo "🔨 Building APK first..."
    echo ""
    
    cd android
    export JAVA_HOME=$(/usr/libexec/java_home -v 17 2>/dev/null || /usr/libexec/java_home)
    export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
    ./gradlew assembleRelease
    cd ..
    
    if [ ! -f "$APK_PATH" ]; then
        echo "❌ Build failed or APK not found"
        exit 1
    fi
fi

APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
echo "✅ APK found: $APK_PATH ($APK_SIZE)"
echo ""

# Check if ADB is available
if ! command -v adb &> /dev/null; then
    echo "⚠️  ADB not found. Install it with:"
    echo "   brew install android-platform-tools"
    echo ""
    echo "📋 Manual installation steps:"
    echo "   1. Transfer APK to your phone (USB, email, cloud)"
    echo "   2. Enable 'Install from unknown sources' in Settings"
    echo "   3. Open the APK file on your phone and install"
    echo ""
    echo "📦 APK location: $APK_PATH"
    exit 0
fi

# Check if device is connected
echo "🔍 Checking for connected devices..."
DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l | tr -d ' ')

if [ "$DEVICES" -eq "0" ]; then
    echo "❌ No Android device connected"
    echo ""
    echo "📋 Please:"
    echo "   1. Connect your phone via USB"
    echo "   2. Enable USB debugging:"
    echo "      Settings → About Phone → Tap 'Build Number' 7 times"
    echo "      Settings → Developer Options → Enable 'USB Debugging'"
    echo "   3. Accept the USB debugging prompt on your phone"
    echo ""
    echo "📦 Or manually transfer the APK:"
    echo "   $APK_PATH"
    exit 1
fi

echo "✅ Found $DEVICES device(s)"
echo ""

# Install APK
echo "📲 Installing APK..."
adb install -r "$APK_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation successful!"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Make sure your backend is running at http://192.168.0.109:8081"
    echo "   2. Ensure your phone is on the same Wi-Fi network"
    echo "   3. Open the GoldElevate app on your phone"
    echo ""
    echo "💡 To launch the app:"
    echo "   adb shell am start -n com.goldelevate/.MainActivity"
else
    echo ""
    echo "❌ Installation failed"
    echo ""
    echo "💡 Try manually:"
    echo "   1. Transfer APK to phone: $APK_PATH"
    echo "   2. Enable 'Install from unknown sources'"
    echo "   3. Open and install the APK"
fi

