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
 * Check API health status with timeout handling
 */
export const checkHealth = async (timeout: number = 10000): Promise<HealthCheckResult> => {
  try {
    const response = await request(`${API_BASE_URL}/health/`, {
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
    console.error('[HEALTH] Health check error:', parsedError);
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Health check failed'),
      error: parsedError,
    };
  }
};
