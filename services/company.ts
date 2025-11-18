/**
 * Company Service
 * 
 * Handles all company-related API operations including fetching, filtering, searching, field-specific queries, and CRUD operations.
 * 
 * **Read Operations (GET):**
 * - List companies with filtering, searching, and pagination
 * - Get company by ID
 * - Count companies with optional filters
 * - Fetch distinct field values (attribute lookups)
 * 
 * **Write Operations (POST/PUT/DELETE):**
 * - Create company (requires admin authentication and X-Companies-Write-Key header)
 * - Update company (requires admin authentication and X-Companies-Write-Key header)
 * - Delete company (requires admin authentication and X-Companies-Write-Key header)
 * 
 * All endpoints require authentication via Bearer token except where noted.
 * Write operations additionally require the X-Companies-Write-Key header.
 */

import {
  Company,
  CompanyCreate,
  CompanyUpdate,
  CompanyFilters,
  FetchCompaniesParams,
  FetchCompaniesResult,
  ApiCompany,
  CursorListResponse,
  OffsetListResponse,
  CountResponse,
  AttributeValueResponse,
  ServiceResponse,
  CompanyContact,
  CompanyContactFilters,
  FetchCompanyContactsParams,
  FetchCompanyContactsResult,
  ApiCompanyContact,
  CompanyContactCursorListResponse,
  CompanyContactOffsetListResponse,
  CompanyContactAttributeResponse,
  FetchCompanyContactAttributeParams,
} from '@/types/company';
import { API_BASE_URL } from './api';
import { axiosAuthenticatedRequest } from '@utils/request';
import { NEXT_PUBLIC_COMPANIES_WRITE_KEY } from '@utils/config';
import {
  parseApiError,
  parseExceptionError,
  formatErrorMessage,
  formatErrorForLogging,
  ParsedError,
} from '@utils/error';

// Simple in-memory cache for count requests (5 minute TTL)
interface CacheEntry {
  data: number;
  timestamp: number;
}

const COUNT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const countCache = new Map<string, CacheEntry>();

/**
 * Clear expired cache entries
 */
const clearExpiredCache = (): void => {
  const now = Date.now();
  for (const [key, entry] of countCache.entries()) {
    if (now - entry.timestamp > COUNT_CACHE_TTL) {
      countCache.delete(key);
    }
  }
};

/**
 * Get cached count or null if not found/expired
 */
const getCachedCount = (cacheKey: string): number | null => {
  clearExpiredCache();
  const entry = countCache.get(cacheKey);
  if (entry && Date.now() - entry.timestamp < COUNT_CACHE_TTL) {
    return entry.data;
  }
  return null;
};

/**
 * Set cached count
 */
const setCachedCount = (cacheKey: string, count: number): void => {
  countCache.set(cacheKey, {
    data: count,
    timestamp: Date.now(),
  });
};

/**
 * Clear count cache (useful for testing or manual invalidation)
 */
export const clearCountCache = (): void => {
  countCache.clear();
};

/**
 * Maps UI sort column names to API field names
 */
const mapSortColumn = (column: string): string => {
  const mapping: { [key: string]: string } = {
    name: 'name',
    employeesCount: 'employees_count',
    annualRevenue: 'annual_revenue',
    totalFunding: 'total_funding',
    created_at: 'created_at',
    updated_at: 'updated_at',
  };

  if (mapping[column]) {
    return mapping[column];
  }

  // Convert camelCase to snake_case
  return column.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Maps UI filter keys to API parameter names
 * 
 * Handles conversion from camelCase UI keys to snake_case API parameters.
 */
const mapFilterKey = (key: string): string => {
  // Special mappings for fields that don't follow standard conversion
  const mapping: { [key: string]: string } = {
    // Already snake_case
    company_location: 'company_location',
    employees_count: 'employees_count',
    annual_revenue: 'annual_revenue',
    total_funding: 'total_funding',
    employees_min: 'employees_min',
    employees_max: 'employees_max',
    annual_revenue_min: 'annual_revenue_min',
    annual_revenue_max: 'annual_revenue_max',
    total_funding_min: 'total_funding_min',
    total_funding_max: 'total_funding_max',
    created_at_after: 'created_at_after',
    created_at_before: 'created_at_before',
    updated_at_after: 'updated_at_after',
    updated_at_before: 'updated_at_before',
    phone_number: 'phone_number',
    linkedin_url: 'linkedin_url',
    facebook_url: 'facebook_url',
    twitter_url: 'twitter_url',
    text_search: 'text_search',
  };

  // Return mapped value if exists, otherwise convert camelCase to snake_case
  if (mapping[key]) {
    return mapping[key];
  }

  // Convert camelCase to snake_case
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Maps snake_case API response to camelCase Company type
 * 
 * Converts the API response format (snake_case) to the frontend Company type (camelCase).
 * Handles all fields from the API documentation including optional fields.
 * 
 * @param apiCompany - The company object from the API response
 * @returns Company object in camelCase format
 * @throws Error if company data is invalid
 */
const mapApiToCompany = (apiCompany: ApiCompany | any): Company => {
  if (!apiCompany || typeof apiCompany !== 'object') {
    throw new Error('Invalid company data received from API');
  }

  return {
    uuid: apiCompany.uuid,
    name: apiCompany.name || '',
    employeesCount: apiCompany.employees_count,
    annualRevenue: apiCompany.annual_revenue,
    totalFunding: apiCompany.total_funding,
    industries: apiCompany.industries,
    keywords: apiCompany.keywords,
    technologies: apiCompany.technologies,
    address: apiCompany.address,
    textSearch: apiCompany.text_search,
    metadata: apiCompany.metadata,
    createdAt: apiCompany.created_at,
    updatedAt: apiCompany.updated_at,
  };
};

/**
 * Build query string from filters
 * 
 * Converts CompanyFilters object and search term into URLSearchParams for API requests.
 * Filters out empty values and properly maps filter keys to API parameter names.
 * 
 * @param filters - CompanyFilters object with filter criteria
 * @param search - Full-text search term
 * @returns URLSearchParams object ready for API request
 */
const buildFilterQuery = (
  filters?: CompanyFilters,
  search?: string
): URLSearchParams => {
  const query = new URLSearchParams();

  // Add search parameter if provided
  if (search && search.trim()) {
    query.set('search', search.trim());
  }

  // Add filter parameters
  if (filters) {
    for (const key in filters) {
      const value = filters[key];

      // Skip undefined and null
      if (value === undefined || value === null) {
        continue;
      }

      // Handle exclusion filters (arrays)
      if (key.startsWith('exclude_') && Array.isArray(value)) {
        if (value.length > 0) {
          const apiKey = mapFilterKey(key);
          // Add each value as a separate query parameter (repeated params)
          value.forEach((v) => {
            if (v && v.toString().trim()) {
              query.append(apiKey, v.toString().trim());
            }
          });
        }
        continue;
      }

      // Skip empty values
      if (value === '') {
        continue;
      }

      const apiKey = mapFilterKey(key);

      // Convert to string, handling both string and number values
      query.set(apiKey, String(value));
    }
  }

  return query;
};

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
 * Fetch distinct values for a specific field
 * 
 * Retrieves field-specific data from the API. Returns value and count for each distinct value.
 * 
 * **Supported Fields:**
 * - name, industry, keywords, technologies
 * - city, state, country
 * - address (company location from text_search)
 * 
 * **Parameters:**
 * - `search`: Search term to filter results (case-insensitive)
 * - `distinct`: If `true`, returns only distinct field values (default: `true`)
 * - `separated`: If `true`, expands array fields into individual values (for industries, keywords, technologies)
 * - `limit`: Number of results per page (max 100, default: 25)
 * - `offset`: Offset for pagination
 * - `ordering`: Sort by field. Valid: 'value', '-value', 'count', '-count'
 * - `requestId`: Optional X-Request-Id header value for request tracking
 * 
 * @param field - The field name (e.g., 'name', 'industry', 'city')
 * @param params - Optional parameters for search, distinct, pagination, ordering, and request tracking
 * @returns Promise resolving to array of objects with `value` and `count`
 */
export const fetchFieldValues = async (
  field: string,
  params?: {
    search?: string;
    distinct?: boolean;
    separated?: boolean;
    limit?: number;
    offset?: number;
    ordering?: string;
    requestId?: string;
  }
): Promise<Array<{ value: string; count: number }>> => {
  try {
    if (!field || typeof field !== 'string') {
      throw new Error('Invalid field name');
    }

    const {
      search,
      distinct = true,
      separated,
      limit = 25,
      offset = 0,
      ordering,
      requestId,
    } = params || {};

    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (distinct) query.set('distinct', 'true');
    if (separated) query.set('separated', 'true');
    if (ordering) query.set('ordering', ordering);
    query.set('limit', String(limit));
    query.set('offset', String(offset));

    const headers: HeadersInit = {};
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/companies/${field}/?${query.toString()}`,
      {
        method: 'GET',
        useQueue: true,
        useCache: true,
        headers,
      }
    );

    if (!response.ok) {
      const error = await parseApiError(
        response,
        `Failed to fetch field values for ${field}`
      );
      throw error;
    }

    const data: AttributeValueResponse = await response.json();
    return (data.results || []) as Array<{ value: string; count: number }>;
  } catch (error) {
    const parsedError = parseExceptionError(
      error,
      `Failed to fetch field values for ${field}`
    );
    const errorLog = formatErrorForLogging(parsedError);
    console.error(
      `[COMPANY] Failed to fetch field values for ${field}:`,
      errorLog
    );
    return [];
  }
};

/**
 * Fetch distinct values for a specific field
 * 
 * Convenience function that fetches distinct field values and returns them as a string array.
 * Automatically handles pagination to get all distinct values (up to 1000).
 * 
 * @param field - The field name (e.g., 'name', 'industry', 'city')
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to array of distinct string values
 */
export const fetchDistinctValues = async (
  field: string,
  requestId?: string
): Promise<string[]> => {
  try {
    const rows = await fetchFieldValues(field, {
      distinct: true,
      limit: 1000,
      offset: 0,
      requestId,
    });
    return rows
      .map((item) => String(item.value || ''))
      .filter((v) => Boolean(v) && v !== 'undefined');
  } catch (error) {
    console.error(
      `[COMPANY] Failed to fetch distinct values for ${field}:`,
      error
    );
    return [];
  }
};

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

// ============================================================================
// Company Contacts Endpoints
// ============================================================================

// Simple in-memory cache for company contacts count requests (5 minute TTL)
const CONTACT_COUNT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const contactCountCache = new Map<string, CacheEntry>();

/**
 * Clear expired contact count cache entries
 */
const clearExpiredContactCountCache = (): void => {
  const now = Date.now();
  for (const [key, entry] of contactCountCache.entries()) {
    if (now - entry.timestamp > CONTACT_COUNT_CACHE_TTL) {
      contactCountCache.delete(key);
    }
  }
};

/**
 * Get cached contact count or null if not found/expired
 */
const getCachedContactCount = (cacheKey: string): number | null => {
  clearExpiredContactCountCache();
  const entry = contactCountCache.get(cacheKey);
  if (entry && Date.now() - entry.timestamp < CONTACT_COUNT_CACHE_TTL) {
    return entry.data;
  }
  return null;
};

/**
 * Set cached contact count
 */
const setCachedContactCount = (cacheKey: string, count: number): void => {
  contactCountCache.set(cacheKey, {
    data: count,
    timestamp: Date.now(),
  });
};

/**
 * Clear contact count cache (useful for testing or manual invalidation)
 */
export const clearContactCountCache = (): void => {
  contactCountCache.clear();
};

/**
 * Maps snake_case API response to camelCase CompanyContact type
 * 
 * Converts the API response format (snake_case) to the frontend CompanyContact type (camelCase).
 * Handles all fields from the API documentation including optional fields.
 * 
 * @param apiContact - The contact object from the API response
 * @returns CompanyContact object in camelCase format
 * @throws Error if contact data is invalid
 */
const mapApiToCompanyContact = (apiContact: ApiCompanyContact | any): CompanyContact => {
  if (!apiContact || typeof apiContact !== 'object') {
    throw new Error('Invalid contact data received from API');
  }

  return {
    uuid: apiContact.uuid,
    firstName: apiContact.first_name,
    lastName: apiContact.last_name,
    email: apiContact.email,
    title: apiContact.title,
    seniority: apiContact.seniority,
    departments: apiContact.departments,
    emailStatus: apiContact.email_status,
    mobilePhone: apiContact.mobile_phone,
    company: apiContact.company,
    metadata: apiContact.metadata,
    createdAt: apiContact.created_at,
    updatedAt: apiContact.updated_at,
  };
};

/**
 * Build query string from company contact filters
 * 
 * Converts CompanyContactFilters object and search term into URLSearchParams for API requests.
 * Filters out empty values and properly maps filter keys to API parameter names.
 * 
 * @param filters - CompanyContactFilters object with filter criteria
 * @param search - Full-text search term
 * @returns URLSearchParams object ready for API request
 */
const buildCompanyContactFilterQuery = (
  filters?: CompanyContactFilters,
  search?: string
): URLSearchParams => {
  const query = new URLSearchParams();

  // Add search parameter if provided
  if (search && search.trim()) {
    query.set('search', search.trim());
  }

  // Add filter parameters
  if (filters) {
    for (const key in filters) {
      const value = filters[key];

      // Skip undefined and null
      if (value === undefined || value === null) {
        continue;
      }

      // Handle exclusion filters (arrays)
      if (key.startsWith('exclude_') && Array.isArray(value)) {
        if (value.length > 0) {
          // Add each value as a separate query parameter (repeated params)
          value.forEach((v) => {
            if (v && v.toString().trim()) {
              query.append(key, v.toString().trim());
            }
          });
        }
        continue;
      }

      // Skip empty values
      if (value === '') {
        continue;
      }

      // Convert to string, handling both string and array values
      query.set(key, String(value));
    }
  }

  return query;
};

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

