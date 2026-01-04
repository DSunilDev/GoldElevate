# Database Setup Guide

## Quick Setup

### 1. **Create Database**
```sql
CREATE DATABASE IF NOT EXISTS gold_investment;
USE gold_investment;
```

### 2. **Run SQL Scripts**
```bash
# From project root
mysql -u root -p < conf/01_init.sql
mysql -u root -p < conf/03_setup.sql
mysql -u root -p < conf/02_performance_indexes.sql
```

### 3. **Add Elite and Ultimate Packages**
```sql
INSERT INTO def_type (typeid, short, name, bv, price, yes21, c_upper, daily_return)
VALUES 
  (7, 'Elite', 'Elite Investment Package', 400000, 400000, 'Yes', 10000, 12000),
  (8, 'Ultimate', 'Ultimate Investment Package', 800000, 800000, 'Yes', 10000, 20000)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  price = VALUES(price),
  daily_return = VALUES(daily_return);
```

### 4. **Configure Database Connection**
Update `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gold_investment
DB_USER=your_username
DB_PASSWORD=your_password
```

## Database Structure

### Key Tables
- `member` - User accounts
- `def_type` - Investment packages
- `sale` - Investment transactions
- `upi_payment` - Payment records
- `income` - Income records
- `income_amount` - Calculated bonuses
- `income_ledger` - Wallet transactions

### Indexes
All performance indexes are in `conf/02_performance_indexes.sql`

## Connection Pool

The backend uses a connection pool for better performance:
- Max connections: 10
- Keep-alive enabled
- Automatic reconnection

## Health Check

Test database connection:
```bash
curl http://localhost:8081/api/health
```

## Backup

Automatic backups are scheduled (if enabled):
- Schedule: 2 AM daily
- Location: `backend/backups/`
- Format: SQL dump

