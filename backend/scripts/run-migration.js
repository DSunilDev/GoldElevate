require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    // Create connection
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      database: process.env.DB_NAME || 'mlm_manager',
    };

    if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '') {
      dbConfig.password = process.env.DB_PASSWORD;
    }

    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Read SQL file
    const sqlFile = path.join(__dirname, '../../database/04_payment_gateway.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          await connection.execute(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          // Ignore "Duplicate column" errors (column already exists)
          if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message}`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    
    // Verify tables
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'payment_gateway_settings'"
    );
    
    if (tables.length > 0) {
      console.log('✅ payment_gateway_settings table exists');
      
      // Check columns in member_withdraw
      const [columns] = await connection.execute(
        "SHOW COLUMNS FROM member_withdraw LIKE 'payment_method'"
      );
      
      if (columns.length > 0) {
        console.log('✅ member_withdraw table updated with new columns');
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

runMigration();

