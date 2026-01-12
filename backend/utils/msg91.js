const https = require('https');

/**
 * Send OTP via MSG91 API (Original sendhttp method)
 * @param {string} phone - Phone number (10 digits)
 * @param {string} otp - OTP code to send
 * @returns {Promise<Object>} Response from MSG91
 */
const sendOTP = async (phone, otp) => {
  console.log(`[MSG91] ========== sendOTP called ==========`);
  console.log(`[MSG91] Phone: ${phone}, OTP: ${otp}`);
  
  const authKey = process.env.MSG91_AUTH_KEY || '485059TdWlYZWpMtU46950d955P1';
  // Sender ID is optional - only include if explicitly set
  // If not set, MSG91 will use the default sender ID for your account
  const senderId = process.env.MSG91_SENDER_ID || null;
  // Route is optional - MSG91 will use default if not provided
  const route = process.env.MSG91_ROUTE || '4';

  if (senderId) {
    console.log(`[MSG91] Config - AuthKey: ${authKey ? authKey.substring(0, 10) + '...' : 'NOT SET'}, SenderID: ${senderId}, Route: ${route}`);
    // Validate sender ID format (MSG91 typically requires 6 characters, alphanumeric)
    if (senderId.length !== 6) {
      console.log(`[MSG91] ⚠️ WARNING: Sender ID '${senderId}' is ${senderId.length} characters. MSG91 typically requires 6 characters.`);
    }
  } else {
    console.log(`[MSG91] Config - AuthKey: ${authKey ? authKey.substring(0, 10) + '...' : 'NOT SET'}, SenderID: (using MSG91 default), Route: ${route}`);
  }
  
  // Original MSG91 sendhttp API method
  const message = `Your GoldElevate OTP is ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`;
  
  // Build query string for sendhttp API
  // Note: sender parameter is optional - if not provided, MSG91 uses default sender ID
  const queryParams = new URLSearchParams({
    authkey: authKey,
    mobiles: `91${phone}`, // Add country code 91 for India
    message: message,
    route: route, // Optional, but recommended
    country: '91'
  });
  
  // Only add sender parameter if explicitly configured
  if (senderId) {
    queryParams.append('sender', senderId);
    console.log(`[MSG91] Using custom sender ID: ${senderId}`);
  } else {
    console.log(`[MSG91] Using MSG91 default sender ID (no custom sender configured)`);
  }
  
  console.log(`[MSG91] Request URL: https://control.msg91.com/api/sendhttp.php?${queryParams.toString().replace(/authkey=[^&]+/, 'authkey=***')}`);

  const options = {
    hostname: 'control.msg91.com',
    path: `/api/sendhttp.php?${queryParams.toString()}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  // Wrap in timeout to prevent hanging
  const timeoutMs = 10000; // 10 seconds timeout for MSG91 API
  let timeoutId;

  console.log(`[MSG91] Making HTTPS request to MSG91 API...`);
  
  const requestPromise = new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`[MSG91] Received response from MSG91, status: ${res.statusCode}`);
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        clearTimeout(timeoutId);
        try {
          // MSG91 sendhttp returns request ID as string or error message
          const responseStr = data.toString().trim();
          
          // Log the raw response for debugging
          console.log(`[MSG91] Raw response for ${phone}:`, responseStr);
          console.log(`[MSG91] Response status code:`, res.statusCode);
          
          // FIRST: Check for error messages (must be checked before checking for valid request IDs)
          // MSG91 can return error messages that look like request IDs, so check errors first
          const lowerResponse = responseStr.toLowerCase();
          if (lowerResponse.includes('error') || 
              lowerResponse.includes('invalid') || 
              lowerResponse.includes('failed') ||
              lowerResponse.includes('missing') ||
              lowerResponse.includes('parameter') ||
              lowerResponse.includes('unauthorized') ||
              lowerResponse.includes('forbidden') ||
              lowerResponse.includes('authentication') ||
              lowerResponse.includes('sender') && (lowerResponse.includes('missing') || lowerResponse.includes('invalid'))) {
            // Error response - including "Some Parameter are missing : sender" errors
            console.log(`[MSG91] ❌ Error response detected: ${responseStr}`);
            resolve({
              success: false,
              message: responseStr || 'Failed to send OTP',
              error: responseStr,
              rawResponse: responseStr
            });
            return; // Exit early to prevent treating error as success
          }
          
          // Check if it's a valid request ID (numeric string, hex string, or alphanumeric)
          // MSG91 can return: numeric IDs, hex IDs, or alphanumeric IDs
          // Valid request IDs are typically: numeric, hex (16+ chars), or alphanumeric (16+ chars)
          if (/^\d+$/.test(responseStr) && responseStr.length >= 10) {
            // Success - numeric request ID returned (must be at least 10 digits)
            console.log(`[MSG91] ✅ Success - Numeric Request ID: ${responseStr}`);
            resolve({
              success: true,
              message: 'OTP sent successfully',
              requestId: responseStr
            });
          } else if (/^[0-9a-fA-F]+$/.test(responseStr) && responseStr.length >= 16) {
            // Success - hex request ID returned (must be at least 16 chars for valid hex ID)
            // NOTE: A request ID doesn't guarantee delivery - message might still fail if sender ID is invalid
            console.log(`[MSG91] ✅ Request ID received: ${responseStr}`);
            console.log(`[MSG91] ⚠️ NOTE: Request ID doesn't guarantee delivery. Check MSG91 dashboard to verify actual delivery.`);
            if (senderId) {
              console.log(`[MSG91] ⚠️ If OTP not received, verify sender ID '${senderId}' is approved in MSG91 dashboard.`);
            } else {
              console.log(`[MSG91] ⚠️ If OTP not received, check MSG91 dashboard for delivery status and default sender ID configuration.`);
            }
            resolve({
              success: true,
              message: 'OTP request accepted by MSG91 (verify delivery in dashboard)',
              requestId: responseStr,
              warning: 'Request ID received but delivery not guaranteed - verify sender ID is approved'
            });
          } else if (/^[0-9a-zA-Z]+$/.test(responseStr) && responseStr.length >= 16 && responseStr.length <= 50) {
            // Success - alphanumeric request ID (must be 16-50 chars, alphanumeric only)
            console.log(`[MSG91] ✅ Success - Request ID (alphanumeric): ${responseStr}`);
            resolve({
              success: true,
              message: 'OTP sent successfully',
              requestId: responseStr
            });
          } else {
            // Unknown response format - likely an error
            console.log(`[MSG91] ⚠️ Unknown response format (likely error): ${responseStr}`);
            resolve({
              success: false,
              message: responseStr || 'Failed to send OTP - Invalid response format',
              error: responseStr,
              rawResponse: responseStr
            });
          }
        } catch (parseError) {
          // If parsing fails, check if it's a numeric request ID
          const responseStr = data.toString().trim();
          console.log(`[MSG91] ⚠️ Parse error, raw response: ${responseStr}`);
          if (/^\d+$/.test(responseStr)) {
            resolve({
              success: true,
              message: 'OTP sent successfully',
              requestId: responseStr
            });
          } else {
            reject(new Error(`Failed to parse MSG91 response: ${parseError.message}, raw: ${responseStr}`));
          }
        }
      });
    });

    req.on('error', (error) => {
      clearTimeout(timeoutId);
      console.log(`[MSG91] ❌ Request error:`, error.message);
      reject(new Error(`MSG91 API request failed: ${error.message}`));
    });

    // Set timeout
    timeoutId = setTimeout(() => {
      console.log(`[MSG91] ⏱️ Request timed out after ${timeoutMs}ms`);
      req.destroy();
      reject(new Error(`MSG91 API request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    console.log(`[MSG91] Sending request...`);
    req.end();
  });

  return requestPromise;
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
  const authKey = process.env.MSG91_AUTH_KEY || '485059TdWlYZWpMtU46950d955P1';

  const postData = JSON.stringify({
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

