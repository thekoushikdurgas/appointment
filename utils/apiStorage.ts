/**
 * API Result Storage
 * 
 * Fallback storage for API results using sessionStorage → localStorage → cookies chain.
 * Provides persistence for API responses to handle network failures and offline scenarios.
 */

import { getCookie, setCookie, deleteCookie } from '@utils/cookies';

/**
 * Storage entry interface
 */
interface StorageEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * Default TTL (5 minutes)
 */
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Storage key prefix for sessionStorage
 */
const SESSION_STORAGE_PREFIX = 'api_storage_session_';

/**
 * Storage key prefix for localStorage
 */
const LOCAL_STORAGE_PREFIX = 'api_storage_local_';

/**
 * Cookie name prefix
 */
const COOKIE_PREFIX = 'api_storage_';

/**
 * Maximum cookie size (4KB limit)
 */
const MAX_COOKIE_SIZE = 4000;

/**
 * Get API result from storage (fallback chain: sessionStorage → localStorage → cookies)
 * 
 * @param key - Storage key
 * @returns Stored data or null if not found/expired
 */
export const getApiResult = <T = any>(key: string): T | null => {
  if (typeof window === 'undefined') return null;

  const now = Date.now();

  // Try sessionStorage first (primary)
  try {
    const sessionKey = `${SESSION_STORAGE_PREFIX}${key}`;
    const sessionValue = sessionStorage.getItem(sessionKey);
    if (sessionValue) {
      const entry: StorageEntry<T> = JSON.parse(sessionValue);
      if (now - entry.timestamp < entry.ttl) {
        return entry.data;
      } else {
        // Expired, remove it
        sessionStorage.removeItem(sessionKey);
      }
    }
  } catch (error) {
    console.warn('[API_STORAGE] Failed to read from sessionStorage:', error);
  }

  // Try localStorage second (secondary)
  try {
    const localKey = `${LOCAL_STORAGE_PREFIX}${key}`;
    const localValue = localStorage.getItem(localKey);
    if (localValue) {
      const entry: StorageEntry<T> = JSON.parse(localValue);
      if (now - entry.timestamp < entry.ttl) {
        // Restore to sessionStorage for faster access next time
        try {
          const sessionKey = `${SESSION_STORAGE_PREFIX}${key}`;
          sessionStorage.setItem(sessionKey, localValue);
        } catch {
          // Ignore sessionStorage errors
        }
        return entry.data;
      } else {
        // Expired, remove it
        localStorage.removeItem(localKey);
      }
    }
  } catch (error) {
    console.warn('[API_STORAGE] Failed to read from localStorage:', error);
  }

  // Try cookies third (tertiary)
  try {
    const cookieName = `${COOKIE_PREFIX}${key}`;
    const cookieValue = getCookie(cookieName);
    if (cookieValue) {
      const entry: StorageEntry<T> = JSON.parse(decodeURIComponent(cookieValue));
      if (now - entry.timestamp < entry.ttl) {
        // Restore to sessionStorage and localStorage for faster access
        try {
          const sessionKey = `${SESSION_STORAGE_PREFIX}${key}`;
          const localKey = `${LOCAL_STORAGE_PREFIX}${key}`;
          const entryString = JSON.stringify(entry);
          sessionStorage.setItem(sessionKey, entryString);
          localStorage.setItem(localKey, entryString);
        } catch {
          // Ignore storage errors
        }
        return entry.data;
      } else {
        // Expired, remove it
        deleteCookie(cookieName);
      }
    }
  } catch (error) {
    console.warn('[API_STORAGE] Failed to read from cookies:', error);
  }

  return null;
};

/**
 * Set API result in storage (saves to all available storage methods)
 * 
 * @param key - Storage key
 * @param data - Data to store
 * @param ttl - Time to live in milliseconds (default: 5 minutes)
 */
export const setApiResult = <T = any>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL
): void => {
  if (typeof window === 'undefined') return;

  const entry: StorageEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl,
  };

  const entryString = JSON.stringify(entry);

  // Save to sessionStorage (primary)
  try {
    const sessionKey = `${SESSION_STORAGE_PREFIX}${key}`;
    sessionStorage.setItem(sessionKey, entryString);
  } catch (error) {
    console.warn('[API_STORAGE] Failed to write to sessionStorage:', error);
  }

  // Save to localStorage (secondary)
  try {
    const localKey = `${LOCAL_STORAGE_PREFIX}${key}`;
    localStorage.setItem(localKey, entryString);
  } catch (error) {
    console.warn('[API_STORAGE] Failed to write to localStorage:', error);
    // Try to clear old entries if quota exceeded
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      clearExpiredStorage();
    }
  }

  // Save to cookies (tertiary) - only if data is small enough
  try {
    const cookieName = `${COOKIE_PREFIX}${key}`;
    const encodedValue = encodeURIComponent(entryString);
    if (encodedValue.length <= MAX_COOKIE_SIZE) {
      // Calculate expiration date
      const expires = new Date();
      expires.setTime(expires.getTime() + ttl);
      
      setCookie(cookieName, encodedValue, {
        expires,
        path: '/',
        sameSite: 'lax',
        secure: window.location.protocol === 'https:',
      });
    } else {
      // Data too large for cookie, skip
      console.warn('[API_STORAGE] Data too large for cookie, skipping:', key);
    }
  } catch (error) {
    console.warn('[API_STORAGE] Failed to write to cookies:', error);
  }
};

/**
 * Clear API result from all storage methods
 * 
 * @param key - Storage key
 */
export const clearApiResult = (key: string): void => {
  if (typeof window === 'undefined') return;

  // Clear from sessionStorage
  try {
    const sessionKey = `${SESSION_STORAGE_PREFIX}${key}`;
    sessionStorage.removeItem(sessionKey);
  } catch (error) {
    console.warn('[API_STORAGE] Failed to clear from sessionStorage:', error);
  }

  // Clear from localStorage
  try {
    const localKey = `${LOCAL_STORAGE_PREFIX}${key}`;
    localStorage.removeItem(localKey);
  } catch (error) {
    console.warn('[API_STORAGE] Failed to clear from localStorage:', error);
  }

  // Clear from cookies
  try {
    const cookieName = `${COOKIE_PREFIX}${key}`;
    deleteCookie(cookieName);
  } catch (error) {
    console.warn('[API_STORAGE] Failed to clear from cookies:', error);
  }
};

/**
 * Clear expired entries from all storage methods
 */
export const clearExpiredStorage = (): void => {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const keysToRemove: string[] = [];

  // Clear expired sessionStorage entries
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(SESSION_STORAGE_PREFIX)) {
        try {
          const value = sessionStorage.getItem(key);
          if (value) {
            const entry: StorageEntry = JSON.parse(value);
            if (now - entry.timestamp >= entry.ttl) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // Invalid entry, remove it
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    keysToRemove.length = 0;
  } catch (error) {
    console.warn('[API_STORAGE] Failed to clear expired sessionStorage entries:', error);
  }

  // Clear expired localStorage entries
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_STORAGE_PREFIX)) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const entry: StorageEntry = JSON.parse(value);
            if (now - entry.timestamp >= entry.ttl) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // Invalid entry, remove it
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    keysToRemove.length = 0;
  } catch (error) {
    console.warn('[API_STORAGE] Failed to clear expired localStorage entries:', error);
  }

  // Clear expired cookies (cookies expire automatically, but we can check and remove manually)
  // Note: We can't easily iterate cookies, so we rely on browser expiration
};

/**
 * Clear all API storage entries
 */
export const clearAllApiStorage = (): void => {
  if (typeof window === 'undefined') return;

  const keysToRemove: string[] = [];

  // Clear all sessionStorage entries
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(SESSION_STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    keysToRemove.length = 0;
  } catch (error) {
    console.warn('[API_STORAGE] Failed to clear sessionStorage:', error);
  }

  // Clear all localStorage entries
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('[API_STORAGE] Failed to clear localStorage:', error);
  }

  // Note: Cookies are harder to clear all at once, but they will expire naturally
};

/**
 * Initialize storage cleanup on page load
 */
if (typeof window !== 'undefined') {
  // Clear expired storage on load
  clearExpiredStorage();
  
  // Set up periodic cleanup (every 5 minutes)
  setInterval(clearExpiredStorage, 5 * 60 * 1000);
}

