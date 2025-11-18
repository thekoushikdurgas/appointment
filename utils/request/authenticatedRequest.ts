/**
 * Authenticated Request
 * 
 * Authenticated request function for making HTTP requests with authentication
 */

import type { AxiosResponse, AxiosError } from 'axios';
import axiosInstance, { convertAxiosError } from '@utils/axiosClient';
import { enqueueRequest, isQueueEnabled } from '@utils/requestQueue';
import {
  getCachedResponse,
  setCachedResponse,
  generateCacheKey,
  clearCacheEntry,
  clearCacheByPattern,
} from '@utils/apiCache';
import { formatErrorMessage } from '@utils/error';
import type { AxiosRequestOptions } from './types';
import { AxiosResponseWrapper } from './responseWrapper';

/**
 * Authenticated request function (replaces services/auth.ts authenticatedFetch())
 * 
 * This function uses the Axios instance which already has authentication interceptors.
 * 
 * @param url - Request URL
 * @param options - Request options
 * @returns Promise resolving to Response-like object
 */
export const axiosAuthenticatedRequest = async (
  url: string,
  options: AxiosRequestOptions = {}
): Promise<AxiosResponseWrapper> => {
  console.log('[AXIOS_AUTH_REQUEST] axiosAuthenticatedRequest called:', { url, method: options.method || 'GET' });
  
  // Authenticated requests always use the queue by default
  const {
    useQueue = true,
    useCache = true,
    cacheTTL,
    priority = 0,
    skipCache = false,
    invalidateCache,
    method = 'GET',
    ...axiosConfig
  } = options;

  console.log('[AXIOS_AUTH_REQUEST] Options:', { 
    useQueue, 
    useCache, 
    priority, 
    skipCache,
    method,
  });

  // Invalidate cache if requested
  if (invalidateCache) {
    console.log('[AXIOS_AUTH_REQUEST] Invalidating cache pattern:', invalidateCache);
    clearCacheByPattern(invalidateCache);
  }

  // Generate cache key
  const cacheKey = generateCacheKey(url, method, axiosConfig.params, axiosConfig.data);

  // Check cache for GET requests
  if (useCache && method.toUpperCase() === 'GET' && !skipCache) {
    console.log('[AXIOS_AUTH_REQUEST] Checking cache for:', cacheKey);
    const cached = getCachedResponse(cacheKey);
    if (cached !== null) {
      console.log('[AXIOS_AUTH_REQUEST] Cache hit for:', cacheKey);
      // Return cached response
      const mockResponse: AxiosResponse = {
        data: cached,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      return new AxiosResponseWrapper(mockResponse);
    }
    console.log('[AXIOS_AUTH_REQUEST] Cache miss for:', cacheKey);
  }

  // Execute request function
  const executeRequest = async (): Promise<AxiosResponseWrapper> => {
    console.log('[AXIOS_AUTH_REQUEST] executeRequest starting for:', url);
    try {
      console.log('[AXIOS_AUTH_REQUEST] Making authenticated Axios request to:', url);
      
      // Determine timeout - use longer timeout for slow endpoints like count queries
      const isSlowEndpoint = url.includes('/count/') || url.includes('ordering=-employees');
      const requestTimeout = axiosConfig.timeout || (isSlowEndpoint ? 120000 : undefined);
      
      // Make authenticated Axios request (interceptors handle auth)
      const response = await axiosInstance.request({
        url,
        method: method as any,
        timeout: requestTimeout,
        ...axiosConfig,
      });

      console.log('[AXIOS_AUTH_REQUEST] Axios response received:', {
        url,
        status: response.status,
        statusText: response.statusText,
      });

      // Cache successful GET responses
      if (useCache && method.toUpperCase() === 'GET' && response.status >= 200 && response.status < 300) {
        console.log('[AXIOS_AUTH_REQUEST] Caching response for:', cacheKey);
        setCachedResponse(cacheKey, response.data, cacheTTL);
      }

      // Invalidate cache for write operations
      if (method.toUpperCase() !== 'GET') {
        // Clear cache entries matching the URL pattern
        const urlPattern = new RegExp(url.split('?')[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        clearCacheByPattern(urlPattern);
      }

      console.log('[AXIOS_AUTH_REQUEST] Returning wrapped response for:', url);
      return new AxiosResponseWrapper(response);
    } catch (error) {
      console.error('[AXIOS_AUTH_REQUEST] Request error for:', url, error);
      // Convert AxiosError to standard Error
      const axiosError = error as AxiosError;
      const parsedError = await convertAxiosError(axiosError, 'Request failed');
      throw new Error(formatErrorMessage(parsedError, 'Request failed'));
    }
  };

  // Use queue if enabled
  if (useQueue && isQueueEnabled()) {
    console.log('[AXIOS_AUTH_REQUEST] Using queue for:', url);
    const result = await enqueueRequest(executeRequest, priority);
    console.log('[AXIOS_AUTH_REQUEST] Queue returned result for:', url);
    return result;
  }

  // Execute directly
  console.log('[AXIOS_AUTH_REQUEST] Executing directly (no queue) for:', url);
  const result = await executeRequest();
  console.log('[AXIOS_AUTH_REQUEST] Direct execution complete for:', url);
  return result;
};

