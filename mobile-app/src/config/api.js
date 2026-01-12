import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store reference to auth context setters for interceptor
let authStateSetters = null;

export const setAuthStateSetters = (setters) => {
  authStateSetters = setters;
};

// API Base URL - Update this to your backend URL
// For web browsers, always use localhost to avoid CORS issues
// For mobile devices, use the network IP

// Detect if running on web - check for browser environment
const isWeb = (() => {
  try {
    // Primary check: window.location exists (definitive web indicator)
    if (typeof window !== 'undefined' && window.location && window.location.href) {
      return true;
    }
    // Secondary check: navigator exists but not React Native
    if (typeof navigator !== 'undefined' && navigator.userAgent && !navigator.userAgent.includes('ReactNative')) {
      return true;
    }
    // Tertiary check: document exists (web DOM)
    if (typeof document !== 'undefined' && document.createElement) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
})();

// Set API URL based on environment
let API_BASE_URL;

if (isWeb) {
  // For web browsers, always use localhost to avoid CORS
  API_BASE_URL = 'http://localhost:3000/api';
} else {
  // For mobile devices (React Native):
  // Option 1: Use localhost with adb reverse (recommended for Android)
  // Run: adb reverse tcp:3000 tcp:3000
  // Option 2: Use network IP (if adb reverse doesn't work)
  // Make sure both devices are on same WiFi network
  
  // Try to detect if we're on Android emulator (uses 10.0.2.2)
  const isAndroidEmulator = typeof navigator !== 'undefined' && 
    navigator.userAgent && 
    navigator.userAgent.includes('Android') &&
    navigator.userAgent.includes('Linux');
  
  if (isAndroidEmulator) {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    API_BASE_URL = 'http://10.0.2.2:3000/api';
    } else {
    // For physical devices: use localhost if adb reverse is set up, otherwise use network IP
    // To use localhost, run: adb reverse tcp:3000 tcp:3000
    // Otherwise, update the IP below to match your computer's IP address
    API_BASE_URL = 'http://localhost:3000/api'; // Works with adb reverse
    // API_BASE_URL = 'http://192.168.0.107:3000/api'; // Use this if adb reverse doesn't work
  }
}

console.log('API Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout - increased for OTP operations that may involve MSG91 API calls
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token and handle FormData
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // If the data is FormData, remove ALL Content-Type headers to let axios set it with boundary
    if (config.data instanceof FormData) {
      console.log('📤 FormData detected, removing Content-Type headers');
      // Remove from all possible locations
      delete config.headers['Content-Type'];
      delete config.headers.common?.['Content-Type'];
      delete config.headers.post?.['Content-Type'];
      delete config.headers.put?.['Content-Type'];
      delete config.headers.patch?.['Content-Type'];
      // Don't set any Content-Type - axios will set it automatically with boundary
      // Also ensure transformRequest doesn't interfere
      if (!config.transformRequest || Array.isArray(config.transformRequest)) {
        // Keep existing transformRequest if it's an array
      }
    }
    
    console.log('📤 API Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullURL: config.baseURL + config.url,
      hasData: !!config.data,
      dataType: config.data?.constructor?.name,
      contentType: config.headers['Content-Type'],
      allHeaders: Object.keys(config.headers),
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log the full error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth state
      // Check if token exists before clearing (to avoid clearing during logout)
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        // Only clear if token exists (means it's an unexpected 401, not a logout)
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      // Update auth context state if setters are available
      if (authStateSetters) {
        authStateSetters.setUser(null);
        authStateSetters.setIsAuthenticated(false);
        }
      } else {
        // Token already cleared (likely during logout) - don't do anything
        console.log('401 error but token already cleared, likely during logout - ignoring');
      }
      // Navigate to login (handled by AuthContext via state change)
    } else if (error.response?.status === 404) {
      // Route not found - log the URL that failed
      console.error('❌ Route not found:', error.config?.baseURL + error.config?.url);
      console.error('Full request config:', error.config);
    } else if (error.response?.status >= 500) {
      // Server error - show user-friendly message
      console.error('Server error:', error.response?.data);
    } else if (!error.response) {
      // Network error - likely backend unreachable or timeout
      console.error('Network error:', error.message);
      console.error('Request URL:', error.config?.baseURL + error.config?.url);
      console.error('Error code:', error.code);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        config: {
          baseURL: error.config?.baseURL,
          url: error.config?.url,
          method: error.config?.method
        }
      });
      
      // Don't throw for network errors on startup - let app continue
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.warn('Request timed out - backend may be unreachable');
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.error('❌ Network Error - Backend may not be reachable');
        console.error('Troubleshooting:');
        console.error('1. Verify backend is running: cd backend && PORT=3000 node server.js');
        console.error('2. Check IP address matches: ' + API_BASE_URL);
        console.error('3. Ensure mobile device and backend are on the same WiFi network');
        console.error('4. Try accessing backend URL in mobile browser to test connectivity');
      }
    }
    return Promise.reject(error);
  }
);

// API Methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
  sendOTP: (data) => api.post('/auth/send-otp', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  verifyMsg91Token: (data) => api.post('/auth/verify-msg91-token', data),
  sendLoginOTP: (data) => api.post('/auth/login-send-otp', data),
  verifyLoginOTP: (data) => api.post('/auth/login-verify-otp', data),
  sendAgentOTP: (data) => {
    console.log('sendAgentOTP called with:', data);
    console.log('API base URL:', api.defaults.baseURL);
    return api.post('/auth/agent-send-otp', data);
  },
  verifyAgentOTP: (data) => api.post('/auth/agent-verify-otp', data),
  agentSignup: (agentData) => api.post('/auth/agent-signup', agentData),
  sendAdminOTP: (data) => api.post('/auth/admin-send-otp', data),
  verifyAdminOTP: (data) => api.post('/auth/admin-verify-otp', data),
  sendAdminLoginOTP: (data) => api.post('/auth/admin-login-send-otp', data),
  verifyAdminLoginOTP: (data) => api.post('/auth/admin-login-verify-otp', data),
  adminSignup: (adminData) => api.post('/auth/admin-signup', adminData),
  logout: () => api.post('/auth/logout'),
  refreshToken: (token) => api.post('/auth/refresh', { token }),
  testLoginMember: () => api.post('/auth/test-login-member'),
  testLoginAdmin: () => api.post('/auth/test-login-admin'),
};

export const packagesAPI = {
  getAll: () => api.get('/packages'),
  getById: (id) => api.get(`/packages/${id}`),
};

export const paymentAPI = {
  initiate: (paymentData) => api.post('/payment/init', paymentData),
  submit: (paymentData) => api.post('/payment/submit', paymentData),
  verify: (paymentId) => api.post(`/payment/verify/${paymentId}`),
  getHistory: () => api.get('/payment/history'),
  getGatewaySettings: () => api.get('/payment-gateway'), // Direct fetch of gateway settings
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/member'),
  getIncome: () => api.get('/income/summary'),
  getReferrals: () => api.get('/referrals/stats'),
};

export const referralsAPI = {
  getList: () => api.get('/referrals/list'),
  getLink: () => api.get('/members/referral-link'),
  shareLink: (data) => api.post('/referrals/share', data),
};

export const incomeAPI = {
  getHistory: () => api.get('/income/history'),
  getBreakdown: () => api.get('/income/summary'),
  getTransactions: () => api.get('/income/history'),
};

export const memberAPI = {
  getProfile: () => api.get('/member/profile'),
  updateProfile: (data) => api.put('/member/profile', data),
  getWallet: () => api.get('/member/wallet'),
  verifyReferralCode: (code) => api.get(`/members/verify-referral-code?code=${encodeURIComponent(code)}`),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getMembers: () => api.get('/admin/members'),
  getMemberDetails: (id) => api.get(`/admin/members/${id}`),
  getPendingSignups: () => api.get('/admin/pending-signups'),
  approveSignup: (id) => api.post(`/admin/approve-signup/${id}`),
  getPayments: (filter = 'all') => {
    // Backend accepts both 'status' and 'filter', but prefer 'status'
    const status = filter;
    return api.get(`/admin/payments?status=${status}`);
  },
  verifyPayment: (id) => api.post(`/admin/verify-payment/${id}`),
  rejectPayment: (id, reason) => api.post(`/admin/reject-payment/${id}`, { reason }),
  getWithdraws: (status = 'all') => api.get(`/admin/withdraws?status=${status}`),
  approveWithdraw: (id, transactionId) => api.post(`/admin/approve-withdraw/${id}`, { admin_transaction_id: transactionId }),
  rejectWithdraw: (id, reason) => api.post(`/admin/reject-withdraw/${id}`, { reason }),
  getPaymentGateway: () => api.get('/admin/payment-gateway'),
  updatePaymentGateway: (data) => api.put('/admin/payment-gateway', data),
  uploadQRImage: (formData) => {
    // For React Native FormData uploads, we need to bypass axios's default transformRequest
    // Create a custom request config that doesn't interfere with FormData
    return api({
      method: 'post',
      url: '/admin/payment-gateway/upload-qr',
      data: formData,
      headers: {
        'Accept': 'application/json',
        // Explicitly don't set Content-Type - axios will set it with boundary for FormData
      },
      transformRequest: (data, headers) => {
        // For FormData, return as-is and let axios handle Content-Type
        if (data instanceof FormData) {
          // Remove any Content-Type header
          delete headers['Content-Type'];
          return data;
        }
        // For other data, use default JSON stringify
        if (typeof data === 'object') {
          headers['Content-Type'] = 'application/json';
          return JSON.stringify(data);
        }
        return data;
      },
    });
  },
  uploadQRImageBase64: (data) => api.post('/admin/payment-gateway/upload-qr-base64', data),
  updatePackage: (id, data) => api.put(`/packages/${id}`, data),
  createPackage: (data) => api.post('/packages', data),
};

// Withdraw API
export const withdrawAPI = {
  request: (data) => api.post('/withdraw/request', data),
  getHistory: () => api.get('/withdraw/history'),
};

export default api;

