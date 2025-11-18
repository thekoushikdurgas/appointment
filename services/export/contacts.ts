/**
 * Export Service Contact Operations
 * 
 * Functions for creating and downloading contact exports.
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
  CreateContactExportRequest,
  CreateContactExportResponse,
} from './types';

/**
 * Create a CSV export of selected contacts
 * 
 * Accepts a list of contact UUIDs and generates a CSV file containing all contact,
 * company, contact metadata, and company metadata fields. Returns a signed temporary
 * download URL that expires after 24 hours.
 * 
 * **Endpoint:** POST /api/v2/exports/contacts/export
 * 
 * **Authentication:** Required (JWT Bearer token)
 * 
 * **Request Body:**
 * - `contact_uuids` (array[string], required, min: 1): List of contact UUIDs to export
 * 
 * **Response:**
 * - `export_id` (string, UUID): Unique identifier for the export
 * - `download_url` (string): Signed temporary download URL that expires after 24 hours
 * - `expires_at` (datetime, ISO 8601): Timestamp when the download URL expires
 * - `contact_count` (integer): Number of contacts included in the export
 * - `status` (string): Export status (pending, processing, completed, failed)
 * 
 * **Error Handling:**
 * - 201 Created: Export created successfully
 * - 400 Bad Request: At least one contact UUID is required
 * - 401 Unauthorized: Authentication required
 * - 500 Internal Server Error: Failed to create export or generate CSV
 * 
 * @param contactUuids - Array of contact UUIDs to export (min: 1)
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to ServiceResponse with CreateContactExportResponse
 * 
 * @example
 * ```typescript
 * const result = await createContactExport([
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
export const createContactExport = async (
  contactUuids: string[],
  requestId?: string
): Promise<ServiceResponse<CreateContactExportResponse>> => {
  try {
    // Validate input
    if (!Array.isArray(contactUuids) || contactUuids.length === 0) {
      return {
        success: false,
        message: 'At least one contact UUID is required',
        error: {
          message: 'At least one contact UUID is required',
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
    const requestBody: CreateContactExportRequest = {
      contact_uuids: contactUuids,
    };

    // Make API request
    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v2/exports/contacts/export`,
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

    const data: CreateContactExportResponse = await response.json();

    return {
      success: true,
      message: `Export created successfully with ${data.contact_count} contact(s)`,
      data,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to create export');
    console.error('[EXPORT] Create export error:', {
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

/**
 * Download a CSV export file using a signed URL
 * 
 * The token must be valid and the export must belong to the requesting user.
 * The export must not have expired.
 * 
 * **Endpoint:** GET /api/v2/exports/{export_id}/download
 * 
 * **Authentication:** Required (JWT Bearer token)
 * 
 * **Path Parameters:**
 * - `export_id` (string, UUID, required): Export ID
 * 
 * **Query Parameters:**
 * - `token` (string, required): Signed URL token for authentication
 * 
 * **Response:**
 * - Returns CSV file with Content-Type: text/csv
 * - Content-Disposition: attachment; filename="export_{export_id}.csv"
 * 
 * **Error Handling:**
 * - 200 OK: CSV file downloaded successfully
 * - 400 Bad Request: Export is not ready (status not completed)
 * - 401 Unauthorized: Invalid or expired download token
 * - 403 Forbidden: Token does not match export or user
 * - 404 Not Found: Export not found or access denied, or export file not found
 * - 410 Gone: Export has expired
 * - 500 Internal Server Error: Server error
 * 
 * **Notes:**
 * - The download URL expires after 24 hours from creation
 * - Only the user who created the export can download it
 * - Use the full download_url from the Create Contact Export response
 * 
 * @param exportId - Export ID (UUID)
 * @param token - Signed URL token (from download_url query parameter)
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to ServiceResponse with Blob (CSV file)
 * 
 * @example
 * ```typescript
 * // Use the download_url directly from createContactExport response
 * const downloadUrl = 'http://api.example.com/api/v2/exports/{id}/download?token=...';
 * const url = new URL(downloadUrl);
 * // Extract export_id from pathname: /api/v2/exports/{export_id}/download
 * const pathParts = url.pathname.split('/').filter(part => part);
 * const downloadIndex = pathParts.indexOf('download');
 * const exportId = downloadIndex > 0 ? pathParts[downloadIndex - 1] : '';
 * const token = url.searchParams.get('token') || '';
 * 
 * const result = await downloadExport(exportId, token);
 * 
 * if (result.success && result.data) {
 *   // Create download link
 *   const blobUrl = URL.createObjectURL(result.data);
 *   const link = document.createElement('a');
 *   link.href = blobUrl;
 *   link.download = `export_${exportId}.csv`;
 *   link.click();
 *   URL.revokeObjectURL(blobUrl);
 * }
 * ```
 */
export const downloadExport = async (
  exportId: string,
  token: string,
  requestId?: string
): Promise<ServiceResponse<Blob>> => {
  try {
    // Validate input
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

    if (!token || typeof token !== 'string') {
      return {
        success: false,
        message: 'Invalid download token',
        error: {
          message: 'Invalid download token',
          statusCode: 400,
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    // Prepare headers
    const headers: HeadersInit = {
      'Accept': 'text/csv',
    };
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    // Build URL with token query parameter
    const url = `${API_BASE_URL}/api/v2/exports/${exportId}/download?token=${encodeURIComponent(token)}`;

    // Make API request with blob response type for CSV file
    const response = await axiosAuthenticatedRequest(url, {
      method: 'GET',
      headers,
      useQueue: true,
      useCache: false,
      responseType: 'blob', // Request blob response for CSV file
    });

    if (!response.ok) {
      if (response.status === 400) {
        const error = await parseApiError(response, 'Export is not ready');
        return {
          success: false,
          message: formatErrorMessage(error, 'Export is not ready for download'),
          error,
        };
      }
      if (response.status === 401) {
        const error = await parseApiError(response, 'Invalid or expired download token');
        return {
          success: false,
          message: 'Invalid or expired download token. Please create a new export.',
          error,
        };
      }
      if (response.status === 403) {
        const error = await parseApiError(response, 'Access forbidden');
        return {
          success: false,
          message: 'You do not have permission to download this export.',
          error,
        };
      }
      if (response.status === 404) {
        const error = await parseApiError(response, 'Export not found');
        return {
          success: false,
          message: 'Export not found or access denied.',
          error,
        };
      }
      if (response.status === 410) {
        const error = await parseApiError(response, 'Export has expired');
        return {
          success: false,
          message: 'Export has expired. Please create a new export.',
          error,
        };
      }
      const error = await parseApiError(response, 'Failed to download export');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to download export'),
        error,
      };
    }

    // Get response as blob directly (responseType: 'blob' means data is already a Blob)
    // The blob() method will return the Blob directly when responseType is 'blob'
    let blob = await response.blob();
    
    // Ensure the blob has the correct MIME type for CSV
    // If the blob doesn't have the correct type, create a new one with the proper type
    if (blob.type !== 'text/csv' && !blob.type.includes('csv')) {
      const csvText = await blob.text();
      blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    }

    return {
      success: true,
      message: 'Export downloaded successfully',
      data: blob,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to download export');
    console.error('[EXPORT] Download export error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to download export'),
      error: parsedError,
    };
  }
};

