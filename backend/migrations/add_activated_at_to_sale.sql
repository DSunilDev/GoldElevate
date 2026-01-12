-- Migration: Add activated_at column to sale table
-- This column stores the timestamp when a package was approved/activated
-- Daily returns will be credited at this exact time every day
--
-- This script safely adds the column if it doesn't exist
-- It will not fail if the column already exists

-- Check if column exists and add it if not (MySQL 5.7+ compatible)
SET @dbname = DATABASE();
SET @tablename = 'sale';
SET @columnname = 'activated_at';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1', -- Column exists, do nothing
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DATETIME NULL AFTER active')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- For existing packages, set activated_at to their created time if it's NULL
-- This ensures existing packages will still get daily returns
-- Updates all rows where activated_at is NULL (regardless of active/paystatus status)
-- This is a one-time migration for existing data

-- First, update active and delivered packages
UPDATE sale 
SET activated_at = created 
WHERE active = 'Yes' 
  AND paystatus = 'Delivered' 
  AND activated_at IS NULL;

-- Also update any other packages with NULL activated_at (for completeness)
-- This handles edge cases where active/paystatus might not be set but packages exist
UPDATE sale 
SET activated_at = created 
WHERE activated_at IS NULL 
  AND created IS NOT NULL;
