// Test Data Generator for Backend API
// Run: node backend/test-data.js

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'gold_user',
  password: process.env.DB_PASSWORD || 'gold123',
  database: process.env.DB_NAME || 'gold_investment'
};

async function insertTestData() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Test Packages (if not exist)
    const [packages] = await connection.execute(
      `SELECT COUNT(*) as count FROM def_type`
    );
    
    if (packages[0].count === 0) {
      console.log('📦 Inserting test packages...');
      await connection.execute(
        `INSERT INTO def_type (typeid, short, name, price, daily_return, bv) VALUES
         (1, 'premium', 'Premium', 80000, 2600, 800),
         (2, 'brahmastra', 'Brahmastra', 50000, 2000, 500),
         (3, 'master', 'Master', 40000, 1600, 400),
         (4, 'expert', 'Expert', 20000, 800, 200),
         (5, 'intermediate', 'Intermediate', 10000, 400, 100),
         (6, 'starter', 'Starter', 5000, 200, 50)`
      );
      console.log('✅ Test packages inserted');
    } else {
      console.log(`✅ Packages already exist (${packages[0].count} packages)`);
    }
    
    // Test Member (if not exist)
    const [members] = await connection.execute(
      `SELECT memberid FROM member WHERE login = 'testuser'`
    );
    
    let testMemberId;
    if (members.length === 0) {
      console.log('👤 Inserting test member...');
      const crypto = require('crypto');
      const password = crypto.createHash('sha1').update('testuser' + 'testpass123').digest('hex');
      
      // Get next available member ID
      const [maxId] = await connection.execute(
        `SELECT COALESCE(MAX(memberid), 0) + 1 as nextid FROM member`
      );
      testMemberId = maxId[0].nextid;
      
      await connection.execute(
        `INSERT INTO member (memberid, login, passwd, active, typeid, email, firstname, lastname, sid, pid, top, leg, reward_points, created) 
         VALUES (?, 'testuser', ?, 'Yes', 6, 'test@example.com', 'Test', 'User', 1, 1, 1, 'L', 150, NOW())`,
        [testMemberId, password]
      );
      console.log(`✅ Test member inserted (ID: ${testMemberId}, login: testuser, password: testpass123)`);
    } else {
      testMemberId = members[0].memberid;
      console.log(`✅ Test member already exists (ID: ${testMemberId})`);
    }
    
    // Test Admin (if not exist)
    const [admins] = await connection.execute(
      `SELECT COUNT(*) as count FROM admin WHERE login = 'testadmin'`
    );
    
    if (admins[0].count === 0) {
      console.log('🔧 Inserting test admin...');
      const crypto = require('crypto');
      const password = crypto.createHash('sha1').update('testadmin' + 'admin123').digest('hex');
      
      await connection.execute(
        `INSERT INTO admin (adminid, login, passwd, status, created) 
         VALUES ('ROOT', 'testadmin', SHA1(CONCAT('testadmin', 'admin123')), 'Yes', NOW())`
      );
      console.log('✅ Test admin inserted (login: testadmin, password: admin123)');
    } else {
      console.log('✅ Test admin already exists');
    }
    
    // Test Sale/Investment
    const [sales] = await connection.execute(
      `SELECT COUNT(*) as count FROM sale WHERE memberid = ?`,
      [testMemberId]
    );
    
    if (sales[0].count === 0) {
      console.log('💰 Inserting test investment...');
      await connection.execute(
        `INSERT INTO sale (memberid, typeid, amount, paystatus, created) 
         VALUES (?, 6, 5000, 'Delivered', NOW())`,
        [testMemberId]
      );
      console.log('✅ Test investment inserted');
    } else {
      console.log('✅ Test investment already exists');
    }
    
    // Test Income
    const [income] = await connection.execute(
      `SELECT COUNT(*) as count FROM income WHERE memberid = ?`,
      [testMemberId]
    );
    
    if (income[0].count === 0) {
      console.log('💵 Inserting test income...');
      await connection.execute(
        `INSERT INTO income (memberid, classify, amount, created) 
         VALUES (?, 'direct', 1000, NOW())`,
        [testMemberId]
      );
      console.log('✅ Test income inserted');
    } else {
      console.log('✅ Test income already exists');
    }
    
    // Test Ledger
    const [ledger] = await connection.execute(
      `SELECT COUNT(*) as count FROM income_ledger WHERE memberid = ?`,
      [testMemberId]
    );
    
    if (ledger[0].count === 0) {
      console.log('📊 Inserting test ledger entry...');
      await connection.execute(
        `INSERT INTO income_ledger (memberid, amount, balance, shop_balance, status, remark, created) 
         VALUES (?, 200, 200, 0, 'Weekly', 'Daily return', NOW())`,
        [testMemberId]
      );
      console.log('✅ Test ledger entry inserted');
    } else {
      console.log('✅ Test ledger entry already exists');
    }
    
    console.log('\n✅ All test data inserted successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('   Member: testuser / testpass123');
    console.log('   Admin: testadmin / admin123');
    
  } catch (error) {
    console.error('❌ Error inserting test data:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

// Run if executed directly
if (require.main === module) {
  insertTestData()
    .then(() => {
      console.log('\n🎉 Test data setup complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test data setup failed:', error);
      process.exit(1);
    });
}

module.exports = { insertTestData };

