require('dotenv').config();
const { query } = require('./config/database');
const bcrypt = require('bcryptjs');

async function createTestMember() {
  try {
    console.log('🔧 Creating/updating test member...\n');

    // Check if test member exists
    const existing = await query(
      'SELECT memberid, login, phone, active FROM member WHERE phone = ? OR login = ?',
      ['9876543210', 'testuser']
    );

    if (existing.length > 0) {
      const member = existing[0];
      console.log(`Found existing member: memberid=${member.memberid}, login=${member.login}, phone=${member.phone}, active=${member.active}`);
      
      // Update to ensure it's active and has correct login
      await query(
        'UPDATE member SET active = ?, login = ? WHERE memberid = ?',
        ['Yes', 'testuser', member.memberid]
      );
      
      // Update phone if needed
      if (member.phone !== '9876543210') {
        await query('UPDATE member SET phone = ? WHERE memberid = ?', ['9876543210', member.memberid]);
      }
      
      console.log('✅ Test member updated successfully!');
      console.log('   Phone: 9876543210');
      console.log('   Login: testuser');
      console.log('   Status: Active');
    } else {
      // Get a valid typeid from existing members
      const typeResult = await query('SELECT DISTINCT typeid FROM member WHERE typeid IS NOT NULL LIMIT 1');
      let defaultTypeId = typeResult.length > 0 ? typeResult[0].typeid : null;
      
      // If no existing members, try to get from def_type
      if (!defaultTypeId) {
        const defTypeResult = await query('SELECT typeid FROM def_type LIMIT 1');
        defaultTypeId = defTypeResult.length > 0 ? defTypeResult[0].typeid : null;
      }
      
      if (!defaultTypeId) {
        console.log('⚠️  No valid typeid found. Checking existing members for reference...');
        const anyMember = await query('SELECT typeid FROM member LIMIT 1');
        if (anyMember.length > 0 && anyMember[0].typeid) {
          defaultTypeId = anyMember[0].typeid;
        } else {
          throw new Error('Cannot create test member: No valid typeid available. Please ensure database has at least one member or type definition.');
        }
      }
      
      // Create new test member
      const password = await bcrypt.hash('test123', 10);
      
      await query(
        `INSERT INTO member (login, passwd, phone, firstname, lastname, email, active, sid, pid, typeid, signuptime, created)
         VALUES (?, ?, ?, 'Test', 'User', 'testuser@goldelevate.com', 'Yes', 1, 1, ?, NOW(), NOW())`,
        ['testuser', password, '9876543210', defaultTypeId]
      );
      
      console.log('✅ Test member created successfully!');
      console.log('   Phone: 9876543210');
      console.log('   Login: testuser');
      console.log('   Password: test123');
      console.log('   Status: Active');
    }
    
    console.log('\n✅ Test member is ready for test login!');
  } catch (error) {
    console.error('❌ Error creating test member:', error);
    process.exit(1);
  }
}

createTestMember().then(() => {
  process.exit(0);
});

