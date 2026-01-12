#!/bin/bash

# Pure Gradle build script (no Expo)

set -e

cd "$(dirname "$0")"

if [ ! -d "android" ]; then
    echo "❌ Error: android folder not found"
    exit 1
fi

# Set Java (prefer Java 17)
export JAVA_HOME=$(/usr/libexec/java_home -v 17 2>/dev/null || /usr/libexec/java_home)
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

echo "📱 Pure Gradle Build (No Expo)"
echo "================================"
echo ""
echo "Java: $JAVA_HOME"
echo "Android SDK: $ANDROID_HOME"
echo ""

# Verify Android SDK exists
if [ ! -d "$ANDROID_HOME" ]; then
    echo "❌ Error: Android SDK not found at $ANDROID_HOME"
    echo "   Please install Android Studio or set ANDROID_HOME"
    exit 1
fi

# Create/update local.properties
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
echo "✅ Created android/local.properties"

# Build
echo ""
echo "🔨 Building APK..."
cd android
./gradlew clean assembleRelease

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

