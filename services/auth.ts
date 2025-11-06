import { API_BASE_URL } from './api';
import { getHybridStorage, setHybridStorage, removeHybridStorage } from '../utils/cookies';
import { request, requestWithErrorHandling } from '../utils/request';
import { parseApiError, parseExceptionError, formatErrorMessage, ParsedError } from '../utils/errorHandler';

// Token storage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

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
}

/**
 * Get stored access token
 * Uses localStorage (client-side access needed)
 */
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.warn('[AUTH] Failed to get token from localStorage:', error);
    return null;
  }
};

/**
 * Get stored refresh token
 * Checks both cookie (httpOnly, server-managed) and localStorage (fallback)
 */
export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Try hybrid storage (cookie first, then localStorage)
  return getHybridStorage(REFRESH_TOKEN_KEY);
};

/**
 * Store tokens
 * Access token: localStorage (client-side access needed)
 * Refresh token: Hybrid storage (cookie preferred, localStorage fallback)
 */
export const setTokens = (accessToken: string, refreshToken?: string): void => {
  if (typeof window === 'undefined') return;

  try {
    // Store access token in localStorage (always needed for client-side access)
    localStorage.setItem(TOKEN_KEY, accessToken);

    // Store refresh token in hybrid storage
    // Note: httpOnly cookies must be set by the server, but we store in localStorage as fallback
    if (refreshToken) {
      // Try to use cookie if available, otherwise fallback to localStorage
      setHybridStorage(REFRESH_TOKEN_KEY, refreshToken, true, {
        path: '/',
        sameSite: 'lax',
        secure: window.location.protocol === 'https:',
        // Note: httpOnly must be set server-side, so we can't set it here
      });
    }
  } catch (error) {
    console.error('[AUTH] Failed to store tokens:', error);
    throw new Error('Failed to store authentication tokens');
  }
};

/**
 * Clear tokens
 * Removes from both localStorage and cookies
 */
export const clearTokens = (): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(TOKEN_KEY);
    removeHybridStorage(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.warn('[AUTH] Failed to clear tokens:', error);
  }
};

/**
 * Make authenticated API request with automatic token refresh
 * Fixed: Properly merges headers on retry after token refresh
 */
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();
  const headers = new Headers(options.headers);
  
  // Set authorization header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
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
    const parsedError = parseExceptionError(error);
    throw new Error(formatErrorMessage(parsedError, 'Request failed'));
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
            throw new Error('Session expired. Please login again.');
          }

          // Retry original request with new token
          // Fixed: Properly merge headers instead of overwriting
          const retryHeaders = new Headers(options.headers);
          retryHeaders.set('Authorization', `Bearer ${newToken}`);
          
          try {
            return await request(url, {
              ...options,
              headers: retryHeaders,
              timeout: 30000,
              retries: 0, // Don't retry the retry
            });
          } catch (retryError) {
            const parsedError = parseExceptionError(retryError);
            throw new Error(formatErrorMessage(parsedError, 'Request failed after token refresh'));
          }
        }
      } catch (error) {
        // Refresh failed, clear tokens
        clearTokens();
        const parsedError = parseExceptionError(error);
        throw new Error(formatErrorMessage(parsedError, 'Session expired'));
      }
    } else {
      clearTokens();
      throw new Error('Session expired. Please login again.');
    }
  }
  
  return response;
};

/**
 * Login user
 */
export const login = async (email: string, password: string): Promise<ServiceResponse<LoginResponse>> => {
  try {
    const result = await requestWithErrorHandling<LoginResponse>(
      `${API_BASE_URL}/auth/login/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        timeout: 30000,
        retries: 1,
      },
      'Login failed'
    );

    if (!result.success || result.error) {
      return {
        success: false,
        message: result.error ? formatErrorMessage(result.error, 'Login failed') : 'Login failed',
        error: result.error,
      };
    }

    // Store tokens if provided
    if (result.data?.access_token) {
      setTokens(result.data.access_token, result.data.refresh_token);
    }

    return {
      success: true,
      message: result.data?.message || 'Login successful',
      data: result.data,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Login failed');
    console.error('[AUTH] Login error:', parsedError);
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Login failed'),
      error: parsedError,
    };
  }
};

/**
 * Register new user
 */
export const register = async (name: string, email: string, password: string): Promise<ServiceResponse<RegisterResponse>> => {
  try {
    const result = await requestWithErrorHandling<RegisterResponse>(
      `${API_BASE_URL}/auth/register/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
        timeout: 30000,
        retries: 1,
      },
      'Registration failed'
    );

    if (!result.success || result.error) {
      return {
        success: false,
        message: result.error ? formatErrorMessage(result.error, 'Registration failed') : 'Registration failed',
        error: result.error,
      };
    }

    // Store tokens if provided (some APIs auto-login on registration)
    if (result.data?.access_token) {
      setTokens(result.data.access_token, result.data.refresh_token);
    }

    return {
      success: true,
      message: result.data?.message || 'Registration successful! Please check your email to verify your account.',
      data: result.data,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Registration failed');
    console.error('[AUTH] Registration error:', parsedError);
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Registration failed'),
      error: parsedError,
    };
  }
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  try {
    const token = getToken();
    if (token) {
      await authenticatedFetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
      });
    }
  } catch (error) {
    console.error('[AUTH] Logout error:', error);
    // Continue with token clearing even if logout request fails
  } finally {
    clearTokens();
  }
};

/**
 * Get current session
 */
export const getSession = async (): Promise<{ user: SessionResponse['user']; token: string } | null> => {
  try {
    const token = getToken();
    if (!token) {
      return null;
    }

    const response = await authenticatedFetch(`${API_BASE_URL}/auth/session/`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearTokens();
        return null;
      }
      
      const error = await parseApiError(response, 'Failed to get session');
      throw new Error(formatErrorMessage(error, 'Failed to get session'));
    }

    const data: SessionResponse = await response.json();
    return {
      user: data.user,
      token,
    };
  } catch (error) {
    console.error('[AUTH] Get session error:', error);
    clearTokens();
    return null;
  }
};

/**
 * Refresh access token
 */
export const refreshTokenRequest = async (refreshToken: string): Promise<boolean> => {
  try {
    const result = await requestWithErrorHandling<RefreshTokenResponse>(
      `${API_BASE_URL}/auth/refresh/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        timeout: 10000, // 10 second timeout for refresh
        retries: 0, // Don't retry refresh token requests
      },
      'Token refresh failed'
    );

    if (!result.success || !result.data?.access_token) {
      return false;
    }

    // Store new tokens
    setTokens(result.data.access_token, result.data.refresh_token || refreshToken);
    return true;
  } catch (error) {
    console.error('[AUTH] Refresh token error:', error);
    return false;
  }
};
