#!/bin/bash

# GoldElevate Demo Startup Script
# This script starts the backend and mobile app for testing

echo "🚀 Starting GoldElevate Demo..."
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if MySQL is running
echo -e "${YELLOW}Checking MySQL connection...${NC}"
mysql -u root -pRoot@123 -e "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ MySQL connected${NC}"
else
    echo -e "${RED}❌ MySQL connection failed${NC}"
    exit 1
fi

# Check database
echo -e "${YELLOW}Checking database...${NC}"
mysql -u root -pRoot@123 -e "USE gold_investment; SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database 'gold_investment' exists${NC}"
else
    echo -e "${RED}❌ Database 'gold_investment' not found${NC}"
    exit 1
fi

# Check if tables exist
echo -e "${YELLOW}Checking tables...${NC}"
TABLES=$(mysql -u root -pRoot@123 gold_investment -e "SHOW TABLES LIKE 'payment_gateway_settings';" 2>/dev/null | wc -l)
if [ "$TABLES" -gt 1 ]; then
    echo -e "${GREEN}✅ Payment gateway settings table exists${NC}"
else
    echo -e "${YELLOW}⚠️  Running migration...${NC}"
    mysql -u root -pRoot@123 gold_investment < database/04_payment_gateway.sql 2>&1 | grep -v "Warning"
    echo -e "${GREEN}✅ Migration completed${NC}"
fi

# Start backend
echo ""
echo -e "${YELLOW}Starting backend server...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install > /dev/null 2>&1
fi

# Kill existing backend if running
lsof -ti:8081 | xargs kill -9 > /dev/null 2>&1

# Start backend in background
npm start > /tmp/goldelevate-backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 5

# Check if backend is running
if curl -s http://localhost:8081/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend server running on http://localhost:8081${NC}"
else
    echo -e "${RED}❌ Backend server failed to start${NC}"
    echo "Check logs: /tmp/goldelevate-backend.log"
    exit 1
fi

# Start mobile app
echo ""
echo -e "${YELLOW}Starting mobile app...${NC}"
cd ../mobile-app

if [ ! -d "node_modules" ]; then
    echo "Installing mobile app dependencies..."
    npm install > /dev/null 2>&1
fi

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "Local IP: $LOCAL_IP"

# Update app.config.js with local IP (if needed)
# This would require sed or similar

echo ""
echo -e "${GREEN}✅ Starting Expo...${NC}"
echo ""
echo "📱 Connect your phone via USB and run:"
echo "   npx expo start --android"
echo ""
echo "Or scan the QR code that appears"
echo ""
echo "Backend logs: /tmp/goldelevate-backend.log"
echo "Backend health: http://localhost:8081/api/health"
echo ""

# Start Expo
npx expo start --android

