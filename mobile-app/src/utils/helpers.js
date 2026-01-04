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
    const { Clipboard } = require('@react-native-clipboard/clipboard');
    if (Clipboard.setStringAsync) {
      await Clipboard.setStringAsync(text);
    } else if (Clipboard.setString) {
      await Clipboard.setString(text);
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
    // Use expo-sharing instead of react-native-share
    const Sharing = require('expo-sharing');
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (!isAvailable) {
      console.warn('Sharing is not available on this device');
      return false;
    }
    
    // Combine message and url
    const shareText = url ? `${message}\n${url}` : message;
    
    await Sharing.shareAsync(shareText, {
      mimeType: 'text/plain',
      dialogTitle: 'GoldElevate',
    });
    return true;
  } catch (error) {
    if (error.message !== 'User did not share' && error.message !== 'Sharing is not available') {
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

