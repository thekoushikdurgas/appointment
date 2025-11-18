/**
 * Error Helpers
 * 
 * Helper functions for working with parsed errors
 */

import type { ParsedError } from './types';

/**
 * Extract field errors from a ParsedError
 * Helper function to get field-specific errors in a convenient format
 */
export const extractFieldErrors = (error: ParsedError): Record<string, string[]> => {
  return error.fieldErrors || {};
};

/**
 * Extract non-field errors from a ParsedError
 * Helper function to get non-field errors in a convenient format
 */
export const extractNonFieldErrors = (error: ParsedError): string[] => {
  return error.nonFieldErrors || [];
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: ParsedError): boolean => {
  // Retry on network errors, timeouts, and 5xx server errors
  if (error.isNetworkError || error.isTimeoutError) {
    return true;
  }

  if (error.statusCode) {
    // Retry on server errors (5xx) but not client errors (4xx)
    return error.statusCode >= 500 && error.statusCode < 600;
  }

  return false;
};

/**
 * Format ParsedError for console logging
 * Converts ParsedError to a plain object that can be properly serialized
 */
export const formatErrorForLogging = (error: ParsedError): Record<string, any> => {
  return {
    message: error.message,
    statusCode: error.statusCode,
    statusText: error.statusText,
    isNetworkError: error.isNetworkError,
    isTimeoutError: error.isTimeoutError,
    ...(error.details && { details: error.details }),
    ...(error.fieldErrors && { fieldErrors: error.fieldErrors }),
    ...(error.nonFieldErrors && { nonFieldErrors: error.nonFieldErrors }),
  };
};

