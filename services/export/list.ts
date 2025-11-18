/**
 * Export Service List Operations
 * 
 * Functions for listing and managing exports.
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
  ListExportsResponse,
  DeleteAllExportsResponse,
} from './types';

/**
 * List all exports for the current user
 * 
 * Returns all exports created by the authenticated user, ordered by creation date (newest first).
 * Includes both contact and company exports.
 * 
 * **Endpoint:** GET /api/v2/exports/
 * 
 * **Authentication:** Required (JWT Bearer token)
 * 
 * **Response:**
 * - `exports` (array): List of export records, ordered by `created_at` descending (newest first)
 * - `total` (integer): Total number of exports for the user
 * 
 * **Each export object contains:**
 * - `export_id` (string, UUID): Unique identifier for the export
 * - `user_id` (string): ID of the user who created the export
 * - `export_type` (string): Type of export - either "contacts" or "companies"
 * - `file_path` (string, optional): Path to the CSV file on the server
 * - `file_name` (string, optional): Name of the CSV file
 * - `contact_count` (integer): Number of contacts in the export (0 for company exports)
 * - `contact_uuids` (array[string], optional): List of contact UUIDs (null for company exports)
 * - `company_count` (integer): Number of companies in the export (0 for contact exports)
 * - `company_uuids` (array[string], optional): List of company UUIDs (null for contact exports)
 * - `status` (string): Export status - pending, completed, or failed
 * - `created_at` (datetime, ISO 8601): When the export was created
 * - `expires_at` (datetime, ISO 8601, optional): When the download URL expires
 * - `download_url` (string, optional): Signed download URL (null if export is not completed)
 * 
 * **Error Handling:**
 * - 200 OK: Exports listed successfully
 * - 401 Unauthorized: Authentication required
 * - 500 Internal Server Error: Failed to list exports
 * 
 * **Notes:**
 * - Returns all exports for the authenticated user, regardless of export type
 * - Exports are ordered by creation date, newest first
 * - Only exports created by the current user are returned
 * - Expired exports are still included in the list (check `expires_at` to determine if download is still available)
 * 
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to ServiceResponse with ListExportsResponse
 * 
 * @example
 * ```typescript
 * const result = await listExports();
 * 
 * if (result.success && result.data) {
 *   console.log('Total exports:', result.data.total);
 *   result.data.exports.forEach(exportItem => {
 *     console.log(`Export ${exportItem.export_id}: ${exportItem.export_type} (${exportItem.status})`);
 *   });
 * } else {
 *   console.error('Error:', result.message);
 * }
 * ```
 */
export const listExports = async (
  requestId?: string
): Promise<ServiceResponse<ListExportsResponse>> => {
  try {
    // Prepare headers
    const headers: HeadersInit = {};
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    // Make API request
    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v2/exports/`,
      {
        method: 'GET',
        headers,
        useQueue: true,
        useCache: false,
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        const error = await parseApiError(response, 'Authentication required');
        return {
          success: false,
          message: 'Authentication required. Please log in again.',
          error,
        };
      }
      const error = await parseApiError(response, 'Failed to list exports');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to list exports'),
        error,
      };
    }

    const data: ListExportsResponse = await response.json();

    return {
      success: true,
      message: `Retrieved ${data.total} export(s)`,
      data,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to list exports');
    console.error('[EXPORT] List exports error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to list exports'),
      error: parsedError,
    };
  }
};

/**
 * Delete all CSV files from the exports directory (Admin only)
 * 
 * This endpoint deletes all CSV files in the exports directory and optionally cleans up
 * expired export records from the database. This operation cannot be undone.
 * 
 * **Endpoint:** DELETE /api/v2/exports/files
 * 
 * **Authentication:** Required (JWT Bearer token with admin role)
 * 
 * **Response:**
 * - `message` (string): Success message
 * - `deleted_count` (integer): Number of CSV files deleted
 * 
 * **Error Handling:**
 * - 200 OK: CSV files deleted successfully
 * - 401 Unauthorized: Authentication required
 * - 403 Forbidden: Admin role required
 * - 500 Internal Server Error: Failed to delete CSV files
 * 
 * **Notes:**
 * - This endpoint requires admin authentication
 * - Deletes all CSV files from the exports directory, regardless of ownership
 * - Optionally cleans up expired export records from the database
 * - Use with caution as this operation cannot be undone
 * - Individual file deletion failures are logged but do not stop the overall operation
 * 
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to ServiceResponse with DeleteAllExportsResponse
 * 
 * @example
 * ```typescript
 * const result = await deleteAllExports();
 * 
 * if (result.success && result.data) {
 *   console.log('Deleted files:', result.data.deleted_count);
 *   console.log('Message:', result.data.message);
 * } else {
 *   console.error('Error:', result.message);
 * }
 * ```
 */
export const deleteAllExports = async (
  requestId?: string
): Promise<ServiceResponse<DeleteAllExportsResponse>> => {
  try {
    // Prepare headers
    const headers: HeadersInit = {};
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    // Make API request
    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v2/exports/files`,
      {
        method: 'DELETE',
        headers,
        useQueue: true,
        useCache: false,
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        const error = await parseApiError(response, 'Authentication required');
        return {
          success: false,
          message: 'Authentication required. Please log in again.',
          error,
        };
      }
      if (response.status === 403) {
        const error = await parseApiError(response, 'Access forbidden');
        return {
          success: false,
          message: 'You do not have permission to perform this action. Admin role required.',
          error,
        };
      }
      const error = await parseApiError(response, 'Failed to delete CSV files');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to delete CSV files'),
        error,
      };
    }

    const data: DeleteAllExportsResponse = await response.json();

    return {
      success: true,
      message: data.message || `Successfully deleted ${data.deleted_count} CSV file(s)`,
      data,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to delete CSV files');
    console.error('[EXPORT] Delete all exports error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to delete CSV files'),
      error: parsedError,
    };
  }
};

