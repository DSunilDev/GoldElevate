const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query, transaction, logger } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { creditReferralBonus } = require('../utils/referralBonus');

// Configure multer for image uploads
const uploadsDir = path.join(__dirname, '../uploads/images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'qr-code-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Approve member signup (accepts memberid - consistent with pending-signups endpoint)
router.post('/approve-signup/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params; // This is memberid now

    logger.info(`[ADMIN APPROVE SIGNUP] Approving signup for memberid: ${id}`);

    await transaction(async (connection) => {
      // Check if member exists and is inactive
      const memberResult = await connection.execute(
        `SELECT * FROM member WHERE memberid = ?`,
        [id]
      );
      const member = memberResult[0]; // connection.execute returns [rows, fields]

      if (!member || member.length === 0) {
        throw new Error('Member not found');
      }

      const memberData = member[0];

      // Check if member is already active
      if (memberData.active === 'Yes') {
        throw new Error('Member is already active');
      }

      // Update member status to active
      await connection.execute(
        `UPDATE member SET active = 'Yes' WHERE memberid = ?`,
        [id]
      );

      logger.info(`[ADMIN APPROVE SIGNUP] ✅ Member ${id} approved successfully`);
    });

    res.json({ success: true, message: 'Application approved successfully. Member is now active.' });
  } catch (error) {
    logger.error(`[ADMIN APPROVE SIGNUP] ❌ Error approving signup for memberid ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve application',
      error: error.message
    });
  }
});

// Get all signups pending approval (members with active = 'No')
router.get('/pending-signups', authenticate, requireAdmin, async (req, res) => {
  try {
    logger.info('[ADMIN PENDING SIGNUPS] Fetching pending applications (active = No)...');
    
    // Get all members with active = 'No' - consistent with dashboard count
    const signups = await query(
      `SELECT 
        m.memberid,
        m.login,
        m.firstname,
        m.lastname,
        m.email,
        m.phone,
        m.active,
        m.created,
        m.typeid,
        dt.name as package_name,
        dt.price,
        dt.daily_return,
        s.saleid,
        s.amount,
        s.paystatus,
        s.paytype,
        s.created as sale_created,
        up.upipaymentid,
        up.transaction_id,
        up.status as payment_status
       FROM member m
       LEFT JOIN def_type dt ON m.typeid = dt.typeid
       LEFT JOIN sale s ON m.memberid = s.memberid AND s.signuptype = 'Yes'
       LEFT JOIN upi_payment up ON s.saleid = up.saleid
       WHERE m.active = 'No'
       ORDER BY m.created DESC`
    );

    logger.info(`[ADMIN PENDING SIGNUPS] Found ${signups.length} pending applications`);
    
    res.json({
      success: true,
      data: signups
    });
  } catch (error) {
    logger.error('[ADMIN PENDING SIGNUPS] Error fetching pending signups:', error);
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
    
    // Get total returns paid (total earnings credited to all members)
    // This is the sum of all daily returns and other earnings (status 'In', 'Weekly', 'Monthly')
    const totalReturnsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM income_ledger 
       WHERE status IN ('In', 'Weekly', 'Monthly') AND amount > 0`
    );
    const totalReturns = totalReturnsResult && Array.isArray(totalReturnsResult) && totalReturnsResult.length > 0 
      ? (totalReturnsResult[0].total || 0)
      : 0;
    
    // Get pending approvals (member signups waiting for approval)
    // Check if member_signup table exists and has pending entries
    let pendingApprovals = 0;
    try {
      const pendingApprovalsResult = await query(
        `SELECT COUNT(*) as count FROM member WHERE active = 'No'`
      );
      pendingApprovals = pendingApprovalsResult && Array.isArray(pendingApprovalsResult) && pendingApprovalsResult.length > 0 
        ? (pendingApprovalsResult[0].count || pendingApprovalsResult[0].COUNT || 0)
        : 0;
    } catch (error) {
      // If member_signup table doesn't exist, check for pending payments instead
      logger.warn('[ADMIN DASHBOARD] member_signup table not found, using pending payments as approvals');
      const pendingPaymentsCheck = await query(
        `SELECT COUNT(*) as count FROM upi_payment WHERE status = 'Pending'`
      );
      pendingApprovals = pendingPaymentsCheck && Array.isArray(pendingPaymentsCheck) && pendingPaymentsCheck.length > 0 
        ? (pendingPaymentsCheck[0].count || pendingPaymentsCheck[0].COUNT || 0)
        : 0;
    }
    
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

      // Update sale status and store activation timestamp
      // Sale record should exist (created during payment submission), but handle missing case
      if (paymentData.saleid) {
        await connection.execute(
          `UPDATE sale SET paystatus = 'Delivered', active = 'Yes', activated_at = NOW() WHERE saleid = ?`,
          [paymentData.saleid]
        );
        
        // Get the sale's typeid and amount to update member's package
        const saleResult = await connection.execute(
          `SELECT typeid, amount FROM sale WHERE saleid = ?`,
          [paymentData.saleid]
        );
        const sale = saleResult[0];
        if (sale && sale.length > 0 && sale[0].typeid) {
          // Check if member already has a typeid (first sale already verified)
          const memberResult = await connection.execute(
            `SELECT typeid FROM member WHERE memberid = ?`,
            [paymentData.memberid]
          );
          const member = memberResult[0];
          const hasExistingTypeid = member && member.length > 0 && member[0].typeid !== null && member[0].typeid !== undefined;
          
          if (!hasExistingTypeid) {
            // First sale - update member's typeid to the verified package
            await connection.execute(
              `UPDATE member SET typeid = ?, active = 'Yes' WHERE memberid = ?`,
              [sale[0].typeid, paymentData.memberid]
            );
            logger.info(`[VERIFY PAYMENT] ✅ First sale verified - Updated member ${paymentData.memberid} typeid to ${sale[0].typeid}, set active='Yes'`);
            
            // Credit referral bonus to sponsor (only for first transaction)
            const packagePrice = parseFloat(sale[0].amount || 0);
            if (packagePrice > 0) {
              await creditReferralBonus(connection, paymentData.memberid, packagePrice);
            } else {
              logger.warn(`[VERIFY PAYMENT] Package price is 0 or invalid (${sale[0].amount}) for member ${paymentData.memberid}, skipping referral bonus`);
            }
          } else {
            // Subsequent sale - only update active status, don't change typeid
            await connection.execute(
              `UPDATE member SET active = 'Yes' WHERE memberid = ? AND active != 'Yes'`,
              [paymentData.memberid]
            );
            logger.info(`[VERIFY PAYMENT] Subsequent sale verified - Member ${paymentData.memberid} already has typeid ${member[0].typeid}, only updated active status`);
          }
        } else {
          // Fallback: just update active status
          await connection.execute(
            `UPDATE member SET active = 'Yes' WHERE memberid = ?`,
            [paymentData.memberid]
          );
          logger.info(`[VERIFY PAYMENT] Updated member ${paymentData.memberid} active status to 'Yes' (no package typeid)`);
        }
        logger.info(`[VERIFY PAYMENT] Updated sale ${paymentData.saleid} to paystatus='Delivered', active='Yes'`);
      } else {
        // No saleid - this shouldn't happen, but create sale record if we can determine package
        logger.warn(`[VERIFY PAYMENT] Payment ${id} has no saleid - attempting to create sale record`);
        
        // Try to find package by amount or get from payment data
        // For now, just update member status and log warning
        await connection.execute(
          `UPDATE member SET active = 'Yes' WHERE memberid = ?`,
          [paymentData.memberid]
        );
        logger.warn(`[VERIFY PAYMENT] Payment ${id} verified but no sale record exists - member activated but package not assigned`);
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

      // Only allow rejection for 'apply', 'pending', or 'processing' statuses
      if (withdrawData.status !== 'apply' && withdrawData.status !== 'pending' && withdrawData.status !== 'processing') {
        logger.warn(`[REJECT WITHDRAW] Withdrawal ${id} status is ${withdrawData.status}, cannot reject`);
        throw new Error('Withdrawal request can only be rejected if status is apply, pending, or processing');
      }

      // Update withdraw status to reject - only for apply, pending, or processing statuses
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
    let withdrawalAmount = 0; // Store withdrawalAmount outside transaction for response

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

      // Only allow approval for 'apply', 'pending', or 'processing' statuses
      if (withdrawData.status !== 'apply' && withdrawData.status !== 'pending' && withdrawData.status !== 'processing') {
        throw new Error('Withdrawal request can only be approved if status is apply, pending, or processing');
      }

      // Ensure amount is a number
      withdrawalAmount = Number(withdrawData.amount) || 0;
      if (withdrawalAmount <= 0) {
        throw new Error('Invalid withdrawal amount');
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
        requestedAmount: withdrawalAmount
      });

      if (withdrawableBalance < withdrawalAmount) {
        throw new Error(`Insufficient withdrawable balance. Available: ₹${withdrawableBalance.toFixed(2)}, Requested: ₹${withdrawalAmount.toFixed(2)}`);
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
      const newBalance = Math.max(0, lastBalance - withdrawalAmount);
      const weekid = lastLedgerRow.weekid || 0;

      logger.info(`[APPROVE WITHDRAW] Deducting ${withdrawalAmount} from balance ${lastBalance} = ${newBalance}`);

      // Create ledger entry for withdrawal (negative amount to deduct from balance)
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

      logger.info(`[APPROVE WITHDRAW] ✅ Withdrawal approved successfully for member ${withdrawData.memberid}, amount: ${withdrawalAmount}`);
    });

    res.json({
      success: true,
      message: 'Withdrawal approved successfully',
      data: {
        withdrawalId: id,
        memberId: withdrawData?.memberid,
        amount: withdrawalAmount
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

// Get payment gateway settings (returns active settings)
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
      // Try to get active payment gateway settings first
      let dbSettings = [];
      try {
        dbSettings = await query(
          `SELECT * FROM payment_gateway_settings 
           WHERE active = 'Yes' 
           ORDER BY updated_at DESC, id DESC 
           LIMIT 1`
      );
      } catch (activeError) {
        // Active column might not exist yet, get most recent
        logger.info('Active column might not exist, getting most recent settings');
      }
      
      // If no active settings found, get the most recent one
      if (!dbSettings || dbSettings.length === 0) {
        const recentSettings = await query(
          `SELECT * FROM payment_gateway_settings ORDER BY updated_at DESC, id DESC LIMIT 1`
        );
        if (recentSettings && recentSettings.length > 0) {
          settings = recentSettings[0];
        }
      } else {
        settings = dbSettings[0];
      }
      
      // Convert file path to URL if it's a local file
      if (settings.qr_code_url && !settings.qr_code_url.startsWith('http')) {
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        if (settings.qr_code_url.startsWith('/uploads/')) {
          settings.qr_code_url = baseUrl + settings.qr_code_url;
        } else if (settings.qr_code_url.startsWith('/')) {
          settings.qr_code_url = baseUrl + '/uploads/images/' + path.basename(settings.qr_code_url);
        }
      }
      
      // Convert file path to URL if it's a local file
      if (settings.qr_code_url && settings.qr_code_url.startsWith('/')) {
        // If it's a local file path, convert to URL
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        settings.qr_code_url = baseUrl + '/uploads/images/' + path.basename(settings.qr_code_url);
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

// Upload QR code image via base64 (more reliable for React Native)
router.post('/payment-gateway/upload-qr-base64', authenticate, requireAdmin, async (req, res) => {
  try {
    const { image, filename, mimetype } = req.body;
    
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided'
      });
    }

    // Extract base64 data from data URL
    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Generate filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = filename?.split('.').pop() || mimetype?.split('/')[1] || 'jpg';
    const finalFilename = `qr-code-${uniqueSuffix}.${ext}`;
    const filePath = path.join(uploadsDir, finalFilename);
    
    // Save file
    fs.writeFileSync(filePath, imageBuffer);
    
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const imageUrl = `${baseUrl}/uploads/images/${finalFilename}`;

    logger.info('QR code image uploaded successfully (base64)', {
      filename: finalFilename,
      size: imageBuffer.length,
      mimetype: mimetype || 'image/jpeg',
    });

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: finalFilename,
        url: imageUrl,
        path: `/uploads/images/${finalFilename}`
      }
    });
  } catch (error) {
    logger.error('QR code upload error (base64):', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
});

// Upload QR code image via FormData (for web/Postman)
router.post('/payment-gateway/upload-qr', authenticate, requireAdmin, upload.single('qr_image'), async (req, res) => {
  try {
    logger.info('═══════════════════════════════════════════════════');
    logger.info('QR code upload request received');
    logger.info('Request details:', {
      method: req.method,
      url: req.url,
      headers: {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length'],
        'authorization': req.headers['authorization'] ? 'Present' : 'Missing',
      },
      hasFile: !!req.file,
      body: req.body,
      files: req.files,
    });
    logger.info('═══════════════════════════════════════════════════');

    if (!req.file) {
      logger.warn('No file received in upload request');
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Please select an image and try again.'
      });
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const imageUrl = `${baseUrl}/uploads/images/${req.file.filename}`;

    logger.info('QR code image uploaded successfully', {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: req.file.filename,
        url: imageUrl,
        path: `/uploads/images/${req.file.filename}`
      }
    });
  } catch (error) {
    logger.error('QR code upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
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
      // qr_code_base64 - Don't store in DB, too large. File is stored on disk and URL is in qr_code_url
      bank_account_number,
      bank_ifsc_code,
      bank_name,
      account_holder_name,
    } = req.body;

    // First, set all existing records to inactive (if active column exists)
    try {
      await query(`UPDATE payment_gateway_settings SET active = 'No' WHERE active = 'Yes'`);
    } catch (error) {
      // Column might not exist yet, that's okay - will be added by migration
      logger.info('Could not update existing records (active column might not exist yet)');
    }

    // Check if active column exists by trying to insert with it
    let insertResult;
    try {
      // Try inserting with active column
      insertResult = await query(
        `INSERT INTO payment_gateway_settings 
         (upi_id, qr_code_url, bank_account_number, bank_ifsc_code, bank_name, account_holder_name, active, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, 'Yes', ?)`,
        [
          upi_id || process.env.UPI_ID || 'yourbusiness@upi',
          qr_code_url || process.env.QR_CODE_URL || '/images/upi-qr.jpg',
          bank_account_number || '',
          bank_ifsc_code || '',
          bank_name || '',
          account_holder_name || '',
          req.user?.login || req.user?.id || 'admin',
        ]
      );
    } catch (insertError) {
      // If active column doesn't exist, insert without it
      if (insertError.message.includes('active')) {
        insertResult = await query(
        `INSERT INTO payment_gateway_settings 
           (upi_id, qr_code_url, bank_account_number, bank_ifsc_code, bank_name, account_holder_name, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          upi_id || process.env.UPI_ID || 'yourbusiness@upi',
          qr_code_url || process.env.QR_CODE_URL || '/images/upi-qr.jpg',
          bank_account_number || '',
          bank_ifsc_code || '',
          bank_name || '',
          account_holder_name || '',
            req.user?.login || req.user?.id || 'admin',
        ]
      );
      } else {
        throw insertError;
      }
    }

    logger.info(`Payment gateway settings updated and marked as active by ${req.user?.login || 'admin'}`);

    res.json({
      success: true,
      message: 'Payment gateway settings updated successfully and marked as active',
      data: {
        id: insertResult.insertId
      }
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




