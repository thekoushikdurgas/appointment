/**
 * Request Types
 * 
 * Type definitions for request options
 */

import type { AxiosRequestConfig } from 'axios';

/**
 * Request options extending AxiosRequestConfig
 */
export interface AxiosRequestOptions extends AxiosRequestConfig {
  useQueue?: boolean; // Whether to use the global request queue (default: true)
  useCache?: boolean; // Whether to use response caching (default: true)
  cacheTTL?: number; // Cache TTL in milliseconds (default: 5 minutes)
  priority?: number; // Queue priority (0-10, default: 0)
  skipCache?: boolean; // Skip cache check (force fresh request)
  invalidateCache?: string | RegExp; // Pattern to invalidate cache entries
}

