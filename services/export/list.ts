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
  ExportStatusResponse,
  ExportListItem,
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
        timeout: 336000000, // 30 second timeout for status check
        priority: 6, // Higher priority for status checks
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

/**
 * Get export status by export ID
 * 
 * Retrieves the status of a specific export using the dedicated status endpoint.
 * Returns detailed status information including progress percentage, estimated time remaining,
 * error messages, and download URL if available.
 * 
 * **Endpoint:** GET /api/v2/exports/{export_id}/status
 * 
 * **Authentication:** Required (JWT Bearer token)
 * 
 * **Response:**
 * - `export_id` (string, UUID): Unique identifier for the export
 * - `status` (string): Export status - pending, processing, completed, failed, or cancelled
 * - `progress_percentage` (float, optional): Progress percentage (0-100)
 * - `estimated_time` (integer, optional): Estimated time remaining in seconds
 * - `error_message` (string, optional): Error message if export failed
 * - `download_url` (string, optional): Download URL if export is completed
 * - `expires_at` (datetime, optional): Expiration time of the download URL
 * 
 * @param exportId - Export ID (UUID) to check status for
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to ServiceResponse with ExportStatusResponse
 * 
 * @example
 * ```typescript
 * const result = await getExportStatus('export-uuid-123');
 * 
 * if (result.success && result.data) {
 *   console.log('Status:', result.data.status);
 *   console.log('Progress:', result.data.progress_percentage);
 *   console.log('Estimated time:', result.data.estimated_time);
 * }
 * ```
 */
export const getExportStatus = async (
  exportId: string,
  requestId?: string
): Promise<ServiceResponse<ExportStatusResponse>> => {
  try {
    if (!exportId || typeof exportId !== 'string') {
      return {
        success: false,
        message: 'Invalid export ID',
        error: {
          message: 'Invalid export ID',
          statusCode: 400,
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    // Prepare headers
    const headers: HeadersInit = {};
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    // Make API request to dedicated status endpoint
    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v2/exports/${exportId}/status`,
      {
        method: 'GET',
        headers,
        useQueue: true,
        useCache: false,
        timeout: 30000, // 30 second timeout for status check
        priority: 6, // Higher priority for status checks
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
      if (response.status === 404) {
        const error = await parseApiError(response, 'Export not found');
        return {
          success: false,
          message: 'Export not found or access denied',
          error: {
            message: 'Export not found or access denied',
            statusCode: 404,
            isNetworkError: false,
            isTimeoutError: false,
          },
        };
      }
      const error = await parseApiError(response, 'Failed to get export status');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to get export status'),
        error,
      };
    }

    const data: ExportStatusResponse = await response.json();

    return {
      success: true,
      message: `Export status: ${data.status}`,
      data,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to get export status');
    console.error('[EXPORT] Get export status error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to get export status'),
      error: parsedError,
    };
  }
};

/**
 * Poll export status until completion or failure
 * 
 * Polls the export status at regular intervals until the export is completed
 * or failed. Calls a progress callback on each poll.
 * 
 * @param exportId - Export ID (UUID) to poll status for
 * @param options - Polling options including interval, maxAttempts, and onProgress callback
 * @returns Promise resolving to ServiceResponse with ExportStatusResponse
 * 
 * @example
 * ```typescript
 * const result = await pollExportStatus('export-uuid-123', {
 *   interval: 2000, // Poll every 2 seconds
 *   maxAttempts: 150, // Max 5 minutes (150 * 2s)
 *   onProgress: (status) => {
 *     console.log(`Status: ${status.status}, Progress: ${status.progress_percentage}%`);
 *   }
 * });
 * ```
 */
export const pollExportStatus = async (
  exportId: string,
  options?: {
    interval?: number;
    maxAttempts?: number;
    onProgress?: (status: ExportStatusResponse) => void;
    requestId?: string;
  }
): Promise<ServiceResponse<ExportStatusResponse>> => {
  const interval = options?.interval || 2000; // Default 2 seconds
  const maxAttempts = options?.maxAttempts || 150; // Default 5 minutes (150 * 2s)
  const onProgress = options?.onProgress;
  const requestId = options?.requestId;

  let attempts = 0;

  while (attempts < maxAttempts) {
    const result = await getExportStatus(exportId, requestId);

    if (!result.success || !result.data) {
      return result;
    }

    const status = result.data;

    // Call progress callback if provided
    if (onProgress) {
      onProgress(status);
    }

    // Check if export is complete, failed, or cancelled
    if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
      return result;
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, interval));
    attempts++;
  }

  // Timeout - return last known status
  const lastResult = await getExportStatus(exportId, requestId);
  return {
    ...lastResult,
    message: lastResult.message || 'Polling timeout reached',
  };
};

/**
 * Cancel a pending or processing export
 * 
 * Cancels an export that is pending or currently processing. Sets the export status
 * to "cancelled" and cleans up any partial resources. Cannot cancel exports that are
 * already completed or failed.
 * 
 * **Endpoint:** DELETE /api/v2/exports/{export_id}/cancel
 * 
 * **Authentication:** Required (JWT Bearer token)
 * 
 * **Response:**
 * - `message` (string): Success or status message
 * - `export_id` (string, UUID): Export ID
 * - `status` (string): Export status after cancellation (cancelled)
 * 
 * **Error Handling:**
 * - 200 OK: Export cancelled successfully
 * - 400 Bad Request: Cannot cancel completed or failed export
 * - 401 Unauthorized: Authentication required
 * - 404 Not Found: Export not found or access denied
 * - 500 Internal Server Error: Failed to cancel export
 * 
 * @param exportId - Export ID (UUID) to cancel
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to ServiceResponse with cancellation result
 * 
 * @example
 * ```typescript
 * const result = await cancelExport('export-uuid-123');
 * 
 * if (result.success) {
 *   console.log('Export cancelled successfully');
 * } else {
 *   console.error('Error:', result.message);
 * }
 * ```
 */
export const cancelExport = async (
  exportId: string,
  requestId?: string
): Promise<ServiceResponse<{ export_id: string; status: string; message: string }>> => {
  try {
    if (!exportId || typeof exportId !== 'string') {
      return {
        success: false,
        message: 'Invalid export ID',
        error: {
          message: 'Invalid export ID',
          statusCode: 400,
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    // Prepare headers
    const headers: HeadersInit = {};
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    // Make API request to cancel endpoint
    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v2/exports/${exportId}/cancel`,
      {
        method: 'DELETE',
        headers,
        useQueue: true,
        useCache: false,
        timeout: 30000, // 30 second timeout
        priority: 6, // Higher priority for cancellation
      }
    );

    if (!response.ok) {
      if (response.status === 400) {
        const error = await parseApiError(response, 'Cannot cancel export');
        return {
          success: false,
          message: formatErrorMessage(error, 'Cannot cancel this export'),
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
      if (response.status === 404) {
        const error = await parseApiError(response, 'Export not found');
        return {
          success: false,
          message: 'Export not found or access denied',
          error: {
            message: 'Export not found or access denied',
            statusCode: 404,
            isNetworkError: false,
            isTimeoutError: false,
          },
        };
      }
      const error = await parseApiError(response, 'Failed to cancel export');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to cancel export'),
        error,
      };
    }

    const data = await response.json();

    return {
      success: true,
      message: data.message || 'Export cancelled successfully',
      data: {
        export_id: data.export_id || exportId,
        status: data.status || 'cancelled',
        message: data.message || 'Export cancelled successfully',
      },
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to cancel export');
    console.error('[EXPORT] Cancel export error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to cancel export'),
      error: parsedError,
    };
  }
};

