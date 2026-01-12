#!/bin/bash
# Import GoldElevate Database Schema

# Database configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-gold_user}"
DB_PASSWORD="${DB_PASSWORD:-gold123}"
DB_NAME="${DB_NAME:-gold_investment}"

# SQL file to import
SQL_FILE="${1:-../goldelevate_schema_all.sql}"

if [ ! -f "$SQL_FILE" ]; then
  echo "❌ SQL file not found: $SQL_FILE"
  echo "   Usage: ./import-database.sh [path_to_sql_file]"
  exit 1
fi

echo "📦 Importing database schema..."
echo "   Host: $DB_HOST"
echo "   User: $DB_USER"
echo "   Database: $DB_NAME"
echo "   File: $SQL_FILE"
echo ""

# Import SQL file
mysql \
  -h "$DB_HOST" \
  -P "$DB_PORT" \
  -u "$DB_USER" \
  -p"$DB_PASSWORD" \
  "$DB_NAME" < "$SQL_FILE" 2> /tmp/mysql_import_errors.log

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ Database imported successfully!"
  
  # Check for warnings
  if [ -s /tmp/mysql_import_errors.log ]; then
    echo ""
    echo "⚠️  Warnings (non-critical):"
    grep -v "Using a password" /tmp/mysql_import_errors.log | head -5
  fi
  
  rm -f /tmp/mysql_import_errors.log
  
  # Verify import
  echo ""
  echo "🔍 Verifying import..."
  TABLE_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | wc -l | tr -d ' ')
  echo "   Tables found: $((TABLE_COUNT - 1))"
  
  exit 0
else
  echo ""
  echo "❌ Import failed!"
  if [ -s /tmp/mysql_import_errors.log ]; then
    echo "   Error details:"
    cat /tmp/mysql_import_errors.log | grep -v "Using a password"
  fi
  rm -f /tmp/mysql_import_errors.log
  exit 1
fi

