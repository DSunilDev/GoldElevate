-- Add payment method and account details to member_withdraw table
ALTER TABLE `member_withdraw` 
ADD COLUMN `payment_method` ENUM('Bank','UPI') DEFAULT 'Bank' AFTER `amount`,
ADD COLUMN `account_number` VARCHAR(50) DEFAULT NULL AFTER `payment_method`,
ADD COLUMN `ifsc_code` VARCHAR(20) DEFAULT NULL AFTER `account_number`,
ADD COLUMN `upi_id` VARCHAR(100) DEFAULT NULL AFTER `ifsc_code`,
ADD COLUMN `bank_name` VARCHAR(100) DEFAULT NULL AFTER `upi_id`,
ADD COLUMN `account_holder_name` VARCHAR(255) DEFAULT NULL AFTER `bank_name`,
ADD COLUMN `admin_transaction_id` VARCHAR(255) DEFAULT NULL AFTER `transax_id`;

-- Create payment gateway settings table
CREATE TABLE IF NOT EXISTS `payment_gateway_settings` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `upi_id` VARCHAR(255) DEFAULT NULL,
  `qr_code_url` VARCHAR(500) DEFAULT NULL,
  `qr_code_base64` TEXT DEFAULT NULL,
  `bank_account_number` VARCHAR(50) DEFAULT NULL,
  `bank_ifsc_code` VARCHAR(20) DEFAULT NULL,
  `bank_name` VARCHAR(255) DEFAULT NULL,
  `account_holder_name` VARCHAR(255) DEFAULT NULL,
  `gpay_merchant_id` VARCHAR(255) DEFAULT NULL,
  `phonepe_merchant_id` VARCHAR(255) DEFAULT NULL,
  `gpay_enabled` ENUM('Yes','No') DEFAULT 'Yes',
  `phonepe_enabled` ENUM('Yes','No') DEFAULT 'Yes',
  `updated_by` VARCHAR(255) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Insert default payment gateway settings
INSERT INTO `payment_gateway_settings` 
(`upi_id`, `qr_code_url`, `bank_account_number`, `bank_ifsc_code`, `bank_name`, `account_holder_name`, `gpay_enabled`, `phonepe_enabled`)
VALUES 
('yourbusiness@upi', '/images/upi-qr.jpg', '1234567890', 'BANK0001234', 'Bank Name', 'Account Holder Name', 'Yes', 'Yes')
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;

