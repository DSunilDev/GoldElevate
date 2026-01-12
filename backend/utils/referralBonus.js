const { logger } = require('../config/database');

/**
 * Credit referral bonus to sponsor when a new member's first transaction is activated
 * @param {Object} connection - Database connection (from transaction callback)
 * @param {number} memberId - The new member's ID
 * @param {number} packagePrice - The package price (amount)
 * @returns {Promise<Object>} - Result object with success flag and details
 */
async function creditReferralBonus(connection, memberId, packagePrice) {
  try {
    // Get sponsor ID (sid) from member table
    const memberResult = await connection.execute(
      `SELECT sid FROM member WHERE memberid = ?`,
      [memberId]
    );
    
    if (!memberResult || !memberResult[0] || memberResult[0].length === 0) {
      logger.warn(`[REFERRAL BONUS] Member ${memberId} not found`);
      return { success: false, error: 'Member not found' };
    }
    
    const sponsorId = memberResult[0][0].sid;
    
    // Validate sponsor exists and is not default sponsor (1)
    if (!sponsorId || sponsorId === 1 || sponsorId === memberId) {
      logger.info(`[REFERRAL BONUS] No valid sponsor for member ${memberId}. Sponsor ID: ${sponsorId || 'null'}`);
      return { success: false, error: 'No valid sponsor', sponsorId: sponsorId || null };
    }
    
    // Validate package price
    if (!packagePrice || packagePrice <= 0) {
      logger.warn(`[REFERRAL BONUS] Invalid package price for member ${memberId}: ${packagePrice}`);
      return { success: false, error: 'Invalid package price', packagePrice };
    }
    
    // Calculate referral bonus (20% of package price)
    const referralBonus = Math.round(packagePrice * 0.2);
    
    logger.info(`[REFERRAL BONUS] Calculating bonus for member ${memberId}: Package ₹${packagePrice}, Bonus ₹${referralBonus}, Sponsor: ${sponsorId}`);
    
    // Get sponsor's current balance
    const balanceResult = await connection.execute(
      `SELECT balance, weekid FROM income_ledger WHERE memberid = ? ORDER BY ledgerid DESC LIMIT 1`,
      [sponsorId]
    );
    
    let currentBalance = 0;
    let weekid = 0;
    
    if (balanceResult && balanceResult[0] && balanceResult[0].length > 0) {
      currentBalance = Number(balanceResult[0][0].balance || 0);
      weekid = Number(balanceResult[0][0].weekid || 0);
    }
    
    const newBalance = currentBalance + referralBonus;
    
    // Insert into income table (classify='direct')
    await connection.execute(
      `INSERT INTO income (memberid, classify, amount, paystatus, created)
       VALUES (?, 'direct', ?, 'new', NOW())`,
      [sponsorId, referralBonus]
    );
    
    // Insert into income_ledger (status='In', update balance)
    await connection.execute(
      `INSERT INTO income_ledger 
       (memberid, weekid, amount, balance, status, remark, created)
       VALUES (?, ?, ?, ?, 'In', ?, NOW())`,
      [
        sponsorId,
        weekid,
        referralBonus,
        newBalance,
        `Referral bonus for member ${memberId} (${referralBonus} = 20% of ₹${packagePrice})`
      ]
    );
    
    logger.info(
      `[REFERRAL BONUS] ✅ Credited ₹${referralBonus} to sponsor ${sponsorId} for member ${memberId}. ` +
      `Balance: ₹${currentBalance} → ₹${newBalance}`
    );
    
    return {
      success: true,
      sponsorId,
      referralBonus,
      oldBalance: currentBalance,
      newBalance
    };
    
  } catch (error) {
    logger.error(`[REFERRAL BONUS] ❌ Error crediting referral bonus for member ${memberId}:`, error);
    // Don't throw error - log it but don't fail the transaction
    return { success: false, error: error.message };
  }
}

module.exports = {
  creditReferralBonus
};
