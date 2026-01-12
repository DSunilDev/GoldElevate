#!/bin/bash

# Quick script to build standalone APK for Android

set -e

echo "📱 GoldElevate - Build Standalone APK"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the mobile-app directory"
    exit 1
fi

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Check if logged in
if ! eas whoami &> /dev/null; then
    echo "🔐 Not logged in to Expo. Please login:"
    echo ""
    eas login
    echo ""
fi

# Check if project is initialized
if ! grep -q "projectId" app.config.js 2>/dev/null; then
    echo "⚙️  Initializing EAS project..."
    eas init
    echo ""
fi

echo "🔨 Building APK (this will take 10-20 minutes)..."
echo ""
echo "📝 Note: You can check build progress at:"
echo "   https://expo.dev/accounts/[your-account]/projects/gold-elevate/builds"
echo ""

# Build APK
eas build --platform android --profile preview

echo ""
echo "✅ Build complete! Check the link above to download your APK."
echo ""
echo "📱 To install on your phone:"
echo "   1. Download the APK from the link above"
echo "   2. Transfer to your Android phone"
echo "   3. Enable 'Install from unknown sources' in Settings"
echo "   4. Open the APK file and install"
echo ""

