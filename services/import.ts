import { axiosAuthenticatedRequest } from '@utils/request';
import { API_BASE_URL } from './api';
import { parseApiError, parseExceptionError, formatErrorMessage, ParsedError } from '@utils/error';

/**
 * Import job status values
 */
export type ImportJobStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Import error interface
 */
export interface ImportError {
  row_number: number;
  error_message: string;
  row_data: Record<string, any>;
}

/**
 * Import job response interface
 */
export interface ImportJob {
  job_id: string; // UUID string, not numeric ID
  status: ImportJobStatus;
  total_rows: number;
  success_count: number;
  error_count: number;
  upload_file_path: string;
  error_file_path: string | null;
  message: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  errors?: ImportError[]; // Included when include_errors=true
}

/**
 * Service response interface
 */
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ParsedError;
}

/**
 * Job status polling options
 */
export interface PollJobOptions {
  interval?: number; // Polling interval in milliseconds (default: 2000)
  maxAttempts?: number; // Maximum polling attempts (default: 300 = 10 minutes at 2s interval)
  onProgress?: (job: ImportJob) => void; // Callback for each status update
}

/**
 * Get import endpoint information
 * 
 * @param requestId - Optional X-Request-Id header value for request tracking
 */
export const getImportInfo = async (requestId?: string): Promise<ServiceResponse<string>> => {
  try {
    const headers: HeadersInit = {};
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    const response = await axiosAuthenticatedRequest(`${API_BASE_URL}/api/v1/contacts/import/`, {
      method: 'GET',
      headers,
      useCache: true,
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          message: 'Authentication required. Admin access needed.',
          error: {
            message: 'Authentication required',
            statusCode: response.status,
            isNetworkError: false,
            isTimeoutError: false,
          },
        };
      }
      const error = await parseApiError(response, 'Failed to get import info');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to get import info'),
        error,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.detail || 'Import endpoint ready',
      message: data.detail || 'Import endpoint ready',
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to get import info');
    console.error('[IMPORT] Get import info error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to get import info'),
      error: parsedError,
    };
  }
};

/**
 * Upload contacts CSV file
 * 
 * @param file - The CSV file to upload
 * @param requestId - Optional X-Request-Id header value for request tracking
 */
export const uploadContactsCSV = async (file: File, requestId?: string): Promise<ServiceResponse<{ jobId: string }>> => {
  try {
    // Validate file type
    const allowedExtensions = ['.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension) && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      return {
        success: false,
        message: 'Invalid file type. Only CSV files are allowed.',
        error: {
          message: 'Invalid file type',
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        success: false,
        message: 'File too large. Maximum size is 50MB.',
        error: {
          message: 'File too large',
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    const response = await axiosAuthenticatedRequest(`${API_BASE_URL}/api/v1/contacts/import/`, {
      method: 'POST',
      data: formData,
      headers: {
        // Don't set Content-Type for FormData, let Axios handle it
      },
      useCache: false,
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          message: 'Authentication required. Admin access needed.',
          error: {
            message: 'Authentication required',
            statusCode: response.status,
            isNetworkError: false,
            isTimeoutError: false,
          },
        };
      }
      
      const error = await parseApiError(response, 'Failed to upload CSV file');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to upload CSV file'),
        error,
      };
    }

    const data = await response.json();
    if (!data.job_id || typeof data.job_id !== 'string') {
      return {
        success: false,
        message: 'Invalid response from server: job ID not found or invalid',
        error: {
          message: 'Invalid response format',
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    return {
      success: true,
      data: { jobId: data.job_id },
      message: 'CSV file uploaded successfully. Processing started.',
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to upload CSV file');
    console.error('[IMPORT] Upload CSV error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to upload CSV file'),
      error: parsedError,
    };
  }
};

/**
 * Get import job status
 * 
 * @param jobId - The import job ID (UUID string)
 * @param includeErrors - If true, includes error records in the response
 * @param requestId - Optional X-Request-Id header value for request tracking
 */
export const getImportJobStatus = async (jobId: string, includeErrors?: boolean, requestId?: string): Promise<ServiceResponse<ImportJob>> => {
  try {
    if (!jobId || typeof jobId !== 'string') {
      return {
        success: false,
        message: 'Invalid job ID',
        error: {
          message: 'Invalid job ID',
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    const headers: HeadersInit = {};
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    // Build URL with optional include_errors parameter
    let url = `${API_BASE_URL}/api/v1/contacts/import/${jobId}/`;
    if (includeErrors === true) {
      url += '?include_errors=true';
    }

    const response = await axiosAuthenticatedRequest(url, {
      method: 'GET',
      headers,
      useCache: true,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          message: 'Import job not found',
          error: {
            message: 'Import job not found',
            statusCode: 404,
            isNetworkError: false,
            isTimeoutError: false,
          },
        };
      }
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          message: 'Authentication required. Admin access needed.',
          error: {
            message: 'Authentication required',
            statusCode: response.status,
            isNetworkError: false,
            isTimeoutError: false,
          },
        };
      }
      const error = await parseApiError(response, 'Failed to get import job status');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to get import job status'),
        error,
      };
    }

    const data: ImportJob = await response.json();
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to get import job status');
    console.error('[IMPORT] Get import job status error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to get import job status'),
      error: parsedError,
    };
  }
};

/**
 * Poll import job status until completion or failure
 */
export const pollImportJobStatus = async (
  jobId: string,
  options: PollJobOptions = {}
): Promise<ServiceResponse<ImportJob>> => {
  const {
    interval = 2000,
    maxAttempts = 300, // 10 minutes at 2s interval
    onProgress,
  } = options;

  let attempts = 0;

  while (attempts < maxAttempts) {
    const result = await getImportJobStatus(jobId);

    if (!result.success || !result.data) {
      return result;
    }

    const job = result.data;

    // Call progress callback if provided
    if (onProgress) {
      onProgress(job);
    }

    // Check if job is complete or failed
    if (job.status === 'completed' || job.status === 'failed') {
      return result;
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, interval));
    attempts++;
  }

  // Timeout - return last known status
  const lastResult = await getImportJobStatus(jobId);
  return {
    ...lastResult,
    message: lastResult.message || 'Polling timeout reached',
  };
};

/**
 * Get import errors as JSON array
 * 
 * @param jobId - The import job ID (UUID string)
 * @param requestId - Optional X-Request-Id header value for request tracking
 */
export const getImportErrors = async (jobId: string, requestId?: string): Promise<ServiceResponse<ImportError[]>> => {
  try {
    if (!jobId || typeof jobId !== 'string') {
      return {
        success: false,
        message: 'Invalid job ID',
        error: {
          message: 'Invalid job ID',
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    const headers: HeadersInit = {};
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    const response = await axiosAuthenticatedRequest(`${API_BASE_URL}/api/v1/contacts/import/${jobId}/errors/`, {
      method: 'GET',
      headers,
      useCache: true,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          message: 'Import job not found or no errors available',
          error: {
            message: 'Import job not found or no errors available',
            statusCode: 404,
            isNetworkError: false,
            isTimeoutError: false,
          },
        };
      }
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          message: 'Authentication required. Admin access needed.',
          error: {
            message: 'Authentication required',
            statusCode: response.status,
            isNetworkError: false,
            isTimeoutError: false,
          },
        };
      }
      const error = await parseApiError(response, 'Failed to get import errors');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to get import errors'),
        error,
      };
    }

    // API returns JSON array of error records
    const errors: ImportError[] = await response.json();
    return {
      success: true,
      data: Array.isArray(errors) ? errors : [],
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to get import errors');
    console.error('[IMPORT] Get import errors error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to get import errors'),
      error: parsedError,
    };
  }
};
