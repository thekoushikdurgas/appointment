import { axiosRequest } from '@utils/request';
import { parseApiError, parseExceptionError, formatErrorMessage, ParsedError } from '@utils/error';
import { API_BASE_URL as API_BASE_URL_CONFIG } from '@utils/config';

/**
 * Get the API base URL with protocol for HTTP requests
 * Always returns the full backend URL for direct API calls.
 * Backend must support CORS for browser requests to work.
 */
const getApiBaseUrl = (): string => {
  // Add http:// protocol to the base URL
  return `http://${API_BASE_URL_CONFIG}`.replace(/\/$/, '');
};

// Export API_BASE_URL with protocol for use in other files
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
 * Get API information and available endpoints
 * 
 * NOTE: This is a public endpoint and does not require authentication.
 * Using `request` instead of `authenticatedFetch` is intentional.
 */
export const getApiInfo = async (): Promise<ApiInfoResponse> => {
    try {
        // Root endpoint is at the base URL
        // Public endpoint - no authentication required
        const response = await axiosRequest(`${API_BASE_URL}/`, {
          method: 'GET',
          useQueue: true,
          useCache: true,
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
