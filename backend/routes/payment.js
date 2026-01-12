const express = require('express');
const router = express.Router();
const { query, transaction, pool } = require('../config/database');
const { authenticate, requireMember } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { logger } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { verifyPayment } = require('../utils/paymentVerifier');
const { creditReferralBonus } = require('../utils/referralBonus');

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

    // NOTE: Sale record should NOT be created here in /payment/init
    // Sale record will be created only when user confirms payment in /payment/submit
    // This prevents duplicate sale records from being created
    let saleId = null;

    // Get payment gateway settings
    let settings = {
      upi_id: process.env.UPI_ID || 'joysreesinha03@oksbi',
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

    // Generate UPI QR code with amount pre-filled
    let qrCodeBase64 = null;
    try {
      const paymentAmount = amount || packageData[0].price;
      const upiId = settings.upi_id || 'joysreesinha03@oksbi';
      const transactionNote = `GoldElevate Payment - ${transactionId}`;
      
      // UPI payment URL format: upi://pay?pa=<UPI_ID>&am=<amount>&tn=<note>&cu=INR
      // Note: Amount should be a string with 2 decimal places for UPI
      const formattedAmount = parseFloat(paymentAmount).toFixed(2);
      const upiPaymentUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&am=${formattedAmount}&tn=${encodeURIComponent(transactionNote)}&cu=INR`;
      
      // Generate QR code as base64 data URL (includes "data:image/png;base64," prefix)
      qrCodeBase64 = await QRCode.toDataURL(upiPaymentUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      logger.info(`✅ QR code generated for payment: ${transactionId}, amount: ₹${formattedAmount}, UPI: ${upiId}`);
    } catch (qrError) {
      logger.error('❌ Error generating QR code:', qrError);
      // Continue without QR code - user can still pay via UPI ID
    }

    res.json({
      success: true,
      data: {
        transaction_id: transactionId,
        saleid: null, // No saleid at init - sale record will be created only on payment submit
        amount: amount || packageData[0].price,
        packageid,
        upi_id: settings.upi_id,
        qr_code_url: settings.qr_code_url,
        qr_code_base64: qrCodeBase64, // Dynamically generated QR code with amount
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

    // Get expected amount from sale or package for verification
    let expectedAmount = paymentAmount;
    if (saleid) {
      const saleData = await query('SELECT amount FROM sale WHERE saleid = ?', [saleid]);
      if (saleData && saleData.length > 0 && saleData[0].amount) {
        expectedAmount = parseFloat(saleData[0].amount);
        logger.info(`[PAYMENT SUBMIT] Expected amount from sale ${saleid}: ₹${expectedAmount}`);
      }
    } else if (packageid) {
      logger.info(`[PAYMENT SUBMIT] Looking up package ${packageid} for expected amount`);
      const packageData = await query('SELECT typeid, price, name FROM def_type WHERE typeid = ?', [packageid]);
      if (packageData && packageData.length > 0 && packageData[0].price) {
        expectedAmount = parseFloat(packageData[0].price);
        logger.info(`[PAYMENT SUBMIT] Package ${packageid} (${packageData[0].name || 'Unknown'}) price: ₹${expectedAmount}`);
      } else {
        logger.warn(`[PAYMENT SUBMIT] Package ${packageid} not found in database`);
      }
    } else {
      logger.info(`[PAYMENT SUBMIT] No saleid or packageid provided, using payment amount as expected: ₹${expectedAmount}`);
    }

    // Verify GPay/PhonePe transactions before auto-approval
    // IMPORTANT: GPay/PhonePe don't provide public APIs for transaction verification
    // Without payment aggregator integration (Razorpay), we cannot verify transactions
    // Therefore, GPay/PhonePe payments require manual admin verification by default
    const isGPayOrPhonePe = payment_method === 'GPay' || payment_method === 'PhonePe';
    let autoApprove = false;
    let verificationResult = null;
    let paymentStatus = 'Pending';

    if (isGPayOrPhonePe) {
      logger.info(`[PAYMENT VERIFICATION] Verifying ${payment_method} transaction: ${trimmedTransactionId}, Amount: ₹${paymentAmount}`);
      
      // Check if API verification is enabled (Razorpay integration)
      const requireApiVerification = process.env.REQUIRE_PAYMENT_API_VERIFICATION === 'true';
      const hasRazorpayCredentials = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
      
      // Only attempt auto-verification if API verification is required AND credentials are available
      if (requireApiVerification && hasRazorpayCredentials) {
        // Perform payment verification with API
        verificationResult = await verifyPayment({
          transactionId: trimmedTransactionId,
          amount: paymentAmount,
          paymentMethod: payment_method,
          expectedAmount: expectedAmount,
          transactionDate: new Date(), // Current timestamp (user just submitted)
          requireApiVerification: true
        });

        logger.info(`[PAYMENT VERIFICATION] Verification result for ${trimmedTransactionId}:`, {
          valid: verificationResult.valid,
          verified: verificationResult.verified,
          errors: verificationResult.errors,
          warnings: verificationResult.warnings,
          requiresManualVerification: verificationResult.requiresManualVerification
        });

        // Only auto-approve if API verification passes
        if (verificationResult.verified && verificationResult.valid && !verificationResult.requiresManualVerification) {
          autoApprove = true;
          paymentStatus = 'Verified';
          
          if (verificationResult.warnings && verificationResult.warnings.length > 0) {
            logger.warn(`[PAYMENT VERIFICATION] Warnings for ${trimmedTransactionId}:`, verificationResult.warnings);
          }
        } else {
          // API verification failed or requires manual review
          autoApprove = false;
          paymentStatus = 'Pending';
          
          logger.warn(`[PAYMENT VERIFICATION] API verification failed for ${trimmedTransactionId}:`, verificationResult.errors);
          
          // Return error if verification fails with specific errors
          if (verificationResult.errors && verificationResult.errors.length > 0) {
            return res.status(400).json({
              success: false,
              message: verificationResult.errors.join(', '),
              error: 'Payment verification failed',
              requiresManualVerification: true
            });
          }
        }
      } else {
        // No API verification configured - require manual admin verification
        // Only validate transaction ID format, NOT amount (since admin will verify manually)
        // This allows payments with different amounts to be submitted for manual review
        const formatCheck = await verifyPayment({
          transactionId: trimmedTransactionId,
          amount: paymentAmount,
          paymentMethod: payment_method,
          expectedAmount: paymentAmount, // Use paymentAmount as expected to skip amount validation
          transactionDate: new Date(),
          requireApiVerification: false,
          skipAmountValidation: true // Skip strict amount validation for manual verification
        });

        // Only check format validation (not amount)
        if (!formatCheck.valid || (formatCheck.errors && formatCheck.errors.length > 0)) {
          // Filter out amount-related errors, only keep format/timestamp errors
          const nonAmountErrors = formatCheck.errors.filter(err => !err.includes('Amount mismatch'));
          
          if (nonAmountErrors.length > 0) {
            logger.warn(`[PAYMENT VERIFICATION] Basic validation failed for ${trimmedTransactionId}:`, nonAmountErrors);
            return res.status(400).json({
              success: false,
              message: nonAmountErrors.join(', ') || 'Payment validation failed',
              error: 'Payment validation failed',
              requiresManualVerification: true
            });
          }
        }

        // Basic validation passed, but requires manual verification since no API verification
        autoApprove = false;
        paymentStatus = 'Pending';
        logger.info(`[PAYMENT VERIFICATION] ${payment_method} payment submitted for manual admin verification (no API verification configured). Amount: ₹${paymentAmount}, Package: ${packageid || 'N/A'}`);
      }
    }

    // Step 1: ALWAYS create sale record FIRST for GPay/PhonePe payments
    // For GPay/PhonePe: ALWAYS create a NEW sale record (ignore provided saleid)
    // MySQL will auto-increment to next ID (e.g., 2017 -> 2018)
    let finalSaleId = null;
    
    // Validate packageid for GPay/PhonePe
    if (isGPayOrPhonePe) {
      if (!packageid) {
        logger.error(`[PAYMENT SUBMIT] ❌ GPay/PhonePe payment requires packageid but none was provided`);
        return res.status(400).json({
          success: false,
          message: 'Package ID is required for GPay/PhonePe payments',
          error: 'Missing packageid'
        });
      }
      
      // Validate package exists
      const packageCheck = await query('SELECT typeid, price FROM def_type WHERE typeid = ?', [packageid]);
      if (!packageCheck || packageCheck.length === 0) {
        logger.error(`[PAYMENT SUBMIT] ❌ Invalid packageid: ${packageid} (package not found)`);
        return res.status(400).json({
          success: false,
          message: 'Invalid package ID. Package not found.',
          error: 'Invalid packageid'
        });
      }
      
      // Use package price if amount doesn't match
      const packagePrice = packageCheck[0].price || 0;
      if (paymentAmount && Math.abs(paymentAmount - packagePrice) > 0.01) {
        logger.warn(`[PAYMENT SUBMIT] ⚠️ Payment amount (${paymentAmount}) doesn't match package price (${packagePrice}), using package price`);
        paymentAmount = packagePrice;
      }
      // Get the last sale ID to see what the next one will be
      const lastSale = await query(
        `SELECT saleid FROM sale ORDER BY saleid DESC LIMIT 1`
      );
      
      const lastSaleId = lastSale && lastSale.length > 0 ? lastSale[0].saleid : null;
      const expectedNextId = lastSaleId ? lastSaleId + 1 : null;
      
      logger.info(`[PAYMENT SUBMIT] GPay/PhonePe - Last sale ID: ${lastSaleId || 'N/A'}, Creating NEW sale record (will be: ${expectedNextId || 'auto-incremented'})`);
      
      // Create sale record - MySQL will auto-increment to next ID (e.g., 2017 -> 2018)
      try {
        logger.info(`[PAYMENT SUBMIT] Attempting to INSERT sale record with: memberId=${memberId}, packageid=${packageid}, amount=${paymentAmount}, paytype='UPI'`);
        const saleInsertResult = await pool.execute(
          `INSERT INTO sale (memberid, typeid, amount, signuptype, paystatus, active, paytype, created)
           VALUES (?, ?, ?, 'Yes', 'Pending', 'No', 'UPI', NOW())`,
          [memberId, packageid, paymentAmount]
        );
        
        // pool.execute returns [result, fields] where result has insertId and affectedRows
        const result = saleInsertResult[0];
        finalSaleId = result?.insertId;
        
        logger.info(`[PAYMENT SUBMIT] Sale insert result:`, {
          insertId: result?.insertId,
          affectedRows: result?.affectedRows,
          resultType: typeof result,
          resultKeys: result ? Object.keys(result) : 'null'
        });
        
        if (!finalSaleId) {
          logger.error(`[PAYMENT SUBMIT] ❌ CRITICAL: Failed to get insertId from sale record creation!`);
          logger.error(`[PAYMENT SUBMIT] Full result:`, JSON.stringify(saleInsertResult, null, 2));
          return res.status(500).json({
            success: false,
            message: 'Failed to create sale record. Please try again.',
            error: 'Sale record creation failed - no insert ID returned'
          });
        }
        
        // Verify the sale record was actually created
        const verifySale = await query(
          `SELECT saleid, paystatus, active FROM sale WHERE saleid = ?`,
          [finalSaleId]
        );
        
        if (!verifySale || verifySale.length === 0) {
          logger.error(`[PAYMENT SUBMIT] ❌ CRITICAL: Sale record ${finalSaleId} was not found in database after creation!`);
          return res.status(500).json({
            success: false,
            message: 'Sale record creation failed. Please try again.',
            error: 'Sale record not found after creation'
          });
        }
        
        logger.info(`[PAYMENT SUBMIT] ✅ Created and verified sale record ${finalSaleId} (expected: ${expectedNextId || 'N/A'}) with paystatus='Pending', active='No'`);
        
        if (expectedNextId && finalSaleId !== expectedNextId) {
          logger.warn(`[PAYMENT SUBMIT] ⚠️ Expected sale ID ${expectedNextId} but got ${finalSaleId} - MySQL auto-increment may have skipped or concurrent insert`);
        }
      } catch (saleError) {
        logger.error(`[PAYMENT SUBMIT] ❌ ERROR creating sale record:`, saleError);
        logger.error(`[PAYMENT SUBMIT] Error stack:`, saleError.stack);
        return res.status(500).json({
          success: false,
          message: 'Failed to create sale record: ' + saleError.message,
          error: 'Sale record creation error'
        });
      }
      
    } else if (saleid) {
      // For other payment methods: Use provided saleid
      finalSaleId = saleid;
      logger.info(`[PAYMENT SUBMIT] Using provided saleid ${finalSaleId} for payment`);
      
    } else if (packageid) {
      // For other payment methods, create sale record if missing
      // Determine paytype based on payment method
      const paytype = isGPayOrPhonePe ? 'UPI' : 'Other';
      logger.info(`[PAYMENT SUBMIT] Creating sale record for member ${memberId}, package ${packageid}, amount ${paymentAmount}, paytype='${paytype}'`);
      
      const [saleInsertResult] = await pool.execute(
        `INSERT INTO sale (memberid, typeid, amount, signuptype, paystatus, active, paytype, created)
         VALUES (?, ?, ?, 'Yes', 'Pending', 'No', ?, NOW())`,
        [memberId, packageid, paymentAmount, paytype]
      );
      
      finalSaleId = saleInsertResult.insertId;
      logger.info(`[PAYMENT SUBMIT] Created sale record ${finalSaleId} with paystatus='Pending', paytype='${paytype}'`);
      
    } else if (!finalSaleId) {
      // Check if there's an existing pending sale for this member
      const existingSale = await query(
        `SELECT saleid FROM sale WHERE memberid = ? AND paystatus = 'Pending' ORDER BY created DESC LIMIT 1`,
        [memberId]
      );
      
      if (existingSale && existingSale.length > 0) {
        finalSaleId = existingSale[0].saleid;
        logger.info(`[PAYMENT SUBMIT] Using existing pending sale record ${finalSaleId}`);
      } else {
        logger.warn(`[PAYMENT SUBMIT] No saleid and no packageid provided - payment will be created without sale record`);
      }
    }
    
    // Validate finalSaleId before creating payment record
    // For GPay/PhonePe with packageid, sale record MUST exist
    if (isGPayOrPhonePe && packageid && !finalSaleId) {
      logger.error(`[PAYMENT SUBMIT] ❌ CRITICAL: Failed to create sale record for GPay/PhonePe payment - member ${memberId}, package ${packageid}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to create sale record. Please try again.',
        error: 'Sale record creation failed for GPay/PhonePe payment'
      });
    }

    // Create payment record with initial status
    // Use pool.execute directly to get insertId
    // Ensure saleid is included in payment record
    const [insertResult] = await pool.execute(
      `INSERT INTO upi_payment (saleid, memberid, amount, upi_id, upi_reference, transaction_id, status, created)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        finalSaleId || null, // Use finalSaleId (created above)
        memberId,
        paymentAmount, // Use converted amount
        process.env.UPI_ID || 'yourbusiness@upi',
        trimmedUpiRef.length > 0 ? trimmedUpiRef.toUpperCase() : trimmedTransactionId,
        trimmedTransactionId,
        paymentStatus // Status based on verification or 'Pending'
      ]
    );
    
    // Extract insertId from result
    const paymentId = insertResult?.insertId || null;
    
    if (!paymentId) {
      logger.error('[PAYMENT SUBMIT] ❌ Payment insert failed - no insertId returned. Result:', insertResult);
      throw new Error('Failed to create payment record - no insert ID returned');
    }
    
    // Verify sale record exists in database
    if (finalSaleId) {
      const verifySale = await query(
        `SELECT saleid, paystatus, active FROM sale WHERE saleid = ?`,
        [finalSaleId]
      );
      
      if (!verifySale || verifySale.length === 0) {
        logger.error(`[PAYMENT SUBMIT] ❌ Sale record ${finalSaleId} not found in database after creation!`);
      } else {
        logger.info(`[PAYMENT SUBMIT] ✅ Verified sale record ${finalSaleId}: paystatus='${verifySale[0].paystatus}', active='${verifySale[0].active}'`);
      }
    }
    
    logger.info(`[PAYMENT SUBMIT] ✅ Created payment record ${paymentId} with saleid=${finalSaleId || 'NULL'}, status=${paymentStatus}`);
    
    // Log the transaction details for debugging
    logger.info(`[PAYMENT SUBMIT] Transaction Summary: member=${memberId}, payment=${paymentId}, sale=${finalSaleId}, amount=${paymentAmount}, method=${payment_method}, status=${paymentStatus}`);

    // If auto-approve (verification passed), activate member immediately
    if (autoApprove) {
      await transaction(async (connection) => {
        // Update payment status
        await connection.execute(
          `UPDATE upi_payment SET status = 'Verified', verified_at = NOW() WHERE upipaymentid = ?`,
          [paymentId]
        );

        // Use the finalSaleId that was created/retrieved during payment submission
        let finalSaleIdForActivation = finalSaleId || saleid;
        let saleTypeid = packageid || null;

        // If saleid exists, update existing sale record
        if (finalSaleIdForActivation) {
          await connection.execute(
            `UPDATE sale SET paystatus = 'Delivered', active = 'Yes', activated_at = NOW() WHERE saleid = ?`,
            [finalSaleIdForActivation]
          );
          
          // Get the sale's typeid
          const saleResult = await connection.execute(
            `SELECT typeid FROM sale WHERE saleid = ?`,
            [finalSaleIdForActivation]
          );
          const sale = saleResult[0];
          if (sale && sale.length > 0 && sale[0].typeid) {
            saleTypeid = sale[0].typeid;
          }
          logger.info(`[PAYMENT AUTO-APPROVE] Updated sale record ${finalSaleIdForActivation} to paystatus='Delivered', active='Yes'`);
        } else if (packageid) {
          // No saleid but packageid provided - create new sale record (shouldn't happen, but fallback)
          // Determine paytype based on payment method
          const paytype = isGPayOrPhonePe ? 'UPI' : 'Other';
          logger.warn(`[PAYMENT AUTO-APPROVE] No saleid found, creating new sale record for member ${memberId}, package ${packageid}, paytype='${paytype}'`);
          
          const [saleInsertResult] = await connection.execute(
            `INSERT INTO sale (memberid, typeid, amount, signuptype, paystatus, active, paytype, activated_at, created)
             VALUES (?, ?, ?, 'Yes', 'Delivered', 'Yes', ?, NOW(), NOW())`,
            [memberId, packageid, paymentAmount, paytype]
          );
          
          finalSaleIdForActivation = saleInsertResult.insertId;
          
          // Update payment record with new saleid
          await connection.execute(
            `UPDATE upi_payment SET saleid = ? WHERE upipaymentid = ?`,
            [finalSaleIdForActivation, paymentId]
          );
          
          saleTypeid = packageid;
          logger.info(`[PAYMENT AUTO-APPROVE] Created sale record ${finalSaleIdForActivation} for member ${memberId}`);
        } else {
          logger.warn(`[PAYMENT AUTO-APPROVE] Cannot create sale record - missing both saleid and packageid for member ${memberId}`);
        }

        // Update member's package (typeid) and active status
        if (saleTypeid) {
          // Check if member already has a typeid (first sale already verified)
          const memberCheck = await connection.execute(
            `SELECT typeid FROM member WHERE memberid = ?`,
            [memberId]
          );
          const member = memberCheck[0];
          const hasExistingTypeid = member && member.length > 0 && member[0].typeid !== null && member[0].typeid !== undefined;
          
          if (!hasExistingTypeid) {
            // First sale - update member's typeid to the verified package
            await connection.execute(
              `UPDATE member SET typeid = ?, active = 'Yes' WHERE memberid = ?`,
              [saleTypeid, memberId]
            );
            logger.info(`[PAYMENT AUTO-APPROVE] ✅ First sale verified - Updated member ${memberId} typeid to ${saleTypeid}, set active = 'Yes'`);
            
            // Credit referral bonus to sponsor (only for first transaction)
            const packagePrice = parseFloat(paymentAmount || 0);
            if (packagePrice > 0) {
              await creditReferralBonus(connection, memberId, packagePrice);
            } else {
              logger.warn(`[PAYMENT AUTO-APPROVE] Package price is 0 or invalid (${paymentAmount}) for member ${memberId}, skipping referral bonus`);
            }
          } else {
            // Subsequent sale - only update active status, don't change typeid
            await connection.execute(
              `UPDATE member SET active = 'Yes' WHERE memberid = ? AND active != 'Yes'`,
              [memberId]
            );
            logger.info(`[PAYMENT AUTO-APPROVE] Subsequent sale verified - Member ${memberId} already has typeid ${member[0].typeid}, only updated active status`);
          }
        } else {
          // Fallback: just update active status (no package assigned)
          await connection.execute(
            `UPDATE member SET active = 'Yes' WHERE memberid = ?`,
            [memberId]
          );
          logger.info(`[PAYMENT AUTO-APPROVE] Updated member ${memberId} active status to 'Yes' (no package)`);
        }

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

      logger.info(`Payment auto-approved via ${payment_method} for member ${memberId} after successful verification`);
    } else if (isGPayOrPhonePe && !autoApprove) {
      // GPay/PhonePe but verification didn't pass - log for admin review
      logger.warn(`[PAYMENT VERIFICATION] ${payment_method} payment requires manual verification: transaction_id=${trimmedTransactionId}, member=${memberId}, amount=${paymentAmount}`);
      
      if (verificationResult && verificationResult.warnings && verificationResult.warnings.length > 0) {
        logger.warn(`[PAYMENT VERIFICATION] Warnings:`, verificationResult.warnings);
      }
    }

    res.json({
      success: true,
      message: autoApprove 
        ? 'Payment verified successfully! Your account has been activated.' 
        : isGPayOrPhonePe
          ? 'Payment submitted successfully. Verification is pending. Admin will review within 24-48 hours.'
          : 'Payment reference submitted successfully. Admin will verify within 24-48 hours.',
      autoApproved: autoApprove,
      verified: verificationResult?.verified || false,
      requiresManualVerification: verificationResult?.requiresManualVerification || false,
      data: {
        upipaymentid: paymentId,
        transaction_id: trimmedTransactionId,
        status: paymentStatus,
        autoApproved: autoApprove,
        verificationWarnings: verificationResult?.warnings || []
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

// Webhook endpoint for payment gateway callbacks (Razorpay, PhonePe, GPay, etc.)
// This endpoint receives payment status updates from payment gateways
// Note: This endpoint should be configured to accept raw JSON in your Express app
// You may need to configure body parser middleware in server.js to handle webhooks
router.post('/webhook', async (req, res) => {
  try {
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || '';
    const signature = req.headers['x-razorpay-signature'] || req.headers['x-phonepe-signature'] || '';
    
    logger.info('[PAYMENT WEBHOOK] Received webhook callback');
    logger.info('[PAYMENT WEBHOOK] Headers:', req.headers);
    
    // Parse webhook body (should be JSON)
    let webhookData;
    try {
      // If body is already parsed (by express.json()), use it directly
      // Otherwise, try to parse if it's a string
      webhookData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (parseError) {
      logger.error('[PAYMENT WEBHOOK] Failed to parse webhook body:', parseError);
      return res.status(400).json({ success: false, message: 'Invalid webhook payload' });
    }

    logger.info('[PAYMENT WEBHOOK] Webhook data:', JSON.stringify(webhookData, null, 2));

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      // TODO: Implement signature verification for the specific payment gateway
      // This requires crypto verification based on the payment gateway's algorithm
      logger.info('[PAYMENT WEBHOOK] Signature verification not yet implemented');
    }

    // Extract transaction details from webhook
    const transactionId = webhookData?.payment?.id || 
                         webhookData?.entity?.id || 
                         webhookData?.transaction_id || 
                         webhookData?.data?.transactionId;
    
    const status = webhookData?.payment?.status || 
                  webhookData?.entity?.status || 
                  webhookData?.status ||
                  webhookData?.data?.status;
    
    const amount = webhookData?.payment?.amount ? (webhookData.payment.amount / 100) : 
                  webhookData?.entity?.amount ? (webhookData.entity.amount / 100) :
                  webhookData?.amount ||
                  webhookData?.data?.amount;

    if (!transactionId) {
      logger.warn('[PAYMENT WEBHOOK] No transaction ID found in webhook data');
      return res.status(400).json({ success: false, message: 'Transaction ID not found in webhook' });
    }

    logger.info(`[PAYMENT WEBHOOK] Processing webhook for transaction: ${transactionId}, status: ${status}, amount: ${amount}`);

    // Find payment record by transaction_id
    const paymentRecord = await query(
      `SELECT * FROM upi_payment WHERE transaction_id = ? ORDER BY created DESC LIMIT 1`,
      [transactionId]
    );

    if (!paymentRecord || paymentRecord.length === 0) {
      logger.warn(`[PAYMENT WEBHOOK] Payment record not found for transaction: ${transactionId}`);
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const payment = paymentRecord[0];

    // Map webhook status to our payment status
    let paymentStatus = 'Pending';
    if (status === 'captured' || status === 'success' || status === 'SUCCESS' || status === 'COMPLETED') {
      paymentStatus = 'Verified';
    } else if (status === 'failed' || status === 'FAILED' || status === 'FAILURE') {
      paymentStatus = 'Rejected';
    }

    // Only update if status changed
    if (payment.status !== paymentStatus && paymentStatus !== 'Pending') {
      await transaction(async (connection) => {
        // Update payment status
        await connection.execute(
          `UPDATE upi_payment SET status = ?, verified_at = NOW() WHERE upipaymentid = ?`,
          [paymentStatus, payment.upipaymentid]
        );

        // If verified, activate member and package (same logic as manual verification)
        if (paymentStatus === 'Verified') {
          // Update sale status if exists
          if (payment.saleid) {
            await connection.execute(
              `UPDATE sale SET paystatus = 'Delivered', active = 'Yes', activated_at = NOW() WHERE saleid = ?`,
              [payment.saleid]
            );
            
            // Get sale's typeid and amount to update member's package
            const saleResult = await connection.execute(
              `SELECT typeid, amount FROM sale WHERE saleid = ?`,
              [payment.saleid]
            );
            const sale = saleResult[0];
            if (sale && sale.length > 0 && sale[0].typeid) {
              // Check if member already has a typeid (first sale already verified)
              const memberCheck = await connection.execute(
                `SELECT typeid FROM member WHERE memberid = ?`,
                [payment.memberid]
              );
              const member = memberCheck[0];
              const hasExistingTypeid = member && member.length > 0 && member[0].typeid !== null && member[0].typeid !== undefined;
              
              if (!hasExistingTypeid) {
                // First sale - update member's typeid to the verified package
                await connection.execute(
                  `UPDATE member SET typeid = ?, active = 'Yes' WHERE memberid = ?`,
                  [sale[0].typeid, payment.memberid]
                );
                logger.info(`[WEBHOOK AUTO-APPROVE] ✅ First sale verified - Updated member ${payment.memberid} typeid to ${sale[0].typeid}, set active='Yes'`);
                
                // Credit referral bonus to sponsor (only for first transaction)
                const packagePrice = parseFloat(sale[0].amount || 0);
                if (packagePrice > 0) {
                  await creditReferralBonus(connection, payment.memberid, packagePrice);
                } else {
                  logger.warn(`[WEBHOOK AUTO-APPROVE] Package price is 0 or invalid (${sale[0].amount}) for member ${payment.memberid}, skipping referral bonus`);
                }
              } else {
                // Subsequent sale - only update active status, don't change typeid
                await connection.execute(
                  `UPDATE member SET active = 'Yes' WHERE memberid = ? AND active != 'Yes'`,
                  [payment.memberid]
                );
                logger.info(`[WEBHOOK AUTO-APPROVE] Subsequent sale verified - Member ${payment.memberid} already has typeid ${member[0].typeid}, only updated active status`);
              }
            } else {
              await connection.execute(
                `UPDATE member SET active = 'Yes' WHERE memberid = ?`,
                [payment.memberid]
              );
            }
          } else {
            await connection.execute(
              `UPDATE member SET active = 'Yes' WHERE memberid = ?`,
              [payment.memberid]
            );
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
          }
        }

        logger.info(`[PAYMENT WEBHOOK] Updated payment ${payment.upipaymentid} status to ${paymentStatus} via webhook`);
      });
    }

    // Return success to webhook provider
    res.json({ success: true, message: 'Webhook processed successfully' });

  } catch (error) {
    logger.error('[PAYMENT WEBHOOK] Error processing webhook:', error);
    logger.error('[PAYMENT WEBHOOK] Error stack:', error.stack);
    // Still return 200 to prevent webhook provider from retrying (we'll log and investigate)
    res.status(200).json({ success: false, message: 'Webhook processing error (logged)' });
  }
});

module.exports = router;

