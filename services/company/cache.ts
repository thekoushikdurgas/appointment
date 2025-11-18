/**
 * Company Service Cache Utilities
 * 
 * Simple in-memory cache for count requests (5 minute TTL)
 * Handles both company counts and company contact counts
 */

interface CacheEntry {
  data: number;
  timestamp: number;
}

const COUNT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const countCache = new Map<string, CacheEntry>();

const CONTACT_COUNT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const contactCountCache = new Map<string, CacheEntry>();

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = (): void => {
  const now = Date.now();
  for (const [key, entry] of countCache.entries()) {
    if (now - entry.timestamp > COUNT_CACHE_TTL) {
      countCache.delete(key);
    }
  }
};

/**
 * Get cached count or null if not found/expired
 */
export const getCachedCount = (cacheKey: string): number | null => {
  clearExpiredCache();
  const entry = countCache.get(cacheKey);
  if (entry && Date.now() - entry.timestamp < COUNT_CACHE_TTL) {
    return entry.data;
  }
  return null;
};

/**
 * Set cached count
 */
export const setCachedCount = (cacheKey: string, count: number): void => {
  countCache.set(cacheKey, {
    data: count,
    timestamp: Date.now(),
  });
};

/**
 * Clear count cache (useful for testing or manual invalidation)
 */
export const clearCountCache = (): void => {
  countCache.clear();
};

/**
 * Clear expired contact count cache entries
 */
export const clearExpiredContactCountCache = (): void => {
  const now = Date.now();
  for (const [key, entry] of contactCountCache.entries()) {
    if (now - entry.timestamp > CONTACT_COUNT_CACHE_TTL) {
      contactCountCache.delete(key);
    }
  }
};

/**
 * Get cached contact count or null if not found/expired
 */
export const getCachedContactCount = (cacheKey: string): number | null => {
  clearExpiredContactCountCache();
  const entry = contactCountCache.get(cacheKey);
  if (entry && Date.now() - entry.timestamp < CONTACT_COUNT_CACHE_TTL) {
    return entry.data;
  }
  return null;
};

/**
 * Set cached contact count
 */
export const setCachedContactCount = (cacheKey: string, count: number): void => {
  contactCountCache.set(cacheKey, {
    data: count,
    timestamp: Date.now(),
  });
};

/**
 * Clear contact count cache (useful for testing or manual invalidation)
 */
export const clearContactCountCache = (): void => {
  contactCountCache.clear();
};

