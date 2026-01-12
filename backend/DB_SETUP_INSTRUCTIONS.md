# 🔧 Database Connection Setup

## Current Issue
The backend cannot connect to MySQL because the root password is not set correctly.

## Quick Solutions

### Option 1: Find Your MySQL Password (Recommended)
Try connecting to MySQL from terminal:
```bash
mysql -u root -p
```
Enter your password when prompted. If it works, use that password.

### Option 2: Reset MySQL Root Password

**For macOS (Homebrew MySQL):**
```bash
# Stop MySQL
brew services stop mysql

# Start MySQL in safe mode
mysqld_safe --skip-grant-tables &

# Connect without password
mysql -u root

# In MySQL prompt, run:
ALTER USER 'root'@'localhost' IDENTIFIED BY 'Root@123';
FLUSH PRIVILEGES;
EXIT;

# Restart MySQL normally
brew services restart mysql
```

**For macOS (MySQL installed from .dmg):**
```bash
# Stop MySQL
sudo /usr/local/mysql/support-files/mysql.server stop

# Start in safe mode
sudo mysqld_safe --skip-grant-tables &

# Connect
mysql -u root

# Reset password
ALTER USER 'root'@'localhost' IDENTIFIED BY 'Root@123';
FLUSH PRIVILEGES;
EXIT;

# Restart MySQL
sudo /usr/local/mysql/support-files/mysql.server start
```

### Option 3: Create .env File
Create `backend/.env` file with your actual MySQL password:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_ACTUAL_PASSWORD_HERE
DB_NAME=gold_investment
PORT=8081
```

### Option 4: Set Environment Variable
```bash
cd backend
DB_PASSWORD=your_actual_password npm start
```

## Verify Database Exists
Make sure the database exists:
```bash
mysql -u root -p -e "SHOW DATABASES;"
```

If `gold_investment` doesn't exist, create it:
```bash
mysql -u root -p -e "CREATE DATABASE gold_investment;"
```

## Test Connection
After setting the password, test the connection:
```bash
cd backend
node check-db-password.js
```

