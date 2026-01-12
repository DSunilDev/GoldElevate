/**
 * Test script to debug sale record insertion
 * This will help identify why sale records are not being created
 */

require('dotenv').config();
const { pool, query } = require('../config/database');
const { logger } = require('../config/database');

async function testSaleInsert() {
  try {
    logger.info('========================================');
    logger.info('TESTING SALE RECORD INSERT');
    logger.info('========================================');

    // Get a test member and package
    const testMember = await query('SELECT memberid FROM member LIMIT 1');
    const testPackage = await query('SELECT typeid, price FROM def_type LIMIT 1');

    if (!testMember || testMember.length === 0) {
      logger.error('No members found in database');
      return;
    }

    if (!testPackage || testPackage.length === 0) {
      logger.error('No packages found in database');
      return;
    }

    const memberId = testMember[0].memberid;
    const packageId = testPackage[0].typeid;
    const amount = testPackage[0].price || 5000;

    logger.info(`Test data: memberId=${memberId}, packageId=${packageId}, amount=${amount}`);

    // Get last sale ID
    const lastSale = await query('SELECT saleid FROM sale ORDER BY saleid DESC LIMIT 1');
    const lastSaleId = lastSale && lastSale.length > 0 ? lastSale[0].saleid : null;
    logger.info(`Last sale ID: ${lastSaleId || 'No sales found'}`);
    const expectedNextId = lastSaleId ? lastSaleId + 1 : 1;

    // Test 1: Using pool.execute (as in payment submit)
    logger.info('\n--- Test 1: Using pool.execute ---');
    try {
      const result1 = await pool.execute(
        `INSERT INTO sale (memberid, typeid, amount, signuptype, paystatus, active, paytype, created)
         VALUES (?, ?, ?, 'Yes', 'Pending', 'No', 'UPI', NOW())`,
        [memberId, packageId, amount]
      );

      logger.info('Result from pool.execute:', {
        resultType: typeof result1,
        isArray: Array.isArray(result1),
        length: result1 ? result1.length : 0,
        result0: result1[0] ? {
          insertId: result1[0].insertId,
          affectedRows: result1[0].affectedRows,
          type: typeof result1[0],
          keys: result1[0] ? Object.keys(result1[0]) : null
        } : 'null',
        fullResult: JSON.stringify(result1, null, 2)
      });

      if (result1 && result1[0] && result1[0].insertId) {
        const insertId = result1[0].insertId;
        logger.info(`✅ SUCCESS: Inserted sale record with ID ${insertId} (expected: ${expectedNextId})`);

        // Verify it exists
        const verify = await query('SELECT * FROM sale WHERE saleid = ?', [insertId]);
        if (verify && verify.length > 0) {
          logger.info(`✅ VERIFIED: Sale record ${insertId} exists in database:`, verify[0]);
          // Clean up - delete test record
          await query('DELETE FROM sale WHERE saleid = ?', [insertId]);
          logger.info(`✅ Cleaned up: Deleted test sale record ${insertId}`);
        } else {
          logger.error(`❌ FAILED: Sale record ${insertId} not found in database after insert!`);
        }
      } else {
        logger.error('❌ FAILED: No insertId returned from pool.execute');
      }
    } catch (error) {
      logger.error('❌ ERROR with pool.execute:', error.message);
      logger.error('Error stack:', error.stack);
    }

    // Test 2: Using query() function (as in payment init)
    logger.info('\n--- Test 2: Using query() function ---');
    try {
      const result2 = await query(
        `INSERT INTO sale (memberid, typeid, amount, signuptype, paystatus, active, paytype, created)
         VALUES (?, ?, ?, 'Yes', 'Pending', 'No', 'UPI', NOW())`,
        [memberId, packageId, amount]
      );

      logger.info('Result from query():', {
        resultType: typeof result2,
        isArray: Array.isArray(result2),
        insertId: result2?.insertId,
        affectedRows: result2?.affectedRows,
        fullResult: JSON.stringify(result2, null, 2)
      });

      if (result2 && result2.insertId) {
        const insertId = result2.insertId;
        logger.info(`✅ SUCCESS: Inserted sale record with ID ${insertId} using query()`);

        // Verify it exists
        const verify = await query('SELECT * FROM sale WHERE saleid = ?', [insertId]);
        if (verify && verify.length > 0) {
          logger.info(`✅ VERIFIED: Sale record ${insertId} exists in database:`, verify[0]);
          // Clean up - delete test record
          await query('DELETE FROM sale WHERE saleid = ?', [insertId]);
          logger.info(`✅ Cleaned up: Deleted test sale record ${insertId}`);
        } else {
          logger.error(`❌ FAILED: Sale record ${insertId} not found in database after insert!`);
        }
      } else {
        logger.error('❌ FAILED: No insertId returned from query()');
      }
    } catch (error) {
      logger.error('❌ ERROR with query():', error.message);
      logger.error('Error stack:', error.stack);
    }

    // Test 3: Check for constraint violations
    logger.info('\n--- Test 3: Testing constraint violations ---');
    
    // Test with invalid memberid
    try {
      await pool.execute(
        `INSERT INTO sale (memberid, typeid, amount, signuptype, paystatus, active, paytype, created)
         VALUES (?, ?, ?, 'Yes', 'Pending', 'No', 'UPI', NOW())`,
        [999999, packageId, amount]
      );
      logger.error('❌ UNEXPECTED: INSERT succeeded with invalid memberid (should fail due to foreign key)');
    } catch (error) {
      logger.info(`✅ EXPECTED: Foreign key constraint works - ${error.message}`);
    }

    // Test with invalid typeid
    try {
      await pool.execute(
        `INSERT INTO sale (memberid, typeid, amount, signuptype, paystatus, active, paytype, created)
         VALUES (?, ?, ?, 'Yes', 'Pending', 'No', 'UPI', NOW())`,
        [memberId, 999, amount]
      );
      logger.error('❌ UNEXPECTED: INSERT succeeded with invalid typeid');
    } catch (error) {
      logger.info(`✅ EXPECTED: Typeid constraint works - ${error.message}`);
    }

    logger.info('\n========================================');
    logger.info('TEST COMPLETE');
    logger.info('========================================');

  } catch (error) {
    logger.error('FATAL ERROR in test:', error);
    logger.error('Error stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run the test
if (require.main === module) {
  testSaleInsert()
    .then(() => {
      logger.info('Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testSaleInsert };
