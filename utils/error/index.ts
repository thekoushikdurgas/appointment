/**
 * Error Handler Utilities
 * 
 * Standardized error handling and parsing for API responses
 * 
 * This module provides:
 * - Type definitions for error structures
 * - Functions to parse errors from API responses and exceptions
 * - Functions to format error messages for user display
 * - Helper functions for working with parsed errors
 */

// Re-export all types
export type {
  ApiErrorResponse,
  ParsedError,
} from './types';

// Re-export parser functions
export {
  parseApiError,
  parseExceptionError,
} from './parser';

// Re-export formatter functions
export {
  formatErrorMessage,
} from './formatter';

// Re-export helper functions
export {
  extractFieldErrors,
  extractNonFieldErrors,
  isRetryableError,
  formatErrorForLogging,
} from './helpers';

