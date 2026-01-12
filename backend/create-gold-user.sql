-- Create gold_user MySQL user and grant privileges
-- Run this with: mysql -u root -p < create-gold-user.sql

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS gold_investment;

-- Create user if it doesn't exist (or update password if it does)
CREATE USER IF NOT EXISTS 'gold_user'@'localhost' IDENTIFIED BY 'gold123';

-- If user already exists, update password
ALTER USER 'gold_user'@'localhost' IDENTIFIED BY 'gold123';

-- Grant all privileges on gold_investment database
GRANT ALL PRIVILEGES ON gold_investment.* TO 'gold_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify user was created
SELECT User, Host FROM mysql.user WHERE User = 'gold_user';

