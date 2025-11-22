/**
 * Apollo Service Analyze Operations
 * 
 * Functions for analyzing Apollo.io URLs.
 */

import { API_BASE_URL } from '../api';
import { axiosAuthenticatedRequest } from '@utils/request';
import {
  parseApiError,
  parseExceptionError,
  formatErrorMessage,
} from '@utils/error';
import {
  ApolloUrlAnalysisResponse,
  ApolloAnalyzeRequest,
} from '@/types/apollo';
import { ServiceResponse } from './types';

/**
 * Validate Apollo.io URL
 * 
 * Checks if the URL is from the apollo.io domain.
 */
export const validateApolloUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return {
      valid: false,
      error: 'URL is required and must be a string',
    };
  }

  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('apollo.io')) {
      return {
        valid: false,
        error: 'URL must be from apollo.io domain',
      };
    }
    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }
};

/**
 * Analyze Apollo.io URL
 * 
 * Analyzes an Apollo.io URL and returns structured parameter breakdown.
 * This endpoint parses Apollo.io search URLs and extracts all query parameters,
 * categorizing them into logical groups.
 * 
 * **Endpoint:** POST /api/v2/apollo/analyze
 * 
 * **Authentication:** Required (JWT Bearer token)
 * 
 * **URL Validation:**
 * - URL must be from apollo.io domain
 * - URL must be a valid string
 * 
 * **Response includes:**
 * - URL structure breakdown (base URL, hash path, query string)
 * - Parameter categories (Pagination, Sorting, Person Filters, etc.)
 * - Statistics (total parameters, categories used)
 * - Raw parameters dictionary
 * 
 * **Error Handling:**
 * - 400 Bad Request: Invalid URL or not from Apollo.io domain
 * - 401 Unauthorized: Authentication required
 * - 500 Internal Server Error: Error occurred while analyzing URL
 * 
 * @param url - Apollo.io URL to analyze (must be from apollo.io domain)
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to ServiceResponse with ApolloUrlAnalysisResponse
 * 
 * @example
 * ```typescript
 * const result = await analyzeApolloUrl(
 *   'https://app.apollo.io/#/people?personTitles[]=CEO&personLocations[]=California'
 * );
 * 
 * if (result.success && result.data) {
 *   console.log('Categories:', result.data.categories);
 *   console.log('Statistics:', result.data.statistics);
 * } else {
 *   console.error('Error:', result.message);
 * }
 * ```
 */
export const analyzeApolloUrl = async (
  url: string,
  requestId?: string
): Promise<ServiceResponse<ApolloUrlAnalysisResponse>> => {
  try {
    // Validate URL
    const validation = validateApolloUrl(url);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || 'Invalid URL',
        error: {
          message: validation.error || 'Invalid URL',
          statusCode: 400,
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    // Prepare request body
    const requestBody: ApolloAnalyzeRequest = { url };

    // Make API request
    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v2/apollo/analyze`,
      {
        method: 'POST',
        headers,
        data: requestBody,
        useCache: false,
      }
    );

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to analyze Apollo URL');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to analyze Apollo URL'),
        error,
      };
    }

    const data: ApolloUrlAnalysisResponse = await response.json();

    return {
      success: true,
      message: 'Apollo URL analyzed successfully',
      data,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to analyze Apollo URL');
    console.error('[APOLLO] Analyze URL error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to analyze Apollo URL'),
      error: parsedError,
    };
  }
};

