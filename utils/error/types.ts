/**
 * Error Handler Types
 * 
 * Type definitions for error handling and parsing
 */

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  [key: string]: any;
}

/**
 * Parsed error information
 */
export interface ParsedError {
  message: string;
  statusCode?: number;
  statusText?: string;
  details?: Record<string, any>;
  fieldErrors?: Record<string, string[]>; // Field-specific errors (e.g., {"email": ["Email already exists"]})
  nonFieldErrors?: string[]; // Non-field errors (e.g., ["Must include 'email' and 'password'"])
  isNetworkError: boolean;
  isTimeoutError: boolean;
}

