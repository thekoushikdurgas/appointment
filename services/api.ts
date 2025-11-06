import { request } from '../utils/request';
import { parseApiError, parseExceptionError, formatErrorMessage, ParsedError } from '../utils/errorHandler';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://107.21.188.21/api';

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
 */
export const getApiInfo = async (timeout: number = 10000): Promise<ApiInfoResponse> => {
    try {
        // Root endpoint is at the base URL without /api
        const baseUrl = API_BASE_URL.replace('/api', '');
        const response = await request(`${baseUrl}/`, {
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
        console.error('[API] Failed to fetch API info:', parsedError);
        return {
            success: false,
            message: formatErrorMessage(parsedError, 'Failed to fetch API info'),
            error: parsedError,
        };
    }
};
