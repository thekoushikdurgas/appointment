/**
 * Authentication Service Login Operations
 * 
 * Functions for user login, registration, and logout.
 */

import { API_BASE_URL } from "../api";
import { axiosRequestWithErrorHandling } from "@utils/request";
import {
  parseExceptionError,
  formatErrorMessage,
} from "@utils/error";
import {
  LoginResponse,
  RegisterResponse,
  ServiceResponse,
} from "./types";
import { setTokens, clearTokens, getToken, getRefreshToken } from "./tokens";
import { authenticatedFetch } from "./fetch";

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
        useQueue: true,
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
        useQueue: true,
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

