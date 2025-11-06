/**
 * Cookie Utilities
 * 
 * Handles httpOnly cookie support with localStorage fallback
 * Note: httpOnly cookies can only be set/read by the server,
 * but we can check if they exist via document.cookie for non-httpOnly cookies
 */

/**
 * Cookie options for setting cookies
 */
export interface CookieOptions {
  expires?: Date;
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean; // Note: httpOnly can only be set server-side
}

/**
 * Get cookie value by name
 * Note: httpOnly cookies cannot be read from client-side JavaScript
 */
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  
  return null;
};

/**
 * Set cookie value
 * Note: httpOnly cookies must be set server-side
 */
export const setCookie = (
  name: string,
  value: string,
  options: CookieOptions = {}
): void => {
  if (typeof document === 'undefined') return;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.expires) {
    cookieString += `; expires=${options.expires.toUTCString()}`;
  }

  if (options.maxAge) {
    cookieString += `; max-age=${options.maxAge}`;
  }

  if (options.path) {
    cookieString += `; path=${options.path}`;
  } else {
    cookieString += '; path=/';
  }

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  if (options.secure) {
    cookieString += '; secure';
  }

  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }

  document.cookie = cookieString;
};

/**
 * Delete cookie
 */
export const deleteCookie = (name: string, options: { path?: string; domain?: string } = {}): void => {
  if (typeof document === 'undefined') return;

  setCookie(name, '', {
    ...options,
    expires: new Date(0),
    maxAge: 0,
  });
};

/**
 * Check if cookies are available
 */
export const areCookiesAvailable = (): boolean => {
  if (typeof document === 'undefined') return false;
  
  try {
    // Try to set and read a test cookie
    const testKey = '__cookie_test__';
    const testValue = 'test';
    setCookie(testKey, testValue);
    const retrieved = getCookie(testKey);
    deleteCookie(testKey);
    return retrieved === testValue;
  } catch {
    return false;
  }
};

/**
 * Hybrid storage: Try cookie first, fallback to localStorage
 * This is useful for refresh tokens that should be httpOnly (server-managed)
 * but we need a fallback for client-side access
 */
export const getHybridStorage = (key: string): string | null => {
  // Try cookie first (for httpOnly cookies set by server, this will return null)
  const cookieValue = getCookie(key);
  if (cookieValue) {
    return cookieValue;
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  return null;
};

/**
 * Hybrid storage: Set in both cookie and localStorage
 * Note: For httpOnly cookies, the server must set them
 */
export const setHybridStorage = (
  key: string,
  value: string,
  useCookie: boolean = true,
  cookieOptions?: CookieOptions
): void => {
  if (typeof window === 'undefined') return;

  // Set in localStorage (always)
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`[COOKIES] Failed to set localStorage for ${key}:`, error);
  }

  // Set in cookie if requested (for non-httpOnly cookies)
  if (useCookie && !cookieOptions?.httpOnly) {
    try {
      setCookie(key, value, {
        path: '/',
        sameSite: 'lax',
        secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
        ...cookieOptions,
      });
    } catch (error) {
      console.warn(`[COOKIES] Failed to set cookie for ${key}:`, error);
    }
  }
};

/**
 * Hybrid storage: Remove from both cookie and localStorage
 */
export const removeHybridStorage = (key: string): void => {
  if (typeof window === 'undefined') return;

  // Remove from localStorage
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[COOKIES] Failed to remove localStorage for ${key}:`, error);
  }

  // Remove from cookie
  try {
    deleteCookie(key);
  } catch (error) {
    console.warn(`[COOKIES] Failed to remove cookie for ${key}:`, error);
  }
};

