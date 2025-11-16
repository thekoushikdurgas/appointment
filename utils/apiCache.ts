/**
 * API Response Cache
 * 
 * Automatic response caching with TTL (Time To Live) management.
 * Supports in-memory cache with localStorage fallback for persistence.
 */

/**
 * Cache entry interface
 */
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Default TTL (5 minutes)
 */
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Cache storage key prefix for localStorage
 */
const CACHE_STORAGE_PREFIX = 'api_cache_';

/**
 * In-memory cache storage
 */
const memoryCache = new Map<string, CacheEntry>();

/**
 * Cache statistics
 */
let cacheStats = {
  hits: 0,
  misses: 0,
};

/**
 * Generate cache key from URL, method, and params
 */
export const generateCacheKey = (
  url: string,
  method: string = 'GET',
  params?: any,
  data?: any
): string => {
  // Parse URL to extract base URL and query string
  const urlParts = url.split('?');
  const normalizedUrl = urlParts[0];
  const queryString = urlParts[1] || '';
  
  // Create key components
  const keyParts = [method.toUpperCase(), normalizedUrl];
  
  // Parse query string from URL if present
  let urlParams: Record<string, string> = {};
  if (queryString) {
    const searchParams = new URLSearchParams(queryString);
    searchParams.forEach((value, key) => {
      urlParams[key] = value;
    });
  }
  
  // Merge URL params with provided params (provided params take precedence)
  const allParams = { ...urlParams, ...(params || {}) };
  
  // Add params if present
  if (Object.keys(allParams).length > 0) {
    // Sort keys to ensure consistent cache keys regardless of param order
    const sortedParams: Record<string, any> = {};
    Object.keys(allParams).sort().forEach(key => {
      sortedParams[key] = allParams[key];
    });
    keyParts.push(JSON.stringify(sortedParams));
  }
  
  // Add data if present (for POST/PUT requests that should be cached)
  if (data && Object.keys(data).length > 0) {
    keyParts.push(JSON.stringify(data));
  }
  
  return keyParts.join('|');
};

/**
 * Get cached response
 */
export const getCachedResponse = <T = any>(cacheKey: string): T | null => {
  // Check memory cache first
  const memoryEntry = memoryCache.get(cacheKey);
  if (memoryEntry) {
    const now = Date.now();
    if (now - memoryEntry.timestamp < memoryEntry.ttl) {
      // Cache hit
      cacheStats.hits++;
      return memoryEntry.data as T;
    } else {
      // Expired, remove from memory
      memoryCache.delete(cacheKey);
    }
  }

  // Check localStorage fallback
  if (typeof window !== 'undefined') {
    try {
      const storageKey = `${CACHE_STORAGE_PREFIX}${cacheKey}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        const now = Date.now();
        
        if (now - entry.timestamp < entry.ttl) {
          // Cache hit - restore to memory cache
          memoryCache.set(cacheKey, entry);
          cacheStats.hits++;
          return entry.data;
        } else {
          // Expired, remove from storage
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.warn('[CACHE] Failed to read from localStorage:', error);
    }
  }

  // Cache miss
  cacheStats.misses++;
  return null;
};

/**
 * Set cached response
 */
export const setCachedResponse = <T = any>(
  cacheKey: string,
  data: T,
  ttl: number = DEFAULT_TTL
): void => {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl,
  };

  // Store in memory cache
  memoryCache.set(cacheKey, entry);

  // Store in localStorage as fallback
  if (typeof window !== 'undefined') {
    try {
      const storageKey = `${CACHE_STORAGE_PREFIX}${cacheKey}`;
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      // Handle quota exceeded or other storage errors
      console.warn('[CACHE] Failed to write to localStorage:', error);
      // Try to clear old entries if quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        clearExpiredCache();
      }
    }
  }
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = (): void => {
  const now = Date.now();
  
  // Clear expired memory cache entries
  for (const [key, entry] of memoryCache.entries()) {
    if (now - entry.timestamp >= entry.ttl) {
      memoryCache.delete(key);
    }
  }

  // Clear expired localStorage entries
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_STORAGE_PREFIX)) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const entry: CacheEntry = JSON.parse(stored);
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
    } catch (error) {
      console.warn('[CACHE] Failed to clear expired localStorage entries:', error);
    }
  }
};

/**
 * Clear specific cache entry
 */
export const clearCacheEntry = (cacheKey: string): void => {
  // Remove from memory cache
  memoryCache.delete(cacheKey);

  // Remove from localStorage
  if (typeof window !== 'undefined') {
    try {
      const storageKey = `${CACHE_STORAGE_PREFIX}${cacheKey}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('[CACHE] Failed to clear cache entry from localStorage:', error);
    }
  }
};

/**
 * Clear all cache entries
 */
export const clearCache = (): void => {
  // Clear memory cache
  memoryCache.clear();

  // Clear localStorage cache
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('[CACHE] Failed to clear localStorage cache:', error);
    }
  }
};

/**
 * Clear cache entries matching a pattern
 */
export const clearCacheByPattern = (pattern: string | RegExp): void => {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  
  // Clear from memory cache
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }

  // Clear from localStorage
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_STORAGE_PREFIX)) {
          const cacheKey = key.replace(CACHE_STORAGE_PREFIX, '');
          if (regex.test(cacheKey)) {
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('[CACHE] Failed to clear cache by pattern from localStorage:', error);
    }
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = (): CacheStats => {
  const total = cacheStats.hits + cacheStats.misses;
  const hitRate = total > 0 ? cacheStats.hits / total : 0;

  return {
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    size: memoryCache.size,
    hitRate,
  };
};

/**
 * Reset cache statistics
 */
export const resetCacheStats = (): void => {
  cacheStats = {
    hits: 0,
    misses: 0,
  };
};

/**
 * Initialize cache cleanup on page load
 */
if (typeof window !== 'undefined') {
  // Clear expired cache on load
  clearExpiredCache();
  
  // Set up periodic cleanup (every 5 minutes)
  setInterval(clearExpiredCache, 5 * 60 * 1000);
}

