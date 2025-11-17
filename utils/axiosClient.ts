/**
 * Axios Client Configuration
 * 
 * Main Axios instance with interceptors for authentication, error handling, and token refresh.
 * This replaces the fetch-based request system with Axios while maintaining the same functionality.
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getToken, getRefreshToken, setTokens, clearTokens } from '@services/auth';
import { parseApiError, parseExceptionError, formatErrorMessage, ParsedError } from './errorHandler';
import { API_BASE_URL as API_BASE_URL_CONFIG } from './config';

/**
 * Get the API base URL with protocol for HTTP requests
 * This is duplicated here to avoid circular dependency with services/api.ts
 */
const getApiBaseUrl = (): string => {
  // Add http:// protocol to the base URL
  return `http://${API_BASE_URL_CONFIG}`.replace(/\/$/, '');
};

/**
 * Default timeout (60 seconds)
 * Increased timeout for slow endpoints like count queries
 */
const DEFAULT_TIMEOUT = 60000;
const SLOW_ENDPOINT_TIMEOUT = 120000; // 2 minutes for slow endpoints

/**
 * Create Axios instance with base configuration
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add authentication token
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from storage
    const token = getToken();
    
    // Add Authorization header if token exists
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    // Handle request error
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle token refresh on 401
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return successful responses as-is
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Token expiration
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log('[AXIOS] 401 Unauthorized - Attempting token refresh...');
      
      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        console.log('[AXIOS] No refresh token available. Logging out...');
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(new Error('Session expired. Please login again.'));
      }

      try {
        // Attempt to refresh the token
        const refreshResponse = await axios.post<{ access_token: string; refresh_token?: string }>(
          `${getApiBaseUrl()}/api/v2/auth/refresh/`,
          { refresh_token: refreshToken }
        );

        if (refreshResponse.data?.access_token) {
          // Store new tokens
          setTokens(
            refreshResponse.data.access_token,
            refreshResponse.data.refresh_token || refreshToken
          );

          // Get new token
          const newToken = getToken();
          if (!newToken) {
            console.log('[AXIOS] Token refresh succeeded but no new token found. Logging out...');
            clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(new Error('Session expired. Please login again.'));
          }

          // Retry original request with new token
          console.log('[AXIOS] Token refreshed, retrying request...');
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          return axiosInstance(originalRequest);
        } else {
          throw new Error('Token refresh failed: No access token in response');
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens
        console.log('[AXIOS] Token refresh error. Logging out...');
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        const parsedError = parseExceptionError(refreshError, 'Session expired');
        return Promise.reject(new Error(formatErrorMessage(parsedError, 'Session expired')));
      }
    }

    // For other errors, convert AxiosError to ParsedError format
    return Promise.reject(error);
  }
);

/**
 * Convert AxiosError to ParsedError
 */
export const convertAxiosError = async (error: AxiosError, fallbackMessage: string = 'Request failed'): Promise<ParsedError> => {
  // Handle network errors (no response)
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        message: 'Request timed out. Please try again.',
        isNetworkError: false,
        isTimeoutError: true,
      };
    }
    
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      return {
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        isNetworkError: true,
        isTimeoutError: false,
      };
    }

    return parseExceptionError(error, fallbackMessage);
  }

  // Handle response errors
  const response = error.response;
  
  // Create a Response-like object for parseApiError
  const fetchResponse = new Response(JSON.stringify(response.data), {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers as any),
  });

  return parseApiError(fetchResponse, fallbackMessage);
};

/**
 * Export the configured Axios instance
 */
export default axiosInstance;

