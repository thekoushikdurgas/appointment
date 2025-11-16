/**
 * Axios Request Wrapper
 * 
 * Unified request wrapper combining Axios, queue, and cache.
 * Provides drop-in replacements for the existing request() and authenticatedFetch() functions.
 */

import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import axiosInstance, { convertAxiosError } from './axiosClient';
import { enqueueRequest, isQueueEnabled } from '@utils/requestQueue';
import {
  getCachedResponse,
  setCachedResponse,
  generateCacheKey,
  clearCacheEntry,
  clearCacheByPattern,
} from './apiCache';
import { parseApiError, parseExceptionError, formatErrorMessage, ParsedError } from './errorHandler';

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

/**
 * Response wrapper to match fetch Response interface
 * Implements a subset of Response interface that's actually used in the codebase
 */
class AxiosResponseWrapper {
  private axiosResponse: AxiosResponse;
  private _bodyUsed: boolean = false;

  constructor(axiosResponse: AxiosResponse) {
    this.axiosResponse = axiosResponse;
  }

  get ok(): boolean {
    return this.axiosResponse.status >= 200 && this.axiosResponse.status < 300;
  }

  get status(): number {
    return this.axiosResponse.status;
  }

  get statusText(): string {
    return this.axiosResponse.statusText || '';
  }

  get headers(): Headers {
    const headers = new Headers();
    Object.entries(this.axiosResponse.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, String(v)));
      }
    });
    return headers;
  }

  get body(): ReadableStream<Uint8Array> | null {
    // Axios doesn't provide a ReadableStream, return null
    return null;
  }

  get bodyUsed(): boolean {
    return this._bodyUsed;
  }

  // Additional Response properties for compatibility
  get redirected(): boolean {
    return false;
  }

  get type(): ResponseType {
    return 'default';
  }

  get url(): string {
    return this.axiosResponse.config.url || '';
  }

  async bytes(): Promise<Uint8Array> {
    if (this._bodyUsed) {
      throw new Error('Body has already been read');
    }
    this._bodyUsed = true;
    const text = typeof this.axiosResponse.data === 'string'
      ? this.axiosResponse.data
      : JSON.stringify(this.axiosResponse.data);
    return new TextEncoder().encode(text);
  }

  async formData(): Promise<FormData> {
    if (this._bodyUsed) {
      throw new Error('Body has already been read');
    }
    this._bodyUsed = true;
    const formData = new FormData();
    if (typeof this.axiosResponse.data === 'object' && this.axiosResponse.data !== null) {
      Object.entries(this.axiosResponse.data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }
    return formData;
  }

  async json(): Promise<any> {
    if (this._bodyUsed) {
      throw new Error('Body has already been read');
    }
    this._bodyUsed = true;
    return this.axiosResponse.data;
  }

  async text(): Promise<string> {
    if (this._bodyUsed) {
      throw new Error('Body has already been read');
    }
    this._bodyUsed = true;
    
    // If data is already a string, return it
    if (typeof this.axiosResponse.data === 'string') {
      return this.axiosResponse.data;
    }
    
    // If data is a Blob, read it as text
    if (this.axiosResponse.data instanceof Blob) {
      return await this.axiosResponse.data.text();
    }
    
    // Otherwise, stringify JSON data
    return JSON.stringify(this.axiosResponse.data);
  }

  async blob(): Promise<Blob> {
    if (this._bodyUsed) {
      throw new Error('Body has already been read');
    }
    this._bodyUsed = true;
    
    // If data is already a Blob (from responseType: 'blob'), return it directly
    if (this.axiosResponse.data instanceof Blob) {
      return this.axiosResponse.data;
    }
    
    // If data is a string, create a blob from it
    if (typeof this.axiosResponse.data === 'string') {
      return new Blob([this.axiosResponse.data], { type: 'text/plain' });
    }
    
    // Otherwise, create a blob from JSON stringified data
    return new Blob([JSON.stringify(this.axiosResponse.data)], { type: 'application/json' });
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    if (this._bodyUsed) {
      throw new Error('Body has already been read');
    }
    this._bodyUsed = true;
    const text = typeof this.axiosResponse.data === 'string'
      ? this.axiosResponse.data
      : JSON.stringify(this.axiosResponse.data);
    return new TextEncoder().encode(text).buffer;
  }

  clone(): AxiosResponseWrapper {
    // Create a new wrapper with the same data
    return new AxiosResponseWrapper(this.axiosResponse);
  }
}

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

