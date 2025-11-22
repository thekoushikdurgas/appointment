/**
 * Authentication Service
 *
 * Provides authentication and token management functionality for the application.
 *
 * **Key Functions:**
 * - `login()` / `register()` - User authentication (use `request` internally for public endpoints)
 * - `logout()` - Clear session and tokens
 * - `getSession()` - Get current user session
 * - `authenticatedFetch()` - Make authenticated API requests with automatic token refresh
 *
 * **Token Management:**
 * - Access tokens stored in localStorage (needed for client-side access)
 * - Refresh tokens stored in hybrid storage (cookie preferred, localStorage fallback)
 * - Automatic token refresh on 401 errors
 *
 * **Usage Pattern:**
 * - Use `authenticatedFetch` for all authenticated API endpoints
 * - Use `request` (from utils/request) only for public endpoints (health, API info, auth endpoints)
 * - All service files should use `authenticatedFetch` for authenticated calls
 */

import { API_BASE_URL } from "./api";
import {
  getHybridStorage,
  setHybridStorage,
  removeHybridStorage,
} from "@utils/cookies";
import { axiosRequest, axiosRequestWithErrorHandling, axiosAuthenticatedRequest } from "@utils/request";
import {
  parseApiError,
  parseExceptionError,
  formatErrorMessage,
  ParsedError,
} from "@utils/error";

// Token storage keys
const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

/**
 * Login response interface
 */
export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user?: any;
  message?: string;
}

/**
 * Register response interface
 */
export interface RegisterResponse {
  access_token?: string;
  refresh_token?: string;
  user?: any;
  message?: string;
}

/**
 * Session response interface
 */
export interface SessionResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    last_sign_in_at?: string;
    [key: string]: any;
  };
}

/**
 * Refresh token response interface
 */
export interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
}

/**
 * Standardized service response
 */
export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: ParsedError;
  fieldErrors?: Record<string, string[]>; // Field-specific errors for easier access
  nonFieldErrors?: string[]; // Non-field errors for easier access
}

/**
 * Get stored access token
 * Uses localStorage (client-side access needed)
 */
export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.warn("[AUTH] Failed to get token from localStorage:", error);
    return null;
  }
};

/**
 * Get stored refresh token
 * Checks both cookie (httpOnly, server-managed) and localStorage (fallback)
 */
export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;

  // Try hybrid storage (cookie first, then localStorage)
  return getHybridStorage(REFRESH_TOKEN_KEY);
};

/**
 * Store tokens
 * Access token: localStorage (client-side access needed)
 * Refresh token: Hybrid storage (cookie preferred, localStorage fallback)
 */
export const setTokens = (accessToken: string, refreshToken?: string): void => {
  if (typeof window === "undefined") return;

  try {
    // Store access token in localStorage (always needed for client-side access)
    localStorage.setItem(TOKEN_KEY, accessToken);

    // Store refresh token in hybrid storage
    // Note: httpOnly cookies must be set by the server, but we store in localStorage as fallback
    if (refreshToken) {
      // Try to use cookie if available, otherwise fallback to localStorage
      setHybridStorage(REFRESH_TOKEN_KEY, refreshToken, true, {
        path: "/",
        sameSite: "lax",
        secure: window.location.protocol === "https:",
        // Note: httpOnly must be set server-side, so we can't set it here
      });
    }
  } catch (error) {
    console.error("[AUTH] Failed to store tokens:", error);
    throw new Error("Failed to store authentication tokens");
  }
};

/**
 * Clear tokens
 * Removes from both localStorage and cookies
 */
export const clearTokens = (): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(TOKEN_KEY);
    removeHybridStorage(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.warn("[AUTH] Failed to clear tokens:", error);
  }
};

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

/**
 * Login user
 */
export const login = async (
  email: string,
  password: string
): Promise<ServiceResponse<LoginResponse>> => {
  try {
    const result = await axiosRequestWithErrorHandling<LoginResponse>(
      `${API_BASE_URL}/api/v2/auth/login/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        data: { email, password },
        useCache: false,
      },
      "Login failed"
    );

    if (!result.success || result.error) {
      // Log detailed error information for debugging
      if (result.error) {
        console.error("[AUTH] Login failed:", {
          statusCode: result.error.statusCode,
          statusText: result.error.statusText,
          message: result.error.message,
          details: result.error.details,
          fieldErrors: result.error.fieldErrors,
          nonFieldErrors: result.error.nonFieldErrors,
          isNetworkError: result.error.isNetworkError,
          isTimeoutError: result.error.isTimeoutError,
        });
      }

      return {
        success: false,
        message: result.error
          ? formatErrorMessage(result.error, "Login failed")
          : "Login failed",
        error: result.error,
        fieldErrors: result.error?.fieldErrors,
        nonFieldErrors: result.error?.nonFieldErrors,
      };
    }

    // Store tokens if provided
    if (result.data?.access_token) {
      setTokens(result.data.access_token, result.data.refresh_token);
    }

    return {
      success: true,
      message: result.data?.message || "Login successful",
      data: result.data,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, "Login failed");
    console.error("[AUTH] Login exception:", {
      error,
      parsedError,
      message: parsedError.message,
      fieldErrors: parsedError.fieldErrors,
      nonFieldErrors: parsedError.nonFieldErrors,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, "Login failed"),
      error: parsedError,
      fieldErrors: parsedError.fieldErrors,
      nonFieldErrors: parsedError.nonFieldErrors,
    };
  }
};

/**
 * Register new user
 */
export const register = async (
  name: string,
  email: string,
  password: string
): Promise<ServiceResponse<RegisterResponse>> => {
  try {
    const result = await axiosRequestWithErrorHandling<RegisterResponse>(
      `${API_BASE_URL}/api/v2/auth/register/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        data: { name, email, password },
        useCache: false,
      },
      "Registration failed"
    );

    if (!result.success || result.error) {
      // Log detailed error information for debugging
      if (result.error) {
        console.error("[AUTH] Registration failed:", {
          statusCode: result.error.statusCode,
          statusText: result.error.statusText,
          message: result.error.message,
          details: result.error.details,
          fieldErrors: result.error.fieldErrors,
          nonFieldErrors: result.error.nonFieldErrors,
          isNetworkError: result.error.isNetworkError,
          isTimeoutError: result.error.isTimeoutError,
        });
      }

      return {
        success: false,
        message: result.error
          ? formatErrorMessage(result.error, "Registration failed")
          : "Registration failed",
        error: result.error,
        fieldErrors: result.error?.fieldErrors,
        nonFieldErrors: result.error?.nonFieldErrors,
      };
    }

    // Store tokens if provided (some APIs auto-login on registration)
    if (result.data?.access_token) {
      setTokens(result.data.access_token, result.data.refresh_token);
    }

    return {
      success: true,
      message:
        result.data?.message ||
        "Registration successful! Please check your email to verify your account.",
      data: result.data,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, "Registration failed");
    console.error("[AUTH] Registration exception:", {
      error,
      parsedError,
      message: parsedError.message,
      fieldErrors: parsedError.fieldErrors,
      nonFieldErrors: parsedError.nonFieldErrors,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, "Registration failed"),
      error: parsedError,
      fieldErrors: parsedError.fieldErrors,
      nonFieldErrors: parsedError.nonFieldErrors,
    };
  }
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  try {
    const token = getToken();
    const refreshToken = getRefreshToken();

    if (token) {
      // Send refresh_token in body if available (as per API documentation)
      const body = refreshToken
        ? JSON.stringify({ refresh_token: refreshToken })
        : undefined;

      await authenticatedFetch(`${API_BASE_URL}/api/v2/auth/logout/`, {
        method: "POST",
        headers: refreshToken
          ? {
              "Content-Type": "application/json",
            }
          : undefined,
        body,
      });
    }
  } catch (error) {
    console.error("[AUTH] Logout error:", error);
    // Continue with token clearing even if logout request fails
  } finally {
    clearTokens();
  }
};

/**
 * Get current session
 * @param silent - If true, suppresses error logging for expired sessions (useful for background checks)
 */
export const getSession = async (silent: boolean = false): Promise<{
  user: SessionResponse["user"];
  token: string;
} | null> => {
  console.log('[AUTH] getSession called, silent:', silent);
  
  try {
    const token = getToken();
    console.log('[AUTH] getSession token check:', token ? 'Token exists' : 'No token');
    
    if (!token) {
      console.log('[AUTH] getSession returning null - no token');
      return null;
    }

    console.log('[AUTH] getSession calling authenticatedFetch for session endpoint');
    const response = await authenticatedFetch(`${API_BASE_URL}/api/v2/auth/session/`, {
      method: "GET",
    });

    console.log('[AUTH] getSession received response:', {
      ok: response.ok,
      status: response.status,
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('[AUTH] getSession got 401, clearing tokens');
        clearTokens();
        return null;
      }

      const error = await parseApiError(response, "Failed to get session");
      console.error('[AUTH] getSession API error:', error);
      throw new Error(formatErrorMessage(error, "Failed to get session"));
    }

    console.log('[AUTH] getSession parsing JSON response');
    const data: SessionResponse = await response.json();
    console.log('[AUTH] getSession successfully parsed, user:', data.user?.id || data.user?.email);
    
    return {
      user: data.user,
      token,
    };
  } catch (error) {
    // Only log error if not in silent mode (for background checks)
    if (!silent) {
      console.error("[AUTH] Get session error:", error);
    } else {
      console.log("[AUTH] Get session error (silent mode):", error);
    }
    clearTokens();
    return null;
  }
};

/**
 * Refresh access token
 */
export const refreshTokenRequest = async (
  refreshToken: string
): Promise<boolean> => {
  try {
    const result = await axiosRequestWithErrorHandling<RefreshTokenResponse>(
      `${API_BASE_URL}/api/v2/auth/refresh/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        data: { refresh_token: refreshToken },
        useCache: false,
      },
      "Token refresh failed"
    );

    if (!result.success || !result.data?.access_token) {
      return false;
    }

    // Store new tokens
    setTokens(
      result.data.access_token,
      result.data.refresh_token || refreshToken
    );
    return true;
  } catch (error) {
    console.error("[AUTH] Refresh token error:", error);
    return false;
  }
};
