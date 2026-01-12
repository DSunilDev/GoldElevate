#!/bin/bash
# Fix Expo MIME error by clearing caches

echo "🧹 Cleaning Expo caches..."

cd "$(dirname "$0")"

# Clear Metro bundler cache
echo "Clearing Metro cache..."
rm -rf .expo
rm -rf node_modules/.cache
rm -rf .expo-shared

# Clear watchman cache (if installed)
if command -v watchman &> /dev/null; then
    echo "Clearing Watchman cache..."
    watchman watch-del-all 2>/dev/null || true
fi

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

echo ""
echo "✅ Caches cleared!"
echo ""
echo "Now restart Expo with:"
echo "  npm run start:clear"
echo "  or"
echo "  npx expo start --clear"

