// Centralized error handling utility
const { logger } = require('../config/database');

/**
 * Format error message for user display
 */
const formatErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred';

  // Network errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Connection timeout. Please check your internet connection.';
  }

  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return 'Cannot connect to server. Please check your network connection.';
  }

  // API errors
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
        return 'Resource not found.';
      case 409:
        return data?.message || 'This record already exists.';
      case 422:
        return data?.message || 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later or contact support.';
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
 * Log error with context
 */
const logError = (error, context = {}) => {
  const errorMessage = formatErrorMessage(error);
  logger.error('Error occurred:', {
    message: errorMessage,
    context,
    error: error.message,
    stack: error.stack,
    response: error.response?.data,
  });
  return errorMessage;
};

/**
 * Handle API errors with user-friendly messages
 */
const handleApiError = (error, defaultMessage = 'Operation failed') => {
  const message = formatErrorMessage(error);
  logError(error, { defaultMessage });
  return {
    success: false,
    message,
    error: error.message,
  };
};

module.exports = {
  formatErrorMessage,
  logError,
  handleApiError,
};

