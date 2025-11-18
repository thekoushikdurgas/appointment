/**
 * Company Service Company Contacts Operations
 * 
 * Functions for fetching, counting, and getting attributes for company contacts.
 */

import {
  CompanyContact,
  CompanyContactFilters,
  FetchCompanyContactsParams,
  FetchCompanyContactsResult,
  ApiCompanyContact,
  CompanyContactCursorListResponse,
  CompanyContactOffsetListResponse,
  CountResponse,
  CompanyContactAttributeResponse,
  FetchCompanyContactAttributeParams,
} from '@/types/company';
import { API_BASE_URL } from '../api';
import { axiosAuthenticatedRequest } from '@utils/request';
import { parseApiError, parseExceptionError, formatErrorForLogging } from '@utils/error';
import { buildCompanyContactFilterQuery } from './filters';
import { mapApiToCompanyContact } from './mappers';
import { getCachedContactCount, setCachedContactCount } from './cache';

/**
 * Fetch contacts for a specific company with search, filters, sorting, and pagination
 * 
 * Retrieves a paginated list of contacts belonging to a specific company with optional filtering,
 * searching, and ordering. Supports both cursor-based pagination and limit-offset pagination.
 * 
 * **Endpoint:** `GET /api/v1/companies/company/{company_uuid}/contacts/`
 * 
 * **Filtering:**
 * - Supports all CompanyContactFilters options including identity filters, metadata filters, and exclusion filters
 * - Date filters must be in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`
 * 
 * **Pagination:**
 * - Supports both cursor-based and offset-based pagination
 * - Use `cursor` for cursor-based pagination
 * - Use `limit` and `offset` for offset-based pagination
 * 
 * **Error Handling:**
 * - Returns error in result object rather than throwing
 * - Handles 404 (Company not found), 400 (Bad Request), 500 (Internal Server Error) responses
 * 
 * @param companyUuid - Company UUID identifier
 * @param params - FetchCompanyContactsParams with search, filters, sorting, and pagination options
 * @returns Promise resolving to FetchCompanyContactsResult with contacts array, count, and pagination links
 */
export const fetchCompanyContacts = async (
  companyUuid: string,
  params: FetchCompanyContactsParams = {}
): Promise<FetchCompanyContactsResult> => {
  const {
    search,
    filters,
    ordering,
    limit = 25,
    offset = 0,
    cursor,
    page,
    pageSize = 25,
    distinct,
    requestId,
  } = params;

  try {
    if (!companyUuid || typeof companyUuid !== 'string') {
      throw new Error('Invalid company UUID');
    }

    const query = buildCompanyContactFilterQuery(filters, search);

    // Add ordering if provided
    if (ordering) {
      query.set('ordering', ordering);
    }

    // Add pagination parameters
    if (cursor) {
      query.set('cursor', cursor);
    } else if (page) {
      query.set('page', page.toString());
    } else {
      query.set('limit', limit.toString());
      query.set('offset', offset.toString());
    }

    // Add page_size if provided
    if (pageSize) {
      query.set('page_size', pageSize.toString());
    }

    // Add distinct if provided
    if (distinct === true) {
      query.set('distinct', 'true');
    }

    // Prepare headers with optional X-Request-Id
    const headers: HeadersInit = {};
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/companies/company/${companyUuid}/contacts/?${query.toString()}`,
      {
        method: 'GET',
        useQueue: true,
        useCache: true,
        headers,
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        const error = await parseApiError(response, 'Company not found');
        return {
          contacts: [],
          count: 0,
          next: null,
          previous: null,
          error,
        };
      }
      const error = await parseApiError(response, 'Failed to fetch company contacts');
      console.error('[COMPANY] Failed to fetch company contacts:', {
        message: error.message,
        statusCode: error.statusCode,
        isNetworkError: error.isNetworkError,
        isTimeoutError: error.isTimeoutError,
      });
      return {
        contacts: [],
        count: 0,
        next: null,
        previous: null,
        error,
      };
    }

    const data: CompanyContactCursorListResponse | CompanyContactOffsetListResponse = await response.json();

    const contacts = (data.results || [])
      .map((item: ApiCompanyContact) => {
        try {
          return mapApiToCompanyContact(item);
        } catch (error) {
          console.warn('[COMPANY] Failed to map contact:', item, error);
          return null;
        }
      })
      .filter((contact): contact is CompanyContact => contact !== null);

    // Fetch count separately
    const countQuery = buildCompanyContactFilterQuery(filters, search);
    const countCacheKey = `${companyUuid}:${countQuery.toString()}`;

    let count = getCachedContactCount(countCacheKey);

    if (count === null) {
      try {
        const countUrl = countQuery.toString()
          ? `${API_BASE_URL}/api/v1/companies/company/${companyUuid}/contacts/count/?${countQuery.toString()}`
          : `${API_BASE_URL}/api/v1/companies/company/${companyUuid}/contacts/count/`;

        const countResp = await axiosAuthenticatedRequest(countUrl, {
          method: 'GET',
          headers: requestId ? { 'X-Request-Id': requestId } : undefined,
          useQueue: true,
          useCache: true,
        });

        if (countResp.ok) {
          const countData: CountResponse = await countResp.json();
          count = countData.count || 0;
          setCachedContactCount(countCacheKey, count);
        } else {
          console.warn(
            '[COMPANY] Contact count endpoint returned non-OK status:',
            countResp.status
          );
          count = (data as CompanyContactOffsetListResponse).count || 0;
        }
      } catch (e) {
        console.error('[COMPANY] Failed to fetch company contacts count:', e);
        count = (data as CompanyContactOffsetListResponse).count || 0;
      }
    }

    return {
      contacts,
      count: count || 0,
      next: data.next ?? null,
      previous: data.previous ?? null,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to fetch company contacts');
    console.error('[COMPANY] Failed to fetch company contacts:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      contacts: [],
      count: 0,
      next: null,
      previous: null,
      error: parsedError,
    };
  }
};

/**
 * Get company contacts count with optional filters
 * 
 * Retrieves the total count of contacts for a specific company, optionally filtered.
 * Results are cached for 5 minutes to improve performance.
 * 
 * **Endpoint:** `GET /api/v1/companies/company/{company_uuid}/contacts/count/`
 * 
 * **Error Handling:**
 * - Returns 0 if count operation fails or times out
 * - Handles 404 (Company not found) gracefully
 * 
 * @param companyUuid - Company UUID identifier
 * @param filters - Optional CompanyContactFilters to filter the count
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to contact count (0 if error occurs)
 */
export const getCompanyContactsCount = async (
  companyUuid: string,
  filters?: CompanyContactFilters,
  requestId?: string
): Promise<number> => {
  try {
    if (!companyUuid || typeof companyUuid !== 'string') {
      throw new Error('Invalid company UUID');
    }

    const query = buildCompanyContactFilterQuery(filters);
    const cacheKey = `${companyUuid}:${query.toString()}`;

    // Check cache first
    const cached = getCachedContactCount(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const queryString = query.toString();
    const url = queryString
      ? `${API_BASE_URL}/api/v1/companies/company/${companyUuid}/contacts/count/?${queryString}`
      : `${API_BASE_URL}/api/v1/companies/company/${companyUuid}/contacts/count/`;

    const headers: HeadersInit = {};
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    const response = await axiosAuthenticatedRequest(url, {
      method: 'GET',
      headers,
      useQueue: true,
      useCache: true,
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('[COMPANY] Company not found for contacts count:', companyUuid);
        return 0;
      }
      const error = await parseApiError(response, 'Failed to fetch company contacts count');
      throw error;
    }

    const data: CountResponse = await response.json();
    const count = data.count || 0;

    // Cache the result
    setCachedContactCount(cacheKey, count);

    return count;
  } catch (error) {
    const parsedError = parseExceptionError(
      error,
      'Failed to fetch company contacts count'
    );
    console.error('[COMPANY] Failed to fetch company contacts count:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return 0;
  }
};

/**
 * Get Company Contact UUIDs
 * 
 * Get a list of contact UUIDs for a specific company that match the provided filters.
 * Returns count and list of UUIDs. Useful for bulk operations on company contacts.
 * 
 * **Endpoint:** GET /api/v1/companies/company/{company_uuid}/contacts/count/uuids/
 * 
 * **Query Parameters:**
 * This endpoint accepts ALL the same query parameters as `/api/v1/companies/company/{company_uuid}/contacts/count/` endpoint, plus:
 * - `limit` (integer, optional): Maximum number of UUIDs to return. **If not provided, returns all matching UUIDs (unlimited).** When provided, limits results to the specified number.
 * 
 * All filter parameters from the list contacts endpoint are supported:
 * - All text filters (title, first_name, last_name, email, etc.)
 * - All exact filters (seniority, department, email_status, etc.)
 * - All date range filters (created_at_after, created_at_before, updated_at_after, updated_at_before, etc.)
 * - Search parameter
 * 
 * **Response:**
 * ```json
 * {
 *   "count": 45,
 *   "uuids": ["contact-uuid-1", "contact-uuid-2", "contact-uuid-3", ...]
 * }
 * ```
 * 
 * **Error Handling:**
 * - Returns empty array and count 0 if operation fails
 * - Returns empty array and count 0 if company is not found (404)
 * 
 * **Notes:**
 * - Returns all matching UUIDs by default (unlimited) unless `limit` parameter is provided
 * - Useful for bulk operations, exports, or when you only need UUIDs without full contact data
 * - All the same filtering capabilities as the count endpoint
 * 
 * @param companyUuid - Company UUID identifier
 * @param filters - Optional CompanyContactFilters to filter the UUIDs
 * @param params - Optional parameters including limit and requestId
 * @returns Promise resolving to object with count and uuids array
 * 
 * @example
 * ```typescript
 * // Get all contact UUIDs for a company matching filters
 * const result = await getCompanyContactUuids(
 *   'company-uuid-123',
 *   { title: 'engineer', seniority: 'senior' },
 *   { limit: 500 }
 * );
 * 
 * if (result) {
 *   console.log('Total:', result.count);
 *   console.log('UUIDs:', result.uuids);
 * }
 * ```
 */
export const getCompanyContactUuids = async (
  companyUuid: string,
  filters?: CompanyContactFilters,
  params?: {
    limit?: number;
    requestId?: string;
  }
): Promise<{ count: number; uuids: string[] }> => {
  try {
    if (!companyUuid || typeof companyUuid !== 'string') {
      throw new Error('Invalid company UUID');
    }

    const query = buildCompanyContactFilterQuery(filters);
    
    // Add limit if provided
    if (params?.limit !== undefined) {
      query.set('limit', params.limit.toString());
    }

    const queryString = query.toString();
    const url = queryString
      ? `${API_BASE_URL}/api/v1/companies/company/${companyUuid}/contacts/count/uuids/?${queryString}`
      : `${API_BASE_URL}/api/v1/companies/company/${companyUuid}/contacts/count/uuids/`;

    const headers: HeadersInit = {};
    if (params?.requestId) {
      headers['X-Request-Id'] = params.requestId;
    }

    const response = await axiosAuthenticatedRequest(url, {
      method: 'GET',
      headers,
      useQueue: true,
      useCache: true,
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('[COMPANY] Company not found for contact UUIDs:', companyUuid);
        return {
          count: 0,
          uuids: [],
        };
      }
      const error = await parseApiError(response, 'Failed to fetch company contact UUIDs');
      throw error;
    }

    const data: { count: number; uuids: string[] } = await response.json();
    return {
      count: data.count || 0,
      uuids: data.uuids || [],
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to fetch company contact UUIDs');
    console.error('[COMPANY] Failed to fetch company contact UUIDs:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      count: 0,
      uuids: [],
    };
  }
};

/**
 * Fetch distinct values for a specific contact attribute within a company
 * 
 * Retrieves field-specific data from the company contacts API. Returns array of distinct string values.
 * 
 * **Endpoint:** `GET /api/v1/companies/company/{company_uuid}/contacts/{attribute}/`
 * 
 * **Supported Attributes:**
 * - first_name, last_name, title, seniority, department, email_status
 * 
 * **Parameters:**
 * - `search`: Search term to filter results (case-insensitive)
 * - `distinct`: If `true`, returns only distinct field values (default: `true`)
 * - `limit`: Number of results per page (max 100, default: 25)
 * - `offset`: Offset for pagination
 * - `ordering`: Sort by field. Valid: 'value', '-value', 'count', '-count'
 * - `requestId`: Optional X-Request-Id header value for request tracking
 * 
 * @param companyUuid - Company UUID identifier
 * @param attribute - The attribute name (e.g., 'first_name', 'title', 'seniority')
 * @param params - Optional parameters for search, distinct, pagination, ordering, and request tracking
 * @returns Promise resolving to array of distinct string values
 */
export const fetchCompanyContactAttribute = async (
  companyUuid: string,
  attribute: string,
  params?: FetchCompanyContactAttributeParams
): Promise<string[]> => {
  try {
    if (!companyUuid || typeof companyUuid !== 'string') {
      throw new Error('Invalid company UUID');
    }

    if (!attribute || typeof attribute !== 'string') {
      throw new Error('Invalid attribute name');
    }

    const {
      search,
      distinct = true,
      limit = 25,
      offset = 0,
      ordering,
      requestId,
    } = params || {};

    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (distinct) query.set('distinct', 'true');
    if (ordering) query.set('ordering', ordering);
    query.set('limit', String(limit));
    query.set('offset', String(offset));

    const headers: HeadersInit = {};
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/companies/company/${companyUuid}/contacts/${attribute}/?${query.toString()}`,
      {
        method: 'GET',
        useQueue: true,
        useCache: true,
        headers,
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('[COMPANY] Company not found for contact attribute:', companyUuid);
        return [];
      }
      const error = await parseApiError(
        response,
        `Failed to fetch contact attribute ${attribute}`
      );
      throw error;
    }

    const data: CompanyContactAttributeResponse = await response.json();
    return (data.results || []) as string[];
  } catch (error) {
    const parsedError = parseExceptionError(
      error,
      `Failed to fetch contact attribute ${attribute}`
    );
    const errorLog = formatErrorForLogging(parsedError);
    console.error(
      `[COMPANY] Failed to fetch contact attribute ${attribute}:`,
      errorLog
    );
    return [];
  }
};

/**
 * Fetch distinct first names for contacts in a specific company
 * 
 * **Endpoint:** `GET /api/v1/companies/company/{company_uuid}/contacts/first_name/`
 * 
 * @param companyUuid - Company UUID identifier
 * @param params - Optional parameters for search, pagination, and request tracking
 * @returns Promise resolving to array of distinct first names
 */
export const fetchCompanyContactFirstNames = async (
  companyUuid: string,
  params?: FetchCompanyContactAttributeParams
): Promise<string[]> => {
  return fetchCompanyContactAttribute(companyUuid, 'first_name', params);
};

/**
 * Fetch distinct last names for contacts in a specific company
 * 
 * **Endpoint:** `GET /api/v1/companies/company/{company_uuid}/contacts/last_name/`
 * 
 * @param companyUuid - Company UUID identifier
 * @param params - Optional parameters for search, pagination, and request tracking
 * @returns Promise resolving to array of distinct last names
 */
export const fetchCompanyContactLastNames = async (
  companyUuid: string,
  params?: FetchCompanyContactAttributeParams
): Promise<string[]> => {
  return fetchCompanyContactAttribute(companyUuid, 'last_name', params);
};

/**
 * Fetch distinct titles for contacts in a specific company
 * 
 * **Endpoint:** `GET /api/v1/companies/company/{company_uuid}/contacts/title/`
 * 
 * @param companyUuid - Company UUID identifier
 * @param params - Optional parameters for search, pagination, and request tracking
 * @returns Promise resolving to array of distinct titles
 */
export const fetchCompanyContactTitles = async (
  companyUuid: string,
  params?: FetchCompanyContactAttributeParams
): Promise<string[]> => {
  return fetchCompanyContactAttribute(companyUuid, 'title', params);
};

/**
 * Fetch distinct seniorities for contacts in a specific company
 * 
 * **Endpoint:** `GET /api/v1/companies/company/{company_uuid}/contacts/seniority/`
 * 
 * @param companyUuid - Company UUID identifier
 * @param params - Optional parameters for search, pagination, and request tracking
 * @returns Promise resolving to array of distinct seniorities
 */
export const fetchCompanyContactSeniorities = async (
  companyUuid: string,
  params?: FetchCompanyContactAttributeParams
): Promise<string[]> => {
  return fetchCompanyContactAttribute(companyUuid, 'seniority', params);
};

/**
 * Fetch distinct departments for contacts in a specific company
 * 
 * **Endpoint:** `GET /api/v1/companies/company/{company_uuid}/contacts/department/`
 * 
 * Note: Departments are stored as arrays and are automatically expanded into individual values.
 * 
 * @param companyUuid - Company UUID identifier
 * @param params - Optional parameters for search, pagination, and request tracking
 * @returns Promise resolving to array of distinct departments
 */
export const fetchCompanyContactDepartments = async (
  companyUuid: string,
  params?: FetchCompanyContactAttributeParams
): Promise<string[]> => {
  return fetchCompanyContactAttribute(companyUuid, 'department', params);
};

/**
 * Fetch distinct email statuses for contacts in a specific company
 * 
 * **Endpoint:** `GET /api/v1/companies/company/{company_uuid}/contacts/email_status/`
 * 
 * @param companyUuid - Company UUID identifier
 * @param params - Optional parameters for search, pagination, and request tracking
 * @returns Promise resolving to array of distinct email statuses
 */
export const fetchCompanyContactEmailStatuses = async (
  companyUuid: string,
  params?: FetchCompanyContactAttributeParams
): Promise<string[]> => {
  return fetchCompanyContactAttribute(companyUuid, 'email_status', params);
};

