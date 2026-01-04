#!/bin/bash
# Installation script for Gold Investment Mobile App

echo "🚀 Installing Gold Investment Mobile App Package..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check MySQL
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL not found. Please install MySQL 8.0+ first."
    exit 1
fi

echo "✅ MySQL found"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install mobile app dependencies
echo "📦 Installing mobile app dependencies..."
cd mobile-app
npm install
cd ..

echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "1. Set up database (see database/README.md)"
echo "2. Configure backend .env file (see backend/.env.example)"
echo "3. Update mobile app API URL in app.config.js"
echo "4. Start backend: cd backend && npm start"
echo "5. Start mobile app: cd mobile-app && npx expo start"
