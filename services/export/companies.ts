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
  ChunkedExportResult,
  ChunkedExportProgressCallback,
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
        timeout: 3600000, // 60 second timeout for export creation
        priority: 7, // High priority for export creation
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

/**
 * Chunk size for splitting large export requests
 */
const DEFAULT_CHUNK_SIZE = 5000;

/**
 * Create a chunked CSV export of selected companies
 * 
 * Splits large UUID arrays into smaller chunks and creates multiple export jobs.
 * This is useful for very large exports (>5000 companies) to avoid request timeouts
 * and reduce memory usage on the backend.
 * 
 * @param companyUuids - Array of company UUIDs to export (will be split into chunks)
 * @param params - Optional parameters including chunkSize, onProgress, and requestId
 * @returns Promise resolving to ServiceResponse with ChunkedExportResult
 * 
 * @example
 * ```typescript
 * const result = await createChunkedCompanyExport(
 *   largeUuidArray, // e.g., 15000 UUIDs
 *   {
 *     chunkSize: 5000,
 *     onProgress: ({ completed, total, percentage }) => {
 *       console.log(`Created ${completed}/${total} export chunks (${percentage}%)`);
 *     }
 *   }
 * );
 * 
 * if (result.success && result.data) {
 *   console.log(`Created ${result.data.successfulChunks} export chunks`);
 *   console.log(`Export IDs: ${result.data.exportIds.join(', ')}`);
 * }
 * ```
 */
export const createChunkedCompanyExport = async (
  companyUuids: string[],
  params?: {
    chunkSize?: number;
    onProgress?: ChunkedExportProgressCallback;
    requestId?: string;
  }
): Promise<ServiceResponse<ChunkedExportResult>> => {
  const chunkSize = params?.chunkSize || DEFAULT_CHUNK_SIZE;
  const onProgress = params?.onProgress;
  const requestId = params?.requestId;

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

    // If UUIDs fit in one chunk, use regular export
    if (companyUuids.length <= chunkSize) {
      const result = await createCompanyExport(companyUuids, requestId);
      if (result.success && result.data) {
        return {
          success: true,
          message: result.message,
          data: {
            exportIds: [result.data.export_id],
            totalCount: result.data.company_count,
            successfulChunks: 1,
            failedChunks: 0,
          },
        };
      } else {
        return {
          success: false,
          message: result.message,
          error: result.error,
        };
      }
    }

    // Split UUIDs into chunks
    const chunks: string[][] = [];
    for (let i = 0; i < companyUuids.length; i += chunkSize) {
      chunks.push(companyUuids.slice(i, i + chunkSize));
    }

    const totalChunks = chunks.length;
    const exportIds: string[] = [];
    const errors: string[] = [];
    let successfulChunks = 0;
    let failedChunks = 0;
    let totalCount = 0;

    // Create exports for each chunk (with limited concurrency to avoid overwhelming the server)
    const maxConcurrency = 3; // Process 3 chunks at a time
    for (let i = 0; i < chunks.length; i += maxConcurrency) {
      const batch = chunks.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(async (chunk, batchIndex) => {
        const chunkIndex = i + batchIndex;
        try {
          const result = await createCompanyExport(chunk, requestId);
          if (result.success && result.data) {
            exportIds.push(result.data.export_id);
            totalCount += result.data.company_count;
            successfulChunks++;
          } else {
            failedChunks++;
            errors.push(`Chunk ${chunkIndex + 1}: ${result.message || 'Unknown error'}`);
          }
        } catch (error: any) {
          failedChunks++;
          errors.push(`Chunk ${chunkIndex + 1}: ${error.message || 'Unknown error'}`);
        }
        
        // Report progress
        if (onProgress) {
          const completed = successfulChunks + failedChunks;
          const percentage = Math.round((completed / totalChunks) * 100);
          onProgress({
            completed,
            total: totalChunks,
            percentage,
            currentChunk: chunkIndex + 1,
          });
        }
      });

      await Promise.all(batchPromises);
    }

    // Determine overall success
    const allSuccessful = failedChunks === 0;
    const someSuccessful = successfulChunks > 0;

    if (allSuccessful) {
      return {
        success: true,
        message: `Successfully created ${successfulChunks} export chunk(s) with ${totalCount.toLocaleString()} total company(ies)`,
        data: {
          exportIds,
          totalCount,
          successfulChunks,
          failedChunks,
        },
      };
    } else if (someSuccessful) {
      return {
        success: true,
        message: `Created ${successfulChunks} export chunk(s) successfully, ${failedChunks} failed. ${totalCount.toLocaleString()} total company(ies) exported.`,
        data: {
          exportIds,
          totalCount,
          successfulChunks,
          failedChunks,
          errors: errors.length > 0 ? errors : undefined,
        },
      };
    } else {
      return {
        success: false,
        message: `Failed to create all ${totalChunks} export chunk(s)`,
        error: {
          message: `All export chunks failed. Errors: ${errors.join('; ')}`,
          statusCode: 500,
          isNetworkError: false,
          isTimeoutError: false,
        },
        data: {
          exportIds: [],
          totalCount: 0,
          successfulChunks: 0,
          failedChunks,
          errors,
        },
      };
    }
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to create chunked export');
    console.error('[EXPORT] Create chunked company export error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to create chunked export'),
      error: parsedError,
    };
  }
};

