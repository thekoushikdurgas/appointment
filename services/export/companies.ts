/**
 * Export Service Company Operations
 * 
 * Functions for creating company exports.
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
  CreateCompanyExportRequest,
  CreateCompanyExportResponse,
} from './types';

/**
 * Create a CSV export of selected companies
 * 
 * Accepts a list of company UUIDs and generates a CSV file containing all company
 * and company metadata fields. Returns a signed temporary download URL that expires after 24 hours.
 * 
 * **Endpoint:** POST /api/v2/exports/companies/export
 * 
 * **Authentication:** Required (JWT Bearer token)
 * 
 * **Request Body:**
 * - `company_uuids` (array[string], required, min: 1): List of company UUIDs to export
 * 
 * **Response:**
 * - `export_id` (string, UUID): Unique identifier for the export
 * - `download_url` (string): Signed temporary download URL that expires after 24 hours
 * - `expires_at` (datetime, ISO 8601): Timestamp when the download URL expires
 * - `company_count` (integer): Number of companies included in the export
 * - `status` (string): Export status (pending, processing, completed, failed)
 * 
 * **Error Handling:**
 * - 201 Created: Export created successfully
 * - 400 Bad Request: At least one company UUID is required
 * - 401 Unauthorized: Authentication required
 * - 500 Internal Server Error: Failed to create export or generate CSV
 * 
 * @param companyUuids - Array of company UUIDs to export (min: 1)
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to ServiceResponse with CreateCompanyExportResponse
 * 
 * @example
 * ```typescript
 * const result = await createCompanyExport([
 *   'abc123-def456-ghi789',
 *   'xyz789-uvw456-rst123'
 * ]);
 * 
 * if (result.success && result.data) {
 *   console.log('Export ID:', result.data.export_id);
 *   console.log('Download URL:', result.data.download_url);
 * } else {
 *   console.error('Error:', result.message);
 * }
 * ```
 */
export const createCompanyExport = async (
  companyUuids: string[],
  requestId?: string
): Promise<ServiceResponse<CreateCompanyExportResponse>> => {
  try {
    // Validate input
    if (!Array.isArray(companyUuids) || companyUuids.length === 0) {
      return {
        success: false,
        message: 'At least one company UUID is required',
        error: {
          message: 'At least one company UUID is required',
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
    const requestBody: CreateCompanyExportRequest = {
      company_uuids: companyUuids,
    };

    // Make API request
    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v2/exports/companies/export`,
      {
        method: 'POST',
        headers,
        data: requestBody,
        useQueue: true,
        useCache: false,
      }
    );

    if (!response.ok) {
      if (response.status === 400) {
        const error = await parseApiError(response, 'Invalid request data');
        return {
          success: false,
          message: formatErrorMessage(error, 'Failed to create export'),
          error,
        };
      }
      if (response.status === 401) {
        const error = await parseApiError(response, 'Authentication required');
        return {
          success: false,
          message: 'Authentication required. Please log in again.',
          error,
        };
      }
      const error = await parseApiError(response, 'Failed to create export');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to create export'),
        error,
      };
    }

    const data: CreateCompanyExportResponse = await response.json();

    return {
      success: true,
      message: `Export created successfully with ${data.company_count} company(ies)`,
      data,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to create export');
    console.error('[EXPORT] Create company export error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to create export'),
      error: parsedError,
    };
  }
};

