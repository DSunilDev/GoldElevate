#!/usr/bin/env node
/**
 * Startup script that sets default environment variables
 * and starts the server
 */

// Set default environment variables if not already set
if (!process.env.DB_PASSWORD) {
  process.env.DB_PASSWORD = 'gold123';
}
if (!process.env.DB_NAME) {
  process.env.DB_NAME = 'gold_investment';
}
if (!process.env.DB_HOST) {
  process.env.DB_HOST = 'localhost';
}
if (!process.env.DB_USER) {
  process.env.DB_USER = 'gold_user';
}
if (!process.env.DB_PORT) {
  process.env.DB_PORT = '3306';
}

console.log('🔧 Database Configuration:');
console.log(`   Host: ${process.env.DB_HOST}`);
console.log(`   Port: ${process.env.DB_PORT}`);
console.log(`   User: ${process.env.DB_USER}`);
console.log(`   Database: ${process.env.DB_NAME}`);
console.log(`   Password: ${process.env.DB_PASSWORD ? '***' : '(not set)'}`);
console.log('');

// Start the server
require('./server.js');

