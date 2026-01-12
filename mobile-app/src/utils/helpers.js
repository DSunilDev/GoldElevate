import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';
import { Platform } from 'react-native';

// Format currency
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  return `₹${parseInt(amount).toLocaleString('en-IN')}`;
};

// Format date
export const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Format date with time
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Validate UPI reference
export const validateUPIReference = (reference) => {
  if (!reference) return false;
  const cleaned = reference.replace(/[^A-Z0-9]/gi, '');
  return cleaned.length >= 8 && cleaned.length <= 20;
};

// Copy to clipboard helper
export const copyToClipboard = async (text, showToast) => {
  try {
    // Check if we're on web
    const isWeb = Platform.OS === 'web' || (typeof window !== 'undefined' && typeof document !== 'undefined');
    
    if (isWeb) {
      // For web, use navigator.clipboard API
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== 'undefined') {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } else {
      // For React Native, use @react-native-clipboard/clipboard
      if (Clipboard && typeof Clipboard.setString === 'function') {
        Clipboard.setString(text);
      } else {
        throw new Error('Clipboard API not available');
      }
    }
    
    if (showToast) {
      showToast({
        type: 'success',
        text1: 'Copied!',
        text2: 'Text copied to clipboard',
      });
    }
    return true;
  } catch (error) {
    console.error('Copy error:', error);
    return false;
  }
};

// Share content
export const shareContent = async (message, url) => {
  try {
    // Combine message and url
    const shareText = url ? `${message}\n${url}` : message;
    
    await Share.open({
      message: shareText,
      title: 'GoldElevate',
    });
    return true;
  } catch (error) {
    if (error.message !== 'User did not share') {
      console.error('Share error:', error);
    }
    return false;
  }
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Truncate text
export const truncate = (text, length = 50) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Calculate percentage
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Generate referral link
export const generateReferralLink = (memberId, baseUrl = 'https://yourdomain.com') => {
  return `${baseUrl}/signup?referrer=${memberId}`;
};

// Validate email
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate phone
export const validatePhone = (phone) => {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone.replace(/[^0-9]/g, ''));
};

// Format phone number
export const formatPhone = (phone) => {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
  }
  return cleaned;
};

