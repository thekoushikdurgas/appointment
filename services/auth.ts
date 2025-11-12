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
} from "../utils/cookies";
import { request, requestWithErrorHandling } from "../utils/request";
import {
  parseApiError,
  parseExceptionError,
  formatErrorMessage,
  ParsedError,
} from "../utils/errorHandler";

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
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();
  const headers = new Headers(options.headers);

  // Set authorization header if token exists
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Make initial request
  let response: Response;
  try {
    response = await request(url, {
      ...options,
      headers,
      timeout: 30000, // 30 second timeout
      retries: 1, // One retry for network errors
    });
  } catch (error) {
    // Handle network/timeout errors
    // formatErrorMessage now prioritizes network/timeout errors over status codes
    const parsedError = parseExceptionError(error);
    throw new Error(formatErrorMessage(parsedError, "Request failed"));
  }

  // Handle token expiration (401)
  if (response.status === 401) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshed = await refreshTokenRequest(refreshToken);
        if (refreshed) {
          // Get new token
          const newToken = getToken();
          if (!newToken) {
            clearTokens();
            throw new Error("Session expired. Please login again.");
          }

          // Retry original request with new token
          // Fixed: Properly merge headers instead of overwriting
          const retryHeaders = new Headers(options.headers);
          retryHeaders.set("Authorization", `Bearer ${newToken}`);

          try {
            return await request(url, {
              ...options,
              headers: retryHeaders,
              timeout: 30000,
              retries: 0, // Don't retry the retry
            });
          } catch (retryError) {
            const parsedError = parseExceptionError(retryError);
            throw new Error(
              formatErrorMessage(
                parsedError,
                "Request failed after token refresh"
              )
            );
          }
        }
      } catch (error) {
        // Refresh failed, clear tokens
        clearTokens();
        const parsedError = parseExceptionError(error);
        throw new Error(formatErrorMessage(parsedError, "Session expired"));
      }
    } else {
      clearTokens();
      throw new Error("Session expired. Please login again.");
    }
  }

  return response;
};

/**
 * Login user
 */
export const login = async (
  email: string,
  password: string
): Promise<ServiceResponse<LoginResponse>> => {
  try {
    const result = await requestWithErrorHandling<LoginResponse>(
      `${API_BASE_URL}/api/v2/auth/login/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        timeout: 30000,
        retries: 1,
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
    const result = await requestWithErrorHandling<RegisterResponse>(
      `${API_BASE_URL}/api/v2/auth/register/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
        timeout: 30000,
        retries: 1,
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
  try {
    const token = getToken();
    if (!token) {
      return null;
    }

    const response = await authenticatedFetch(`${API_BASE_URL}/api/v2/auth/session/`, {
      method: "GET",
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearTokens();
        return null;
      }

      const error = await parseApiError(response, "Failed to get session");
      throw new Error(formatErrorMessage(error, "Failed to get session"));
    }

    const data: SessionResponse = await response.json();
    return {
      user: data.user,
      token,
    };
  } catch (error) {
    // Only log error if not in silent mode (for background checks)
    if (!silent) {
      console.error("[AUTH] Get session error:", error);
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
    const result = await requestWithErrorHandling<RefreshTokenResponse>(
      `${API_BASE_URL}/api/v2/auth/refresh/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        timeout: 10000, // 10 second timeout for refresh
        retries: 0, // Don't retry refresh token requests
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
