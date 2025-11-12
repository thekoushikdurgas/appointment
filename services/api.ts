import { request } from '../utils/request';
import { parseApiError, parseExceptionError, formatErrorMessage, ParsedError } from '../utils/errorHandler';

/**
 * Get the API base URL from environment variable
 * Always returns the full backend URL for direct API calls.
 * Backend must support CORS for browser requests to work.
 */
const getApiBaseUrl = (): string => {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
  // Remove trailing slash if present to avoid double slashes
  return backendUrl.replace(/\/$/, '');
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * API info response interface
 */
export interface ApiInfo {
  service: string;
  status: string;
  version?: string;
  endpoints: {
    auth?: {
      login: string;
      register: string;
      logout: string;
      session: string;
      refresh: string;
    };
    users?: {
      profile: string;
    };
    ai_chats?: string;
    contacts: string;
    contacts_count: string;
    health: string;
    field_endpoints?: {
      [key: string]: string;
    };
  };
  [key: string]: any;
}

/**
 * API info service response
 */
export interface ApiInfoResponse {
  success: boolean;
  info?: ApiInfo;
  message?: string;
  error?: ParsedError;
}

/**
 * Get API information and available endpoints with timeout handling
 * 
 * NOTE: This is a public endpoint and does not require authentication.
 * Using `request` instead of `authenticatedFetch` is intentional.
 */
export const getApiInfo = async (timeout: number = 10000): Promise<ApiInfoResponse> => {
    try {
        // Root endpoint is at the base URL
        // Public endpoint - no authentication required
        const response = await request(`${API_BASE_URL}/`, {
          method: 'GET',
          timeout,
          retries: 1,
        });

        if (!response.ok) {
          const error = await parseApiError(response, 'Failed to fetch API info');
          return {
            success: false,
            message: formatErrorMessage(error, 'Failed to fetch API info'),
            error,
          };
        }

        const data: ApiInfo = await response.json();
        return {
            success: true,
            info: data,
        };
    } catch (error) {
        const parsedError = parseExceptionError(error, 'Failed to fetch API info');
        console.error('[API] Failed to fetch API info:', {
            message: parsedError.message,
            statusCode: parsedError.statusCode,
            isNetworkError: parsedError.isNetworkError,
            isTimeoutError: parsedError.isTimeoutError,
        });
        return {
            success: false,
            message: formatErrorMessage(parsedError, 'Failed to fetch API info'),
            error: parsedError,
        };
    }
};
