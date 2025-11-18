/**
 * Authentication Service Token Management
 * 
 * Functions for managing authentication tokens.
 */

import {
  getHybridStorage,
  setHybridStorage,
  removeHybridStorage,
} from "@utils/cookies";

// Token storage keys
const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

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

