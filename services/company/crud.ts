/**
 * Company Service CRUD Operations
 * 
 * Functions for creating, updating, and deleting companies.
 */

import {
  Company,
  CompanyCreate,
  CompanyUpdate,
  ApiCompany,
  ServiceResponse,
} from '@/types/company';
import { API_BASE_URL } from '../api';
import { axiosAuthenticatedRequest } from '@utils/request';
import { parseApiError, parseExceptionError, formatErrorMessage } from '@utils/error';
import { NEXT_PUBLIC_COMPANIES_WRITE_KEY } from '@utils/config';
import { mapApiToCompany } from './mappers';
import { clearCountCache } from './cache';

/**
 * Get the companies write key (hard-coded)
 */
const getCompaniesWriteKey = (): string | null => {
  return NEXT_PUBLIC_COMPANIES_WRITE_KEY;
};

/**
 * Create a new company
 * 
 * Creates a new company record using the CompanyCreate schema. All body fields are optional.
 * Requires admin authentication and the X-Companies-Write-Key header.
 * 
 * **Authentication:**
 * - Requires admin authentication (Bearer token)
 * - Requires X-Companies-Write-Key header matching the configured COMPANIES_WRITE_KEY value
 * 
 * **Response Codes:**
 * - 201 Created: Company created successfully
 * - 400 Bad Request: Invalid request data
 * - 401 Unauthorized: Authentication required
 * - 403 Forbidden: Admin access required or invalid write key
 * 
 * @param companyData - CompanyCreate data with company information
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to ServiceResponse<Company> with created company
 */
export const createCompany = async (
  companyData: CompanyCreate,
  requestId?: string
): Promise<ServiceResponse<Company>> => {
  try {
    // Get write key from environment
    const writeKey = getCompaniesWriteKey();
    if (!writeKey) {
      return {
        success: false,
        message:
          'Companies write key not configured. Please set NEXT_PUBLIC_COMPANIES_WRITE_KEY environment variable.',
        error: {
          message: 'Write key not configured',
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Companies-Write-Key': writeKey,
    };
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/companies/`,
      {
        method: 'POST',
        useQueue: true,
        useCache: false,
        headers,
        data: companyData,
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        const error = await parseApiError(response, 'Authentication required');
        return {
          success: false,
          message: 'Authentication required. Please log in again.',
          error,
          fieldErrors: error.fieldErrors,
          nonFieldErrors: error.nonFieldErrors,
        };
      }
      if (response.status === 403) {
        const error = await parseApiError(response, 'Access forbidden');
        return {
          success: false,
          message:
            'Admin access required or invalid write key. Please check your X-Companies-Write-Key header.',
          error,
          fieldErrors: error.fieldErrors,
          nonFieldErrors: error.nonFieldErrors,
        };
      }
      const error = await parseApiError(response, 'Failed to create company');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to create company'),
        error,
        fieldErrors: error.fieldErrors,
        nonFieldErrors: error.nonFieldErrors,
      };
    }

    // Handle 201 Created response
    const data: ApiCompany = await response.json();
    const company = mapApiToCompany(data);

    // Clear count cache since we added a company
    clearCountCache();

    return {
      success: true,
      message: 'Company created successfully',
      data: company,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to create company');
    console.error('[COMPANY] Create company error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to create company'),
      error: parsedError,
      fieldErrors: parsedError.fieldErrors,
      nonFieldErrors: parsedError.nonFieldErrors,
    };
  }
};

/**
 * Update an existing company
 * 
 * Updates a company record. All body fields are optional (partial update).
 * Requires admin authentication and the X-Companies-Write-Key header.
 * 
 * **Authentication:**
 * - Requires admin authentication (Bearer token)
 * - Requires X-Companies-Write-Key header
 * 
 * **Response Codes:**
 * - 200 OK: Company updated successfully
 * - 400 Bad Request: Invalid request data
 * - 401 Unauthorized: Authentication required
 * - 403 Forbidden: Admin access required or invalid write key
 * - 404 Not Found: Company not found
 * 
 * @param uuid - The company UUID
 * @param companyData - CompanyUpdate data with fields to update
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to ServiceResponse<Company> with updated company
 */
export const updateCompany = async (
  uuid: string,
  companyData: CompanyUpdate,
  requestId?: string
): Promise<ServiceResponse<Company>> => {
  try {
    if (!uuid || typeof uuid !== 'string') {
      return {
        success: false,
        message: 'Invalid company UUID',
        error: {
          message: 'Invalid company UUID',
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    // Get write key from environment
    const writeKey = getCompaniesWriteKey();
    if (!writeKey) {
      return {
        success: false,
        message:
          'Companies write key not configured. Please set NEXT_PUBLIC_COMPANIES_WRITE_KEY environment variable.',
        error: {
          message: 'Write key not configured',
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Companies-Write-Key': writeKey,
    };
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/companies/${uuid}/`,
      {
        method: 'PUT',
        headers,
        data: companyData,
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
          fieldErrors: error.fieldErrors,
          nonFieldErrors: error.nonFieldErrors,
        };
      }
      if (response.status === 403) {
        const error = await parseApiError(response, 'Access forbidden');
        return {
          success: false,
          message:
            'Admin access required or invalid write key. Please check your X-Companies-Write-Key header.',
          error,
          fieldErrors: error.fieldErrors,
          nonFieldErrors: error.nonFieldErrors,
        };
      }
      if (response.status === 404) {
        const error = await parseApiError(response, 'Company not found');
        return {
          success: false,
          message: 'Company not found.',
          error,
          fieldErrors: error.fieldErrors,
          nonFieldErrors: error.nonFieldErrors,
        };
      }
      const error = await parseApiError(response, 'Failed to update company');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to update company'),
        error,
        fieldErrors: error.fieldErrors,
        nonFieldErrors: error.nonFieldErrors,
      };
    }

    // Handle 200 OK response
    const data: ApiCompany = await response.json();
    const company = mapApiToCompany(data);

    // Clear count cache since data may have changed
    clearCountCache();

    return {
      success: true,
      message: 'Company updated successfully',
      data: company,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to update company');
    console.error('[COMPANY] Update company error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to update company'),
      error: parsedError,
      fieldErrors: parsedError.fieldErrors,
      nonFieldErrors: parsedError.nonFieldErrors,
    };
  }
};

/**
 * Delete a company
 * 
 * Deletes a company record.
 * Requires admin authentication and the X-Companies-Write-Key header.
 * 
 * **Authentication:**
 * - Requires admin authentication (Bearer token)
 * - Requires X-Companies-Write-Key header
 * 
 * **Response Codes:**
 * - 204 No Content: Company deleted successfully
 * - 401 Unauthorized: Authentication required
 * - 403 Forbidden: Admin access required or invalid write key
 * - 404 Not Found: Company not found
 * 
 * @param uuid - The company UUID
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to ServiceResponse<void>
 */
export const deleteCompany = async (
  uuid: string,
  requestId?: string
): Promise<ServiceResponse<void>> => {
  try {
    if (!uuid || typeof uuid !== 'string') {
      return {
        success: false,
        message: 'Invalid company UUID',
        error: {
          message: 'Invalid company UUID',
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    // Get write key from environment
    const writeKey = getCompaniesWriteKey();
    if (!writeKey) {
      return {
        success: false,
        message:
          'Companies write key not configured. Please set NEXT_PUBLIC_COMPANIES_WRITE_KEY environment variable.',
        error: {
          message: 'Write key not configured',
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    // Prepare headers
    const headers: HeadersInit = {
      'X-Companies-Write-Key': writeKey,
    };
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/companies/${uuid}/`,
      {
        method: 'DELETE',
        useQueue: true,
        useCache: false,
        headers,
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        const error = await parseApiError(response, 'Authentication required');
        return {
          success: false,
          message: 'Authentication required. Please log in again.',
          error,
          fieldErrors: error.fieldErrors,
          nonFieldErrors: error.nonFieldErrors,
        };
      }
      if (response.status === 403) {
        const error = await parseApiError(response, 'Access forbidden');
        return {
          success: false,
          message:
            'Admin access required or invalid write key. Please check your X-Companies-Write-Key header.',
          error,
          fieldErrors: error.fieldErrors,
          nonFieldErrors: error.nonFieldErrors,
        };
      }
      if (response.status === 404) {
        const error = await parseApiError(response, 'Company not found');
        return {
          success: false,
          message: 'Company not found.',
          error,
          fieldErrors: error.fieldErrors,
          nonFieldErrors: error.nonFieldErrors,
        };
      }
      const error = await parseApiError(response, 'Failed to delete company');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to delete company'),
        error,
        fieldErrors: error.fieldErrors,
        nonFieldErrors: error.nonFieldErrors,
      };
    }

    // Handle 204 No Content response
    // Clear count cache since we deleted a company
    clearCountCache();

    return {
      success: true,
      message: 'Company deleted successfully',
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to delete company');
    console.error('[COMPANY] Delete company error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to delete company'),
      error: parsedError,
      fieldErrors: parsedError.fieldErrors,
      nonFieldErrors: parsedError.nonFieldErrors,
    };
  }
};

