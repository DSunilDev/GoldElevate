const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { authenticate, requireMember, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { logger } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// User: Create withdraw request
router.post('/request', authenticate, requireMember, [
  body('amount').isFloat({ min: 100 }).withMessage('Minimum withdrawal amount is ₹100'),
  body('payment_method').isIn(['Bank', 'UPI']).withMessage('Payment method must be Bank or UPI'),
  body('account_number').if(body('payment_method').equals('Bank')).notEmpty().withMessage('Account number required for bank transfer'),
  body('ifsc_code').if(body('payment_method').equals('Bank')).notEmpty().withMessage('IFSC code required for bank transfer'),
  body('upi_id').if(body('payment_method').equals('UPI')).notEmpty().withMessage('UPI ID required for UPI transfer'),
  body('bank_name').optional().isString().withMessage('Bank name must be a string'),
  body('account_holder_name').optional().isString().withMessage('Account holder name must be a string'),
  body('memo').optional().isString().withMessage('Memo must be a string'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Withdraw request validation failed:', errors.array());
      return res.status(400).json({ 
        success: false, 
        message: errors.array()[0]?.msg || 'Validation failed',
        errors: errors.array() 
      });
    }

    const memberId = req.user.memberid;
    const { 
      amount, 
      payment_method = 'Bank',
      account_number,
      ifsc_code,
      upi_id,
      bank_name,
      account_holder_name,
      memo = '' 
    } = req.body;
    
    logger.info(`[WITHDRAW REQUEST] Member ${memberId}, Amount: ${amount}, Method: ${payment_method}`);

    // Validate payment method specific fields
    if (payment_method === 'Bank' && (!account_number || !ifsc_code)) {
      return res.status(400).json({
        success: false,
        message: 'Account number and IFSC code are required for bank transfer'
      });
    }

    if (payment_method === 'UPI' && !upi_id) {
      return res.status(400).json({
        success: false,
        message: 'UPI ID is required for UPI transfer'
      });
    }

    // Get current wallet balance
    const balance = await query(
      `SELECT balance FROM income_ledger 
       WHERE memberid = ? 
       ORDER BY ledgerid DESC LIMIT 1`,
      [memberId]
    );

    const currentBalance = balance?.[0]?.balance || balance?.balance || 0;

    // Get total investment (package cost - not withdrawable)
    const investmentResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_investment 
       FROM sale 
       WHERE memberid = ? AND paystatus = 'Delivered'`,
      [memberId]
    );
    let investment = Array.isArray(investmentResult) && investmentResult.length > 0 
      ? investmentResult[0]?.total_investment || 0
      : (investmentResult?.total_investment || 0);
    
    // Get total returns (earnings) to validate investment calculation
    const returnsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_returns 
       FROM income_ledger 
       WHERE memberid = ? AND status IN ('Weekly', 'Monthly', 'Withdraw', 'In') AND amount > 0`,
      [memberId]
    );
    const totalReturns = Array.isArray(returnsResult) && returnsResult.length > 0 
      ? (returnsResult[0]?.total_returns || 0)
      : 0;
    
    logger.info(`[WITHDRAW REQUEST] Member ${memberId} balance calculation:`, {
      currentBalance,
      investment,
      totalReturns,
      calculatedWithdrawable: Math.max(0, currentBalance - investment)
    });
    
    // Safety check: If investment is unreasonably high (greater than current balance),
    // recalculate it as: balance - returns
    if (investment > currentBalance && totalReturns > 0) {
      logger.warn(`[WITHDRAW REQUEST] Investment (${investment}) > Balance (${currentBalance}), recalculating...`);
      investment = Math.max(0, currentBalance - totalReturns);
      logger.info(`[WITHDRAW REQUEST] Recalculated investment: ${investment}`);
    }

    // Calculate withdrawable balance (earnings only, excludes investment)
    const withdrawableBalance = Math.max(0, currentBalance - investment);
    
    logger.info(`[WITHDRAW REQUEST] Final values:`, {
      currentBalance,
      investment,
      totalReturns,
      withdrawableBalance,
      requestedAmount: amount
    });

    if (withdrawableBalance < amount) {
      logger.warn(`[WITHDRAW REQUEST] ❌ Insufficient balance: ${withdrawableBalance} < ${amount}`);
      return res.status(400).json({
        success: false,
        message: 'Insufficient withdrawable balance',
        error: `Your withdrawable balance is ₹${withdrawableBalance.toFixed(2)}. Investment amount (₹${investment.toFixed(2)}) cannot be withdrawn.`,
        details: {
          currentBalance,
          investment,
          withdrawableBalance,
          requestedAmount: amount
        }
      });
    }
    
    logger.info(`[WITHDRAW REQUEST] ✅ Balance check passed: ${withdrawableBalance} >= ${amount}`);

    // Check for pending withdraw requests
    const pendingResult = await query(
      `SELECT COUNT(*) as count FROM member_withdraw 
       WHERE memberid = ? AND status IN ('apply', 'pending', 'processing')`,
      [memberId]
    );

    // Handle different query result formats
    let pendingCount = 0;
    if (Array.isArray(pendingResult) && pendingResult.length > 0) {
      // If it's an array, get the first element
      const firstRow = pendingResult[0];
      pendingCount = firstRow?.count || firstRow?.COUNT || 0;
    } else if (pendingResult && typeof pendingResult === 'object') {
      // If it's an object, check for count property
      pendingCount = pendingResult.count || pendingResult.COUNT || 0;
    }

    logger.info(`[WITHDRAW REQUEST] Pending withdrawals check: ${pendingCount}`);

    if (pendingCount > 0) {
      logger.warn(`[WITHDRAW REQUEST] Member ${memberId} has ${pendingCount} pending withdrawal(s)`);
      return res.status(400).json({
        success: false,
        message: 'You already have a pending withdrawal request. Please wait for it to be processed.'
      });
    }
    
    logger.info(`[WITHDRAW REQUEST] No pending withdrawals, proceeding...`);

    // Generate transaction ID
    const transactionId = `WD${Date.now()}${Math.floor(Math.random() * 10000)}`;

    // Create withdraw request
    await query(
      `INSERT INTO member_withdraw 
       (memberid, amount, payment_method, account_number, ifsc_code, upi_id, bank_name, account_holder_name, transax_id, memo, status, created)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'apply', NOW())`,
      [
        memberId, 
        amount, 
        payment_method,
        payment_method === 'Bank' ? account_number : null,
        payment_method === 'Bank' ? ifsc_code : null,
        payment_method === 'UPI' ? upi_id : null,
        bank_name || null,
        account_holder_name || null,
        transactionId, 
        memo
      ]
    );

    logger.info(`Withdraw request created: ${transactionId} for member ${memberId}, amount: ${amount}`);

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully. Admin will process it within 24-48 hours.',
      data: {
        transactionId,
        amount,
        status: 'apply'
      }
    });
  } catch (error) {
    logger.error('Withdraw request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create withdrawal request',
      error: error.message
    });
  }
});

// User: Get withdraw history
router.get('/history', authenticate, requireMember, async (req, res) => {
  try {
    const memberId = req.user.memberid;
    const withdrawals = await query(
      `SELECT * FROM member_withdraw 
       WHERE memberid = ? 
       ORDER BY created DESC`,
      [memberId]
    );

    res.json({
      success: true,
      data: withdrawals
    });
  } catch (error) {
    logger.error('Withdraw history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal history',
      error: error.message
    });
  }
});

// Admin: Get all withdraw requests
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    let sql = `
      SELECT mw.*, m.login as member_name, m.memberid, m.firstname, m.lastname, m.email, m.phone
      FROM member_withdraw mw
      JOIN member m ON mw.memberid = m.memberid
    `;
    
    const params = [];
    if (status !== 'all') {
      sql += ` WHERE mw.status = ?`;
      params.push(status);
    }
    
    sql += ` ORDER BY mw.created DESC`;

    const withdrawals = await query(sql, params);

    res.json({
      success: true,
      data: withdrawals
    });
  } catch (error) {
    logger.error('Admin withdraw list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal requests',
      error: error.message
    });
  }
});

// Admin: Approve withdraw request
router.post('/admin/approve/:id', authenticate, requireAdmin, [
  body('admin_transaction_id').optional().isString().withMessage('Transaction ID must be a string'),
], async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_transaction_id } = req.body;

    await transaction(async (connection) => {
      // Get withdraw request
      const [withdraw] = await connection.execute(
        `SELECT * FROM member_withdraw WHERE id = ?`,
        [id]
      );

      if (withdraw.length === 0) {
        throw new Error('Withdrawal request not found');
      }

      const withdrawData = withdraw[0];

      if (withdrawData.status !== 'apply' && withdrawData.status !== 'pending') {
        throw new Error('Withdrawal request is not in pending status');
      }

      // Get current balance and calculate withdrawable balance
      const balanceResult = await connection.execute(
        `SELECT balance FROM income_ledger 
         WHERE memberid = ? 
         ORDER BY ledgerid DESC LIMIT 1`,
        [withdrawData.memberid]
      );
      const balanceRows = balanceResult[0]; // connection.execute returns [rows, fields]
      const currentBalance = Number(balanceRows?.[0]?.balance || 0);

      // Get total investment to calculate withdrawable balance
      const investmentResult = await connection.execute(
        `SELECT COALESCE(SUM(amount), 0) as total_investment 
         FROM sale 
         WHERE memberid = ? AND paystatus = 'Delivered'`,
        [withdrawData.memberid]
      );
      const investmentRows = investmentResult[0];
      let investment = Number(investmentRows?.[0]?.total_investment || 0);

      // Get total returns for validation
      const returnsResult = await connection.execute(
        `SELECT COALESCE(SUM(amount), 0) as total_returns 
         FROM income_ledger 
         WHERE memberid = ? AND status IN ('Weekly', 'Monthly', 'Withdraw', 'In') AND amount > 0`,
        [withdrawData.memberid]
      );
      const returnsRows = returnsResult[0];
      const totalReturns = Number(returnsRows?.[0]?.total_returns || 0);

      // Safety check: Recalculate investment if too high
      if (investment > currentBalance && totalReturns > 0) {
        investment = Math.max(0, currentBalance - totalReturns);
      }

      const withdrawableBalance = Math.max(0, currentBalance - investment);

      logger.info(`[APPROVE WITHDRAW] Member ${withdrawData.memberid} balance check:`, {
        currentBalance,
        investment,
        withdrawableBalance,
        requestedAmount: withdrawData.amount
      });

      if (withdrawableBalance < withdrawData.amount) {
        throw new Error(`Insufficient withdrawable balance. Available: ₹${withdrawableBalance.toFixed(2)}, Requested: ₹${withdrawData.amount.toFixed(2)}`);
      }

      // Update withdraw status
      await connection.execute(
        `UPDATE member_withdraw 
         SET status = 'finished', admin_transaction_id = ?, updated_on = NOW() 
         WHERE id = ?`,
        [admin_transaction_id || null, id]
      );

      // Get latest ledger entry for balance and weekid
      const ledgerResult = await connection.execute(
        `SELECT ledgerid, balance, weekid FROM income_ledger 
         WHERE memberid = ? 
         ORDER BY ledgerid DESC LIMIT 1`,
        [withdrawData.memberid]
      );
      const ledgerRows = ledgerResult[0]; // connection.execute returns [rows, fields]
      const lastLedgerRow = ledgerRows?.[0] || {};

      const lastBalance = Number(lastLedgerRow.balance || 0);
      const newBalance = Math.max(0, lastBalance - withdrawData.amount);
      const weekid = lastLedgerRow.weekid || 0;

      logger.info(`[APPROVE WITHDRAW] Deducting ${withdrawData.amount} from balance ${lastBalance} = ${newBalance}`);

      // Create ledger entry for withdrawal (negative amount to deduct from balance)
      const withdrawalAmount = Number(withdrawData.amount);
      const negativeAmount = -withdrawalAmount;
      
      logger.info(`[APPROVE WITHDRAW] Creating ledger entry:`, {
        memberId: withdrawData.memberid,
        withdrawalAmount: withdrawalAmount,
        negativeAmount: negativeAmount,
        oldBalance: lastBalance,
        newBalance: newBalance,
        weekid: weekid
      });

      const insertResult = await connection.execute(
        `INSERT INTO income_ledger 
         (memberid, weekid, amount, balance, status, remark, created)
         VALUES (?, ?, ?, ?, 'Withdraw', ?, NOW())`,
        [
          withdrawData.memberid,
          weekid,
          negativeAmount, // Negative amount for withdrawal
          newBalance,
          `Withdrawal approved - ${withdrawData.transax_id || 'N/A'}`
        ]
      );

      const insertedLedgerId = insertResult[0]?.insertId;
      
      // Verify the ledger entry was created correctly
      const verifyResult = await connection.execute(
        `SELECT ledgerid, amount, balance, status, remark 
         FROM income_ledger 
         WHERE ledgerid = ?`,
        [insertedLedgerId]
      );
      const verifiedEntry = verifyResult[0]?.[0];
      
      logger.info(`[APPROVE WITHDRAW] ✅ Ledger entry created and verified:`, {
        ledgerId: insertedLedgerId,
        memberId: withdrawData.memberid,
        transactionId: withdrawData.transax_id,
        amount: verifiedEntry?.amount,
        balance: verifiedEntry?.balance,
        status: verifiedEntry?.status,
        remark: verifiedEntry?.remark,
        expectedBalance: newBalance,
        balanceMatch: verifiedEntry?.balance === newBalance
      });
      
      if (verifiedEntry?.balance !== newBalance) {
        logger.error(`[APPROVE WITHDRAW] ❌ Balance mismatch! Expected: ${newBalance}, Got: ${verifiedEntry?.balance}`);
      }
    });

    res.json({
      success: true,
      message: 'Withdrawal approved successfully'
    });
  } catch (error) {
    logger.error('Approve withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve withdrawal',
      error: error.message
    });
  }
});

// Admin: Reject withdraw request
router.post('/admin/reject/:id', authenticate, requireAdmin, [
  body('reason').optional().isString().withMessage('Reason must be a string'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { reason = 'Withdrawal request rejected by admin' } = req.body;

    const withdraw = await query(
      `SELECT * FROM member_withdraw WHERE id = ?`,
      [id]
    );

    if (!withdraw || !Array.isArray(withdraw) || withdraw.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    await query(
      `UPDATE member_withdraw 
       SET status = 'reject', memo = CONCAT(COALESCE(memo, ''), ' - ', ?), updated_on = NOW() 
       WHERE id = ?`,
      [reason, id]
    );

    logger.info(`Withdrawal rejected: ${withdraw[0].transax_id} for member ${withdraw[0].memberid}`);

    res.json({
      success: true,
      message: 'Withdrawal request rejected'
    });
  } catch (error) {
    logger.error('Reject withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject withdrawal',
      error: error.message
    });
  }
});

module.exports = router;

