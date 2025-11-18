/**
 * Request Utilities
 * 
 * Standardized request wrapper with retry logic, timeout handling, and interceptors
 * 
 * @deprecated This file is kept for backward compatibility.
 * The new modular structure is in './request/index'.
 * This file re-exports from the new module to maintain compatibility.
 */

// Re-export everything from the new request module (Axios-based)
export * from './request/index';

// Keep the old fetch-based exports for backward compatibility
import { parseApiError, parseExceptionError, ParsedError, isRetryableError } from '@utils/error';

/**
 * Request options
 */
export interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  retryCondition?: (error: ParsedError) => boolean;
}

/**
 * Request interceptor function type
 */
export type RequestInterceptor = (url: string, options: RequestInit) => [string, RequestInit];

/**
 * Response interceptor function type
 */
export type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

/**
 * Default timeout (30 seconds)
 */
const DEFAULT_TIMEOUT = 30000;

/**
 * Default retry configuration
 */
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

/**
 * Global request interceptors
 */
const requestInterceptors: RequestInterceptor[] = [];

/**
 * Global response interceptors
 */
const responseInterceptors: ResponseInterceptor[] = [];

/**
 * Add request interceptor
 */
export const addRequestInterceptor = (interceptor: RequestInterceptor): void => {
  requestInterceptors.push(interceptor);
};

/**
 * Add response interceptor
 */
export const addResponseInterceptor = (interceptor: ResponseInterceptor): void => {
  responseInterceptors.push(interceptor);
};

/**
 * Remove request interceptor
 */
export const removeRequestInterceptor = (interceptor: RequestInterceptor): void => {
  const index = requestInterceptors.indexOf(interceptor);
  if (index > -1) {
    requestInterceptors.splice(index, 1);
  }
};

/**
 * Remove response interceptor
 */
export const removeResponseInterceptor = (interceptor: ResponseInterceptor): void => {
  const index = responseInterceptors.indexOf(interceptor);
  if (index > -1) {
    responseInterceptors.splice(index, 1);
  }
};

/**
 * Create timeout promise
 */
const createTimeoutPromise = (timeout: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);
  });
};

/**
 * Delay utility for retries
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Execute request with retry logic
 */
const executeRequest = async (
  url: string,
  options: RequestInit,
  requestOptions: RequestOptions
): Promise<Response> => {
  const maxRetries = requestOptions.retries ?? DEFAULT_RETRIES;
  const retryDelay = requestOptions.retryDelay ?? DEFAULT_RETRY_DELAY;
  const retryCondition = requestOptions.retryCondition ?? isRetryableError;

  let lastError: ParsedError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Apply request interceptors
      let finalUrl = url;
      let finalOptions: RequestInit = options;
      
      for (const interceptor of requestInterceptors) {
        [finalUrl, finalOptions] = interceptor(finalUrl, finalOptions);
      }

      // Create fetch promise
      const fetchPromise = fetch(finalUrl, finalOptions);

      // Create timeout promise if timeout is specified
      const timeout = requestOptions.timeout ?? DEFAULT_TIMEOUT;
      const timeoutPromise = createTimeoutPromise(timeout);

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      // Apply response interceptors
      let finalResponse = response;
      for (const interceptor of responseInterceptors) {
        finalResponse = await interceptor(finalResponse);
      }

      // If response is ok, return it
      if (finalResponse.ok) {
        return finalResponse;
      }

      // Parse error for retry decision
      const error = await parseApiError(finalResponse, 'Request failed');

      // If error is not retryable or we've exhausted retries, throw
      if (!retryCondition(error) || attempt === maxRetries) {
        throw error;
      }

      lastError = error;

      // Wait before retrying (exponential backoff)
      const delayMs = retryDelay * Math.pow(2, attempt);
      await delay(delayMs);

    } catch (error) {
      // Parse exception error
      const parsedError = parseExceptionError(error as unknown, 'Request failed');

      // If it's a timeout or network error and we have retries left, retry
      if (retryCondition(parsedError) && attempt < maxRetries) {
        lastError = parsedError;
        const delayMs = retryDelay * Math.pow(2, attempt);
        await delay(delayMs);
        continue;
      }

      // Otherwise, throw the error
      throw parsedError;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || parseExceptionError(new Error('Request failed'), 'Request failed');
};

/**
 * Standardized request wrapper with retry logic and timeout
 */
export const request = async (
  url: string,
  options: RequestOptions = {}
): Promise<Response> => {
  const { timeout, retries, retryDelay, retryCondition, ...fetchOptions } = options;

  return executeRequest(url, fetchOptions, {
    timeout,
    retries,
    retryDelay,
    retryCondition,
  });
};

/**
 * Request with automatic JSON parsing
 */
export const requestJson = async <T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> => {
  const response = await request(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await parseApiError(response, 'Request failed');
    throw error;
  }

  return response.json();
};

/**
 * Request with automatic error handling
 */
export const requestWithErrorHandling = async <T = any>(
  url: string,
  options: RequestOptions = {},
  errorContext?: string
): Promise<{ success: boolean; data?: T; error?: ParsedError }> => {
  try {
    const response = await request(url, options);

    if (!response.ok) {
      const error = await parseApiError(response, errorContext || 'Request failed');
      return {
        success: false,
        error,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, errorContext || 'Request failed');
    return {
      success: false,
      error: parsedError,
    };
  }
};

