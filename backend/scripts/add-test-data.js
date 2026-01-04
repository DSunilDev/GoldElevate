require('dotenv').config();
const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');

async function addTestData() {
  try {
    console.log('📝 Adding test data to database...\n');

    // 1. Create Test Admin
    console.log('1. Creating test admin...');
    const adminPhone = '9999999999';
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    // Check if admin exists
    const [existingAdmin] = await query(
      `SELECT memberid FROM member WHERE phone = ? AND role = 'admin'`,
      [adminPhone]
    );

    let adminId;
    if (existingAdmin.length === 0) {
      await query(
        `INSERT INTO member (login, passwd, phone, firstname, lastname, email, role, active, sid, pid, typeid)
         VALUES (?, ?, ?, 'Admin', 'User', 'admin@goldelevate.com', 'admin', 'Yes', 1, 1, 1)`,
        ['admin', adminPassword, adminPhone]
      );
      const [newAdmin] = await query(`SELECT memberid FROM member WHERE phone = ?`, [adminPhone]);
      adminId = newAdmin[0].memberid;
      console.log('✅ Admin created - Phone: 9999999999, Password: admin123');
    } else {
      adminId = existingAdmin[0].memberid;
      await query(`UPDATE member SET passwd = ? WHERE memberid = ?`, [adminPassword, adminId]);
      console.log('✅ Admin updated - Phone: 9999999999, Password: admin123');
    }

    // 2. Create Test Agent
    console.log('\n2. Creating test agent...');
    const agentPhone = '8888888888';
    const agentPassword = await bcrypt.hash('agent123', 10);
    
    const [existingAgent] = await query(
      `SELECT memberid FROM member WHERE login = 'agent'`
    );

    let agentId;
    if (existingAgent.length === 0) {
      const [result] = await query(
        `INSERT INTO member (login, passwd, firstname, lastname, email, active, sid, pid, typeid)
         VALUES (?, ?, 'Agent', 'User', 'agent@goldelevate.com', 'Yes', 1, 1, 1)`,
        ['agent', agentPassword]
      );
      agentId = result.insertId;
      try {
        await query(`UPDATE member SET phone = ? WHERE memberid = ?`, [agentPhone, agentId]);
      } catch (e) {
        // Phone column might not exist
      }
      console.log('✅ Agent created - Login: agent, Phone: 8888888888, Password: agent123');
    } else {
      agentId = existingAgent[0].memberid;
      await query(`UPDATE member SET passwd = ? WHERE memberid = ?`, [agentPassword, agentId]);
      try {
        await query(`UPDATE member SET phone = ? WHERE memberid = ?`, [agentPhone, agentId]);
      } catch (e) {
        // Phone column might not exist
      }
      console.log('✅ Agent updated - Login: agent, Phone: 8888888888, Password: agent123');
    }

    // 3. Create Test Users
    console.log('\n3. Creating test users...');
    const testUsers = [
      { phone: '7777777777', name: 'John', password: 'user123', sponsor: adminId },
      { phone: '6666666666', name: 'Jane', password: 'user123', sponsor: agentId },
      { phone: '5555555555', name: 'Bob', password: 'user123', sponsor: adminId },
    ];

    for (const user of testUsers) {
      const [existing] = await query(`SELECT memberid FROM member WHERE login = ?`, [user.phone]);
      if (existing.length === 0) {
        const userPassword = await bcrypt.hash(user.password, 10);
        const [result] = await query(
          `INSERT INTO member (login, passwd, firstname, lastname, email, active, sid, pid, typeid)
           VALUES (?, ?, ?, 'User', ?, 'Yes', ?, 1, 1)`,
          [user.phone, userPassword, user.name, `${user.phone}@goldelevate.com`, user.sponsor]
        );
        try {
          await query(`UPDATE member SET phone = ? WHERE memberid = ?`, [user.phone, result.insertId]);
        } catch (e) {
          // Phone column might not exist
        }
        console.log(`✅ User created - Login: ${user.phone}, Phone: ${user.phone}, Password: ${user.password}, Name: ${user.name}`);
      } else {
        const userId = existing[0].memberid;
        const userPassword = await bcrypt.hash(user.password, 10);
        await query(`UPDATE member SET passwd = ? WHERE memberid = ?`, [userPassword, userId]);
        try {
          await query(`UPDATE member SET phone = ? WHERE memberid = ?`, [user.phone, userId]);
        } catch (e) {
          // Phone column might not exist
        }
        console.log(`⚠️  User already exists - Updated password - Login: ${user.phone}, Phone: ${user.phone}`);
      }
    }

    // 4. Create Test Packages
    console.log('\n4. Creating test packages...');
    const testPackages = [
      { name: 'Gold Starter', price: 1000, bv: 1000, daily_return: 50, yes21: 21 },
      { name: 'Gold Premium', price: 5000, bv: 5000, daily_return: 250, yes21: 21 },
      { name: 'Gold Elite', price: 10000, bv: 10000, daily_return: 500, yes21: 21 },
      { name: 'Gold Platinum', price: 25000, bv: 25000, daily_return: 1250, yes21: 21 },
    ];

    for (const pkg of testPackages) {
      const [existing] = await query(`SELECT typeid FROM def_type WHERE name = ?`, [pkg.name]);
      if (existing.length === 0) {
        await query(
          `INSERT INTO def_type (name, price, bv, daily_return, yes21, c_upper)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [pkg.name, pkg.price, pkg.bv, pkg.daily_return, pkg.yes21, 0]
        );
        console.log(`✅ Package created - ${pkg.name} (₹${pkg.price})`);
      } else {
        console.log(`⚠️  Package already exists - ${pkg.name}`);
      }
    }

    // 5. Create Test Payments
    console.log('\n5. Creating test payments...');
    const [users] = await query(`SELECT memberid FROM member WHERE role = 'member' LIMIT 3`);
    const [packages] = await query(`SELECT typeid, price FROM def_type LIMIT 3`);

    for (let i = 0; i < Math.min(users.length, packageTypes.length); i++) {
      const userId = users[i].memberid;
      const packageId = packageTypes[i].typeid;
      const amount = packageTypes[i].price;

      // Check if payment exists
      const [existingSale] = await query(
        `SELECT saleid FROM sale WHERE memberid = ? AND typeid = ?`,
        [userId, packageId]
      );

      if (existingSale.length === 0) {
        await transaction(async (conn) => {
          // Create sale
          const [saleResult] = await conn.execute(
            `INSERT INTO sale (memberid, typeid, amount, signuptype, created)
             VALUES (?, ?, ?, 'Yes', NOW())`,
            [userId, packageId, amount]
          );
          const saleId = saleResult.insertId;

          // Create UPI payment (pending)
          await conn.execute(
            `INSERT INTO upi_payment (saleid, amount, transaction_id, status, created)
             VALUES (?, ?, ?, 'Pending', NOW())`,
            [saleId, amount, `TXN${Date.now()}${i}`, 'Pending']
          );

          console.log(`✅ Payment created - User ID: ${userId}, Amount: ₹${amount}, Status: Pending`);
        });
      }
    }

    // 6. Create Test Withdrawals
    console.log('\n6. Creating test withdrawals...');
    const [activeUsers] = await query(
      `SELECT memberid FROM member WHERE login NOT IN ('admin', 'agent') AND active = 'Yes' LIMIT 2`
    );

    for (const user of activeUsers) {
      // Initialize wallet if needed
      const [ledger] = await query(
        `SELECT balance FROM income_ledger WHERE memberid = ? ORDER BY ledgerid DESC LIMIT 1`,
        [user.memberid]
      );

      let balance = 0;
      if (ledger.length > 0) {
        balance = parseFloat(ledger[0].balance) || 0;
      } else {
        // Create initial ledger entry
        await query(
          `INSERT INTO income_ledger (memberid, weekid, amount, balance, status, remark, created)
           VALUES (?, 0, 1000, 1000, 'Bonus', 'Initial test balance', NOW())`,
          [user.memberid]
        );
        balance = 1000;
      }

      if (balance > 100) {
        // Create withdrawal request
        const [existing] = await query(
          `SELECT id FROM member_withdraw WHERE memberid = ? AND status IN ('apply', 'pending')`,
          [user.memberid]
        );

        if (existing.length === 0) {
          await query(
            `INSERT INTO member_withdraw (memberid, amount, payment_method, account_number, ifsc_code, upi_id, transax_id, memo, status, created)
             VALUES (?, ?, 'Bank', '1234567890', 'HDFC0001234', NULL, ?, 'Test withdrawal request', 'apply', NOW())`,
            [user.memberid, Math.min(500, balance - 100), `WD${Date.now()}`]
          );
          console.log(`✅ Withdrawal created - User ID: ${user.memberid}, Amount: ₹${Math.min(500, balance - 100)}`);
        }
      }
    }

    // 7. Update Payment Gateway Settings
    console.log('\n7. Updating payment gateway settings...');
    await query(
      `UPDATE payment_gateway_settings SET
       upi_id = 'goldelevate@upi',
       bank_account_number = '9876543210',
       bank_ifsc_code = 'HDFC0001234',
       bank_name = 'HDFC Bank',
       account_holder_name = 'GoldElevate',
       gpay_enabled = 'Yes',
       phonepe_enabled = 'Yes'
       WHERE id = 1`
    );
    console.log('✅ Payment gateway settings updated');

    console.log('\n✅ All test data added successfully!\n');
    console.log('📱 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ADMIN:');
    console.log('  Phone: 9999999999');
    console.log('  Password: admin123');
    console.log('');
    console.log('AGENT:');
    console.log('  Phone: 8888888888');
    console.log('  Password: agent123');
    console.log('');
    console.log('USERS:');
    console.log('  Phone: 7777777777 | Password: user123 | Name: John');
    console.log('  Phone: 6666666666 | Password: user123 | Name: Jane');
    console.log('  Phone: 5555555555 | Password: user123 | Name: Bob');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error adding test data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  addTestData()
    .then(() => {
      console.log('✅ Test data setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to add test data:', error);
      process.exit(1);
    });
}

module.exports = { addTestData };

