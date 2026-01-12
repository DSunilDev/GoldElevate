#!/bin/bash

set -e

echo "📦 Bundling JavaScript..."
cd "$(dirname "$0")"

# Create assets directory
mkdir -p android/app/src/main/assets

# Bundle JavaScript
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res/ \
  --minify false

echo "✅ Bundle created"

# Verify bundle exists
if [ -f "android/app/src/main/assets/index.android.bundle" ]; then
  echo "✅ Bundle file exists: $(ls -lh android/app/src/main/assets/index.android.bundle | awk '{print $5}')"
else
  echo "❌ Bundle file not found!"
  exit 1
fi

echo ""
echo "🔨 Building APK..."
cd android

export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export ANDROID_HOME="$HOME/Library/Android/sdk"

./gradlew clean assembleRelease

echo ""
echo "✅ Build complete!"
echo "📱 APK location: app/build/outputs/apk/release/app-release.apk"

