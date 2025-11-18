/**
 * Authentication Service Types
 * 
 * All type definitions and interfaces for the authentication service.
 */

import { ParsedError } from '@utils/error';

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

