/**
 * MSG91 React Native SDK Integration
 * 
 * This utility wraps the @msg91comm/sendotp-react-native SDK
 * for easier integration across the app.
 */

let OTPWidget = null;
try {
  console.log('[MSG91 SDK] Attempting to load @msg91comm/sendotp-react-native module...');
  const msg91Module = require('@msg91comm/sendotp-react-native');
  console.log('[MSG91 SDK] Module loaded. Module keys:', Object.keys(msg91Module));
  console.log('[MSG91 SDK] Module structure:', JSON.stringify(Object.keys(msg91Module)));
  
  // Try different import patterns
  OTPWidget = msg91Module.OTPWidget || msg91Module.default?.OTPWidget || msg91Module.default || msg91Module;
  
  console.log('[MSG91 SDK] OTPWidget extracted:', !!OTPWidget);
  console.log('[MSG91 SDK] OTPWidget type:', typeof OTPWidget);
  
  if (OTPWidget) {
    console.log('[MSG91 SDK] OTPWidget methods:', Object.keys(OTPWidget));
    console.log('[MSG91 SDK] sendOTP function exists:', typeof OTPWidget.sendOTP === 'function');
    console.log('[MSG91 SDK] initializeWidget function exists:', typeof OTPWidget.initializeWidget === 'function');
  }
  
  if (!OTPWidget || typeof OTPWidget.sendOTP !== 'function') {
    console.error('❌ MSG91 SDK structure unexpected. OTPWidget:', OTPWidget);
    console.error('❌ Module keys:', Object.keys(msg91Module));
    OTPWidget = null;
  } else {
    console.log('✅ MSG91 SDK loaded successfully');
  }
} catch (error) {
  console.error('❌ MSG91 SDK not available:', error.message);
  console.error('❌ Error stack:', error.stack);
  // SDK not installed or not linked properly
}

// MSG91 Widget Configuration
const WIDGET_ID = '356c42676f6d373231353532';
const TOKEN_AUTH = '485059TdWlYZWpMtU46950d955P1';

// Initialize widget (call this once in App.js or similar)
let isInitialized = false;

export const initializeMsg91Widget = () => {
  console.log('[MSG91 SDK] initializeMsg91Widget called');
  console.log('[MSG91 SDK] OTPWidget available:', !!OTPWidget);
  console.log('[MSG91 SDK] Already initialized:', isInitialized);
  console.log('[MSG91 SDK] Widget ID:', WIDGET_ID);
  console.log('[MSG91 SDK] Token configured:', !!TOKEN_AUTH);
  
  if (!OTPWidget) {
    console.error('❌ MSG91 SDK not available. Please install: npm install @msg91comm/sendotp-react-native');
    return false;
  }
  
  if (typeof OTPWidget.initializeWidget !== 'function') {
    console.error('❌ OTPWidget.initializeWidget is not a function');
    console.error('❌ OTPWidget methods:', Object.keys(OTPWidget));
    return false;
  }
  
  if (!isInitialized) {
    try {
      // IMPORTANT: tokenAuth should be a string, not an object
      // According to MSG91 docs: OTPWidget.initializeWidget(widgetId, tokenAuth)
      console.log('[MSG91 SDK] Initializing widget with:', { widgetId: WIDGET_ID, hasToken: !!TOKEN_AUTH });
      console.log('[MSG91 SDK] Token type:', typeof TOKEN_AUTH);
      OTPWidget.initializeWidget(WIDGET_ID, TOKEN_AUTH);
      isInitialized = true;
      console.log('✅ MSG91 Widget initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MSG91 Widget:', error);
      console.error('❌ Error details:', error.message, error.stack);
      isInitialized = false;
    }
  } else {
    console.log('[MSG91 SDK] Widget already initialized, skipping');
  }
  return isInitialized;
};

/**
 * Send OTP using MSG91 SDK
 * @param {string} phoneNumber - 10-digit phone number (without country code)
 * @returns {Promise<Object>} Response with reqId and status
 */
export const sendOTP = async (phoneNumber) => {
  console.log('═══════════════════════════════════════════════════');
  console.log('[MSG91 SDK] ========== sendOTP called ==========');
  console.log('[MSG91 SDK] Phone:', phoneNumber);
  console.log('[MSG91 SDK] OTPWidget available:', !!OTPWidget);
  console.log('[MSG91 SDK] OTPWidget type:', typeof OTPWidget);
  console.log('[MSG91 SDK] OTPWidget.sendOTP function:', typeof OTPWidget?.sendOTP);
  console.log('[MSG91 SDK] isInitialized:', isInitialized);
  
  if (!OTPWidget) {
    console.error('❌ [MSG91 SDK] OTPWidget is null/undefined - SDK not loaded');
    console.error('❌ [MSG91 SDK] This means @msg91comm/sendotp-react-native is not properly installed or linked');
    console.error('❌ [MSG91 SDK] Falling back to backend MSG91 API');
    return {
      success: false,
      error: 'MSG91 SDK not installed or not linked',
      response: null
    };
  }

  if (typeof OTPWidget.sendOTP !== 'function') {
    console.error('❌ [MSG91 SDK] OTPWidget.sendOTP is not a function');
    console.error('❌ [MSG91 SDK] OTPWidget object:', OTPWidget);
    console.error('❌ [MSG91 SDK] Available methods:', Object.keys(OTPWidget || {}));
    console.error('❌ [MSG91 SDK] Falling back to backend MSG91 API');
    return {
      success: false,
      error: 'MSG91 SDK sendOTP function not available',
      response: null
    };
  }

  try {
    // Ensure widget is initialized
    if (!isInitialized) {
      console.log('[MSG91 SDK] Widget not initialized, initializing now...');
      const initResult = initializeMsg91Widget();
      if (!initResult) {
        console.error('❌ Failed to initialize MSG91 widget');
        return {
          success: false,
          error: 'Failed to initialize MSG91 widget',
          response: null
        };
      }
    }

    // Format phone number with country code (91 for India)
    const identifier = `91${phoneNumber}`;
    console.log('[MSG91 SDK] Formatted identifier:', identifier);
    
    const data = {
      identifier: identifier
    };

    console.log('[MSG91 SDK] Calling OTPWidget.sendOTP with data:', JSON.stringify(data));
    console.log('[MSG91 SDK] About to call native MSG91 SDK...');
    
    const response = await OTPWidget.sendOTP(data);
    
    console.log('[MSG91 SDK] ========== Response Received ==========');
    console.log('[MSG91 SDK] Raw response:', JSON.stringify(response, null, 2));
    console.log('[MSG91 SDK] Response type:', typeof response);
    console.log('[MSG91 SDK] Response is null?', response === null);
    console.log('[MSG91 SDK] Response is undefined?', response === undefined);
    if (response) {
      console.log('[MSG91 SDK] Response keys:', Object.keys(response));
      console.log('[MSG91 SDK] Response.type:', response.type);
      console.log('[MSG91 SDK] Response.code:', response.code);
      console.log('[MSG91 SDK] Response.message:', response.message);
      console.log('[MSG91 SDK] Response.reqId:', response.reqId);
    }
    
    // Check for error responses first
    if (response && response.type === 'error') {
      console.error('❌ MSG91 returned error response:', response);
      return {
        success: false,
        error: response.message || 'MSG91 returned error',
        response: response
      };
    }

    if (response && response.code && response.code !== '200' && response.code !== '201') {
      console.error('❌ MSG91 returned error code:', response.code, response.message);
      return {
        success: false,
        error: response.message || `MSG91 error code: ${response.code}`,
        response: response
      };
    }
    
    // Extract request ID from response (can be in reqId, requestId, or message field)
    const reqId = response?.reqId || response?.requestId || response?.message || null;
    console.log('[MSG91 SDK] Extracted reqId:', reqId);
    
    // Check if response indicates success
    const isSuccess = response?.type === 'success' || 
                     response?.status === 'success' || 
                     (response?.message && typeof response.message === 'string' && response.message.length > 0 && !response.message.toLowerCase().includes('error') && !response.message.toLowerCase().includes('fail'));
    
    console.log('[MSG91 SDK] Success check result:', isSuccess);
    console.log('[MSG91 SDK] Has reqId:', !!reqId);
    
    const finalSuccess = isSuccess && !!reqId;
    
    if (!finalSuccess) {
      console.error('❌ MSG91 sendOTP failed - isSuccess:', isSuccess, 'reqId:', reqId);
      console.error('❌ Full response:', JSON.stringify(response));
    }
    
    return {
      success: finalSuccess,
      reqId: reqId,
      response: response
    };
  } catch (error) {
    console.error('❌ MSG91 Send OTP Exception:', error);
    console.error('❌ Error stack:', error.stack);
    return {
      success: false,
      error: error.message || 'Failed to send OTP',
      response: error
    };
  }
};

/**
 * Retry OTP using MSG91 SDK
 * @param {string} reqId - Request ID from sendOTP response
 * @param {number} retryChannel - Channel code (11 for SMS)
 * @returns {Promise<Object>} Response with status
 */
export const retryOTP = async (reqId, retryChannel = 11) => {
  if (!OTPWidget) {
    return {
      success: false,
      error: 'MSG91 SDK not installed',
      response: null
    };
  }

  try {
    const body = {
      reqId: reqId,
      retryChannel: retryChannel // 11 = SMS
    };

    const response = await OTPWidget.retryOTP(body);
    console.log('MSG91 Retry OTP Response:', response);
    
    const isSuccess = response.type === 'success' || response.status === 'success';
    
    return {
      success: isSuccess,
      response: response
    };
  } catch (error) {
    console.error('MSG91 Retry OTP Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retry OTP',
      response: error
    };
  }
};

/**
 * Verify OTP using MSG91 SDK
 * @param {string} reqId - Request ID from sendOTP response
 * @param {string} otp - OTP code entered by user
 * @returns {Promise<Object>} Verification result
 */
export const verifyOTP = async (reqId, otp) => {
  if (!OTPWidget) {
    return {
      success: false,
      error: 'MSG91 SDK not installed',
      response: null
    };
  }

  try {
    const body = {
      reqId: reqId,
      otp: otp
    };

    const response = await OTPWidget.verifyOTP(body);
    console.log('MSG91 Verify OTP Response:', response);
    
    // Check various success indicators
    const isSuccess = response.type === 'success' || 
                     response.status === 'success' || 
                     response.verified === true ||
                     (response.message && typeof response.message === 'string' && response.message.toLowerCase().includes('success'));
    
    return {
      success: isSuccess,
      response: response
    };
  } catch (error) {
    console.error('MSG91 Verify OTP Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify OTP',
      response: error
    };
  }
};

export default {
  initializeMsg91Widget,
  sendOTP,
  retryOTP,
  verifyOTP,
  WIDGET_ID,
  TOKEN_AUTH
};

