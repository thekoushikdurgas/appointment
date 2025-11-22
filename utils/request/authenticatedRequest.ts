/**
 * Authenticated Request
 * 
 * Authenticated request function for making HTTP requests with authentication
 */

import type { AxiosResponse, AxiosError } from 'axios';
import axiosInstance, { convertAxiosError } from '@utils/axiosClient';
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
import { getApiResult, setApiResult } from '@utils/apiStorage';

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
  const timestamp = new Date().toISOString();
  const requestData = options.data;
  const requestDataPreview = requestData 
    ? (typeof requestData === 'string' 
        ? requestData.substring(0, 200) 
        : JSON.stringify(requestData, null, 2).substring(0, 200))
    : null;
  
  console.log(`[AXIOS_AUTH_REQUEST] axiosAuthenticatedRequest called at ${timestamp}:`, { 
    url, 
    method: options.method || 'GET',
    hasData: !!requestData,
    dataPreview: requestDataPreview,
  });
  
  const {
    useCache = true,
    cacheTTL,
    skipCache = false,
    invalidateCache,
    method = 'GET',
    ...axiosConfig
  } = options;

  console.log('[AXIOS_AUTH_REQUEST] Options:', { 
    useCache, 
    skipCache,
    method,
    cacheTTL,
    hasInvalidateCache: !!invalidateCache,
    axiosConfigKeys: Object.keys(axiosConfig),
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
    
    // Check fallback storage if cache miss
    const fallbackData = getApiResult(cacheKey);
    if (fallbackData !== null) {
      console.log('[AXIOS_AUTH_REQUEST] Fallback storage hit for:', cacheKey);
      // Restore to cache
      setCachedResponse(cacheKey, fallbackData, cacheTTL);
      const mockResponse: AxiosResponse = {
        data: fallbackData,
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
    const timestamp = new Date().toISOString();
    console.log(`[AXIOS_AUTH_REQUEST] executeRequest starting at ${timestamp} for:`, url);
    
    try {
      // Log request details
      const requestData = axiosConfig.data;
      const requestDataPreview = requestData 
        ? (typeof requestData === 'string' 
            ? requestData.substring(0, 500) 
            : JSON.stringify(requestData, null, 2).substring(0, 500))
        : null;
      
      console.log('[AXIOS_AUTH_REQUEST] Making authenticated Axios request:', {
        url,
        method,
        headers: axiosConfig.headers ? Object.keys(axiosConfig.headers) : [],
        hasData: !!requestData,
        dataPreview: requestDataPreview,
        dataType: requestData ? typeof requestData : 'none',
        params: axiosConfig.params ? JSON.stringify(axiosConfig.params).substring(0, 200) : null,
      });
      
      // Determine timeout - use longer timeout for slow endpoints like count queries
      const isSlowEndpoint = url.includes('/count/') || url.includes('ordering=-employees');
      const requestTimeout = axiosConfig.timeout || (isSlowEndpoint ? 120000 : undefined);
      
      if (requestTimeout) {
        console.log('[AXIOS_AUTH_REQUEST] Using custom timeout:', requestTimeout, 'ms');
      }
      
      const requestStartTime = Date.now();
      
      // Make authenticated Axios request (interceptors handle auth)
      const response = await axiosInstance.request({
        url,
        method: method as any,
        timeout: requestTimeout,
        ...axiosConfig,
      });

      const requestDuration = Date.now() - requestStartTime;
      
      // Log response data preview
      const responseDataPreview = response.data 
        ? (typeof response.data === 'string' 
            ? response.data.substring(0, 500) 
            : JSON.stringify(response.data, null, 2).substring(0, 500))
        : null;

      console.log(`[AXIOS_AUTH_REQUEST] Axios response received in ${requestDuration}ms:`, {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers ? Object.keys(response.headers) : [],
        dataSize: response.data ? (typeof response.data === 'string' ? response.data.length : JSON.stringify(response.data).length) : 0,
        dataPreview: responseDataPreview,
        dataType: response.data ? typeof response.data : 'none',
      });

      // Cache successful GET responses
      if (useCache && method.toUpperCase() === 'GET' && response.status >= 200 && response.status < 300) {
        console.log('[AXIOS_AUTH_REQUEST] Caching response for:', cacheKey);
        setCachedResponse(cacheKey, response.data, cacheTTL);
        // Also save to fallback storage
        setApiResult(cacheKey, response.data, cacheTTL);
      }

      // Invalidate cache for write operations
      if (method.toUpperCase() !== 'GET') {
        // Clear cache entries matching the URL pattern
        const urlPattern = new RegExp(url.split('?')[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        console.log('[AXIOS_AUTH_REQUEST] Invalidating cache for write operation:', urlPattern);
        clearCacheByPattern(urlPattern);
      }

      console.log('[AXIOS_AUTH_REQUEST] Returning wrapped response for:', url);
      return new AxiosResponseWrapper(response);
    } catch (error) {
      console.error('[AXIOS_AUTH_REQUEST] Request error for:', url, {
        error,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      
      // Convert AxiosError to standard Error
      const axiosError = error as AxiosError;
      
      // Log detailed error information if it's an AxiosError
      if (axiosError.isAxiosError) {
        console.error('[AXIOS_AUTH_REQUEST] AxiosError details:', {
          message: axiosError.message,
          code: axiosError.code,
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          responseHeaders: axiosError.response?.headers ? Object.keys(axiosError.response.headers) : [],
          responseData: axiosError.response?.data 
            ? (typeof axiosError.response.data === 'string' 
                ? axiosError.response.data.substring(0, 500) 
                : JSON.stringify(axiosError.response.data, null, 2).substring(0, 500))
            : null,
          requestUrl: axiosError.config?.url,
          requestMethod: axiosError.config?.method,
          requestData: axiosError.config?.data 
            ? (typeof axiosError.config.data === 'string' 
                ? axiosError.config.data.substring(0, 500) 
                : JSON.stringify(axiosError.config.data, null, 2).substring(0, 500))
            : null,
        });
      }
      
      const parsedError = await convertAxiosError(axiosError, 'Request failed');
      console.error('[AXIOS_AUTH_REQUEST] Parsed error:', {
        message: parsedError.message,
        statusCode: parsedError.statusCode,
        isNetworkError: parsedError.isNetworkError,
        isTimeoutError: parsedError.isTimeoutError,
        fullError: parsedError,
      });
      
      // Try to retrieve from fallback storage on network errors
      if (parsedError.isNetworkError && method.toUpperCase() === 'GET') {
        const fallbackData = getApiResult(cacheKey);
        if (fallbackData !== null) {
          console.log('[AXIOS_AUTH_REQUEST] Using fallback storage data for:', cacheKey);
          const mockResponse: AxiosResponse = {
            data: fallbackData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          };
          return new AxiosResponseWrapper(mockResponse);
        }
      }
      
      throw new Error(formatErrorMessage(parsedError, 'Request failed'));
    }
  };

  // Execute request directly (parallel execution)
  console.log('[AXIOS_AUTH_REQUEST] Executing request for:', url);
  const result = await executeRequest();
  console.log('[AXIOS_AUTH_REQUEST] Request execution complete for:', url);
  return result;
};

