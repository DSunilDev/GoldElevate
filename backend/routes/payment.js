const express = require('express');
const router = express.Router();
const { query, transaction, pool } = require('../config/database');
const { authenticate, requireMember } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { logger } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Initiate payment
router.post('/init', authenticate, requireMember, [
  body('packageid').isInt().withMessage('Valid package ID required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { packageid, amount } = req.body;
    const memberId = req.user.memberid;

    // Verify package exists
    const packageData = await query(
      'SELECT typeid, price FROM def_type WHERE typeid = ?',
      [packageid]
    );

    if (!packageData || !Array.isArray(packageData) || packageData.length === 0) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    // Generate transaction ID
    const transactionId = `UPI${Date.now()}${Math.floor(Math.random() * 10000)}`;

    // Get or create sale record
    const sale = await query(
      `SELECT saleid FROM sale WHERE memberid = ? AND signuptype = 'Yes' AND paystatus = 'Pending' ORDER BY created DESC LIMIT 1`,
      [memberId]
    );

    let saleId = sale && sale.length > 0 ? sale[0].saleid : null;

    if (!saleId) {
      const newSale = await query(
        `INSERT INTO sale (memberid, typeid, amount, signuptype, paystatus, active, created)
         VALUES (?, ?, ?, 'Yes', 'Pending', 'No', NOW())`,
        [memberId, packageid, amount || (packageData[0]?.price || 0)]
      );
      // Handle both array and object result formats
      if (newSale && typeof newSale === 'object') {
        if (newSale.insertId) {
          saleId = newSale.insertId;
        } else if (Array.isArray(newSale) && newSale[0] && newSale[0].insertId) {
          saleId = newSale[0].insertId;
        } else if (newSale[0] && newSale[0].insertId) {
          saleId = newSale[0].insertId;
        }
      }
    }

    // Get payment gateway settings
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
      const gatewaySettings = await query(
        `SELECT * FROM payment_gateway_settings ORDER BY id DESC LIMIT 1`
      );
      if (gatewaySettings && Array.isArray(gatewaySettings) && gatewaySettings.length > 0) {
        settings = gatewaySettings[0];
      }
    } catch (error) {
      // Table might not exist yet, use defaults
      logger.warn('Payment gateway settings table not found, using defaults');
    }

    res.json({
      success: true,
      data: {
        transaction_id: transactionId,
        saleid: saleId,
        amount: amount || packageData[0].price,
        packageid,
        upi_id: settings.upi_id,
        qr_code_url: settings.qr_code_url,
        bank_account_number: settings.bank_account_number,
        bank_ifsc_code: settings.bank_ifsc_code,
        bank_name: settings.bank_name,
        account_holder_name: settings.account_holder_name,
        gpay_enabled: settings.gpay_enabled === 'Yes',
        phonepe_enabled: settings.phonepe_enabled === 'Yes',
      }
    });
  } catch (error) {
    logger.error('Payment init error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate payment' });
  }
});

// Submit payment reference
router.post('/submit', authenticate, requireMember, [
  body('upi_reference').optional().custom((value) => {
    // If provided, must be 8-20 characters, otherwise skip validation
    if (value && value.length > 0 && (value.length < 8 || value.length > 20)) {
      throw new Error('UPI reference must be 8-20 characters');
    }
    return true;
  }),
  body('transaction_id').notEmpty().withMessage('Transaction ID required'),
  body('amount').custom((value) => {
    // Convert to number and validate
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      throw new Error('Valid amount required (must be a number >= 0)');
    }
    return true;
  }),
  body('payment_method').optional().isIn(['GPay', 'PhonePe', 'Other']).withMessage('Payment method must be GPay, PhonePe, or Other'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error('Payment submit validation errors:', errors.array());
      logger.error('Request body:', req.body);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { upi_reference, transaction_id, amount, saleid, packageid, payment_method = 'Other' } = req.body;
    const memberId = req.user.memberid;
    
    // Amount should already be sanitized to number by validator
    const paymentAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    
    // Final validation (shouldn't be needed but double-check)
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      logger.error('Invalid amount after validation:', amount, 'converted to:', paymentAmount);
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Amount must be a positive number.',
        error: 'Invalid amount'
      });
    }
    
    // Validate transaction_id (should already be validated but double-check)
    const trimmedTransactionId = transaction_id ? String(transaction_id).trim() : '';
    if (!trimmedTransactionId || trimmedTransactionId.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required',
        error: 'Missing transaction_id'
      });
    }
    
    logger.info(`Payment submission: member=${memberId}, amount=${paymentAmount}, transaction_id=${trimmedTransactionId}, payment_method=${payment_method}, upi_reference=${upi_reference || 'empty'}`);

    // Check if reference already exists (only if provided and not empty)
    // For GPay/PhonePe, upi_reference might be empty, so we only check transaction_id
    const trimmedUpiRef = upi_reference ? String(upi_reference).trim() : '';
    
    if (trimmedUpiRef.length > 0) {
      const existing = await query(
        'SELECT upipaymentid FROM upi_payment WHERE upi_reference = ? OR transaction_id = ?',
        [trimmedUpiRef.toUpperCase(), trimmedTransactionId]
      );

      // Query returns array directly
      if (Array.isArray(existing) && existing.length > 0) {
        logger.warn(`Duplicate payment attempt: transaction_id=${trimmedTransactionId}, upi_reference=${trimmedUpiRef}`);
        return res.status(400).json({
          success: false,
          message: 'Payment reference or transaction ID already used'
        });
      }
    } else {
      // Check if transaction_id already exists (even if upi_reference is empty)
      const existing = await query(
        'SELECT upipaymentid FROM upi_payment WHERE transaction_id = ?',
        [trimmedTransactionId]
      );
      
      if (Array.isArray(existing) && existing.length > 0) {
        logger.warn(`Duplicate transaction ID: ${trimmedTransactionId}`);
        return res.status(400).json({
          success: false,
          message: 'Transaction ID already used'
        });
      }
    }

    // Auto-approve for GPay and PhonePe
    const autoApprove = payment_method === 'GPay' || payment_method === 'PhonePe';
    const paymentStatus = autoApprove ? 'Verified' : 'Pending';

    // Create payment record
    // saleid can be NULL if payment is submitted before package purchase
    // Use pool.execute directly to get insertId
    const [insertResult] = await pool.execute(
      `INSERT INTO upi_payment (saleid, memberid, amount, upi_id, upi_reference, transaction_id, status, created)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        saleid || null, // Allow NULL saleid
        memberId,
        paymentAmount, // Use converted amount
        process.env.UPI_ID || 'yourbusiness@upi',
        trimmedUpiRef.length > 0 ? trimmedUpiRef.toUpperCase() : trimmedTransactionId,
        trimmedTransactionId,
        paymentStatus // Add status parameter
      ]
    );
    
    // Extract insertId from result
    const paymentId = insertResult?.insertId || null;
    
    if (!paymentId) {
      logger.error('Payment insert failed - no insertId returned. Result:', insertResult);
      throw new Error('Failed to create payment record - no insert ID returned');
    }

    // If auto-approve, activate member immediately
    if (autoApprove) {
      await transaction(async (connection) => {
        // Update payment status
        await connection.execute(
          `UPDATE upi_payment SET status = 'Verified', verified_at = NOW() WHERE upipaymentid = ?`,
          [paymentId]
        );

        // Update sale status
        if (saleid) {
          await connection.execute(
            `UPDATE sale SET paystatus = 'Delivered', active = 'Yes' WHERE saleid = ?`,
            [saleid]
          );
        }

        // Update member status
        await connection.execute(
          `UPDATE member SET active = 'Yes' WHERE memberid = ?`,
          [memberId]
        );

        // Initialize wallet balance if needed
        const ledgerResult = await connection.execute(
          `SELECT ledgerid FROM income_ledger WHERE memberid = ? LIMIT 1`,
          [memberId]
        );
        const existingLedger = ledgerResult[0]; // connection.execute returns [rows, fields]

        if (!existingLedger || existingLedger.length === 0) {
          await connection.execute(
            `INSERT INTO income_ledger (memberid, weekid, amount, balance, status, remark, created)
             VALUES (?, 0, 0, 0, 'Other', 'Initial wallet balance', NOW())`,
            [memberId]
          );
        }
      });

      logger.info(`Payment auto-approved via ${payment_method} for member ${memberId}`);
    }

    res.json({
      success: true,
      message: autoApprove 
        ? 'Payment successful! Your account has been activated.' 
        : 'Payment reference submitted successfully. Admin will verify within 24-48 hours.',
      autoApproved: autoApprove,
      data: {
        upipaymentid: paymentId,
        transaction_id,
        status: paymentStatus,
        autoApproved: autoApprove
      }
    });
  } catch (error) {
    logger.error('Payment submit error:', error);
    logger.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get payment history
router.get('/history', authenticate, requireMember, async (req, res) => {
  try {
    const memberId = req.user.memberid;
    const payments = await query(
      `SELECT upipaymentid, amount, upi_reference, transaction_id, status, created, verified_at
       FROM upi_payment WHERE memberid = ? ORDER BY created DESC`,
      [memberId]
    );

    res.json({ success: true, data: payments });
  } catch (error) {
    logger.error('Payment history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
  }
});

module.exports = router;

