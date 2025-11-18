/**
 * Error Parser
 * 
 * Functions for parsing errors from API responses and exceptions
 */

import type { ApiErrorResponse, ParsedError } from './types';

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

