#!/usr/bin/env node
/**
 * Setup script to create gold_user MySQL user if it doesn't exist
 * Run this with root MySQL access: node setup-db-user.js
 */

const mysql = require('mysql2/promise');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupUser() {
  console.log('🔧 MySQL User Setup for GoldElevate\n');
  console.log('This script will create the gold_user MySQL user if it doesn\'t exist.\n');
  
  // Get root credentials
  const rootUser = await question('MySQL root user [root]: ') || 'root';
  const rootPassword = await question('MySQL root password: ');
  
  rl.close();
  
  let rootConnection;
  try {
    // Connect as root
    console.log('\n🔌 Connecting to MySQL as root...');
    rootConnection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: rootUser,
      password: rootPassword
    });
    console.log('✅ Connected to MySQL\n');
    
    // Check if gold_user exists
    const [users] = await rootConnection.execute(
      `SELECT User FROM mysql.user WHERE User = 'gold_user'`
    );
    
    if (users.length > 0) {
      console.log('ℹ️  User gold_user already exists');
      
      // Try to update password
      try {
        await rootConnection.execute(
          `ALTER USER 'gold_user'@'localhost' IDENTIFIED BY 'gold123'`
        );
        console.log('✅ Updated password for gold_user');
      } catch (err) {
        console.log('⚠️  Could not update password (may need to drop and recreate)');
      }
    } else {
      // Create the user
      console.log('👤 Creating gold_user...');
      await rootConnection.execute(
        `CREATE USER 'gold_user'@'localhost' IDENTIFIED BY 'gold123'`
      );
      console.log('✅ Created gold_user');
    }
    
    // Grant privileges
    console.log('🔐 Granting privileges...');
    await rootConnection.execute(
      `GRANT ALL PRIVILEGES ON gold_investment.* TO 'gold_user'@'localhost'`
    );
    
    // If database doesn't exist, create it
    try {
      await rootConnection.execute(`CREATE DATABASE IF NOT EXISTS gold_investment`);
      console.log('✅ Database gold_investment ready');
    } catch (err) {
      // Database might already exist, that's fine
    }
    
    await rootConnection.execute(`FLUSH PRIVILEGES`);
    console.log('✅ Privileges granted\n');
    
    // Test the new user
    console.log('🧪 Testing gold_user connection...');
    const testConnection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'gold_user',
      password: 'gold123',
      database: 'gold_investment'
    });
    await testConnection.ping();
    await testConnection.end();
    console.log('✅ gold_user connection test successful!\n');
    
    console.log('🎉 Setup complete! You can now start the backend with:');
    console.log('   cd backend && npm start\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. MySQL is running');
    console.error('   2. Root password is correct');
    console.error('   3. You have permission to create users');
    process.exit(1);
  } finally {
    if (rootConnection) {
      await rootConnection.end();
    }
  }
}

setupUser();

