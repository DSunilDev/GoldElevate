#!/usr/bin/env node
/**
 * Test MySQL database connection with different password options
 */

const mysql = require('mysql2/promise');

const testConnection = async (config) => {
  try {
    const connection = await mysql.createConnection(config);
    await connection.ping();
    await connection.end();
    return true;
  } catch (error) {
    return false;
  }
};

const testPasswords = [
  'Root@123',
  'root',
  '',
  'password',
  '123456',
  'admin',
  'gold123'
];

async function main() {
  console.log('🔍 Testing MySQL Connection...\n');
  
  const baseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'gold_investment'
  };

  // Test with no password first
  console.log('Testing with no password...');
  const noPasswordResult = await testConnection(baseConfig);
  if (noPasswordResult) {
    console.log('✅ SUCCESS: MySQL connection works WITHOUT password!\n');
    console.log('💡 Solution: Remove password from database config or set DB_PASSWORD=""');
    process.exit(0);
  }
  console.log('❌ Failed\n');

  // Test with provided password
  if (process.env.DB_PASSWORD) {
    console.log(`Testing with provided password: ${process.env.DB_PASSWORD}...`);
    const providedResult = await testConnection({
      ...baseConfig,
      password: process.env.DB_PASSWORD
    });
    if (providedResult) {
      console.log('✅ SUCCESS: MySQL connection works with provided password!\n');
      process.exit(0);
    }
    console.log('❌ Failed\n');
  }

  // Test common passwords
  console.log('Testing common passwords...');
  for (const password of testPasswords) {
    const result = await testConnection({
      ...baseConfig,
      password: password
    });
    if (result) {
      console.log(`✅ SUCCESS: MySQL password is "${password}"!\n`);
      console.log('💡 Solution: Set DB_PASSWORD=' + password + ' or create .env file');
      process.exit(0);
    }
  }

  console.log('❌ Could not connect with any tested password.\n');
  console.log('💡 Options:');
  console.log('   1. Find your MySQL root password');
  console.log('   2. Reset MySQL root password');
  console.log('   3. Create a new MySQL user for this app');
  console.log('\nTo reset MySQL root password on macOS:');
  console.log('   sudo /usr/local/mysql/support-files/mysql.server stop');
  console.log('   sudo mysqld_safe --skip-grant-tables &');
  console.log('   mysql -u root');
  console.log('   ALTER USER \'root\'@\'localhost\' IDENTIFIED BY \'Root@123\';');
  console.log('   FLUSH PRIVILEGES;');
  process.exit(1);
}

main();

