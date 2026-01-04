import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Encrypt sensitive data
export const encryptData = (data, key = 'gold-investment-key') => {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

// Decrypt sensitive data
export const decryptData = (encryptedData, key = 'gold-investment-key') => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

// Secure storage for sensitive data
export const secureStore = {
  setItem: async (key, value) => {
    try {
      const encrypted = encryptData(value);
      if (encrypted) {
        await AsyncStorage.setItem(key, encrypted);
      }
    } catch (error) {
      console.error('Secure store error:', error);
    }
  },
  getItem: async (key) => {
    try {
      const encrypted = await AsyncStorage.getItem(key);
      if (encrypted) {
        return decryptData(encrypted);
      }
      return null;
    } catch (error) {
      console.error('Secure get error:', error);
      return null;
    }
  },
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Secure remove error:', error);
    }
  }
};

// Input sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Validate email
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
  return password.length >= 6;
};

// Generate secure token
export const generateSecureToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
};

