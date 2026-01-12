#!/bin/bash
# Quick script to create gold_user MySQL user
# Usage: ./create-user.sh [root_password]

echo "🔧 Creating gold_user MySQL user..."

if [ -z "$1" ]; then
    echo "Usage: $0 <mysql_root_password>"
    echo "Or run manually:"
    echo "  mysql -u root -p < create-gold-user.sql"
    exit 1
fi

ROOT_PASS="$1"

mysql -u root -p"$ROOT_PASS" <<EOF
-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS gold_investment;

-- Drop user if exists (to recreate with correct password)
DROP USER IF EXISTS 'gold_user'@'localhost';

-- Create user
CREATE USER 'gold_user'@'localhost' IDENTIFIED BY 'gold123';

-- Grant all privileges on gold_investment database
GRANT ALL PRIVILEGES ON gold_investment.* TO 'gold_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify user was created
SELECT 'User created successfully!' AS Status;
SELECT User, Host FROM mysql.user WHERE User = 'gold_user';
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ gold_user created successfully!"
    echo "   User: gold_user"
    echo "   Password: gold123"
    echo "   Database: gold_investment"
    echo ""
    echo "You can now start the backend with: npm start"
else
    echo ""
    echo "❌ Failed to create user. Please check your MySQL root password."
    exit 1
fi

