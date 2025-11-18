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


// Re-export all types
export type {
  LoginResponse,
  RegisterResponse,
  SessionResponse,
  RefreshTokenResponse,
  ServiceResponse,
} from "./types";

// Re-export token management functions
export {
  getToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "./tokens";

// Re-export login/register/logout functions
export {
  login,
  register,
  logout,
} from "./login";

// Re-export session functions
export {
  getSession,
} from "./session";

// Re-export refresh functions
export {
  refreshTokenRequest,
} from "./refresh";

// Re-export authenticatedFetch
export {
  authenticatedFetch,
} from "./fetch";

