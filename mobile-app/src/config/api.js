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
  API_BASE_URL = 'http://localhost:8081/api';
} else {
  // For mobile devices (React Native), try to get from Expo constants or use network IP
  try {
    const Constants = require('expo-constants').default;
    if (Constants && Constants.expoConfig && Constants.expoConfig.extra && Constants.expoConfig.extra.apiUrl) {
      API_BASE_URL = Constants.expoConfig.extra.apiUrl;
    } else {
      // Default to network IP for mobile devices
      API_BASE_URL = 'http://172.28.37.188:8081/api';
    }
  } catch (e) {
    // Constants not available, use network IP for mobile
    API_BASE_URL = 'http://172.28.37.188:8081/api';
  }
}

console.log('API Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout to prevent hanging
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth state
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      // Update auth context state if setters are available
      if (authStateSetters) {
        authStateSetters.setUser(null);
        authStateSetters.setIsAuthenticated(false);
      }
      // Navigate to login (handled by AuthContext via state change)
    } else if (error.response?.status >= 500) {
      // Server error - show user-friendly message
      console.error('Server error:', error.response?.data);
    } else if (!error.response) {
      // Network error
      console.error('Network error:', error.message);
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
  updatePackage: (id, data) => api.put(`/packages/${id}`, data),
  createPackage: (data) => api.post('/packages', data),
};

// Withdraw API
export const withdrawAPI = {
  request: (data) => api.post('/withdraw/request', data),
  getHistory: () => api.get('/withdraw/history'),
};

export default api;

