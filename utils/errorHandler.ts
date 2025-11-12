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
  fieldErrors?: Record<string, string[]>; // Field-specific errors (e.g., {"email": ["Email already exists"]})
  nonFieldErrors?: string[]; // Non-field errors (e.g., ["Must include 'email' and 'password'"])
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
    // Try to get response text first to handle non-JSON responses
    // Clone the response to avoid consuming the body stream
    let responseText: string;
    try {
      responseText = await response.clone().text();
    } catch (cloneError) {
      // If cloning fails, try reading directly (body might already be consumed)
      try {
        responseText = await response.text();
      } catch (readError) {
        // If both fail, return status-based error
        return {
          message: `${fallbackMessage}: ${statusText} (${statusCode})`,
          statusCode,
          statusText,
          isNetworkError: false,
          isTimeoutError: false,
        };
      }
    }
    
    let errorData: ApiErrorResponse;

    try {
      errorData = JSON.parse(responseText);
    } catch {
      // If JSON parsing fails, use the raw text as the error message
      return {
        message: responseText || `${fallbackMessage}: ${statusText} (${statusCode})`,
        statusCode,
        statusText,
        details: { raw: responseText },
        isNetworkError: false,
        isTimeoutError: false,
      };
    }
    
    // Extract field-specific errors and non-field errors
    const fieldErrors: Record<string, string[]> = {};
    const nonFieldErrors: string[] = [];

    // Handle non_field_errors (common in Django REST Framework)
    if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
      nonFieldErrors.push(...errorData.non_field_errors.filter((e: any) => typeof e === 'string'));
    }

    // Handle field-specific errors
    // Check for direct field errors (e.g., {"email": ["Email already exists"]})
    Object.keys(errorData).forEach((key) => {
      // Skip known non-field error keys
      if (key === 'detail' || key === 'message' || key === 'error' || key === 'msg' || key === 'errors' || key === 'non_field_errors') {
        return;
      }

      const value = errorData[key];
      if (Array.isArray(value)) {
        // Field with array of error messages
        const errorMessages = value
          .map((e: any) => typeof e === 'string' ? e : String(e))
          .filter(Boolean);
        if (errorMessages.length > 0) {
          fieldErrors[key] = errorMessages;
        }
      } else if (typeof value === 'string' && value.trim()) {
        // Field with single error message
        fieldErrors[key] = [value];
      }
    });

    // Also check errorData.errors if it's an object (nested structure)
    if (errorData.errors && typeof errorData.errors === 'object' && !Array.isArray(errorData.errors)) {
      Object.entries(errorData.errors).forEach(([field, errors]: [string, any]) => {
        if (Array.isArray(errors)) {
          const errorMessages = errors
            .map((e: any) => typeof e === 'string' ? e : String(e))
            .filter(Boolean);
          if (errorMessages.length > 0) {
            fieldErrors[field] = errorMessages;
          }
        } else if (typeof errors === 'string') {
          const trimmedError = errors.trim();
          if (trimmedError) {
            fieldErrors[field] = [trimmedError];
          }
        }
      });
    }

    // Try to extract general error message from various possible fields
    // Priority: detail > message > error > msg
    let message = errorData.detail || 
                  errorData.message || 
                  errorData.error || 
                  errorData.msg ||
                  null;

    // If no message found, check for common error patterns in the response
    if (!message) {
      // Check for nested error objects
      if (errorData.error && typeof errorData.error === 'object') {
        const errorObj = errorData.error as any;
        message = errorObj.message || errorObj.detail || errorObj.error;
      }
      
      // Check for array of errors (if not already handled as non_field_errors)
      if (!message && Array.isArray(errorData.errors)) {
        message = errorData.errors.map((e: any) => 
          typeof e === 'string' ? e : (e.message || e.detail || e.error)
        ).filter(Boolean).join('; ');
      }
    }

    // Build message from field errors if no general message exists
    if (!message && Object.keys(fieldErrors).length > 0) {
      const fieldErrorMessages = Object.entries(fieldErrors)
        .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
        .join('; ');
      message = fieldErrorMessages;
    }

    // Add non-field errors to message if present
    if (nonFieldErrors.length > 0) {
      const nonFieldMessage = nonFieldErrors.join('; ');
      message = message ? `${message}. ${nonFieldMessage}` : nonFieldMessage;
    }

    // If still no message, use fallback with status info
    if (!message) {
      message = statusCode === 401 
        ? 'Authentication failed'
        : statusCode === 403
        ? 'Access forbidden'
        : statusCode === 404
        ? 'Resource not found'
        : statusCode === 422
        ? 'Validation error'
        : statusCode >= 500
        ? 'Server error'
        : `${fallbackMessage} (${statusCode})`;
    }

    return {
      message,
      statusCode,
      statusText,
      details: errorData,
      fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
      nonFieldErrors: nonFieldErrors.length > 0 ? nonFieldErrors : undefined,
      isNetworkError: false,
      isTimeoutError: false,
    };
  } catch (parseError) {
    // If parsing completely fails, return status-based error
    console.error('[ERROR] Failed to parse API error response:', parseError);
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
 * Check if an object is a ParsedError
 */
const isParsedError = (obj: any): obj is ParsedError => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.message === 'string' &&
    typeof obj.isNetworkError === 'boolean' &&
    typeof obj.isTimeoutError === 'boolean'
  );
};

/**
 * Parse error from exception
 */
export const parseExceptionError = (error: unknown, fallbackMessage: string = 'An unexpected error occurred'): ParsedError => {
  // If it's already a ParsedError, return it directly
  if (isParsedError(error)) {
    return error;
  }

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

