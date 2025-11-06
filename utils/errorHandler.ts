/**
 * Error Handler Utilities
 * 
 * Standardized error handling and parsing for API responses
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
  isNetworkError: boolean;
  isTimeoutError: boolean;
}

/**
 * Parse error from API response
 */
export const parseApiError = async (
  response: Response,
  fallbackMessage: string = 'An error occurred'
): Promise<ParsedError> => {
  const statusCode = response.status;
  const statusText = response.statusText;

  try {
    const errorData: ApiErrorResponse = await response.json();
    
    // Try to extract error message from various possible fields
    let message = errorData.detail || 
                  errorData.message || 
                  errorData.error || 
                  fallbackMessage;

    // Handle validation errors (field-specific errors)
    if (errorData.errors && Object.keys(errorData.errors).length > 0) {
      const fieldErrors = Object.entries(errorData.errors)
        .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
        .join('; ');
      message = `${message} (${fieldErrors})`;
    }

    return {
      message,
      statusCode,
      statusText,
      details: errorData,
      isNetworkError: false,
      isTimeoutError: false,
    };
  } catch (parseError) {
    // If JSON parsing fails, return status-based error
    return {
      message: `${fallbackMessage}: ${statusText} (${statusCode})`,
      statusCode,
      statusText,
      isNetworkError: false,
      isTimeoutError: false,
    };
  }
};

/**
 * Parse error from exception
 */
export const parseExceptionError = (error: unknown, fallbackMessage: string = 'An unexpected error occurred'): ParsedError => {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return {
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      isNetworkError: true,
      isTimeoutError: false,
    };
  }

  if (error instanceof Error) {
    // Check for timeout errors
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      return {
        message: 'Request timed out. Please try again.',
        isNetworkError: false,
        isTimeoutError: true,
      };
    }

    return {
      message: error.message || fallbackMessage,
      isNetworkError: false,
      isTimeoutError: false,
    };
  }

  return {
    message: fallbackMessage,
    isNetworkError: false,
    isTimeoutError: false,
  };
};

/**
 * Format error message for user display
 */
export const formatErrorMessage = (error: ParsedError, context?: string): string => {
  let message = error.message;

  // Add context if provided
  if (context) {
    message = `${context}: ${message}`;
  }

  // Add helpful hints for common errors
  if (error.statusCode === 401) {
    message = 'Your session has expired. Please log in again.';
  } else if (error.statusCode === 403) {
    message = 'You do not have permission to perform this action.';
  } else if (error.statusCode === 404) {
    message = 'The requested resource was not found.';
  } else if (error.statusCode === 500) {
    message = 'A server error occurred. Please try again later.';
  } else if (error.isNetworkError) {
    message = 'Network error. Please check your connection and try again.';
  } else if (error.isTimeoutError) {
    message = 'Request timed out. Please try again.';
  }

  return message;
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

