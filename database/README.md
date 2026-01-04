# 📊 Database Setup

## Database Files

1. **01_init.sql** - Main database schema
   - Creates all tables
   - Sets up foreign keys
   - Defines indexes

2. **02_performance_indexes.sql** - Performance optimization
   - Adds indexes for faster queries
   - Optimizes frequently accessed columns

## Setup Instructions

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE mlm_manager;"

# Run schema
mysql -u root -p mlm_manager < 01_init.sql

# Add indexes
mysql -u root -p mlm_manager < 02_performance_indexes.sql
```

## Database Structure

### Core Tables
- `member` - User accounts
- `admin` - Admin accounts
- `def_type` - Package definitions
- `sale` - Investment records
- `upi_payment` - Payment records
- `income` - Income records
- `income_amount` - Processed income
- `income_ledger` - Wallet/balance ledger
- `member_signup` - Signup applications

## Default Admin

Create admin account:
```sql
INSERT INTO admin (login, passwd, status) 
VALUES ('admin', SHA1(CONCAT('admin', 'password')), 'Yes');
```

Login: `admin`  
Password: `password`

**⚠️ Change default password in production!**

