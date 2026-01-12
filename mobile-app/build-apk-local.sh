#!/bin/bash

# Quick script to build APK locally (requires Android Studio)

set -e

echo "📱 GoldElevate - Build APK Locally"
echo "==================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the mobile-app directory"
    exit 1
fi

# Check if Android folder exists
if [ ! -d "android" ]; then
    echo "❌ Error: Android folder not found. Run 'npx expo prebuild' first"
    exit 1
fi

# Check and set JAVA_HOME (prefer Java 17 or 19 for Android builds)
echo "🔍 Detecting Java installation..."
if command -v /usr/libexec/java_home &> /dev/null; then
    # Try Java 17 first (recommended for Android)
    JAVA_HOME_PATH=$(/usr/libexec/java_home -v 17 2>/dev/null)
    
    # If not found, try Java 19
    if [ -z "$JAVA_HOME_PATH" ]; then
        JAVA_HOME_PATH=$(/usr/libexec/java_home -v 19 2>/dev/null)
    fi
    
    # If still not found, try Java 11
    if [ -z "$JAVA_HOME_PATH" ]; then
        JAVA_HOME_PATH=$(/usr/libexec/java_home -v 11 2>/dev/null)
    fi
    
    # Last resort: use any available Java
    if [ -z "$JAVA_HOME_PATH" ]; then
        JAVA_HOME_PATH=$(/usr/libexec/java_home 2>/dev/null)
    fi
    
    if [ -n "$JAVA_HOME_PATH" ] && [ -d "$JAVA_HOME_PATH" ]; then
        export JAVA_HOME="$JAVA_HOME_PATH"
        JAVA_VERSION=$(java -version 2>&1 | head -1)
        echo "✅ Using Java: $JAVA_HOME"
        echo "   Version: $JAVA_VERSION"
        
        # Note about Java 23 (Gradle 8.5+ supports it)
        if echo "$JAVA_VERSION" | grep -q "23\|24\|25"; then
            echo "ℹ️  Note: Using Java 23 with Gradle 8.5 (compatible)"
        fi
    else
        echo "❌ Error: Could not find valid Java installation"
        echo "   Please install Java JDK 17 (recommended) or set JAVA_HOME manually"
        echo "   Download: https://adoptium.net/temurin/releases/?version=17"
        exit 1
    fi
else
    if [ -z "$JAVA_HOME" ] || [ ! -d "$JAVA_HOME" ]; then
        echo "❌ Error: Could not detect Java. Please set JAVA_HOME manually"
        exit 1
    else
        echo "✅ Using JAVA_HOME: $JAVA_HOME"
    fi
fi

# Check if ANDROID_HOME is set
if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️  Warning: ANDROID_HOME not set. Trying default location..."
    if [ -d "$HOME/Library/Android/sdk" ]; then
        export ANDROID_HOME="$HOME/Library/Android/sdk"
        export PATH=$PATH:$ANDROID_HOME/platform-tools
        echo "✅ Found Android SDK at: $ANDROID_HOME"
    else
        echo "❌ Error: Android SDK not found. Please install Android Studio first."
        echo "   Download: https://developer.android.com/studio"
        exit 1
    fi
fi

echo "🔨 Building release APK..."
echo ""

# Use Gradle directly to build APK (avoids device connection issues)
echo "Using Gradle to build APK directly..."
cd android

# Build the APK
echo "🔨 Running Gradle build..."
./gradlew assembleRelease

cd ..

# Find the APK
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
    echo "❌ Error: APK not found at expected location: $APK_PATH"
    exit 1
fi

