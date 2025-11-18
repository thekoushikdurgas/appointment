/**
 * Request Utilities
 * 
 * Unified request wrapper combining Axios, queue, and cache.
 * Provides drop-in replacements for the existing request() and authenticatedFetch() functions.
 */

// Re-export all types
export type {
  AxiosRequestOptions,
} from './types';

// Re-export response wrapper
export {
  AxiosResponseWrapper,
} from './responseWrapper';

// Re-export request functions
export {
  axiosRequest,
  axiosRequestJson,
  axiosRequestWithErrorHandling,
} from './axiosRequest';

// Re-export authenticated request functions
export {
  axiosAuthenticatedRequest,
} from './authenticatedRequest';

