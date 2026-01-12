#!/bin/bash

# Workaround: Build with Java 23 by upgrading Gradle
# This is a temporary solution - Java 17 is still recommended

set -e

echo "🔧 Building with Java 23 (workaround)"
echo "======================================"
echo ""

cd "$(dirname "$0")"

if [ ! -d "android" ]; then
    echo "❌ Error: android folder not found"
    exit 1
fi

# Set JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home)
echo "✅ Using Java: $JAVA_HOME"
java -version 2>&1 | head -1
echo ""

# Upgrade Gradle to 8.5+ which supports Java 23
echo "📦 Upgrading Gradle wrapper to 8.5 (supports Java 23)..."
cd android

# Update gradle-wrapper.properties
sed -i.bak 's|gradle-8.0.1-all.zip|gradle-8.5-all.zip|g' gradle/wrapper/gradle-wrapper.properties
echo "✅ Gradle wrapper updated to 8.5"
echo ""

# Clean and build
echo "🔨 Building APK..."
./gradlew clean assembleRelease

# Restore original gradle version
mv gradle/wrapper/gradle-wrapper.properties.bak gradle/wrapper/gradle-wrapper.properties 2>/dev/null || true

cd ..

APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📦 APK Location: $APK_PATH"
    echo "📏 APK Size: $APK_SIZE"
else
    echo "❌ Error: APK not found"
    exit 1
fi

