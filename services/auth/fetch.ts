/**
 * Authentication Service Authenticated Fetch
 * 
 * Function for making authenticated API requests with automatic token refresh.
 */

import { axiosAuthenticatedRequest } from "@utils/request";
import {
  parseExceptionError,
  formatErrorMessage,
} from "@utils/error";

/**
 * Make authenticated API request with automatic token refresh
 *
 * **When to use `authenticatedFetch`:**
 * - For ALL authenticated API endpoints that require a user to be logged in
 * - Examples: user profile, contacts, AI chats, imports, team management
 * - Automatically adds Authorization header with Bearer token
 * - Automatically handles token refresh on 401 errors
 * - Clears tokens and throws error if refresh fails
 *
 * **When to use `request` (from utils/request):**
 * - For public endpoints that don't require authentication
 * - Examples: health checks, API info, login, register, refresh token endpoints
 * - These endpoints are intentionally public and should NOT use authenticatedFetch
 *
 * **Token Refresh Behavior:**
 * - On 401 response, automatically attempts to refresh the access token
 * - If refresh succeeds, retries the original request with new token
 * - If refresh fails or no refresh token available, clears all tokens and throws error
 * - Properly merges custom headers on retry (doesn't overwrite them)
 *
 * **Error Handling:**
 * - Network/timeout errors are caught and formatted
 * - Throws Error with user-friendly message
 * - Use try/catch in calling code to handle errors
 *
 * **Timeout Configuration:**
 * - Default timeout is 60 seconds (configured globally in axiosClient)
 *
 * @param url - The API endpoint URL (should include API_BASE_URL prefix)
 * @param options - Standard fetch RequestInit options (method, headers, body, etc.)
 * @returns Promise<Response> - The fetch Response object
 * @throws Error - If request fails, token refresh fails, or session expired
 *
 * @example
 * ```typescript
 * // In a service file
 * const response = await authenticatedFetch(`${API_BASE_URL}/api/v2/users/profile/`, {
 *   method: 'GET',
 * });
 *
 * if (!response.ok) {
 *   const error = await parseApiError(response, 'Failed to fetch profile');
 *   throw new Error(formatErrorMessage(error, 'Failed to fetch profile'));
 * }
 *
 * const data = await response.json();
 * ```
 */
export const authenticatedFetch = async (
  url: string,
  options: RequestInit & { retries?: number } = {}
): Promise<any> => {
  console.log('[AUTH] authenticatedFetch called for:', url);
  
  // Extract retries and other options
  const { retries = 1, ...fetchOptions } = options;

  // Convert fetch options to Axios config
  const axiosConfig: any = {
    method: fetchOptions.method || 'GET',
    useCache: true,
    headers: {},
  };

  // Convert headers
  if (fetchOptions.headers) {
    if (fetchOptions.headers instanceof Headers) {
      fetchOptions.headers.forEach((value, key) => {
        axiosConfig.headers[key] = value;
      });
    } else if (Array.isArray(fetchOptions.headers)) {
      fetchOptions.headers.forEach(([key, value]) => {
        axiosConfig.headers[key] = value;
      });
    } else {
      Object.assign(axiosConfig.headers, fetchOptions.headers);
    }
  }

  // Convert body
  if (fetchOptions.body) {
    if (fetchOptions.body instanceof FormData) {
      axiosConfig.data = fetchOptions.body;
      // Don't set Content-Type for FormData, let Axios handle it
      delete axiosConfig.headers['Content-Type'];
    } else if (typeof fetchOptions.body === 'string') {
      try {
        axiosConfig.data = JSON.parse(fetchOptions.body);
      } catch {
        axiosConfig.data = fetchOptions.body;
      }
    } else {
      axiosConfig.data = fetchOptions.body;
    }
  }

  console.log('[AUTH] Making axiosAuthenticatedRequest with config:', {
    url,
    method: axiosConfig.method,
    useCache: axiosConfig.useCache,
  });
  
  try {
    const response = await axiosAuthenticatedRequest(url, axiosConfig);
    console.log('[AUTH] authenticatedFetch response received:', {
      url,
      status: response.status,
      ok: response.ok,
    });
    return response;
  } catch (error) {
    console.error('[AUTH] authenticatedFetch error:', { url, error });
    // Handle network/timeout errors
    const parsedError = parseExceptionError(error);
    const errorMessage = parsedError.isTimeoutError 
      ? "Request timed out. Please try again."
      : formatErrorMessage(parsedError, "Request failed");
    throw new Error(errorMessage);
  }
};

