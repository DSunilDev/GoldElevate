#!/bin/bash

# Quick fix for JAVA_HOME issue

echo "🔧 Fixing JAVA_HOME..."
echo ""

# Detect correct Java path
JAVA_HOME_PATH=$(/usr/libexec/java_home 2>/dev/null)

if [ -z "$JAVA_HOME_PATH" ]; then
    echo "❌ Error: No Java installation found"
    echo "   Please install Java JDK first"
    exit 1
fi

echo "✅ Found Java at: $JAVA_HOME_PATH"
echo ""

# Set JAVA_HOME for current session
export JAVA_HOME="$JAVA_HOME_PATH"
export PATH="$JAVA_HOME/bin:$PATH"

echo "✅ JAVA_HOME set to: $JAVA_HOME"
echo ""

# Verify
if [ -d "$JAVA_HOME" ]; then
    echo "✅ JAVA_HOME is valid"
    java -version 2>&1 | head -1
    echo ""
    echo "💡 To make this permanent, add to your ~/.zshrc:"
    echo "   export JAVA_HOME=\$(/usr/libexec/java_home)"
    echo "   export PATH=\"\$JAVA_HOME/bin:\$PATH\""
    echo ""
    echo "   Then run: source ~/.zshrc"
else
    echo "❌ Error: JAVA_HOME path is invalid"
    exit 1
fi

