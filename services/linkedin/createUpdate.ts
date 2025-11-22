/**
 * LinkedIn Service Create/Update Operations
 * 
 * Functions for creating or updating contacts and companies by LinkedIn URL.
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
  LinkedInCreateUpdateRequest,
  LinkedInCreateUpdateResponse,
} from './types';

/**
 * Create or update contacts and companies based on LinkedIn URL
 * 
 * If a record with the LinkedIn URL already exists, it will be updated. 
 * Otherwise, new records will be created.
 * 
 * **Endpoint:** POST /api/v2/linkedin/
 * 
 * **Authentication:** Required (JWT Bearer token)
 * 
 * **Request Body:**
 * - `url` (string, required): LinkedIn URL. Will be set as `linkedin_url` in the appropriate metadata table.
 * - `contact_data` (object, optional): Contact fields to create/update
 * - `contact_metadata` (object, optional): Contact metadata fields. The `linkedin_url` will automatically be set to the `url` value.
 * - `company_data` (object, optional): Company fields to create/update
 * - `company_metadata` (object, optional): Company metadata fields. The `linkedin_url` will automatically be set to the `url` value.
 * 
 * **Response:**
 * - `created` (boolean): Whether new records were created
 * - `updated` (boolean): Whether existing records were updated
 * - `contacts` (array): List of created/updated contacts with their metadata and related company data
 * - `companies` (array): List of created/updated companies with their metadata and related contacts
 * 
 * **Error Handling:**
 * - 400 Bad Request: LinkedIn URL is empty or invalid, or request body is malformed
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 500 Internal Server Error: Server error during create/update operation
 * 
 * @param data - LinkedInCreateUpdateRequest with URL and optional data
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to ServiceResponse with LinkedInCreateUpdateResponse
 * 
 * @example
 * ```typescript
 * const result = await createOrUpdateByLinkedInUrl({
 *   url: 'https://www.linkedin.com/in/jane-smith',
 *   contact_data: {
 *     first_name: 'Jane',
 *     last_name: 'Smith',
 *     email: 'jane.smith@example.com',
 *     title: 'Product Manager'
 *   },
 *   contact_metadata: {
 *     city: 'New York',
 *     state: 'NY',
 *     country: 'US'
 *   }
 * });
 * 
 * if (result.success && result.data) {
 *   console.log('Created:', result.data.created);
 *   console.log('Updated:', result.data.updated);
 * } else {
 *   console.error('Error:', result.message);
 * }
 * ```
 */
export const createOrUpdateByLinkedInUrl = async (
  data: LinkedInCreateUpdateRequest,
  requestId?: string
): Promise<ServiceResponse<LinkedInCreateUpdateResponse>> => {
  try {
    // Validate input
    if (!data.url || typeof data.url !== 'string' || data.url.trim() === '') {
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

    // Prepare request body (trim URL)
    const requestBody: LinkedInCreateUpdateRequest = {
      ...data,
      url: data.url.trim(),
    };

    // Make API request
    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v2/linkedin/`,
      {
        method: 'POST',
        headers,
        useCache: false,
        data: requestBody,
      }
    );

    if (!response.ok) {
      if (response.status === 400) {
        const error = await parseApiError(response, 'Invalid request data');
        const errorMessage = error.message?.toLowerCase() || '';
        let userMessage = 'Invalid request data';
        
        if (errorMessage.includes('url') && (errorMessage.includes('empty') || errorMessage.includes('required'))) {
          userMessage = 'LinkedIn URL is required';
        } else if (errorMessage.includes('url') && (errorMessage.includes('invalid') || errorMessage.includes('format'))) {
          userMessage = 'Please enter a valid LinkedIn URL format';
        } else if (errorMessage.includes('malformed') || errorMessage.includes('format')) {
          userMessage = 'Invalid data format. Please check all fields and try again.';
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
          message: 'A server error occurred while saving. Please try again in a moment.',
          error,
        };
      }

      const error = await parseApiError(response, 'Failed to create/update by LinkedIn URL');
      return {
        success: false,
        message: formatErrorMessage(error, 'Unable to save. Please check your connection and try again.'),
        error,
      };
    }

    const responseData: LinkedInCreateUpdateResponse = await response.json();

    return {
      success: true,
      data: responseData,
      message: responseData.created
        ? 'Records created successfully'
        : responseData.updated
        ? 'Records updated successfully'
        : 'Operation completed successfully',
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to create/update by LinkedIn URL');
    console.error('[LINKEDIN] Create/Update error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });

    let userMessage = 'Failed to create/update by LinkedIn URL';
    if (parsedError.isNetworkError) {
      userMessage = 'Network error: Unable to connect to the server. Please check your internet connection.';
    } else if (parsedError.isTimeoutError) {
      userMessage = 'Request timed out. Please try again.';
    } else {
      userMessage = formatErrorMessage(parsedError, 'An unexpected error occurred while saving. Please try again.');
    }

    return {
      success: false,
      message: userMessage,
      error: parsedError,
    };
  }
};

