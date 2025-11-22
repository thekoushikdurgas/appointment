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
  const timestamp = new Date().toISOString();
  console.log(`[LINKEDIN_SERVICE] searchByLinkedInUrl called at ${timestamp}`, {
    url,
    urlType: typeof url,
    urlLength: url?.length,
    urlTrimmed: url?.trim(),
    requestId,
  });

  try {
    // Validate input
    console.log('[LINKEDIN_SERVICE] Validating input URL');
    if (!url || typeof url !== 'string' || url.trim() === '') {
      console.warn('[LINKEDIN_SERVICE] Input validation failed: URL is empty or invalid', {
        url,
        urlType: typeof url,
        isEmpty: !url || url.trim() === '',
      });
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

    const trimmedUrl = url.trim();
    console.log('[LINKEDIN_SERVICE] Input validation passed', {
      originalUrl: url,
      trimmedUrl,
    });

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }
    console.log('[LINKEDIN_SERVICE] Request headers prepared:', {
      headers: Object.keys(headers),
      hasRequestId: !!requestId,
    });

    // Prepare request body
    const requestBody: LinkedInSearchRequest = {
      url: trimmedUrl,
    };
    console.log('[LINKEDIN_SERVICE] Request body prepared:', {
      requestBody: JSON.stringify(requestBody),
    });

    // Make API request
    // Note: API docs specify GET with body, but we use POST as it's more standard for requests with bodies
    // If the API strictly requires GET, we may need to use query parameters instead
    const apiUrl = `${API_BASE_URL}/api/v2/linkedin/`;
    const requestOptions = {
      method: 'POST' as const,
      headers,
      useCache: false,
      data: requestBody,
    };

    console.log('[LINKEDIN_SERVICE] Making API request:', {
      url: apiUrl,
      method: requestOptions.method,
      baseUrl: API_BASE_URL,
      endpoint: '/api/v2/linkedin/',
      requestBody: JSON.stringify(requestBody),
      useCache: requestOptions.useCache,
      note: 'API docs specify GET with body, but using POST as it\'s more standard',
    });

    const requestStartTime = Date.now();
    const response = await axiosAuthenticatedRequest(apiUrl, requestOptions);
    const requestDuration = Date.now() - requestStartTime;

    console.log(`[LINKEDIN_SERVICE] API request completed in ${requestDuration}ms`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: response.headers ? Object.keys(response.headers) : null,
    });

    if (!response.ok) {
      console.warn('[LINKEDIN_SERVICE] API request returned non-OK status:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (response.status === 400) {
        console.log('[LINKEDIN_SERVICE] Parsing 400 Bad Request error');
        const error = await parseApiError(response, 'Invalid LinkedIn URL');
        const errorMessage = error.message?.toLowerCase() || '';
        console.log('[LINKEDIN_SERVICE] Parsed error:', {
          errorMessage,
          errorStructure: {
            message: error.message,
            statusCode: error.statusCode,
            isNetworkError: error.isNetworkError,
            isTimeoutError: error.isTimeoutError,
          },
        });

        let userMessage = 'Invalid LinkedIn URL format';
        
        if (errorMessage.includes('empty')) {
          userMessage = 'LinkedIn URL cannot be empty';
        } else if (errorMessage.includes('invalid') || errorMessage.includes('format')) {
          userMessage = 'Please enter a valid LinkedIn URL (e.g., https://www.linkedin.com/in/username or https://www.linkedin.com/company/company-name)';
        }
        
        console.log('[LINKEDIN_SERVICE] Returning 400 error response:', { userMessage });
        return {
          success: false,
          message: userMessage,
          error,
        };
      }

      if (response.status === 401) {
        console.log('[LINKEDIN_SERVICE] Parsing 401 Unauthorized error');
        const error = await parseApiError(response, 'Authentication required');
        console.log('[LINKEDIN_SERVICE] Returning 401 error response');
        return {
          success: false,
          message: 'Your session has expired. Please log in again to continue.',
          error,
        };
      }

      if (response.status === 500) {
        console.log('[LINKEDIN_SERVICE] Parsing 500 Internal Server Error');
        const error = await parseApiError(response, 'Server error');
        console.log('[LINKEDIN_SERVICE] Returning 500 error response');
        return {
          success: false,
          message: 'A server error occurred while searching. Please try again in a moment.',
          error,
        };
      }

      console.log('[LINKEDIN_SERVICE] Parsing generic error for status:', response.status);
      const error = await parseApiError(response, 'Failed to search by LinkedIn URL');
      console.log('[LINKEDIN_SERVICE] Returning generic error response:', {
        status: response.status,
        errorMessage: error.message,
      });
      return {
        success: false,
        message: formatErrorMessage(error, 'Unable to search LinkedIn URL. Please check your connection and try again.'),
        error,
      };
    }

    console.log('[LINKEDIN_SERVICE] Response OK, parsing JSON data');
    const data: LinkedInSearchResponse = await response.json();
    
    // Calculate totals from arrays if missing from API response
    const contactsLength = data.contacts?.length || 0;
    const companiesLength = data.companies?.length || 0;
    const totalContacts = data.total_contacts !== undefined ? data.total_contacts : contactsLength;
    const totalCompanies = data.total_companies !== undefined ? data.total_companies : companiesLength;
    
    // Ensure totals are set in the data object
    const normalizedData: LinkedInSearchResponse = {
      ...data,
      total_contacts: totalContacts,
      total_companies: totalCompanies,
    };
    
    console.log('[LINKEDIN_SERVICE] Response data parsed successfully:', {
      total_contacts: normalizedData.total_contacts,
      total_companies: normalizedData.total_companies,
      contactsLength,
      companiesLength,
      totalsCalculated: data.total_contacts === undefined || data.total_companies === undefined,
      dataPreview: JSON.stringify(normalizedData, null, 2).substring(0, 1000),
    });

    const serviceResponse: ServiceResponse<LinkedInSearchResponse> = {
      success: true,
      data: normalizedData,
      message: 'Search completed successfully',
    };

    console.log('[LINKEDIN_SERVICE] Returning successful ServiceResponse:', {
      success: serviceResponse.success,
      hasData: !!serviceResponse.data,
      message: serviceResponse.message,
      dataSummary: {
        total_contacts: serviceResponse.data?.total_contacts,
        total_companies: serviceResponse.data?.total_companies,
      },
    });

    return serviceResponse;
  } catch (error) {
    console.error('[LINKEDIN_SERVICE] Exception caught in searchByLinkedInUrl:', {
      error,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      url,
    });

    const parsedError = parseExceptionError(error, 'Failed to search by LinkedIn URL');
    console.error('[LINKEDIN_SERVICE] Parsed error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
      fullError: parsedError,
    });

    let userMessage = 'Failed to search by LinkedIn URL';
    if (parsedError.isNetworkError) {
      userMessage = 'Network error: Unable to connect to the server. Please check your internet connection.';
    } else if (parsedError.isTimeoutError) {
      userMessage = 'Request timed out. Please try again.';
    } else {
      userMessage = formatErrorMessage(parsedError, 'An unexpected error occurred while searching. Please try again.');
    }

    console.log('[LINKEDIN_SERVICE] Returning error ServiceResponse:', {
      success: false,
      message: userMessage,
      error: parsedError,
    });

    return {
      success: false,
      message: userMessage,
      error: parsedError,
    };
  }
};

