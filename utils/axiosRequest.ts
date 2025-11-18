/**
 * Axios Request Wrapper
 * 
 * Unified request wrapper combining Axios, queue, and cache.
 * Provides drop-in replacements for the existing request() and authenticatedFetch() functions.
 * 
 * @deprecated This file is kept for backward compatibility.
 * Please import from '@utils/request' instead.
 */

// Re-export everything from the new request module
export * from './request/index';

