/**
 * Error Formatter
 * 
 * Functions for formatting error messages for user display
 */

import type { ParsedError } from './types';

/**
 * Format error message for user display
 */
export const formatErrorMessage = (error: ParsedError, context?: string): string => {
  let message = error.message;

  // Handle network/timeout errors FIRST (these take priority over status codes)
  // Network errors should never be treated as session expiration
  if (error.isNetworkError) {
    message = 'Network error. Please check your connection and try again.';
  } else if (error.isTimeoutError) {
    message = 'Request timed out. Please try again.';
  } else if (error.statusCode === 401) {
    // For login/registration, provide more specific messages
    if (context?.toLowerCase().includes('login')) {
      message = 'Invalid email or password. Please check your credentials and try again.';
    } else if (context?.toLowerCase().includes('registration') || context?.toLowerCase().includes('register')) {
      message = 'Registration failed. Please check your information and try again.';
    } else {
      message = 'Your session has expired. Please log in again.';
    }
  } else if (error.statusCode === 403) {
    message = 'You do not have permission to perform this action.';
  } else if (error.statusCode === 404) {
    message = 'The requested resource was not found.';
  } else if (error.statusCode === 422) {
    // Validation errors - use the message from the API if available
    if (error.message && error.message !== context) {
      message = error.message;
    } else {
      message = 'Invalid input. Please check your information and try again.';
    }
  } else if (error.statusCode === 500) {
    message = 'A server error occurred. Please try again later.';
  } else {
    // Only add context if the message doesn't already contain it and the message is meaningful
    // Avoid duplication like "Login failed: Login failed"
    if (context && message !== context && !message.toLowerCase().includes(context.toLowerCase())) {
      // Check if message is just a generic fallback - if so, use context as primary message
      const genericFallbacks = ['an error occurred', 'request failed', 'an unexpected error occurred'];
      const isGenericFallback = genericFallbacks.some(fallback => 
        message.toLowerCase().includes(fallback.toLowerCase())
      );
      
      if (isGenericFallback) {
        // Use context as the primary message, append error details if available
        const errorDetails = error.statusCode 
          ? ` (${error.statusCode}${error.statusText ? `: ${error.statusText}` : ''})`
          : '';
        message = `${context}${errorDetails}`;
      } else {
        // Message is specific, prepend context
        message = `${context}: ${message}`;
      }
    }
  }

  return message;
};

