# Database Access Guide

## Database Credentials

- **Host**: localhost
- **Port**: 3306
- **Database**: gold_investment
- **User**: gold_user
- **Password**: gold123

## Export Database

### Option 1: Using the Export Script (Recommended)

```bash
cd backend
./export-database.sh [output_filename.sql]
```

Example:
```bash
./export-database.sh my_backup.sql
```

If no filename is provided, it will create a file with timestamp: `gold_investment_export_YYYYMMDD_HHMMSS.sql`

### Option 2: Using mysqldump Directly

```bash
mysqldump \
  -h localhost \
  -P 3306 \
  -u gold_user \
  -pgold123 \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --add-drop-database \
  --databases gold_investment > gold_investment_backup.sql
```

### Option 3: Export Specific Tables Only

```bash
mysqldump \
  -h localhost \
  -u gold_user \
  -pgold123 \
  gold_investment \
  member def_type sale income > tables_backup.sql
```

## Import Database

```bash
mysql -h localhost -u gold_user -pgold123 < gold_investment_backup.sql
```

Or:

```bash
mysql -h localhost -u gold_user -pgold123 gold_investment < backup.sql
```

## Access Database via MySQL Client

### Command Line

```bash
mysql -h localhost -u gold_user -pgold123 gold_investment
```

### Using Environment Variables

```bash
export DB_PASSWORD=gold123
export DB_USER=gold_user
export DB_NAME=gold_investment

mysql -h localhost -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"
```

## Access via GUI Tools

### MySQL Workbench
- Host: localhost
- Port: 3306
- Username: gold_user
- Password: gold123
- Default Schema: gold_investment

### phpMyAdmin
- Server: localhost:3306
- Username: gold_user
- Password: gold123
- Database: gold_investment

### DBeaver / TablePlus / Sequel Pro
Use the same credentials as above.

## Quick Database Operations

### List All Tables
```bash
mysql -h localhost -u gold_user -pgold123 gold_investment -e "SHOW TABLES;"
```

### Count Records in Table
```bash
mysql -h localhost -u gold_user -pgold123 gold_investment -e "SELECT COUNT(*) FROM member;"
```

### View Table Structure
```bash
mysql -h localhost -u gold_user -pgold123 gold_investment -e "DESCRIBE member;"
```

### Export Single Table
```bash
mysqldump -h localhost -u gold_user -pgold123 gold_investment member > member_backup.sql
```

## Troubleshooting

### If mysqldump is not found:
```bash
# macOS
brew install mysql-client

# Or use full path
/usr/local/mysql/bin/mysqldump ...
```

### If connection fails:
1. Check MySQL is running: `brew services list | grep mysql`
2. Verify credentials in `backend/.env` file
3. Check MySQL user has proper permissions

### Permission Issues:
```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON gold_investment.* TO 'gold_user'@'localhost';
FLUSH PRIVILEGES;
```

