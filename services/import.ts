import { authenticatedFetch } from './auth';
import { API_BASE_URL } from './api';
import { parseApiError, parseExceptionError, formatErrorMessage, ParsedError } from '../utils/errorHandler';

/**
 * Import job status values
 */
export type ImportJobStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Import job response interface
 */
export interface ImportJob {
  id: number;
  status: ImportJobStatus;
  total_rows: number;
  success_count: number;
  error_count: number;
  upload_file_path: string;
  error_file_path: string;
  message: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  errors_url: string;
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
 */
export const getImportInfo = async (): Promise<ServiceResponse<string>> => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/contacts/import/`, {
      method: 'GET',
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
    console.error('[IMPORT] Get import info error:', parsedError);
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to get import info'),
      error: parsedError,
    };
  }
};

/**
 * Upload contacts CSV file
 */
export const uploadContactsCSV = async (file: File): Promise<ServiceResponse<{ jobId: number }>> => {
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

    const response = await authenticatedFetch(`${API_BASE_URL}/contacts/import/`, {
      method: 'POST',
      body: formData,
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
    if (!data.job_id) {
      return {
        success: false,
        message: 'Invalid response from server: job ID not found',
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
    console.error('[IMPORT] Upload CSV error:', parsedError);
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to upload CSV file'),
      error: parsedError,
    };
  }
};

/**
 * Get import job status
 */
export const getImportJobStatus = async (jobId: number): Promise<ServiceResponse<ImportJob>> => {
  try {
    if (!jobId || typeof jobId !== 'number') {
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

    const response = await authenticatedFetch(`${API_BASE_URL}/contacts/import/${jobId}/`, {
      method: 'GET',
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
    console.error('[IMPORT] Get import job status error:', parsedError);
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
  jobId: number,
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
 * Download import errors CSV file
 */
export const downloadImportErrors = async (jobId: number): Promise<ServiceResponse<Blob>> => {
  try {
    if (!jobId || typeof jobId !== 'number') {
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

    const response = await authenticatedFetch(`${API_BASE_URL}/contacts/import/${jobId}/errors/`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          message: 'Import job not found or no error file available',
          error: {
            message: 'Import job not found or no error file available',
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
      const error = await parseApiError(response, 'Failed to download import errors');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to download import errors'),
        error,
      };
    }

    // Check if response is actually a CSV file
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/csv')) {
      // If not CSV, try to get error message from JSON response
      try {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.detail || 'Failed to download error file',
          error: {
            message: errorData.detail || 'Failed to download error file',
            isNetworkError: false,
            isTimeoutError: false,
          },
        };
      } catch {
        return {
          success: false,
          message: 'Unexpected response format. Expected CSV file.',
          error: {
            message: 'Unexpected response format',
            isNetworkError: false,
            isTimeoutError: false,
          },
        };
      }
    }

    const blob = await response.blob();
    return {
      success: true,
      data: blob,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to download import errors');
    console.error('[IMPORT] Download import errors error:', parsedError);
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to download import errors'),
      error: parsedError,
    };
  }
};
