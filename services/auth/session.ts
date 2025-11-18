/**
 * Authentication Service Session Operations
 * 
 * Functions for managing user sessions.
 */

import { API_BASE_URL } from "../api";
import {
  parseApiError,
  formatErrorMessage,
} from "@utils/error";
import { SessionResponse } from "./types";
import { getToken, clearTokens } from "./tokens";
import { authenticatedFetch } from "./fetch";

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

