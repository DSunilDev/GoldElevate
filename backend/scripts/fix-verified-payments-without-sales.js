/**
 * Script to fix verified payments that don't have sale records
 * 
 * This script:
 * 1. Finds verified payments in upi_payment table without corresponding sale records
 * 2. Creates sale records for these payments if packageid can be determined
 * 3. Updates member typeid and active status if needed
 * 
 * Usage: node scripts/fix-verified-payments-without-sales.js
 */

require('dotenv').config();
const { query, transaction, pool } = require('../config/database');
const { logger } = require('../config/database');

async function fixVerifiedPaymentsWithoutSales() {
  try {
    logger.info('[FIX PAYMENTS] Starting fix for verified payments without sale records...');

    // Find verified payments without sale records or with NULL saleid
    const verifiedPayments = await query(`
      SELECT 
        up.upipaymentid,
        up.memberid,
        up.amount,
        up.transaction_id,
        up.created as payment_created,
        up.saleid,
        m.typeid as member_typeid,
        m.active as member_active,
        s.saleid as existing_sale_id
      FROM upi_payment up
      LEFT JOIN member m ON up.memberid = m.memberid
      LEFT JOIN sale s ON up.saleid = s.saleid
      WHERE up.status = 'Verified'
        AND (up.saleid IS NULL OR s.saleid IS NULL)
      ORDER BY up.created DESC
    `);

    if (!verifiedPayments || verifiedPayments.length === 0) {
      logger.info('[FIX PAYMENTS] No verified payments without sale records found.');
      return;
    }

    logger.info(`[FIX PAYMENTS] Found ${verifiedPayments.length} verified payments without sale records.`);

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const payment of verifiedPayments) {
      try {
        logger.info(`[FIX PAYMENTS] Processing payment ${payment.upipaymentid} for member ${payment.memberid}...`);

        // Check if packageid can be determined
        let packageid = null;

        // Option 1: Check member's current typeid (might be set from this payment)
        if (payment.member_typeid) {
          // Verify this package matches the payment amount
          const packageData = await query(
            `SELECT typeid, price FROM def_type WHERE typeid = ?`,
            [payment.member_typeid]
          );

          if (packageData && packageData.length > 0) {
            const pkgPrice = parseFloat(packageData[0].price || 0);
            const paymentAmount = parseFloat(payment.amount || 0);
            
            // If amount matches (within 1% tolerance), use this package
            if (Math.abs(pkgPrice - paymentAmount) / pkgPrice <= 0.01) {
              packageid = payment.member_typeid;
              logger.info(`[FIX PAYMENTS] Found matching package from member typeid: ${packageid}, amount: ₹${pkgPrice}`);
            }
          }
        }

        // Option 2: Find package by amount (if amount is unique)
        if (!packageid) {
          const packagesByAmount = await query(
            `SELECT typeid, price FROM def_type WHERE ABS(price - ?) < 1 ORDER BY ABS(price - ?) LIMIT 1`,
            [payment.amount, payment.amount]
          );

          if (packagesByAmount && packagesByAmount.length > 0) {
            packageid = packagesByAmount[0].typeid;
            logger.info(`[FIX PAYMENTS] Found package by amount match: ${packageid}, amount: ₹${packagesByAmount[0].price}`);
          }
        }

        if (!packageid) {
          logger.warn(`[FIX PAYMENTS] Cannot determine packageid for payment ${payment.upipaymentid} (amount: ₹${payment.amount}). Skipping.`);
          skippedCount++;
          continue;
        }

        // Check if sale record already exists for this member+package+amount
        const existingSale = await query(
          `SELECT saleid FROM sale 
           WHERE memberid = ? AND typeid = ? AND ABS(amount - ?) < 1 
           ORDER BY created DESC LIMIT 1`,
          [payment.memberid, packageid, payment.amount]
        );

        let saleId = null;

        if (existingSale && existingSale.length > 0) {
          // Sale record already exists - link payment to it
          saleId = existingSale[0].saleid;
          logger.info(`[FIX PAYMENTS] Found existing sale record ${saleId}, linking payment to it...`);

          await transaction(async (connection) => {
            // Update payment with saleid
            await connection.execute(
              `UPDATE upi_payment SET saleid = ? WHERE upipaymentid = ?`,
              [saleId, payment.upipaymentid]
            );

            // Update sale to delivered if not already
            await connection.execute(
              `UPDATE sale SET paystatus = 'Delivered', active = 'Yes', 
               activated_at = COALESCE(activated_at, ?) 
               WHERE saleid = ? AND (paystatus != 'Delivered' OR active != 'Yes')`,
              [payment.payment_created, saleId]
            );
          });

          fixedCount++;
          logger.info(`[FIX PAYMENTS] ✅ Linked payment ${payment.upipaymentid} to existing sale ${saleId}`);

        } else {
          // Create new sale record
          logger.info(`[FIX PAYMENTS] Creating new sale record for member ${payment.memberid}, package ${packageid}...`);

          await transaction(async (connection) => {
            // Create sale record
            const [saleInsertResult] = await connection.execute(
              `INSERT INTO sale (memberid, typeid, amount, signuptype, paystatus, active, activated_at, created)
               VALUES (?, ?, ?, 'Yes', 'Delivered', 'Yes', ?, ?)`,
              [payment.memberid, packageid, payment.amount, payment.payment_created, payment.payment_created]
            );

            saleId = saleInsertResult.insertId;

            // Update payment with saleid
            await connection.execute(
              `UPDATE upi_payment SET saleid = ? WHERE upipaymentid = ?`,
              [saleId, payment.upipaymentid]
            );

            // Update member's typeid if not already set
            if (!payment.member_typeid || payment.member_typeid !== packageid) {
              await connection.execute(
                `UPDATE member SET typeid = ?, active = 'Yes' WHERE memberid = ?`,
                [packageid, payment.memberid]
              );
              logger.info(`[FIX PAYMENTS] Updated member ${payment.memberid} typeid to ${packageid}`);
            } else if (payment.member_active !== 'Yes') {
              await connection.execute(
                `UPDATE member SET active = 'Yes' WHERE memberid = ?`,
                [payment.memberid]
              );
              logger.info(`[FIX PAYMENTS] Updated member ${payment.memberid} active status to 'Yes'`);
            }

            // Initialize wallet balance if needed
            const ledgerResult = await connection.execute(
              `SELECT ledgerid FROM income_ledger WHERE memberid = ? LIMIT 1`,
              [payment.memberid]
            );
            const existingLedger = ledgerResult[0];

            if (!existingLedger || existingLedger.length === 0) {
              await connection.execute(
                `INSERT INTO income_ledger (memberid, weekid, amount, balance, status, remark, created)
                 VALUES (?, 0, 0, 0, 'Other', 'Initial wallet balance', NOW())`,
                [payment.memberid]
              );
              logger.info(`[FIX PAYMENTS] Initialized wallet balance for member ${payment.memberid}`);
            }
          });

          fixedCount++;
          logger.info(`[FIX PAYMENTS] ✅ Created sale record ${saleId} for payment ${payment.upipaymentid}`);
        }

      } catch (error) {
        logger.error(`[FIX PAYMENTS] ❌ Error processing payment ${payment.upipaymentid}:`, error);
        errorCount++;
      }
    }

    logger.info(`[FIX PAYMENTS] ============================================`);
    logger.info(`[FIX PAYMENTS] Fix completed:`);
    logger.info(`[FIX PAYMENTS] - Fixed: ${fixedCount}`);
    logger.info(`[FIX PAYMENTS] - Skipped: ${skippedCount}`);
    logger.info(`[FIX PAYMENTS] - Errors: ${errorCount}`);
    logger.info(`[FIX PAYMENTS] ============================================`);

  } catch (error) {
    logger.error('[FIX PAYMENTS] Fatal error:', error);
    throw error;
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  fixVerifiedPaymentsWithoutSales()
    .then(() => {
      logger.info('[FIX PAYMENTS] Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('[FIX PAYMENTS] Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixVerifiedPaymentsWithoutSales };
