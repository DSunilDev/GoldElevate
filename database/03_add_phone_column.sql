-- Add phone column to member table for phone-based registration
-- Run this migration to add phone number support

ALTER TABLE `member` 
ADD COLUMN `phone` VARCHAR(10) NULL AFTER `email`,
ADD UNIQUE KEY `phone` (`phone`);

-- Update existing records if needed (optional)
-- UPDATE member SET phone = CONCAT('9', LPAD(memberid, 9, '0')) WHERE phone IS NULL;

