const https = require('https');

/**
 * Send OTP via MSG91 API (Original sendhttp method)
 * @param {string} phone - Phone number (10 digits)
 * @param {string} otp - OTP code to send
 * @returns {Promise<Object>} Response from MSG91
 */
const sendOTP = async (phone, otp) => {
  const authKey = process.env.MSG91_AUTH_KEY || 'YOUR_MSG91_AUTH_KEY';
  const senderId = process.env.MSG91_SENDER_ID || 'GOLDEV';
  const route = process.env.MSG91_ROUTE || '4'; // 4 = Transactional, 1 = Promotional

  // Original MSG91 sendhttp API method
  const message = `Your GoldElevate OTP is ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`;
  
  // Build query string for sendhttp API
  const queryParams = new URLSearchParams({
    authkey: authKey,
    mobiles: `91${phone}`, // Add country code 91 for India
    message: message,
    sender: senderId,
    route: route,
    country: '91'
  });

  const options = {
    hostname: 'control.msg91.com',
    path: `/api/sendhttp.php?${queryParams.toString()}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          // MSG91 sendhttp returns request ID as string or error message
          const responseStr = data.toString().trim();
          
          // Check if it's a request ID (numeric string) or error
          if (/^\d+$/.test(responseStr)) {
            // Success - request ID returned
            resolve({
              success: true,
              message: 'OTP sent successfully',
              requestId: responseStr
            });
          } else if (responseStr.toLowerCase().includes('error') || responseStr.toLowerCase().includes('invalid')) {
            // Error response
            resolve({
              success: false,
              message: responseStr || 'Failed to send OTP',
              error: responseStr
            });
          } else {
            // Unknown response, assume success
            resolve({
              success: true,
              message: 'OTP sent successfully',
              requestId: responseStr
            });
          }
        } catch (parseError) {
          // If parsing fails, check if it's a numeric request ID
          const responseStr = data.toString().trim();
          if (/^\d+$/.test(responseStr)) {
            resolve({
              success: true,
              message: 'OTP sent successfully',
              requestId: responseStr
            });
          } else {
            reject(new Error(`Failed to parse MSG91 response: ${parseError.message}`));
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`MSG91 API request failed: ${error.message}`));
    });

    req.end();
  });
};

/**
 * Verify OTP via MSG91 API (Original method - verify against stored OTP)
 * Note: Original implementation stored OTP and verified locally
 * This function is kept for compatibility but verification is done against stored OTP
 * @param {string} phone - Phone number (10 digits)
 * @param {string} otp - OTP code to verify
 * @returns {Promise<Object>} Verification result
 */
const verifyOTP = async (phone, otp) => {
  // Original implementation verified OTP against stored value
  // MSG91 sendhttp doesn't have a verify endpoint, so we verify locally
  // This function is kept for API compatibility
  return Promise.resolve({
    success: true,
    message: 'OTP verification (handled by stored OTP check)'
  });
};

/**
 * Send SMS via MSG91 (for general messages)
 * @param {string} phone - Phone number (10 digits)
 * @param {string} message - Message to send
 * @returns {Promise<Object>} Response from MSG91
 */
const sendSMS = async (phone, message) => {
  const authKey = process.env.MSG91_AUTH_KEY || 'YOUR_MSG91_AUTH_KEY';
  const senderId = process.env.MSG91_SENDER_ID || 'GOLDEV';
  const route = process.env.MSG91_ROUTE || '4'; // 4 = Transactional, 1 = Promotional

  const postData = JSON.stringify({
    sender: senderId,
    route: route,
    country: '91',
    sms: [{
      message: message,
      to: [`91${phone}`]
    }]
  });

  const options = {
    hostname: 'control.msg91.com',
    path: `/api/sendhttp.php?authkey=${authKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          // MSG91 returns response as string or JSON
          if (data.startsWith('{')) {
            const response = JSON.parse(data);
            resolve({
              success: response.type === 'success',
              message: response.message || 'SMS sent',
              response: response
            });
          } else {
            // String response (request ID)
            resolve({
              success: true,
              message: 'SMS sent successfully',
              requestId: data.trim()
            });
          }
        } catch (parseError) {
          resolve({
            success: true,
            message: 'SMS sent (response parsing failed)',
            rawResponse: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`MSG91 SMS API request failed: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
};

module.exports = {
  sendOTP,
  verifyOTP,
  sendSMS
};

