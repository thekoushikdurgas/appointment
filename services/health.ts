import { API_BASE_URL } from './api';
import { request } from '../utils/request';
import { parseApiError, parseExceptionError, formatErrorMessage, ParsedError } from '../utils/errorHandler';

/**
 * Health check response interface
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  checks: {
    database: boolean;
    cache: boolean;
    celery: boolean;
  };
  celery_workers?: number;
  cache_error?: string;
  celery_error?: string;
  timestamp?: string;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  success: boolean;
  health?: HealthCheckResponse;
  message?: string;
  error?: ParsedError;
}

/**
 * Get the base host URL (without API version prefix)
 */
const getBaseHost = (): string => {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
  return backendUrl;
};

/**
 * Check API health status with timeout handling
 * 
 * Checks the versioned API health endpoint at `/api/health/`.
 * 
 * NOTE: This is a public endpoint and does not require authentication.
 * Using `request` instead of `authenticatedFetch` is intentional.
 * 
 * @param timeout - Request timeout in milliseconds (default: 10000)
 * @returns Promise resolving to HealthCheckResult
 */
export const checkHealth = async (timeout: number = 10000): Promise<HealthCheckResult> => {
  try {
    // Public endpoint - no authentication required
    const response = await request(`${API_BASE_URL}/api/health/`, {
      method: 'GET',
      timeout,
      retries: 1,
    });

    // Health endpoint returns 503 for unhealthy, but we still want to return the data
    if (response.status === 503) {
      try {
        const data: HealthCheckResponse = await response.json();
        return {
          success: false,
          health: data,
          message: 'Service is unhealthy',
        };
      } catch (parseError) {
        const error = parseExceptionError(parseError, 'Health check failed');
        return {
          success: false,
          message: formatErrorMessage(error, 'Health check failed'),
          error,
        };
      }
    }

    if (!response.ok) {
      const error = await parseApiError(response, 'Health check failed');
      return {
        success: false,
        message: formatErrorMessage(error, 'Health check failed'),
        error,
      };
    }

    const data: HealthCheckResponse = await response.json();
    return {
      success: true,
      health: data,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Health check failed');
    console.error('[HEALTH] Health check error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Health check failed'),
      error: parsedError,
    };
  }
};

/**
 * Check application health status (unversioned endpoint)
 * 
 * Checks the unversioned health endpoint at `/health` (defined in app/main.py).
 * This is separate from the versioned API health endpoint at `/api/health/`.
 * 
 * NOTE: This is a public endpoint and does not require authentication.
 * Using `request` instead of `authenticatedFetch` is intentional.
 * 
 * @param timeout - Request timeout in milliseconds (default: 10000)
 * @returns Promise resolving to HealthCheckResult
 */
export const checkApplicationHealth = async (timeout: number = 10000): Promise<HealthCheckResult> => {
  try {
    const baseHost = getBaseHost();
    // Public endpoint - no authentication required
    const response = await request(`${baseHost}/health`, {
      method: 'GET',
      timeout,
      retries: 1,
    });

    // Health endpoint returns 503 for unhealthy, but we still want to return the data
    if (response.status === 503) {
      try {
        const data: HealthCheckResponse = await response.json();
        return {
          success: false,
          health: data,
          message: 'Application is unhealthy',
        };
      } catch (parseError) {
        const error = parseExceptionError(parseError, 'Application health check failed');
        return {
          success: false,
          message: formatErrorMessage(error, 'Application health check failed'),
          error,
        };
      }
    }

    if (!response.ok) {
      const error = await parseApiError(response, 'Application health check failed');
      return {
        success: false,
        message: formatErrorMessage(error, 'Application health check failed'),
        error,
      };
    }

    const data: HealthCheckResponse = await response.json();
    return {
      success: true,
      health: data,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Application health check failed');
    console.error('[HEALTH] Application health check error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Application health check failed'),
      error: parsedError,
    };
  }
};
