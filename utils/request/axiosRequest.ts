/**
 * Axios Request
 * 
 * Main request function for making HTTP requests with queue and cache support
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
import { parseApiError, parseExceptionError, formatErrorMessage } from '@utils/error';
import type { ParsedError } from '@utils/error';
import type { AxiosRequestOptions } from './types';
import { AxiosResponseWrapper } from './responseWrapper';

/**
 * Main request function (replaces utils/request.ts request())
 * 
 * @param url - Request URL
 * @param options - Request options
 * @returns Promise resolving to Response-like object
 */
export const axiosRequest = async (
  url: string,
  options: AxiosRequestOptions = {}
): Promise<AxiosResponseWrapper> => {
  console.log('[AXIOS_REQUEST] axiosRequest called:', { url, method: options.method || 'GET' });
  
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

  console.log('[AXIOS_REQUEST] Options:', { 
    useQueue, 
    useCache, 
    priority, 
    skipCache,
    method,
  });

  // Invalidate cache if requested
  if (invalidateCache) {
    console.log('[AXIOS_REQUEST] Invalidating cache pattern:', invalidateCache);
    clearCacheByPattern(invalidateCache);
  }

  // Generate cache key
  const cacheKey = generateCacheKey(url, method, axiosConfig.params, axiosConfig.data);

  // Check cache for GET requests
  if (useCache && method.toUpperCase() === 'GET' && !skipCache) {
    console.log('[AXIOS_REQUEST] Checking cache for:', cacheKey);
    const cached = getCachedResponse(cacheKey);
    if (cached !== null) {
      console.log('[AXIOS_REQUEST] Cache hit for:', cacheKey);
      // Return cached response as AxiosResponse-like object
      const mockResponse: AxiosResponse = {
        data: cached,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      return new AxiosResponseWrapper(mockResponse);
    }
    console.log('[AXIOS_REQUEST] Cache miss for:', cacheKey);
  }

  // Execute request function
  const executeRequest = async (): Promise<AxiosResponseWrapper> => {
    console.log('[AXIOS_REQUEST] executeRequest starting for:', url);
    try {
      console.log('[AXIOS_REQUEST] Making Axios request to:', url);
      
      // Determine timeout - use longer timeout for slow endpoints like count queries
      const isSlowEndpoint = url.includes('/count/') || url.includes('ordering=-employees');
      const requestTimeout = axiosConfig.timeout || (isSlowEndpoint ? 120000 : undefined);
      
      // Make Axios request
      const response = await axiosInstance.request({
        url,
        method: method as any,
        timeout: requestTimeout,
        ...axiosConfig,
      });

      console.log('[AXIOS_REQUEST] Axios response received:', {
        url,
        status: response.status,
        statusText: response.statusText,
      });

      // Cache successful GET responses
      if (useCache && method.toUpperCase() === 'GET' && response.status >= 200 && response.status < 300) {
        console.log('[AXIOS_REQUEST] Caching response for:', cacheKey);
        setCachedResponse(cacheKey, response.data, cacheTTL);
      }

      // Invalidate cache for write operations
      if (method.toUpperCase() !== 'GET') {
        // Clear cache entries matching the URL pattern
        const urlPattern = new RegExp(url.split('?')[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        clearCacheByPattern(urlPattern);
      }

      console.log('[AXIOS_REQUEST] Returning wrapped response for:', url);
      return new AxiosResponseWrapper(response);
    } catch (error) {
      console.error('[AXIOS_REQUEST] Request error for:', url, error);
      // Convert AxiosError to standard Error
      const axiosError = error as AxiosError;
      const parsedError = await convertAxiosError(axiosError, 'Request failed');
      throw new Error(formatErrorMessage(parsedError, 'Request failed'));
    }
  };

  // Use queue if enabled
  if (useQueue && isQueueEnabled()) {
    console.log('[AXIOS_REQUEST] Using queue for:', url);
    const result = await enqueueRequest(executeRequest, priority);
    console.log('[AXIOS_REQUEST] Queue returned result for:', url);
    return result;
  }

  // Execute directly
  console.log('[AXIOS_REQUEST] Executing directly (no queue) for:', url);
  const result = await executeRequest();
  console.log('[AXIOS_REQUEST] Direct execution complete for:', url);
  return result;
};

/**
 * Request with automatic JSON parsing (similar to utils/request.ts requestJson())
 */
export const axiosRequestJson = async <T = any>(
  url: string,
  options: AxiosRequestOptions = {}
): Promise<T> => {
  const response = await axiosRequest(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await parseApiError(response, 'Request failed');
    throw error;
  }

  return response.json();
};

/**
 * Request with automatic error handling (similar to utils/request.ts requestWithErrorHandling())
 */
export const axiosRequestWithErrorHandling = async <T = any>(
  url: string,
  options: AxiosRequestOptions = {},
  errorContext?: string
): Promise<{ success: boolean; data?: T; error?: ParsedError }> => {
  try {
    const response = await axiosRequest(url, options);

    if (!response.ok) {
      const error = await parseApiError(response, errorContext || 'Request failed');
      return {
        success: false,
        error,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, errorContext || 'Request failed');
    return {
      success: false,
      error: parsedError,
    };
  }
};

