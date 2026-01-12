-- Migration: Make member.typeid nullable
-- This allows users to sign up without a package assigned
-- typeid will only be set when they purchase their first investment package
--
-- This script safely modifies the column if it exists
-- It will not fail if the column is already nullable

-- Check if column exists and if it's NOT NULL, then make it nullable
SET @dbname = DATABASE();
SET @tablename = 'member';
SET @columnname = 'typeid';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
      AND (IS_NULLABLE = 'NO')
  ) > 0,
  -- Column exists and is NOT NULL, make it nullable
  CONCAT('ALTER TABLE ', @tablename, ' MODIFY COLUMN ', @columnname, ' tinyint(3) unsigned NULL'),
  'SELECT 1' -- Already nullable or doesn't exist, do nothing
));
PREPARE alterIfNeeded FROM @preparedStatement;
EXECUTE alterIfNeeded;
DEALLOCATE PREPARE alterIfNeeded;

-- Note: Foreign key constraint (member_ibfk_1) will automatically allow NULL values
-- MySQL foreign key constraints allow NULL values by default, so we don't need to drop/recreate it
-- However, if you get an error about foreign key constraint, you may need to temporarily disable foreign key checks