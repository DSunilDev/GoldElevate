#!/bin/bash
echo "Building web version..."
npx expo export --platform web
echo "Build complete! Check the dist/ folder"
