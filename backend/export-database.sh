#!/bin/bash
# Export GoldElevate Database to SQL file

# Database configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-gold_user}"
DB_PASSWORD="${DB_PASSWORD:-gold123}"
DB_NAME="${DB_NAME:-gold_investment}"

# Output file
OUTPUT_FILE="${1:-gold_investment_export_$(date +%Y%m%d_%H%M%S).sql}"

echo "📦 Exporting database: $DB_NAME"
echo "   Host: $DB_HOST"
echo "   User: $DB_USER"
echo "   Output: $OUTPUT_FILE"
echo ""

# Export database
# Note: Removed --single-transaction and FLUSH TABLES to avoid privilege issues
# Redirect stderr to filter warnings but keep errors
mysqldump \
  -h "$DB_HOST" \
  -P "$DB_PORT" \
  -u "$DB_USER" \
  -p"$DB_PASSWORD" \
  --routines \
  --triggers \
  --events \
  --add-drop-database \
  --databases "$DB_NAME" > "$OUTPUT_FILE" 2> /tmp/mysqldump_errors.log

EXIT_CODE=$?

# Check if file was created and has content
if [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
  echo ""
  echo "✅ Database exported successfully!"
  echo "   File: $OUTPUT_FILE"
  echo "   Size: $(du -h "$OUTPUT_FILE" | cut -f1)"
  
  # Show warnings if any (but not password warning)
  if [ -s /tmp/mysqldump_errors.log ]; then
    echo ""
    echo "⚠️  Warnings (non-critical):"
    grep -v "Using a password" /tmp/mysqldump_errors.log | head -3
  fi
  
  rm -f /tmp/mysqldump_errors.log
  exit 0
else
  echo ""
  echo "❌ Export failed!"
  if [ -s /tmp/mysqldump_errors.log ]; then
    echo "   Error details:"
    cat /tmp/mysqldump_errors.log
  fi
  rm -f /tmp/mysqldump_errors.log
  exit 1
fi

