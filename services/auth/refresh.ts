/**
 * Authentication Service Token Refresh Operations
 * 
 * Functions for refreshing authentication tokens.
 */

import { API_BASE_URL } from "../api";
import { axiosRequestWithErrorHandling } from "@utils/request";
import { RefreshTokenResponse } from "./types";
import { setTokens } from "./tokens";

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
        useQueue: false, // Don't queue refresh token requests
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

