#!/bin/bash
# Complete database setup script for GoldElevate

echo "🚀 GoldElevate Database Setup"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Database configuration
DB_NAME="gold_investment"
DB_USER="gold_user"
DB_PASS="gold123"

# Check if MySQL is available
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MySQL command not found. Please install MySQL.${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 Setting up database: $DB_NAME${NC}"
echo ""

# Prompt for MySQL root password
read -sp "Enter MySQL root password: " ROOT_PASS
echo ""

# Step 1: Create database user (if needed)
echo -e "${YELLOW}Step 1: Creating database user...${NC}"
mysql -u root -p"$ROOT_PASS" <<EOF 2>/dev/null
CREATE DATABASE IF NOT EXISTS $DB_NAME;
DROP USER IF EXISTS '$DB_USER'@'localhost';
CREATE USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database user created${NC}"
else
    echo -e "${RED}❌ Failed to create user. Trying with existing user...${NC}"
fi

# Step 2: Create database
echo ""
echo -e "${YELLOW}Step 2: Creating database...${NC}"
mysql -u root -p"$ROOT_PASS" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database created${NC}"
else
    echo -e "${RED}❌ Failed to create database${NC}"
    exit 1
fi

# Step 3: Run schema
echo ""
echo -e "${YELLOW}Step 3: Running database schema...${NC}"
if [ -f "database/01_init.sql" ]; then
    mysql -u root -p"$ROOT_PASS" $DB_NAME < database/01_init.sql 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Schema loaded${NC}"
    else
        echo -e "${RED}❌ Failed to load schema${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Schema file not found: database/01_init.sql${NC}"
    exit 1
fi

# Step 4: Add indexes
echo ""
echo -e "${YELLOW}Step 4: Adding performance indexes...${NC}"
if [ -f "database/02_performance_indexes.sql" ]; then
    mysql -u root -p"$ROOT_PASS" $DB_NAME < database/02_performance_indexes.sql 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Indexes added${NC}"
    else
        echo -e "${YELLOW}⚠️  Indexes may already exist (this is OK)${NC}"
    fi
fi

# Step 5: Add phone column
echo ""
echo -e "${YELLOW}Step 5: Adding phone column...${NC}"
if [ -f "database/03_add_phone_column.sql" ]; then
    mysql -u root -p"$ROOT_PASS" $DB_NAME < database/03_add_phone_column.sql 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Phone column added${NC}"
    else
        echo -e "${YELLOW}⚠️  Phone column may already exist (this is OK)${NC}"
    fi
fi

# Step 6: Payment gateway setup
echo ""
echo -e "${YELLOW}Step 6: Setting up payment gateway...${NC}"
if [ -f "database/04_payment_gateway.sql" ]; then
    mysql -u root -p"$ROOT_PASS" $DB_NAME < database/04_payment_gateway.sql 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Payment gateway configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Payment gateway may already be configured (this is OK)${NC}"
    fi
fi

# Step 7: Verify setup
echo ""
echo -e "${YELLOW}Step 7: Verifying setup...${NC}"
TABLE_COUNT=$(mysql -u root -p"$ROOT_PASS" $DB_NAME -e "SHOW TABLES;" 2>/dev/null | wc -l)

if [ "$TABLE_COUNT" -gt 1 ]; then
    echo -e "${GREEN}✅ Database setup complete! Found $((TABLE_COUNT - 1)) tables${NC}"
else
    echo -e "${RED}❌ Setup verification failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Database setup complete!${NC}"
echo ""
echo "📝 Database credentials:"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Password: $DB_PASS"
echo ""
echo "✅ You can now start the backend with:"
echo "   cd backend && npm start"

