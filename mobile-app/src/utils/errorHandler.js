/**
 * Comprehensive Error Handler for React Native App
 * Provides consistent error handling with toast notifications
 */

import Toast from 'react-native-toast-message';

/**
 * Format error message for user display
 */
export const formatErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred';

  // Handle network errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Connection timeout. Please check your internet connection.';
  }

  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('Network')) {
    return 'Cannot connect to server. Please check your network connection.';
  }

  // Handle API errors
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        return data?.message || data?.error || 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return data?.message || 'Resource not found.';
      case 409:
        return data?.message || 'This record already exists.';
      case 422:
        return data?.message || 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return data?.message || 'Server error. Please try again later or contact support.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return data?.message || data?.error || `Error ${status}: ${error.message}`;
    }
  }

  // Generic error
  return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Show error toast notification
 */
export const showErrorToast = (error, customMessage = null) => {
  const message = customMessage || formatErrorMessage(error);
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: message,
    visibilityTime: 5000,
    topOffset: 60,
  });
  console.error('Error:', error);
};

/**
 * Show success toast notification
 */
export const showSuccessToast = (message, title = 'Success') => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    visibilityTime: 3000,
    topOffset: 60,
  });
};

/**
 * Show info toast notification
 */
export const showInfoToast = (message, title = 'Info') => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    visibilityTime: 3000,
    topOffset: 60,
  });
};

/**
 * Safe async function wrapper with error handling
 */
export const safeAsync = async (asyncFn, errorHandler = null) => {
  try {
    return await asyncFn();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    } else {
      showErrorToast(error);
    }
    throw error; // Re-throw for caller to handle if needed
  }
};

