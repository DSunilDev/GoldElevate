#!/bin/bash
# Permanent backend startup script with CORS fix

cd "$(dirname "$0")/backend"

# Kill any existing backend process
lsof -ti:8081 | xargs kill -9 2>/dev/null
sleep 2

# Set database credentials if not already set
# You can override these by creating a .env file in the backend directory
export DB_HOST=${DB_HOST:-localhost}
export DB_PORT=${DB_PORT:-3306}
export DB_USER=${DB_USER:-gold_user}
export DB_PASSWORD=${DB_PASSWORD:-gold123}
export DB_NAME=${DB_NAME:-gold_investment}

# Start backend server
echo "Starting backend server..."
echo "Database: $DB_NAME@$DB_HOST (user: $DB_USER)"
node server.js

