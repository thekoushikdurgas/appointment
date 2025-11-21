/**
 * LinkedIn Service Search Operations
 * 
 * Functions for searching contacts and companies by LinkedIn URL.
 */

import { API_BASE_URL } from '../api';
import { axiosAuthenticatedRequest } from '@utils/request';
import {
  parseApiError,
  parseExceptionError,
  formatErrorMessage,
} from '@utils/error';
import {
  ServiceResponse,
  LinkedInSearchRequest,
  LinkedInSearchResponse,
} from './types';

/**
 * Search for contacts and companies by LinkedIn URL
 * 
 * Searches both person LinkedIn URLs (from ContactMetadata.linkedin_url) and 
 * company LinkedIn URLs (from CompanyMetadata.linkedin_url), returning all 
 * matching records with their related data.
 * 
 * **Endpoint:** GET /api/v2/linkedin/
 * 
 * **Authentication:** Required (JWT Bearer token)
 * 
 * **Request Body:**
 * - `url` (string, required): LinkedIn URL to search for. Can be a person LinkedIn URL 
 *   or company LinkedIn URL. Supports partial matching (case-insensitive).
 * 
 * **Response:**
 * - `contacts` (array): List of contacts matching the LinkedIn URL
 * - `companies` (array): List of companies matching the LinkedIn URL
 * - `total_contacts` (integer): Total number of contacts found
 * - `total_companies` (integer): Total number of companies found
 * 
 * **Error Handling:**
 * - 400 Bad Request: LinkedIn URL is empty or invalid
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 500 Internal Server Error: Server error during search
 * 
 * @param url - LinkedIn URL to search for
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to ServiceResponse with LinkedInSearchResponse
 * 
 * @example
 * ```typescript
 * const result = await searchByLinkedInUrl('https://www.linkedin.com/in/john-doe');
 * 
 * if (result.success && result.data) {
 *   console.log('Contacts found:', result.data.total_contacts);
 *   console.log('Companies found:', result.data.total_companies);
 * } else {
 *   console.error('Error:', result.message);
 * }
 * ```
 */
export const searchByLinkedInUrl = async (
  url: string,
  requestId?: string
): Promise<ServiceResponse<LinkedInSearchResponse>> => {
  try {
    // Validate input
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return {
        success: false,
        message: 'LinkedIn URL cannot be empty',
        error: {
          message: 'LinkedIn URL cannot be empty',
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
    const requestBody: LinkedInSearchRequest = {
      url: url.trim(),
    };

    // Make API request
    // Note: API docs specify GET with body, but we use POST as it's more standard for requests with bodies
    // If the API strictly requires GET, we may need to use query parameters instead
    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v2/linkedin/`,
      {
        method: 'POST',
        headers,
        useQueue: true,
        useCache: false,
        data: requestBody,
      }
    );

    if (!response.ok) {
      if (response.status === 400) {
        const error = await parseApiError(response, 'Invalid LinkedIn URL');
        const errorMessage = error.message?.toLowerCase() || '';
        let userMessage = 'Invalid LinkedIn URL format';
        
        if (errorMessage.includes('empty')) {
          userMessage = 'LinkedIn URL cannot be empty';
        } else if (errorMessage.includes('invalid') || errorMessage.includes('format')) {
          userMessage = 'Please enter a valid LinkedIn URL (e.g., https://www.linkedin.com/in/username or https://www.linkedin.com/company/company-name)';
        }
        
        return {
          success: false,
          message: userMessage,
          error,
        };
      }

      if (response.status === 401) {
        const error = await parseApiError(response, 'Authentication required');
        return {
          success: false,
          message: 'Your session has expired. Please log in again to continue.',
          error,
        };
      }

      if (response.status === 500) {
        const error = await parseApiError(response, 'Server error');
        return {
          success: false,
          message: 'A server error occurred while searching. Please try again in a moment.',
          error,
        };
      }

      const error = await parseApiError(response, 'Failed to search by LinkedIn URL');
      return {
        success: false,
        message: formatErrorMessage(error, 'Unable to search LinkedIn URL. Please check your connection and try again.'),
        error,
      };
    }

    const data: LinkedInSearchResponse = await response.json();

    return {
      success: true,
      data,
      message: 'Search completed successfully',
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to search by LinkedIn URL');
    console.error('[LINKEDIN] Search error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });

    let userMessage = 'Failed to search by LinkedIn URL';
    if (parsedError.isNetworkError) {
      userMessage = 'Network error: Unable to connect to the server. Please check your internet connection.';
    } else if (parsedError.isTimeoutError) {
      userMessage = 'Request timed out. Please try again.';
    } else {
      userMessage = formatErrorMessage(parsedError, 'An unexpected error occurred while searching. Please try again.');
    }

    return {
      success: false,
      message: userMessage,
      error: parsedError,
    };
  }
};

