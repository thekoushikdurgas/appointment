/**
 * LinkedIn Service Export Operations
 * 
 * Functions for exporting contacts and companies by LinkedIn URLs.
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
  LinkedInExportRequest,
  LinkedInExportResponse,
} from './types';

/**
 * Create a CSV export of contacts and companies by multiple LinkedIn URLs
 * 
 * Accepts a list of LinkedIn URLs, searches for matching contacts and companies, 
 * and generates a combined CSV file containing all matches plus unmatched URLs 
 * marked as "not_found". The export is processed asynchronously in the background 
 * using Celery. Returns immediately with an export ID and job ID for tracking.
 * 
 * **Endpoint:** POST /api/v2/linkedin/export
 * 
 * **Authentication:** Required (JWT Bearer token)
 * 
 * **Request Body:**
 * - `urls` (array[string], required, min: 1): List of LinkedIn URLs to search and export. 
 *   At least one URL is required. Can be person LinkedIn URLs or company LinkedIn URLs.
 * 
 * **Response:**
 * - `export_id` (string, UUID): Unique identifier for the export
 * - `download_url` (string): Signed URL for downloading the CSV file (will be updated when export completes)
 * - `expires_at` (datetime, ISO 8601): Timestamp when the download URL expires (24 hours from creation)
 * - `contact_count` (integer): Number of contacts included in the export (initially 0, updated when export completes)
 * - `company_count` (integer): Number of companies included in the export (initially 0, updated when export completes)
 * - `status` (string): Export status. Possible values: `pending`, `processing`, `completed`, `failed`, `cancelled`
 * - `job_id` (string, optional): Celery task ID for tracking the background job
 * 
 * **Error Handling:**
 * - 400 Bad Request: At least one LinkedIn URL is required, or all URLs are empty/invalid
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 500 Internal Server Error: Server error during export creation
 * 
 * @param urls - Array of LinkedIn URLs to export (min: 1)
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to ServiceResponse with LinkedInExportResponse
 * 
 * @example
 * ```typescript
 * const result = await exportByLinkedInUrls([
 *   'https://www.linkedin.com/in/john-doe',
 *   'https://www.linkedin.com/company/tech-corp',
 *   'https://www.linkedin.com/in/jane-smith'
 * ]);
 * 
 * if (result.success && result.data) {
 *   console.log('Export ID:', result.data.export_id);
 *   console.log('Download URL:', result.data.download_url);
 *   console.log('Status:', result.data.status);
 * } else {
 *   console.error('Error:', result.message);
 * }
 * ```
 */
export const exportByLinkedInUrls = async (
  urls: string[],
  requestId?: string
): Promise<ServiceResponse<LinkedInExportResponse>> => {
  try {
    // Validate input
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return {
        success: false,
        message: 'At least one LinkedIn URL is required',
        error: {
          message: 'At least one LinkedIn URL is required',
          statusCode: 400,
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    // Filter out empty URLs and trim
    const validUrls = urls
      .map(url => (typeof url === 'string' ? url.trim() : ''))
      .filter(url => url !== '');

    if (validUrls.length === 0) {
      return {
        success: false,
        message: 'All LinkedIn URLs are empty or invalid',
        error: {
          message: 'All LinkedIn URLs are empty or invalid',
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
    const requestBody: LinkedInExportRequest = {
      urls: validUrls,
    };

    // Make API request
    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v2/linkedin/export`,
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
        const error = await parseApiError(response, 'Invalid export request');
        const errorMessage = error.message?.toLowerCase() || '';
        let userMessage = 'Invalid export request';
        
        if (errorMessage.includes('url') && (errorMessage.includes('empty') || errorMessage.includes('required'))) {
          userMessage = 'At least one LinkedIn URL is required for export';
        } else if (errorMessage.includes('url') && (errorMessage.includes('invalid') || errorMessage.includes('format'))) {
          userMessage = 'One or more LinkedIn URLs are invalid. Please check the format.';
        } else if (errorMessage.includes('empty') || errorMessage.includes('required')) {
          userMessage = 'Please provide at least one valid LinkedIn URL';
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
          message: 'A server error occurred while creating the export. Please try again in a moment.',
          error,
        };
      }

      const error = await parseApiError(response, 'Failed to create LinkedIn export');
      return {
        success: false,
        message: formatErrorMessage(error, 'Unable to create export. Please check your connection and try again.'),
        error,
      };
    }

    const data: LinkedInExportResponse = await response.json();

    return {
      success: true,
      data,
      message: 'Export created successfully',
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to create LinkedIn export');
    console.error('[LINKEDIN] Export error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });

    let userMessage = 'Failed to create LinkedIn export';
    if (parsedError.isNetworkError) {
      userMessage = 'Network error: Unable to connect to the server. Please check your internet connection.';
    } else if (parsedError.isTimeoutError) {
      userMessage = 'Request timed out. Please try again.';
    } else {
      userMessage = formatErrorMessage(parsedError, 'An unexpected error occurred while creating the export. Please try again.');
    }

    return {
      success: false,
      message: userMessage,
      error: parsedError,
    };
  }
};

