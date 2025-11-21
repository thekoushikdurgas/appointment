/**
 * Company Service Fetch Operations
 * 
 * Functions for fetching companies, counts, and UUIDs.
 */

import {
  Company,
  CompanyFilters,
  FetchCompaniesParams,
  FetchCompaniesResult,
  ApiCompany,
  CursorListResponse,
  OffsetListResponse,
  CountResponse,
} from '@/types/company';
import { API_BASE_URL } from '../api';
import { axiosAuthenticatedRequest } from '@utils/request';
import { parseApiError, parseExceptionError, formatErrorForLogging } from '@utils/error';
import { buildFilterQuery, mapSortColumn } from './filters';
import { mapApiToCompany } from './mappers';
import { getCachedCount, setCachedCount } from './cache';

/**
 * Fetch companies with search, filters, sorting, and pagination
 * 
 * Retrieves a paginated list of companies with optional filtering, searching, and ordering.
 * Supports both cursor-based pagination (default) and limit-offset pagination (with custom ordering).
 * 
 * **Pagination Modes:**
 * - **Cursor pagination** (default): Used when no sortColumn is provided. Orders by `-created_at` (newest first).
 *   Uses `page_size` and `cursor` parameters. Better performance for large datasets.
 * - **Limit-offset pagination**: Used when `sortColumn` is provided. Uses `limit` and `offset` parameters.
 * 
 * **Filtering:**
 * - Supports all CompanyFilters options including text filters, exact matches, numeric ranges, and date ranges.
 * - Date filters must be in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`
 * 
 * **Error Handling:**
 * - Returns error in result object rather than throwing
 * - Handles 400 (Bad Request), 500 (Internal Server Error) responses
 * 
 * @param params - FetchCompaniesParams with search, filters, sorting, and pagination options
 * @returns Promise resolving to FetchCompaniesResult with companies array, count, and pagination links
 */
export const fetchCompanies = async (
  params: FetchCompaniesParams
): Promise<FetchCompaniesResult> => {
  const {
    search,
    filters,
    sortColumn,
    sortDirection,
    limit = 25,
    offset = 0,
    pageSize = 25,
    cursor,
    requestId,
    distinct,
  } = params;

  const query = buildFilterQuery(filters, search);

  // Add advanced controls
  if (distinct === true) {
    query.set('distinct', 'true');
  }

  // Determine pagination mode
  const usingCustomOrdering = Boolean(sortColumn);

  if (usingCustomOrdering) {
    const directionPrefix = sortDirection === 'desc' ? '-' : '';
    const apiSortColumn = mapSortColumn(sortColumn as string);
    query.set('ordering', `${directionPrefix}${apiSortColumn}`);
    query.set('limit', limit.toString());
    query.set('offset', offset.toString());
  } else {
    query.set('page_size', pageSize.toString());
    if (cursor) {
      query.set('cursor', cursor);
    }
  }

  // Prepare headers with optional X-Request-Id
  const headers: HeadersInit = {};
  if (requestId) {
    headers['X-Request-Id'] = requestId;
  }

  try {
    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/companies/?${query.toString()}`,
      {
        method: 'GET',
        useQueue: true,
        useCache: true,
        headers,
      }
    );

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to fetch companies');
      console.error('[COMPANY] Failed to fetch companies:', {
        message: error.message,
        statusCode: error.statusCode,
        isNetworkError: error.isNetworkError,
        isTimeoutError: error.isTimeoutError,
      });
      return {
        companies: [],
        count: 0,
        next: null,
        previous: null,
        error,
      };
    }

    const data: CursorListResponse | OffsetListResponse = await response.json();

    const companies = (data.results || [])
      .map((item: ApiCompany) => {
        try {
          return mapApiToCompany(item);
        } catch (error) {
          console.warn('[COMPANY] Failed to map company:', item, error);
          return null;
        }
      })
      .filter((company): company is Company => company !== null);

    // Fetch count with caching
    const countQuery = buildFilterQuery(filters, search);
    const countCacheKey = countQuery.toString();

    let count = getCachedCount(countCacheKey);

    if (count === null) {
      try {
        const countUrl = countQuery.toString()
          ? `${API_BASE_URL}/api/v1/companies/count/?${countQuery.toString()}`
          : `${API_BASE_URL}/api/v1/companies/count/`;

        const countResp = await axiosAuthenticatedRequest(countUrl, {
          method: 'GET',
          headers: requestId ? { 'X-Request-Id': requestId } : undefined,
          useQueue: true,
          useCache: true,
        });

        if (countResp.ok) {
          const countData: CountResponse = await countResp.json();
          count = countData.count || 0;
          setCachedCount(countCacheKey, count);
        } else {
          console.warn(
            '[COMPANY] Count endpoint returned non-OK status:',
            countResp.status
          );
          count = (data as OffsetListResponse).count || 0;
        }
      } catch (e) {
        console.error('[COMPANY] Failed to fetch company count:', e);
        count = (data as OffsetListResponse).count || 0;
      }
    }

    return {
      companies,
      count: count || 0,
      next: data.next ?? null,
      previous: data.previous ?? null,
      meta: data.meta,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to fetch companies');
    console.error('[COMPANY] Failed to fetch companies:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      companies: [],
      count: 0,
      next: null,
      previous: null,
      error: parsedError,
    };
  }
};

/**
 * Get company by UUID
 * 
 * Fetches a single company by its UUID.
 * 
 * **Error Handling:**
 * - Returns null if company not found (404)
 * - Throws error for other failures
 * 
 * @param uuid - The company UUID
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to Company object or null if not found
 */
export const getCompanyByUuid = async (
  uuid: string,
  requestId?: string
): Promise<Company | null> => {
  try {
    if (!uuid || typeof uuid !== 'string') {
      throw new Error('Invalid company UUID');
    }

    const headers: HeadersInit = {};
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/companies/${uuid}/`,
      {
        method: 'GET',
        useQueue: true,
        useCache: true,
        headers,
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await parseApiError(
        response,
        `Failed to fetch company ${uuid}`
      );
      throw error;
    }

    const data: ApiCompany = await response.json();
    return mapApiToCompany(data);
  } catch (error) {
    const parsedError = parseExceptionError(
      error,
      `Failed to fetch company ${uuid}`
    );
    console.error(`[COMPANY] Failed to fetch company ${uuid}:`, formatErrorForLogging(parsedError));
    return null;
  }
};

/**
 * Get company count with optional filters
 * 
 * Retrieves the total count of companies, optionally filtered.
 * Results are cached for 5 minutes to improve performance.
 * 
 * **Error Handling:**
 * - Returns 0 if count operation fails or times out
 * 
 * @param filters - Optional CompanyFilters to filter the count
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to company count (0 if error occurs)
 */
export const getCompanyCount = async (
  filters?: CompanyFilters,
  requestId?: string
): Promise<number> => {
  try {
    const query = buildFilterQuery(filters);
    const cacheKey = query.toString();

    // Check cache first
    const cached = getCachedCount(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const queryString = query.toString();
    const url = queryString
      ? `${API_BASE_URL}/api/v1/companies/count/?${queryString}`
      : `${API_BASE_URL}/api/v1/companies/count/`;

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
      const error = await parseApiError(response, 'Failed to fetch company count');
      throw error;
    }

    const data: CountResponse = await response.json();
    const count = data.count || 0;

    // Cache the result
    setCachedCount(cacheKey, count);

    return count;
  } catch (error) {
    const parsedError = parseExceptionError(
      error,
      'Failed to fetch company count'
    );
    console.error('[COMPANY] Failed to fetch company count:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return 0;
  }
};

/**
 * Get Company UUIDs
 * 
 * Get a list of company UUIDs that match the provided filters. Returns count and list of UUIDs.
 * Useful for bulk operations or exporting specific company sets.
 * 
 * **Endpoint:** GET /api/v1/companies/count/uuids/
 * 
 * **Query Parameters:**
 * This endpoint accepts ALL the same query parameters as `/api/v1/companies/count/` endpoint, plus:
 * - `limit` (integer, optional): Maximum number of UUIDs to return. **If not provided, returns all matching UUIDs (unlimited).** When provided, limits results to the specified number.
 * 
 * All filter parameters from `/api/v1/companies/` are supported:
 * - All text filters (name, address, city, state, country, etc.)
 * - All numeric range filters (employees_min, employees_max, annual_revenue_min, annual_revenue_max, total_funding_min, total_funding_max, etc.)
 * - All array filters (industries, keywords, technologies, etc.)
 * - All exclude filters (exclude_industries, exclude_keywords, exclude_technologies, exclude_locations, etc.)
 * - All location filters (city, state, country, address, company_location, etc.)
 * - All contact information filters (phone_number, website, linkedin_url, facebook_url, twitter_url, etc.)
 * - All date range filters (created_at_after, created_at_before, updated_at_after, updated_at_before, etc.)
 * - Distinct parameter
 * 
 * **Response:**
 * ```json
 * {
 *   "count": 1234,
 *   "uuids": ["uuid1", "uuid2", "uuid3", ...]
 * }
 * ```
 * 
 * **Error Handling:**
 * - Returns empty array and count 0 if operation fails
 * 
 * **Notes:**
 * - Returns all matching UUIDs by default (unlimited) unless `limit` parameter is provided
 * - Useful for bulk operations, exports, or when you only need UUIDs without full company data
 * - All the same filtering capabilities as the count endpoint
 * 
 * @param filters - Optional CompanyFilters to filter the UUIDs
 * @param params - Optional parameters including limit and requestId
 * @returns Promise resolving to object with count and uuids array
 * 
 * @example
 * ```typescript
 * // Get all UUIDs matching filters
 * const result = await getCompanyUuids(
 *   { industries: 'Technology', employees_min: 100 },
 *   { limit: 1000 }
 * );
 * 
 * if (result) {
 *   console.log('Total:', result.count);
 *   console.log('UUIDs:', result.uuids);
 * }
 * ```
 */
export const getCompanyUuids = async (
  filters?: CompanyFilters,
  params?: {
    limit?: number;
    requestId?: string;
  }
): Promise<{ count: number; uuids: string[] }> => {
  try {
    const query = buildFilterQuery(filters);
    
    // Add limit if provided
    if (params?.limit !== undefined) {
      query.set('limit', params.limit.toString());
    }

    const queryString = query.toString();
    const url = queryString
      ? `${API_BASE_URL}/api/v1/companies/count/uuids/?${queryString}`
      : `${API_BASE_URL}/api/v1/companies/count/uuids/`;

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
      const error = await parseApiError(response, 'Failed to fetch company UUIDs');
      throw error;
    }

    const data: { count: number; uuids: string[] } = await response.json();
    return {
      count: data.count || 0,
      uuids: data.uuids || [],
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to fetch company UUIDs');
    console.error('[COMPANY] Failed to fetch company UUIDs:', {
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
 * Progress callback for paginated UUID fetching
 */
export type UuidFetchProgressCallback = (progress: {
  fetched: number;
  total: number;
  percentage: number;
}) => void;

/**
 * Fetch Company UUIDs with Pagination
 * 
 * Fetches company UUIDs in batches to handle large datasets efficiently.
 * Reports progress via callback and supports cancellation.
 * 
 * @param filters - Optional CompanyFilters to filter the UUIDs
 * @param params - Optional parameters including batchSize, onProgress, and cancellation signal
 * @returns Promise resolving to object with count and uuids array
 * 
 * @example
 * ```typescript
 * const abortController = new AbortController();
 * const result = await fetchCompanyUuidsPaginated(
 *   { industries: 'Technology' },
 *   {
 *     batchSize: 1000,
 *     onProgress: ({ fetched, total, percentage }) => {
 *       console.log(`Fetched ${fetched}/${total} (${percentage}%)`);
 *     },
 *     signal: abortController.signal
 *   }
 * );
 * ```
 */
export const fetchCompanyUuidsPaginated = async (
  filters?: CompanyFilters,
  params?: {
    batchSize?: number;
    maxUuids?: number;
    onProgress?: UuidFetchProgressCallback;
    signal?: AbortSignal;
    requestId?: string;
  }
): Promise<{ count: number; uuids: string[] }> => {
  const batchSize = params?.batchSize || 1000;
  const maxUuids = params?.maxUuids;
  const onProgress = params?.onProgress;
  const signal = params?.signal;
  const requestId = params?.requestId;

  const allUuids: string[] = [];
  let offset = 0;
  let totalCount = 0;
  let hasMore = true;

  try {
    // First, get the total count
    const countQuery = buildFilterQuery(filters);
    const countQueryString = countQuery.toString();
    const countUrl = countQueryString
      ? `${API_BASE_URL}/api/v1/companies/count/?${countQueryString}`
      : `${API_BASE_URL}/api/v1/companies/count/`;

    const countHeaders: HeadersInit = {};
    if (requestId) {
      countHeaders['X-Request-Id'] = requestId;
    }

    const countResponse = await axiosAuthenticatedRequest(countUrl, {
      method: 'GET',
      headers: countHeaders,
      useQueue: true,
      useCache: true,
    });

    if (!countResponse.ok) {
      const error = await parseApiError(countResponse, 'Failed to fetch company count');
      throw error;
    }

    const countData: CountResponse = await countResponse.json();
    totalCount = countData.count || 0;

    // If maxUuids is specified, limit totalCount
    if (maxUuids !== undefined && totalCount > maxUuids) {
      totalCount = maxUuids;
    }

    // Fetch UUIDs in batches
    while (hasMore && !signal?.aborted) {
      const query = buildFilterQuery(filters);
      query.set('limit', batchSize.toString());
      query.set('offset', offset.toString());

      const queryString = query.toString();
      const url = `${API_BASE_URL}/api/v1/companies/count/uuids/?${queryString}`;

      const headers: HeadersInit = {};
      if (requestId) {
        headers['X-Request-Id'] = requestId;
      }

      const response = await axiosAuthenticatedRequest(url, {
        method: 'GET',
        headers,
        useQueue: true,
        useCache: false, // Don't cache paginated requests
        timeout: 336000000, // 1 hour timeout for UUID fetch
        priority: 5, // Higher priority for export-related requests
      });

      if (!response.ok) {
        const error = await parseApiError(response, 'Failed to fetch company UUIDs');
        throw error;
      }

      const data: { count: number; uuids: string[] } = await response.json();
      const batchUuids = data.uuids || [];

      if (batchUuids.length === 0) {
        hasMore = false;
        break;
      }

      allUuids.push(...batchUuids);

      // Check if we've reached the max
      if (maxUuids !== undefined && allUuids.length >= maxUuids) {
        allUuids.splice(maxUuids);
        hasMore = false;
        break;
      }

      // Report progress
      if (onProgress) {
        const percentage = totalCount > 0 
          ? Math.min(100, Math.round((allUuids.length / totalCount) * 100))
          : 0;
        onProgress({
          fetched: allUuids.length,
          total: totalCount,
          percentage,
        });
      }

      // Check if we have more to fetch
      if (batchUuids.length < batchSize) {
        hasMore = false;
      } else {
        offset += batchSize;
      }
    }

    // Handle cancellation
    if (signal?.aborted) {
      return {
        count: totalCount,
        uuids: allUuids,
      };
    }

    return {
      count: totalCount,
      uuids: allUuids,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to fetch company UUIDs');
    console.error('[COMPANY] Failed to fetch company UUIDs (paginated):', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      count: totalCount || 0,
      uuids: allUuids,
    };
  }
};

