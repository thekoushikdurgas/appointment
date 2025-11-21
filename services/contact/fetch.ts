/**
 * Contact Service Fetch Operations
 * 
 * Functions for fetching contacts, counts, and UUIDs.
 */

import { Contact } from '@/types/index';
import { API_BASE_URL } from '../api';
import { axiosAuthenticatedRequest } from '@utils/request';
import { parseApiError, parseExceptionError, ParsedError } from '@utils/error';
import { ContactFilters, FetchContactsParams, FetchContactsResult, ApiContact, ContactSimpleItem, CursorListResponse, OffsetListResponse, CountResponse } from './types';
import { buildFilterQuery } from './filters';
import { mapApiToContact, mapSimpleItemToContact } from './mappers';
import { mapSortColumn } from './filters';
import { getCachedCount, setCachedCount } from './cache';

/**
 * Fetch contacts with search, filters, sorting, and pagination
 * 
 * Retrieves a paginated list of contacts with optional filtering, searching, and ordering.
 * Supports both cursor-based pagination (default) and limit-offset pagination (with custom ordering).
 * 
 * **Pagination Modes:**
 * - **Cursor pagination** (default): Used when no sortColumn is provided. Orders by `-created_at` (newest first).
 *   Uses `page_size` and `cursor` parameters. Better performance for large datasets.
 * - **Limit-offset pagination**: Used when `sortColumn` is provided. Uses `limit` and `offset` parameters.
 * 
 * **Filtering:**
 * - Supports all ContactFilters options including text filters, exact matches, numeric ranges, and date ranges.
 * - Date filters must be in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` (e.g., "2024-01-01T00:00:00Z")
 * 
 * **Error Handling:**
 * - Returns error in result object rather than throwing
 * - Handles 400 (Bad Request), 500 (Internal Server Error) responses
 * 
 * @param params - FetchContactsParams with search, filters, sorting, and pagination options
 * @returns Promise resolving to FetchContactsResult with contacts array, count, and pagination links
 * 
 * @example
 * ```typescript
 * // Cursor pagination (default)
 * const result = await fetchContacts({
 *   search: 'technology',
 *   filters: { country: 'United States', employees_min: 50 },
 *   pageSize: 25,
 *   cursor: 'cj0xJnN1YiI6IjE2ODAwMDAwMDAwMDAwMDAwMDAwMCJ9'
 * });
 * 
 * // Limit-offset pagination (custom ordering)
 * const result = await fetchContacts({
 *   filters: { industry: 'Technology' },
 *   sortColumn: 'employees',
 *   sortDirection: 'desc',
 *   limit: 25,
 *   offset: 0
 * });
 * 
 * // Date range filtering
 * const result = await fetchContacts({
 *   filters: {
 *     created_at_after: '2024-01-01T00:00:00Z',
 *     created_at_before: '2024-12-31T23:59:59Z'
 *   }
 * });
 * ```
 */
export const fetchContacts = async (params: FetchContactsParams): Promise<FetchContactsResult> => {
    const {
      search,
      filters,
      sortColumn,
      sortDirection,
      limit = 20,
      offset = 0,
      pageSize = 25,
      cursor,
      requestId,
      view,
      include_meta,
      use_replica,
    } = params;

    const query = buildFilterQuery(filters, search);

    // Add advanced controls
    if (view === 'simple') {
        query.set('view', 'simple');
    }
    if (include_meta === true) {
        query.set('include_meta', 'true');
    }
    if (use_replica === true) {
        query.set('use_replica', 'true');
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
        const response = await axiosAuthenticatedRequest(`${API_BASE_URL}/api/v1/contacts/?${query.toString()}`, {
          method: 'GET',
          headers,
          useQueue: true,
          useCache: true,
        });

        if (!response.ok) {
          const error = await parseApiError(response, 'Failed to fetch contacts');
          console.error('[CONTACT] Failed to fetch contacts:', {
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

        const data: CursorListResponse | OffsetListResponse = await response.json();
        
        // Check if this is a simple view response
        const isSimpleView = view === 'simple' || (data.results && data.results.length > 0 && 'uuid' in data.results[0] && 'location' in data.results[0]);
        
        const contacts = (data.results || []).map((item: ApiContact | ContactSimpleItem) => {
          try {
            // Handle ContactSimpleItem
            if (isSimpleView && 'uuid' in item && 'location' in item) {
              const simpleItem = item as ContactSimpleItem;
              return mapSimpleItemToContact(simpleItem);
            }
            // Handle ApiContact
            return mapApiToContact(item as ApiContact);
          } catch (error) {
            console.warn('[CONTACT] Failed to map contact:', item, error);
            return null;
          }
        }).filter((contact): contact is Contact => contact !== null);

        // Fetch count with caching
        const countQuery = buildFilterQuery(filters, search);
        const countCacheKey = countQuery.toString();
        
        let count = getCachedCount(countCacheKey);
        
        if (count === null) {
          try {
            const countUrl = countQuery.toString() 
              ? `${API_BASE_URL}/api/v1/contacts/count/?${countQuery.toString()}`
              : `${API_BASE_URL}/api/v1/contacts/count/`;
            
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
              console.warn('[CONTACT] Count endpoint returned non-OK status:', countResp.status);
              count = (data as OffsetListResponse).count || 0;
            }
          } catch (e) {
            // Handle timeout and other errors gracefully
            const errorMessage = e instanceof Error ? e.message : String(e);
            if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
              console.warn('[CONTACT] Count endpoint timed out, using fallback count from list response');
            } else {
              console.error('[CONTACT] Failed to fetch contact count:', e);
            }
            // Fallback to count from list response if available
            count = (data as OffsetListResponse).count || 0;
          }
        }

        return {
            contacts,
            count: count || 0,
            next: data.next ?? null,
            previous: data.previous ?? null,
            meta: data.meta,
        };
    } catch (error) {
        const parsedError = parseExceptionError(error, 'Failed to fetch contacts');
        console.error('[CONTACT] Failed to fetch contacts:', {
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
 * Get a single contact by UUID
 * 
 * Retrieves detailed information about a specific contact by its UUID.
 * 
 * **Endpoint:** GET /api/v1/contacts/{contact_uuid}/
 * 
 * **Error Handling:**
 * - Returns `null` if contact is not found (404)
 * - Throws error for other failures
 * 
 * @param uuid - The contact UUID
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to Contact object or null if not found
 * 
 * @example
 * ```typescript
 * const contact = await getContactByUuid('abc-123-def');
 * if (contact) {
 *   console.log(contact.name, contact.email);
 * }
 * ```
 */
export const getContactByUuid = async (uuid: string, requestId?: string): Promise<Contact | null> => {
    try {
        if (!uuid || typeof uuid !== 'string') {
          throw new Error('Invalid contact UUID');
        }

        const headers: HeadersInit = {};
        if (requestId) {
            headers['X-Request-Id'] = requestId;
        }

        const response = await axiosAuthenticatedRequest(`${API_BASE_URL}/api/v1/contacts/${uuid}/`, {
          method: 'GET',
          headers,
          useQueue: true,
          useCache: true,
        });

        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          const error = await parseApiError(response, `Failed to fetch contact with UUID ${uuid}`);
          throw error;
        }

        const data: ApiContact = await response.json();
        return mapApiToContact(data);
    } catch (error) {
        const parsedError = parseExceptionError(error, `Failed to fetch contact with UUID ${uuid}`);
        console.error(`[CONTACT] Failed to fetch contact with UUID ${uuid}:`, {
            message: parsedError.message,
            statusCode: parsedError.statusCode,
            isNetworkError: parsedError.isNetworkError,
            isTimeoutError: parsedError.isTimeoutError,
        });
        return null;
    }
};

/**
 * Get contact count with optional filters
 * 
 * Retrieves the total count of contacts, optionally filtered.
 * Uses PostgreSQL estimated count for unfiltered queries (fast, cached for 5 minutes)
 * and actual count for filtered queries (accurate).
 * 
 * **Performance:**
 * - Unfiltered queries: Uses PostgreSQL's estimated row count (very fast, cached for 5 minutes)
 * - Filtered queries: Uses actual COUNT(*) which can be slow on large datasets
 * - Results are cached for 5 minutes to improve performance
 * 
 * **Error Handling:**
 * - Returns 0 if count operation fails or times out
 * - For complex filters, the count operation may timeout - try simpler filters
 * 
 * @param filters - Optional ContactFilters to filter the count
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to contact count (0 if error occurs)
 * 
 * @example
 * ```typescript
 * // Get total count (uses estimate, cached)
 * const total = await getContactCount();
 * 
 * // Get filtered count (uses actual count)
 * const filtered = await getContactCount({ 
 *   country: 'United States', 
 *   employees_min: 50 
 * });
 * ```
 */
export const getContactCount = async (filters?: ContactFilters, requestId?: string): Promise<number> => {
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
            ? `${API_BASE_URL}/api/v1/contacts/count/?${queryString}`
            : `${API_BASE_URL}/api/v1/contacts/count/`;

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
          const error = await parseApiError(response, 'Failed to fetch contact count');
          throw error;
        }

        const data: CountResponse = await response.json();
        const count = data.count || 0;
        
        // Cache the result
        setCachedCount(cacheKey, count);
        
        return count;
    } catch (error) {
        const parsedError = parseExceptionError(error, 'Failed to fetch contact count');
        console.error('[CONTACT] Failed to fetch contact count:', {
            message: parsedError.message,
            statusCode: parsedError.statusCode,
            isNetworkError: parsedError.isNetworkError,
            isTimeoutError: parsedError.isTimeoutError,
        });
        return 0;
    }
};

/**
 * Get Contact UUIDs
 * 
 * Get a list of contact UUIDs that match the provided filters. Returns count and list of UUIDs.
 * Useful for bulk operations or exporting specific contact sets.
 * 
 * **Endpoint:** GET /api/v1/contacts/count/uuids/
 * 
 * **Query Parameters:**
 * This endpoint accepts ALL the same query parameters as `/api/v1/contacts/count/` endpoint, plus:
 * - `limit` (integer, optional): Maximum number of UUIDs to return. **If not provided, returns all matching UUIDs (unlimited).** When provided, limits results to the specified number.
 * 
 * All filter parameters from `/api/v1/contacts/` are supported:
 * - All text filters (first_name, last_name, title, company, etc.)
 * - All exact filters (email_status, stage, seniority, etc.)
 * - All numeric range filters (employees_min, employees_max, etc.)
 * - All date range filters (created_at_after, created_at_before, updated_at_after, updated_at_before, etc.)
 * - All exclude filters (exclude_titles, exclude_seniorities, exclude_departments, exclude_company_locations, exclude_contact_locations, exclude_technologies, exclude_keywords, exclude_industries, exclude_company_ids, etc.)
 * - Search and distinct parameters
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
 * - Useful for bulk operations, exports, or when you only need UUIDs without full contact data
 * - All the same filtering capabilities as the count endpoint
 * 
 * @param filters - Optional ContactFilters to filter the UUIDs
 * @param params - Optional parameters including limit and requestId
 * @returns Promise resolving to object with count and uuids array
 * 
 * @example
 * ```typescript
 * // Get all UUIDs matching filters
 * const result = await getContactUuids(
 *   { country: 'United States', employees_min: 50 },
 *   { limit: 1000 }
 * );
 * 
 * if (result) {
 *   console.log('Total:', result.count);
 *   console.log('UUIDs:', result.uuids);
 * }
 * ```
 */
export const getContactUuids = async (
    filters?: ContactFilters,
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
            ? `${API_BASE_URL}/api/v1/contacts/count/uuids/?${queryString}`
            : `${API_BASE_URL}/api/v1/contacts/count/uuids/`;

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
            const error = await parseApiError(response, 'Failed to fetch contact UUIDs');
            throw error;
        }

        const data: { count: number; uuids: string[] } = await response.json();
        return {
            count: data.count || 0,
            uuids: data.uuids || [],
        };
    } catch (error) {
        const parsedError = parseExceptionError(error, 'Failed to fetch contact UUIDs');
        console.error('[CONTACT] Failed to fetch contact UUIDs:', {
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
 * Fetch Contact UUIDs with Pagination
 * 
 * Fetches contact UUIDs in batches to handle large datasets efficiently.
 * Reports progress via callback and supports cancellation.
 * 
 * @param filters - Optional ContactFilters to filter the UUIDs
 * @param params - Optional parameters including batchSize, onProgress, and cancellation signal
 * @returns Promise resolving to object with count and uuids array
 * 
 * @example
 * ```typescript
 * const abortController = new AbortController();
 * const result = await fetchContactUuidsPaginated(
 *   { country: 'United States' },
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
export const fetchContactUuidsPaginated = async (
    filters?: ContactFilters,
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
            ? `${API_BASE_URL}/api/v1/contacts/count/?${countQueryString}`
            : `${API_BASE_URL}/api/v1/contacts/count/`;

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
            const error = await parseApiError(countResponse, 'Failed to fetch contact count');
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
            const url = `${API_BASE_URL}/api/v1/contacts/count/uuids/?${queryString}`;

            const headers: HeadersInit = {};
            if (requestId) {
                headers['X-Request-Id'] = requestId;
            }

            const response = await axiosAuthenticatedRequest(url, {
                method: 'GET',
                headers,
                useQueue: true,
                useCache: false, // Don't cache paginated requests
                timeout: 336000000, // 30 second timeout for UUID fetch
                priority: 5, // Higher priority for export-related requests
            });

            if (!response.ok) {
                const error = await parseApiError(response, 'Failed to fetch contact UUIDs');
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
        const parsedError = parseExceptionError(error, 'Failed to fetch contact UUIDs');
        console.error('[CONTACT] Failed to fetch contact UUIDs (paginated):', {
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

