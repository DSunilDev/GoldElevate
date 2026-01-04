#!/bin/bash

# GoldElevate Database Migration Script
# This script runs the payment gateway migration

echo "🚀 GoldElevate Database Migration"
echo "=================================="
echo ""

# Check if MySQL is available
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL command not found. Please install MySQL client."
    exit 1
fi

# Get database credentials
DB_USER="root"
DB_PASS="Root@123"
DB_NAME="mlm_manager"
DB_HOST="localhost"

echo ""
echo "📝 Running migration..."

# Run the SQL file
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < database/04_payment_gateway.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Verifying tables..."
    
    # Verify tables
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
        SHOW TABLES LIKE 'payment_gateway_settings';
        DESCRIBE member_withdraw;
    " 2>/dev/null
    
    echo ""
    echo "✅ Setup complete! You can now start the backend server."
else
    echo ""
    echo "❌ Migration failed. Please check your database credentials and try again."
    exit 1
fi

