/**
 * MSG91 Widget Integration Utility
 * 
 * This utility helps integrate MSG91 OTP widget in React Native.
 * Since MSG91 widget is web-based, we use a hybrid approach:
 * 1. Try to use MSG91 widget via WebView (for better UX)
 * 2. Fallback to manual OTP entry if widget fails
 */

import { authAPI } from '../config/api';

// MSG91 Widget Configuration
const MSG91_CONFIG = {
  widgetId: '356c42676f6d373231353532',
  tokenAuth: '485059TdWlYZWpMtU46950d955P1',
};

/**
 * Generate HTML for MSG91 widget
 * @param {string} phoneNumber - Phone number to send OTP to
 * @param {Function} onSuccess - Callback when OTP is verified successfully
 * @param {Function} onFailure - Callback when OTP verification fails
 * @returns {string} HTML string for WebView
 */
export const generateMsg91WidgetHTML = (phoneNumber, onSuccess, onFailure) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f5f5f5;
        }
        .widget-container {
          max-width: 400px;
          margin: 0 auto;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        #msg91-otp-widget {
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="widget-container">
        <h3>Verify OTP</h3>
        <p>Enter the OTP sent to ${phoneNumber}</p>
        <div id="msg91-otp-widget"></div>
      </div>
      
      <script type="text/javascript">
        var configuration = {
          widgetId: "${MSG91_CONFIG.widgetId}",
          tokenAuth: "${MSG91_CONFIG.tokenAuth}",
          identifier: "${phoneNumber}",
          exposeMethods: true,
          success: function(data) {
            // Send success message to React Native
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'success',
                token: data.token || data.accessToken || data.access_token,
                phone: "${phoneNumber}"
              }));
            } else {
              console.log('MSG91 Success:', data);
            }
          },
          failure: function(error) {
            // Send failure message to React Native
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'failure',
                error: error.message || error || 'OTP verification failed',
                phone: "${phoneNumber}"
              }));
            } else {
              console.log('MSG91 Failure:', error);
            }
          }
        };
      </script>
      
      <script type="text/javascript">
        (function loadOtpScript(urls) {
          let i = 0;
          function attempt() {
            const s = document.createElement('script');
            s.src = urls[i];
            s.async = true;
            s.onload = function() {
              if (typeof window.initSendOTP === 'function') {
                window.initSendOTP(configuration);
              }
            };
            s.onerror = function() {
              i++;
              if (i < urls.length) {
                attempt();
              } else {
                // All scripts failed - notify React Native
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'error',
                    error: 'Failed to load MSG91 widget scripts',
                    phone: "${phoneNumber}"
                  }));
                }
              }
            };
            document.head.appendChild(s);
          }
          attempt();
        })([
          'https://verify.msg91.com/otp-provider.js',
          'https://verify.phone91.com/otp-provider.js'
        ]);
      </script>
    </body>
    </html>
  `;
  
  return html;
};

/**
 * Verify MSG91 widget access token with backend
 * @param {string} phoneNumber - Phone number
 * @param {string} accessToken - Access token from MSG91 widget
 * @returns {Promise<Object>} Verification result
 */
export const verifyMsg91Token = async (phoneNumber, accessToken) => {
  try {
    const response = await authAPI.verifyMsg91Token({
      phone: phoneNumber,
      accessToken: accessToken
    });
    return response.data;
  } catch (error) {
    console.error('MSG91 token verification error:', error);
    throw error;
  }
};

export default {
  generateMsg91WidgetHTML,
  verifyMsg91Token,
  MSG91_CONFIG
};

