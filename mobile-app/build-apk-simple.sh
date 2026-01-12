#!/bin/bash

# Simple direct Gradle build - no device connection needed

set -e

cd "$(dirname "$0")"

if [ ! -d "android" ]; then
    echo "❌ Error: android folder not found. Run from mobile-app directory"
    exit 1
fi

# Set JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home)
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

echo "📱 Building APK with Gradle..."
echo "Java: $JAVA_HOME"
echo "Android SDK: $ANDROID_HOME"
echo ""

cd android
./gradlew assembleRelease

cd ..

APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📦 APK Location: $APK_PATH"
    echo "📏 APK Size: $APK_SIZE"
    echo ""
    echo "📱 To install on your phone:"
    echo "   1. Transfer APK to your phone (USB, email, cloud)"
    echo "   2. Enable 'Install from unknown sources' in Settings"
    echo "   3. Open the APK file and install"
    echo ""
    echo "💡 Quick install via USB (if USB debugging enabled):"
    echo "   adb install $APK_PATH"
else
    echo "❌ Error: APK not found at: $APK_PATH"
    echo "   Check the build output above for errors"
    exit 1
fi

