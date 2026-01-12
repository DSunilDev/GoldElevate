const express = require('express');
const router = express.Router();
const path = require('path');
const { query, transaction } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { logger } = require('../config/database');

// Get payment gateway settings
router.get('/', async (req, res) => {
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
          const path = require('path');
          settings.qr_code_url = baseUrl + '/uploads/images/' + path.basename(settings.qr_code_url);
        }
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
    logger.error('Get payment gateway error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment gateway settings',
      error: error.message
    });
  }
});

// Update payment gateway settings (admin only)
router.put('/', authenticate, requireAdmin, [
  body('upi_id').optional().isString().withMessage('UPI ID must be a string'),
  body('qr_code_url').optional().isString().withMessage('QR code URL must be a string'),
  body('bank_account_number').optional().isString().withMessage('Bank account number must be a string'),
  body('bank_ifsc_code').optional().isString().withMessage('IFSC code must be a string'),
  body('bank_name').optional().isString().withMessage('Bank name must be a string'),
  body('account_holder_name').optional().isString().withMessage('Account holder name must be a string'),
  body('gpay_enabled').optional().isIn(['Yes', 'No']).withMessage('GPay enabled must be Yes or No'),
  body('phonepe_enabled').optional().isIn(['Yes', 'No']).withMessage('PhonePe enabled must be Yes or No'),
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
      gpay_merchant_id,
      phonepe_merchant_id,
      gpay_enabled,
      phonepe_enabled,
    } = req.body;

    // Check if settings exist
    const existing = await query(
      `SELECT id FROM payment_gateway_settings ORDER BY id DESC LIMIT 1`
    );

    if (existing && Array.isArray(existing) && existing.length > 0) {
      // Update existing
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
      if (gpay_merchant_id !== undefined) {
        updateFields.push('gpay_merchant_id = ?');
        updateValues.push(gpay_merchant_id);
      }
      if (phonepe_merchant_id !== undefined) {
        updateFields.push('phonepe_merchant_id = ?');
        updateValues.push(phonepe_merchant_id);
      }
      if (gpay_enabled !== undefined) {
        updateFields.push('gpay_enabled = ?');
        updateValues.push(gpay_enabled);
      }
      if (phonepe_enabled !== undefined) {
        updateFields.push('phonepe_enabled = ?');
        updateValues.push(phonepe_enabled);
      }

      updateFields.push('updated_by = ?');
      updateValues.push(req.user.login || 'admin');
      updateValues.push(existing[0].id);

      await query(
        `UPDATE payment_gateway_settings SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    } else {
      // Create new
      await query(
        `INSERT INTO payment_gateway_settings 
         (upi_id, qr_code_url, qr_code_base64, bank_account_number, bank_ifsc_code, bank_name, 
          account_holder_name, gpay_merchant_id, phonepe_merchant_id, gpay_enabled, phonepe_enabled, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          upi_id || process.env.UPI_ID || 'yourbusiness@upi',
          qr_code_url || process.env.QR_CODE_URL || '/images/upi-qr.jpg',
          qr_code_base64 || null,
          bank_account_number || '',
          bank_ifsc_code || '',
          bank_name || '',
          account_holder_name || '',
          gpay_merchant_id || null,
          phonepe_merchant_id || null,
          gpay_enabled || 'Yes',
          phonepe_enabled || 'Yes',
          req.user.login || 'admin',
        ]
      );
    }

    logger.info(`Payment gateway settings updated by ${req.user.login || 'admin'}`);
    res.json({
      success: true,
      message: 'Payment gateway settings updated successfully'
    });
  } catch (error) {
    logger.error('Update payment gateway error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment gateway settings',
      error: error.message
    });
  }
});

module.exports = router;

