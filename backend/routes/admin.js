const express = require('express');
const router = express.Router();
const { query, transaction, logger } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Approve member signup
router.post('/approve-signup/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await transaction(async (connection) => {
      const signupResult = await connection.execute(
        `SELECT * FROM member_signup WHERE signupid = ?`,
        [id]
      );
      const signup = signupResult[0]; // connection.execute returns [rows, fields]

      if (!signup || signup.length === 0) {
        throw new Error('Signup not found');
      }

      const signupData = signup[0];

      // Approve the signup - use signupstatus field (not status)
      await connection.execute(
        `UPDATE member_signup SET signupstatus = 'Yes' WHERE signupid = ?`,
        [id]
      );

      // Update member status
      await connection.execute(
        `UPDATE member SET active = 'Yes' WHERE memberid = ?`,
        [signupData.memberid]
      );
    });

    res.json({ success: true, message: 'Signup approved successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve signup',
      error: error.message
    });
  }
});

// Get all signups pending approval
router.get('/pending-signups', authenticate, requireAdmin, async (req, res) => {
  try {
    const signups = await query(
      `SELECT ms.*, m.*, dt.name as package_name, s.amount, up.transaction_id
       FROM member_signup ms
       JOIN member m ON ms.memberid = m.memberid
       LEFT JOIN sale s ON m.memberid = s.memberid AND s.signuptype = 'Yes'
       LEFT JOIN def_type dt ON s.typeid = dt.typeid
       LEFT JOIN upi_payment up ON s.saleid = up.saleid
       WHERE ms.signupstatus = 'Wait' OR ms.signupstatus = 'No'
       ORDER BY ms.signuptime DESC`
    );

    res.json({
      success: true,
      data: signups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending signups',
      error: error.message
    });
  }
});

// Get all members
router.get('/members', authenticate, requireAdmin, async (req, res) => {
  try {
    const members = await query(
      `SELECT m.*, dt.name as package_name, dt.price, dt.daily_return
       FROM member m
       LEFT JOIN def_type dt ON m.typeid = dt.typeid
       ORDER BY m.created DESC`
    );

    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members',
      error: error.message
    });
  }
});

// Get member details by ID
router.get('/members/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const memberResult = await query(
      `SELECT m.*, dt.name as package_name, dt.price, dt.daily_return
       FROM member m
       LEFT JOIN def_type dt ON m.typeid = dt.typeid
       WHERE m.memberid = ?`,
      [id]
    );

    if (!memberResult || memberResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const member = memberResult[0];

    // Get member's balance
    const balanceResult = await query(
      `SELECT balance, shop_balance 
       FROM income_ledger 
       WHERE memberid = ? 
       ORDER BY ledgerid DESC LIMIT 1`,
      [id]
    );
    const balance = balanceResult && balanceResult.length > 0 ? balanceResult[0] : { balance: 0, shop_balance: 0 };

    // Get total investment
    const investmentResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_investment 
       FROM sale 
       WHERE memberid = ? AND paystatus = 'Delivered'`,
      [id]
    );
    const investment = investmentResult && investmentResult.length > 0 ? investmentResult[0] : { total_investment: 0 };

    // Get total earnings
    const earningsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_earnings 
       FROM income_ledger 
       WHERE memberid = ? AND status = 'In' AND amount > 0`,
      [id]
    );
    const earnings = earningsResult && earningsResult.length > 0 ? earningsResult[0] : { total_earnings: 0 };

    res.json({
      success: true,
      data: {
        ...member,
        balance: balance.balance || 0,
        shop_balance: balance.shop_balance || 0,
        total_investment: investment.total_investment || 0,
        total_earnings: earnings.total_earnings || 0,
      }
    });
  } catch (error) {
    logger.error('Error fetching member details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch member details',
      error: error.message
    });
  }
});

// Get admin dashboard stats
router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    logger.info('[ADMIN DASHBOARD] Fetching dashboard statistics...');
    
    // Get total active members
    const totalMembersResult = await query(`SELECT COUNT(*) as count FROM member WHERE active = 'Yes'`);
    const totalMembers = totalMembersResult && Array.isArray(totalMembersResult) && totalMembersResult.length > 0 
      ? (totalMembersResult[0].count || totalMembersResult[0].COUNT || 0)
      : 0;
    
    // Get total investments (all delivered payments)
    const totalInvestmentsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM sale WHERE paystatus = 'Delivered'`
    );
    const totalInvestments = totalInvestmentsResult && Array.isArray(totalInvestmentsResult) && totalInvestmentsResult.length > 0 
      ? (totalInvestmentsResult[0].total || 0)
      : 0;
    
    // Get total returns paid (all returns that have been paid out)
    const totalReturnsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM income_ledger 
       WHERE status IN ('Weekly', 'Monthly', 'Withdraw', 'In') AND amount > 0`
    );
    const totalReturns = totalReturnsResult && Array.isArray(totalReturnsResult) && totalReturnsResult.length > 0 
      ? (totalReturnsResult[0].total || 0)
      : 0;
    
    // Get pending approvals
    const pendingApprovalsResult = await query(
      `SELECT COUNT(*) as count FROM member_signup WHERE signupstatus = 'Wait' OR signupstatus = 'No' OR signupstatus = 'Pending'`
    );
    const pendingApprovals = pendingApprovalsResult && Array.isArray(pendingApprovalsResult) && pendingApprovalsResult.length > 0 
      ? (pendingApprovalsResult[0].count || pendingApprovalsResult[0].COUNT || 0)
      : 0;
    
    // Get pending payments
    const pendingPaymentsResult = await query(
      `SELECT COUNT(*) as count FROM upi_payment WHERE status = 'Pending'`
    );
    const pendingPayments = pendingPaymentsResult && Array.isArray(pendingPaymentsResult) && pendingPaymentsResult.length > 0 
      ? (pendingPaymentsResult[0].count || pendingPaymentsResult[0].COUNT || 0)
      : 0;
    
    // Get pending withdrawals
    const pendingWithdrawsResult = await query(
      `SELECT COUNT(*) as count FROM member_withdraw WHERE status IN ('apply', 'pending', 'processing')`
    );
    const pendingWithdraws = pendingWithdrawsResult && Array.isArray(pendingWithdrawsResult) && pendingWithdrawsResult.length > 0 
      ? (pendingWithdrawsResult[0].count || pendingWithdrawsResult[0].COUNT || 0)
      : 0;

    const stats = {
      totalMembers: Number(totalMembers) || 0,
      totalInvestments: Number(totalInvestments) || 0,
      totalReturns: Number(totalReturns) || 0,
      pendingApprovals: Number(pendingApprovals) || 0,
      pendingPayments: Number(pendingPayments) || 0,
      pendingWithdraws: Number(pendingWithdraws) || 0,
    };

    logger.info('[ADMIN DASHBOARD] Stats fetched:', stats);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// Get payments
router.get('/payments', authenticate, requireAdmin, async (req, res) => {
  try {
    // Support both 'status' and 'filter' query parameters for compatibility
    const status = req.query.status || req.query.filter || 'all';
    logger.info(`[ADMIN PAYMENTS] Fetching payments with filter: ${status} (query params: ${JSON.stringify(req.query)})`);
    
    let queryStr = `
      SELECT up.*, 
             COALESCE(m.login, 'Unknown') as member_name, 
             up.memberid, 
             m.phone, 
             m.firstname, 
             m.lastname
      FROM upi_payment up
      LEFT JOIN member m ON up.memberid = m.memberid
    `;
    
    if (status === 'pending') {
      queryStr += ` WHERE up.status = 'Pending'`;
    } else if (status === 'verified') {
      queryStr += ` WHERE up.status = 'Verified'`;
    } else if (status === 'rejected') {
      queryStr += ` WHERE up.status = 'Rejected'`;
    }
    // If status is 'all', no WHERE clause is added
    
    queryStr += ` ORDER BY up.created DESC`;

    const payments = await query(queryStr);
    
    logger.info(`[ADMIN PAYMENTS] Found ${payments?.length || 0} payments for filter: ${status}`);

    res.json({
      success: true,
      data: payments || []
    });
  } catch (error) {
    logger.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

// Verify payment
router.post('/verify-payment/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await transaction(async (connection) => {
      const paymentResult = await connection.execute(
        `SELECT * FROM upi_payment WHERE upipaymentid = ?`,
        [id]
      );
      const payment = paymentResult[0]; // connection.execute returns [rows, fields]

      if (!payment || payment.length === 0) {
        throw new Error('Payment not found');
      }

      const paymentData = payment[0];

      // Check if payment is already verified or rejected
      if (paymentData.status === 'Verified' || paymentData.status === 'Rejected') {
        throw new Error('Payment is already processed');
      }

      // Update payment status - ensure only this specific payment is updated
      const updateResult = await connection.execute(
        `UPDATE upi_payment SET status = 'Verified', verified_at = NOW() WHERE upipaymentid = ? AND status = 'Pending'`,
        [id]
      );
      
      // Check if any rows were actually updated
      if (updateResult[0].affectedRows === 0) {
        throw new Error('Payment could not be verified. It may have already been processed.');
      }

      // Update sale status
      if (paymentData.saleid) {
        await connection.execute(
          `UPDATE sale SET paystatus = 'Delivered', active = 'Yes' WHERE saleid = ?`,
          [paymentData.saleid]
        );
        
        // Get the sale's typeid to update member's package
        const saleResult = await connection.execute(
          `SELECT typeid FROM sale WHERE saleid = ?`,
          [paymentData.saleid]
        );
        const sale = saleResult[0];
        if (sale && sale.length > 0 && sale[0].typeid) {
          // Update member's typeid to the verified package
          await connection.execute(
            `UPDATE member SET typeid = ?, active = 'Yes' WHERE memberid = ?`,
            [sale[0].typeid, paymentData.memberid]
          );
        } else {
          // Fallback: just update active status
          await connection.execute(
            `UPDATE member SET active = 'Yes' WHERE memberid = ?`,
            [paymentData.memberid]
          );
        }
      } else {
        // No saleid - just update member status to 'Yes' (active)
        await connection.execute(
          `UPDATE member SET active = 'Yes' WHERE memberid = ?`,
          [paymentData.memberid]
        );
      }

      // Get or initialize wallet balance
      const ledgerResult = await connection.execute(
        `SELECT ledgerid, balance FROM income_ledger WHERE memberid = ? ORDER BY ledgerid DESC LIMIT 1`,
        [paymentData.memberid]
      );
      const existingLedger = ledgerResult[0]; // connection.execute returns [rows, fields]

      let currentBalance = 0;
      if (existingLedger && existingLedger.length > 0) {
        currentBalance = existingLedger[0].balance || 0;
      }

      // If no ledger entry exists, create initial entry with balance 0
      if (!existingLedger || existingLedger.length === 0) {
        await connection.execute(
          `INSERT INTO income_ledger (memberid, weekid, amount, balance, status, remark, created)
           VALUES (?, 0, 0, 0, 'Other', 'Initial wallet balance', NOW())`,
          [paymentData.memberid]
        );
        logger.info(`[VERIFY PAYMENT] Initialized wallet balance for member ${paymentData.memberid}`);
      } else {
        logger.info(`[VERIFY PAYMENT] Member ${paymentData.memberid} already has wallet balance: ${currentBalance}`);
      }
      
      // Note: Balance will be updated when daily returns are credited
      // The payment verification activates the member, and daily returns will start being credited
    });

    res.json({ success: true, message: 'Payment verified successfully. Member is now active and will receive daily earnings.' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment',
      error: error.message
    });
  }
});

// Reject payment
router.post('/reject-payment/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Payment rejected by admin' } = req.body;

    await transaction(async (connection) => {
      const paymentResult = await connection.execute(
        `SELECT * FROM upi_payment WHERE upipaymentid = ?`,
        [id]
      );
      const payment = paymentResult[0];

      if (!payment || payment.length === 0) {
        throw new Error('Payment not found');
      }

      const paymentData = payment[0];

      if (paymentData.status === 'Verified' || paymentData.status === 'Rejected') {
        throw new Error('Payment is already processed');
      }

      // Update payment status to Rejected
      await connection.execute(
        `UPDATE upi_payment SET status = 'Rejected', verified_at = NOW() WHERE upipaymentid = ?`,
        [id]
      );
    });

    res.json({
      success: true,
      message: 'Payment rejected successfully'
    });
  } catch (error) {
    logger.error('Error rejecting payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject payment',
      error: error.message
    });
  }
});

// Reject withdrawal - REMOVED DUPLICATE (using the one below at line 532)

// Get withdraw requests
router.get('/withdraws', authenticate, requireAdmin, async (req, res) => {
  try {
    // Support both 'status' and 'filter' query parameters for compatibility
    const status = req.query.status || req.query.filter || 'all';
    logger.info(`[ADMIN WITHDRAWALS] Fetching withdrawals with filter: ${status} (query params: ${JSON.stringify(req.query)})`);
    
    let sql = `
      SELECT mw.*, m.login as member_name, m.memberid, m.firstname, m.lastname, m.email, m.phone
      FROM member_withdraw mw
      JOIN member m ON mw.memberid = m.memberid
    `;
    
    const params = [];
    if (status === 'apply' || status === 'pending') {
      sql += ` WHERE mw.status IN ('apply', 'pending', 'processing')`;
    } else if (status === 'finished') {
      sql += ` WHERE mw.status = 'finished'`;
    } else if (status === 'reject' || status === 'rejected') {
      sql += ` WHERE mw.status = 'reject'`;
    } else if (status !== 'all') {
      sql += ` WHERE mw.status = ?`;
      params.push(status);
    }
    
    sql += ` ORDER BY mw.created DESC`;

    const withdrawals = await query(sql, params);
    
    logger.info(`[ADMIN WITHDRAWALS] Found ${withdrawals?.length || 0} withdrawals for filter: ${status}`);

    res.json({
      success: true,
      data: withdrawals
    });
  } catch (error) {
    logger.error('Error fetching withdrawal requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal requests',
      error: error.message
    });
  }
});

// Reject withdraw request
router.post('/reject-withdraw/:id', authenticate, requireAdmin, [
  body('reason').optional().isString().withMessage('Reason must be a string'),
], async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Withdrawal request rejected by admin' } = req.body;

    logger.info(`[REJECT WITHDRAW] Attempting to reject withdrawal ${id}`);

    await transaction(async (connection) => {
      const withdrawResult = await connection.execute(
        `SELECT * FROM member_withdraw WHERE id = ?`,
        [id]
      );
      const withdrawRows = withdrawResult[0]; // connection.execute returns [rows, fields]

      if (!withdrawRows || withdrawRows.length === 0) {
        logger.warn(`[REJECT WITHDRAW] Withdrawal ${id} not found`);
        throw new Error('Withdrawal request not found');
      }

      const withdrawData = withdrawRows[0];

      logger.info(`[REJECT WITHDRAW] Withdrawal ${id} current status: ${withdrawData.status}`);

      // Only allow rejection of pending/apply statuses
      // Allow rejection if status is 'apply', 'pending', or 'processing'
      // Don't allow if already 'finished' or 'reject'
      if (withdrawData.status === 'finished') {
        logger.warn(`[REJECT WITHDRAW] Withdrawal ${id} is already finished, cannot reject`);
        throw new Error('Withdrawal request is already approved and processed');
      }

      if (withdrawData.status === 'reject') {
        logger.warn(`[REJECT WITHDRAW] Withdrawal ${id} is already rejected`);
        throw new Error('Withdrawal request is already rejected');
      }

      // Update withdraw status to reject - only update if status is pending/apply/processing
      const updateResult = await connection.execute(
        `UPDATE member_withdraw 
         SET status = 'reject', 
             memo = CONCAT(COALESCE(memo, ''), ' - Rejected: ', ?), 
             updated_on = NOW() 
         WHERE id = ? AND status IN ('apply', 'pending', 'processing')`,
        [reason, id]
      );

      const affectedRows = updateResult[0]?.affectedRows || 0;
      
      if (affectedRows === 0) {
        logger.warn(`[REJECT WITHDRAW] No rows updated for withdrawal ${id}. Status may have changed.`);
        throw new Error('Withdrawal request could not be rejected. It may have already been processed.');
      }

      logger.info(`[REJECT WITHDRAW] ✅ Withdrawal ${id} rejected successfully`);
    });

    res.json({
      success: true,
      message: 'Withdrawal request rejected successfully'
    });
  } catch (error) {
    logger.error(`[REJECT WITHDRAW] ❌ Error rejecting withdrawal ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject withdrawal',
      error: error.message
    });
  }
});

// Approve withdraw request
router.post('/approve-withdraw/:id', authenticate, requireAdmin, [
  body('admin_transaction_id').optional().isString().withMessage('Transaction ID must be a string'),
], async (req, res) => {
  try {
    const { id } = req.params;
    let withdrawData = null; // Store withdrawData outside transaction for logging

    await transaction(async (connection) => {
      const withdrawResult = await connection.execute(
        `SELECT * FROM member_withdraw WHERE id = ?`,
        [id]
      );
      const withdrawRows = withdrawResult[0]; // connection.execute returns [rows, fields]

      if (!withdrawRows || withdrawRows.length === 0) {
        throw new Error('Withdrawal request not found');
      }

      withdrawData = withdrawRows[0]; // Assign to outer variable

      if (withdrawData.status !== 'apply' && withdrawData.status !== 'pending') {
        throw new Error('Withdrawal request is not in pending status');
      }

      const { admin_transaction_id } = req.body;

      // Get current balance and calculate withdrawable balance
      const balanceResult = await connection.execute(
        `SELECT balance FROM income_ledger 
         WHERE memberid = ? 
         ORDER BY ledgerid DESC LIMIT 1`,
        [withdrawData.memberid]
      );
      const balanceRows = balanceResult[0]; // connection.execute returns [rows, fields]
      const currentBalance = balanceRows?.[0]?.balance || 0;

      // Get total investment to calculate withdrawable balance
      const investmentResult = await connection.execute(
        `SELECT COALESCE(SUM(amount), 0) as total_investment 
         FROM sale 
         WHERE memberid = ? AND paystatus = 'Delivered'`,
        [withdrawData.memberid]
      );
      const investmentRows = investmentResult[0];
      let investment = investmentRows?.[0]?.total_investment || 0;

      // Get total returns for validation
      const returnsResult = await connection.execute(
        `SELECT COALESCE(SUM(amount), 0) as total_returns 
         FROM income_ledger 
         WHERE memberid = ? AND status IN ('Weekly', 'Monthly', 'Withdraw', 'In') AND amount > 0`,
        [withdrawData.memberid]
      );
      const returnsRows = returnsResult[0];
      const totalReturns = returnsRows?.[0]?.total_returns || 0;

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

      logger.info(`[APPROVE WITHDRAW] ✅ Withdrawal approved successfully for member ${withdrawData.memberid}, amount: ${withdrawData.amount}`);
    });

    res.json({
      success: true,
      message: 'Withdrawal approved successfully',
      data: {
        withdrawalId: id,
        memberId: withdrawData?.memberid,
        amount: withdrawData?.amount
      }
    });
  } catch (error) {
    logger.error(`[APPROVE WITHDRAW] ❌ Error approving withdrawal ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve withdrawal',
      error: error.message
    });
  }
});

// Get payment gateway settings
router.get('/payment-gateway', authenticate, requireAdmin, async (req, res) => {
  try {
    let settings = {
      upi_id: process.env.UPI_ID || 'yourbusiness@upi',
      qr_code_url: process.env.QR_CODE_URL || '/images/upi-qr.jpg',
      bank_account_number: '',
      bank_ifsc_code: '',
      bank_name: '',
      account_holder_name: '',
      gpay_enabled: 'Yes',
      phonepe_enabled: 'Yes',
    };

    try {
      const dbSettings = await query(
        `SELECT * FROM payment_gateway_settings ORDER BY id DESC LIMIT 1`
      );
      if (dbSettings && Array.isArray(dbSettings) && dbSettings.length > 0) {
        settings = dbSettings[0];
      }
    } catch (tableError) {
      // Table might not exist yet, use defaults
      logger.warn('Payment gateway settings table not found, using defaults');
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment gateway settings',
      error: error.message
    });
  }
});

// Update payment gateway settings
router.put('/payment-gateway', authenticate, requireAdmin, [
  body('upi_id').optional().isString(),
  body('qr_code_url').optional().isString(),
  body('bank_account_number').optional().isString(),
  body('bank_ifsc_code').optional().isString(),
  body('bank_name').optional().isString(),
  body('account_holder_name').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      upi_id,
      qr_code_url,
      qr_code_base64,
      bank_account_number,
      bank_ifsc_code,
      bank_name,
      account_holder_name,
    } = req.body;

    let existing = [];
    try {
      const existingResult = await query(
        `SELECT id FROM payment_gateway_settings ORDER BY id DESC LIMIT 1`
      );
      existing = existingResult || [];
    } catch (tableError) {
      // Table doesn't exist, will create it
      logger.info('Creating payment_gateway_settings table');
      existing = [];
    }

    if (existing && Array.isArray(existing) && existing.length > 0) {
      const updateFields = [];
      const updateValues = [];

      if (upi_id !== undefined) {
        updateFields.push('upi_id = ?');
        updateValues.push(upi_id);
      }
      if (qr_code_url !== undefined) {
        updateFields.push('qr_code_url = ?');
        updateValues.push(qr_code_url);
      }
      if (qr_code_base64 !== undefined) {
        updateFields.push('qr_code_base64 = ?');
        updateValues.push(qr_code_base64);
      }
      if (bank_account_number !== undefined) {
        updateFields.push('bank_account_number = ?');
        updateValues.push(bank_account_number);
      }
      if (bank_ifsc_code !== undefined) {
        updateFields.push('bank_ifsc_code = ?');
        updateValues.push(bank_ifsc_code);
      }
      if (bank_name !== undefined) {
        updateFields.push('bank_name = ?');
        updateValues.push(bank_name);
      }
      if (account_holder_name !== undefined) {
        updateFields.push('account_holder_name = ?');
        updateValues.push(account_holder_name);
      }

      updateValues.push(existing[0].id);
      await query(
        `UPDATE payment_gateway_settings SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    } else {
      await query(
        `INSERT INTO payment_gateway_settings 
         (upi_id, qr_code_url, qr_code_base64, bank_account_number, bank_ifsc_code, bank_name, account_holder_name)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          upi_id || process.env.UPI_ID || 'yourbusiness@upi',
          qr_code_url || process.env.QR_CODE_URL || '/images/upi-qr.jpg',
          qr_code_base64 || null,
          bank_account_number || '',
          bank_ifsc_code || '',
          bank_name || '',
          account_holder_name || '',
        ]
      );
    }

    res.json({
      success: true,
      message: 'Payment gateway settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update payment gateway settings',
      error: error.message
    });
  }
});

module.exports = router;




