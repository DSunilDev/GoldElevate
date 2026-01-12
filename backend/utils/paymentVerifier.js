const { logger } = require('../config/database');
const https = require('https');
const http = require('http');

/**
 * Payment Verification Utility
 * Validates GPay/PhonePe transactions before auto-approval
 */

/**
 * Validates UPI transaction ID format
 * UPI transaction IDs typically have:
 * - Length: 12-15 alphanumeric characters
 * - Format: Usually starts with specific prefixes for different apps
 */
function validateTransactionIdFormat(transactionId, paymentMethod) {
  if (!transactionId || typeof transactionId !== 'string') {
    return { valid: false, error: 'Invalid transaction ID format' };
  }

  const trimmedId = transactionId.trim();
  
  // Basic validation: 12-15 alphanumeric characters
  if (trimmedId.length < 12 || trimmedId.length > 30) {
    return { valid: false, error: 'Transaction ID must be 12-30 characters long' };
  }

  // Check if it contains only alphanumeric characters, hyphens, and underscores
  if (!/^[A-Za-z0-9\-_]+$/.test(trimmedId)) {
    return { valid: false, error: 'Transaction ID contains invalid characters' };
  }

  // Payment method specific validation
  if (paymentMethod === 'GPay') {
    // GPay transaction IDs typically start with specific patterns
    // They usually don't have a fixed prefix, but we can check format
    if (trimmedId.length < 12) {
      return { valid: false, error: 'GPay transaction ID format is invalid' };
    }
  } else if (paymentMethod === 'PhonePe') {
    // PhonePe transaction IDs also have specific patterns
    if (trimmedId.length < 12) {
      return { valid: false, error: 'PhonePe transaction ID format is invalid' };
    }
  }

  return { valid: true };
}

/**
 * Validates transaction amount against expected amount
 */
function validateAmount(transactionAmount, expectedAmount, tolerance = 0) {
  const transAmount = parseFloat(transactionAmount);
  const expAmount = parseFloat(expectedAmount);

  if (isNaN(transAmount) || isNaN(expAmount)) {
    return { valid: false, error: 'Invalid amount values' };
  }

  const difference = Math.abs(transAmount - expAmount);
  
  if (difference > tolerance) {
    return { 
      valid: false, 
      error: `Amount mismatch. Expected: ₹${expAmount}, Received: ₹${transAmount}` 
    };
  }

  return { valid: true };
}

/**
 * Validates transaction timestamp (prevents old/future transactions)
 * @param {Date} transactionDate - Date when transaction was made
 * @param {number} maxAgeMinutes - Maximum age in minutes (default: 30 minutes)
 * @param {number} futureToleranceMinutes - Allow future timestamps within tolerance (default: 5 minutes)
 */
function validateTransactionTimestamp(transactionDate, maxAgeMinutes = 30, futureToleranceMinutes = 5) {
  if (!transactionDate) {
    // If no timestamp provided, we'll assume it's recent
    return { valid: true, warning: 'No transaction timestamp provided, assuming recent' };
  }

  const transDate = new Date(transactionDate);
  const now = new Date();
  const diffMs = now - transDate;
  const diffMinutes = diffMs / (1000 * 60);

  // Check if transaction is too old
  if (diffMinutes > maxAgeMinutes) {
    return { 
      valid: false, 
      error: `Transaction is too old (${Math.round(diffMinutes)} minutes ago). Maximum allowed: ${maxAgeMinutes} minutes` 
    };
  }

  // Check if transaction is in the future (beyond tolerance)
  if (diffMinutes < -futureToleranceMinutes) {
    return { 
      valid: false, 
      error: 'Transaction timestamp is in the future' 
    };
  }

  return { valid: true };
}

/**
 * Makes HTTP request using Node's built-in https module
 */
function makeHttpRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsedData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(options.timeout || 10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Verifies transaction with Razorpay UPI API (if configured)
 * This requires Razorpay merchant credentials
 */
async function verifyWithRazorpay(transactionId, amount, paymentMethod) {
  try {
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      logger.info('[PAYMENT VERIFICATION] Razorpay credentials not configured, skipping API verification');
      return { verified: false, error: 'Razorpay not configured', requiresApiVerification: false };
    }

    // Razorpay payment verification endpoint
    const razorpayApiUrl = `https://api.razorpay.com/v1/payments/${transactionId}`;
    
    try {
      // Create Basic Auth header
      const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
      
      const response = await makeHttpRequest(razorpayApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.status !== 200) {
        if (response.status === 404) {
          return { verified: false, error: 'Transaction not found in Razorpay', requiresApiVerification: false };
        }
        return { verified: false, error: `Razorpay API returned status ${response.status}`, requiresApiVerification: false };
      }

      const payment = response.data;

      // Verify payment status
      if (payment.status !== 'captured' && payment.status !== 'authorized') {
        return { verified: false, error: `Payment status is ${payment.status}`, requiresApiVerification: false };
      }

      // Verify amount
      const razorpayAmount = payment.amount / 100; // Razorpay amounts are in paise
      if (Math.abs(razorpayAmount - amount) > 0.01) {
        return { verified: false, error: 'Amount mismatch with Razorpay records' };
      }

      // Verify payment method matches
      if (payment.method !== 'upi') {
        return { verified: false, error: 'Payment method mismatch' };
      }

      logger.info(`[PAYMENT VERIFICATION] Transaction ${transactionId} verified successfully via Razorpay`);
      return { verified: true, paymentData: payment };

    } catch (apiError) {
      logger.error('[PAYMENT VERIFICATION] Razorpay API error:', apiError.message);
      return { verified: false, error: 'Failed to verify with Razorpay API: ' + apiError.message, requiresApiVerification: false };
    }
  } catch (error) {
    logger.error('[PAYMENT VERIFICATION] Error in Razorpay verification:', error);
    return { verified: false, error: error.message, requiresApiVerification: false };
  }
}

/**
 * Main verification function for GPay/PhonePe transactions
 * @param {Object} params - Verification parameters
 * @param {string} params.transactionId - Transaction ID provided by user
 * @param {number} params.amount - Transaction amount
 * @param {string} params.paymentMethod - Payment method ('GPay' or 'PhonePe')
 * @param {number} params.expectedAmount - Expected payment amount
 * @param {Date} params.transactionDate - Optional transaction timestamp
 * @param {boolean} params.requireApiVerification - Whether to require API verification (default: false)
 */
async function verifyPayment(params) {
  const { transactionId, amount, paymentMethod, expectedAmount, transactionDate, requireApiVerification = false, skipAmountValidation = false } = params;

  const verificationResults = {
    valid: false,
    verified: false,
    errors: [],
    warnings: [],
    requiresManualVerification: false
  };

  try {
    // 1. Validate transaction ID format
    const formatCheck = validateTransactionIdFormat(transactionId, paymentMethod);
    if (!formatCheck.valid) {
      verificationResults.errors.push(formatCheck.error);
      return verificationResults;
    }

    // 2. Validate amount (skip if skipAmountValidation is true - for manual verification flows)
    if (!skipAmountValidation) {
      const amountCheck = validateAmount(amount, expectedAmount, 0.01); // Allow ₹0.01 tolerance
      if (!amountCheck.valid) {
        verificationResults.errors.push(amountCheck.error);
        verificationResults.requiresManualVerification = true;
        return verificationResults;
      }
    } else {
      // Skip amount validation - log warning for manual verification
      logger.info(`[PAYMENT VERIFICATION] Skipping amount validation for manual verification. Amount: ₹${amount}, Expected: ₹${expectedAmount}`);
      verificationResults.warnings.push('Amount validation skipped - will be verified manually by admin');
    }

    // 3. Validate timestamp if provided
    if (transactionDate) {
      const timestampCheck = validateTransactionTimestamp(transactionDate, 30, 5);
      if (!timestampCheck.valid) {
        verificationResults.errors.push(timestampCheck.error);
        verificationResults.requiresManualVerification = true;
        return verificationResults;
      }
      if (timestampCheck.warning) {
        verificationResults.warnings.push(timestampCheck.warning);
      }
    }

    // 4. Attempt API verification if required or if credentials are available
    if (requireApiVerification || process.env.RAZORPAY_KEY_ID) {
      const apiVerification = await verifyWithRazorpay(transactionId, amount, paymentMethod);
      
      if (apiVerification.verified) {
        verificationResults.verified = true;
        verificationResults.valid = true;
        return verificationResults;
      } else if (requireApiVerification) {
        // If API verification is required but failed, mark for manual verification
        verificationResults.errors.push(apiVerification.error || 'API verification failed');
        verificationResults.requiresManualVerification = true;
        return verificationResults;
      } else {
        // API verification failed but not required - log warning but continue
        verificationResults.warnings.push(apiVerification.error || 'API verification unavailable, relying on basic validation');
      }
    }

    // 5. Basic validation passed - mark as valid
    // Note: This is still not fully verified via API, but basic checks passed
    verificationResults.valid = true;
    verificationResults.verified = false; // Not verified via API, just validated
    verificationResults.warnings.push('Transaction validated but not verified via payment gateway API. Consider enabling API verification for enhanced security.');

    return verificationResults;

  } catch (error) {
    logger.error('[PAYMENT VERIFICATION] Error in payment verification:', error);
    verificationResults.errors.push('Verification error: ' + error.message);
    verificationResults.requiresManualVerification = true;
    return verificationResults;
  }
}

/**
 * Verify payment using webhook callback data (for future implementation)
 * This will be called when payment gateway sends webhook notifications
 */
function verifyWebhookPayment(webhookData, paymentMethod) {
  // This is a placeholder for future webhook implementation
  // Webhook data should contain transaction details from payment gateway
  logger.info('[PAYMENT VERIFICATION] Webhook verification not yet implemented');
  return { verified: false, error: 'Webhook verification not implemented' };
}

module.exports = {
  verifyPayment,
  verifyWebhookPayment,
  validateTransactionIdFormat,
  validateAmount,
  validateTransactionTimestamp
};
