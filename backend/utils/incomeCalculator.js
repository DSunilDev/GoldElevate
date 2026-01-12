const { query, transaction } = require('../config/database');
const { logger } = require('../config/database');

/**
 * Credits daily returns for active packages at their exact activation time
 * This function checks all active packages and credits daily returns if:
 * 1. The current time matches the activation time (hour:minute)
 * 2. Daily returns haven't been credited today for this package
 */
async function processDailyReturns() {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    logger.info(`[DAILY RETURNS] Processing daily returns at ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);

    // Get all active packages with their activation times and daily returns
    // Note: Requires activated_at column in sale table (run migration first)
    let activePackages;
    try {
      activePackages = await query(
        `SELECT 
          s.saleid,
          s.memberid,
          s.typeid,
          s.activated_at,
          dt.name as package_name,
          dt.daily_return,
          TIME(s.activated_at) as activation_time
        FROM sale s
        INNER JOIN def_type dt ON s.typeid = dt.typeid
        WHERE s.paystatus = 'Delivered' 
          AND s.active = 'Yes'
          AND s.activated_at IS NOT NULL
          AND dt.daily_return > 0
        ORDER BY s.saleid`
      );
    } catch (error) {
      if (error.message && error.message.includes('activated_at')) {
        logger.error(
          '[DAILY RETURNS] ❌ activated_at column not found in sale table. ' +
          'Please run the migration: backend/migrations/add_activated_at_to_sale.sql'
        );
        return { processed: 0, credits: 0, error: 'Column not found' };
      }
      throw error;
    }

    if (!activePackages || activePackages.length === 0) {
      logger.info(`[DAILY RETURNS] No active packages found`);
      return { processed: 0, credits: 0 };
    }

    logger.info(`[DAILY RETURNS] Found ${activePackages.length} active packages to check`);

    let processedCount = 0;
    let creditsCount = 0;

    for (const pkg of activePackages) {
      try {
        // Parse activation time
        if (!pkg.activated_at) {
          logger.warn(`[DAILY RETURNS] Package ${pkg.saleid} has no activation time, skipping`);
          continue;
        }

        const activatedAt = new Date(pkg.activated_at);
        const activationHour = activatedAt.getHours();
        const activationMinute = activatedAt.getMinutes();

        // Check if current time matches activation time (same hour and minute)
        if (currentHour !== activationHour || currentMinute !== activationMinute) {
          continue; // Not time for this package yet
        }

        // Check if daily returns have already been credited today for this specific package (saleid)
        const existingCredit = await query(
          `SELECT ledgerid 
           FROM income_ledger 
           WHERE memberid = ? 
             AND status = 'In' 
             AND remark LIKE ?
             AND DATE(created) = ?`,
          [
            pkg.memberid,
            `%Sale ID: ${pkg.saleid}%`,
            today
          ]
        );

        if (existingCredit && existingCredit.length > 0) {
          logger.info(`[DAILY RETURNS] Daily returns already credited today for package ${pkg.saleid} (Member ${pkg.memberid})`);
          continue;
        }

        // Get current balance for the member
        const balanceResult = await query(
          `SELECT balance, weekid 
           FROM income_ledger 
           WHERE memberid = ? 
           ORDER BY ledgerid DESC LIMIT 1`,
          [pkg.memberid]
        );

        let currentBalance = 0;
        let weekid = 0;

        if (balanceResult && balanceResult.length > 0) {
          currentBalance = Number(balanceResult[0].balance || 0);
          weekid = Number(balanceResult[0].weekid || 0);
        }

        const dailyReturn = Number(pkg.daily_return || 0);
        const newBalance = currentBalance + dailyReturn;

        // Credit daily returns to income_ledger
        await transaction(async (connection) => {
          await connection.execute(
            `INSERT INTO income_ledger 
             (memberid, weekid, amount, balance, status, remark, created)
             VALUES (?, ?, ?, ?, 'In', ?, NOW())`,
            [
              pkg.memberid,
              weekid,
              dailyReturn,
              newBalance,
              `Daily return - Package: ${pkg.package_name} (Sale ID: ${pkg.saleid})`
            ]
          );
        });

        creditsCount++;
        processedCount++;
        logger.info(
          `[DAILY RETURNS] ✅ Credited ₹${dailyReturn} to Member ${pkg.memberid} ` +
          `for package ${pkg.package_name} (Sale ID: ${pkg.saleid}). ` +
          `Balance: ₹${currentBalance} → ₹${newBalance}`
        );

      } catch (error) {
        logger.error(
          `[DAILY RETURNS] ❌ Error processing package ${pkg.saleid} (Member ${pkg.memberid}):`,
          error.message
        );
        // Continue with other packages even if one fails
      }
    }

    logger.info(
      `[DAILY RETURNS] ✅ Completed: ${processedCount} packages checked, ${creditsCount} daily returns credited`
    );

    return { processed: processedCount, credits: creditsCount };
  } catch (error) {
    logger.error('[DAILY RETURNS] ❌ Fatal error processing daily returns:', error);
    throw error;
  }
}

/**
 * Calculate daily income for all active packages (legacy function for backward compatibility)
 * This is called by the cron job
 */
async function calculateDailyIncome() {
  return await processDailyReturns();
}

module.exports = {
  processDailyReturns,
  calculateDailyIncome
};
