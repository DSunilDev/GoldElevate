#!/usr/bin/env node

// Quick test to verify backend is accessible
const http = require('http');

const testUrl = 'http://localhost:3000/api/auth/login-send-otp';
const testData = JSON.stringify({ phone: '9999999999' });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login-send-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData)
  }
};

console.log('Testing backend connection...');
console.log(`URL: ${testUrl}`);

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`\n✅ Backend is responding!`);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response: ${data.substring(0, 200)}`);
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error(`\n❌ Connection failed: ${error.message}`);
  console.error('\nTroubleshooting:');
  console.error('1. Make sure backend is running: cd backend && PORT=3000 node server.js');
  console.error('2. Check if port 3000 is in use: lsof -i :3000');
  console.error('3. Verify database connection in backend/.env');
  process.exit(1);
});

req.setTimeout(5000, () => {
  console.error('\n❌ Request timed out after 5 seconds');
  req.destroy();
  process.exit(1);
});

req.write(testData);
req.end();

