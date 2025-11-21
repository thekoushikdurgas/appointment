/**
 * Apollo Service Search Operations
 * 
 * Functions for searching, counting, and getting UUIDs from Apollo.io URLs.
 */

import { API_BASE_URL } from '../api';
import { axiosAuthenticatedRequest } from '@utils/request';
import {
  parseApiError,
  parseExceptionError,
  formatErrorMessage,
} from '@utils/error';
import {
  ApolloContactsResponse,
  ApolloContactsSearchParams,
  ApolloContactsRequest,
  ApolloContactsCountRequest,
  ApolloContactsCountResponse,
  ApolloContactsUuidsRequest,
  ApolloContactsUuidsResponse,
  ApolloContactsUuidsParams,
} from '@/types/apollo';
import { Contact } from '@/types/index';
import { ResponseMeta } from '../contact/types';
import { ServiceResponse, ApiContact, ApiApolloContactsResponse } from './types';
import { validateApolloUrl } from './analyze';
import { mapApiToContact } from './mappers';

/**
 * Search Contacts from Apollo.io URL
 * 
 * Searches contacts using Apollo.io URL parameters. This endpoint converts an
 * Apollo.io People Search URL into contact filter parameters and returns matching
 * contacts from your database.
 * 
 * **Endpoint:** POST /api/v2/apollo/contacts
 * 
 * **Authentication:** Required (JWT Bearer token)
 * 
 * **Query Parameters:**
 * - `limit` (integer, optional): Maximum number of results per page
 * - `offset` (integer, optional): Starting offset for results (default: 0)
 * - `cursor` (string, optional): Opaque cursor token for pagination
 * - `view` (string, optional): When set to "simple", returns simplified contact data
 * - `include_company_name` (string, optional): Include contacts whose company name matches this value (case-insensitive substring match)
 * - `exclude_company_name` (array of strings, optional): Exclude contacts whose company name matches any provided value (case-insensitive)
 * - `include_domain_list` (array of strings, optional): Include contacts whose company website domain matches any provided domain (case-insensitive)
 * - `exclude_domain_list` (array of strings, optional): Exclude contacts whose company website domain matches any provided domain (case-insensitive)
 * 
 * **Response includes:**
 * - Contact results (paginated)
 * - Apollo URL mapping metadata
 * - Summary of mapped and unmapped parameters
 * - Detailed information about parameters that were not mapped
 * 
 * **Parameter Mappings:**
 * The endpoint maps Apollo.io parameters to contact filter parameters:
 * - `personTitles[]` → `title` (comma-separated OR logic)
 * - `personLocations[]` → `contact_location`
 * - `organizationNumEmployeesRanges[]` → `employees_min`, `employees_max`
 * - `contactEmailStatusV2[]` → `email_status`
 * - And many more (see API documentation)
 * 
 * **Unmapped Parameters:**
 * Some Apollo parameters cannot be mapped (ID-based filters, Apollo-specific features).
 * The response includes detailed reasons for each unmapped parameter.
 * 
 * **Error Handling:**
 * - 400 Bad Request: Invalid URL or filter parameters
 * - 401 Unauthorized: Authentication required
 * - 500 Internal Server Error: Error occurred while searching contacts
 * 
 * @param url - Apollo.io URL to convert and search (must be from apollo.io domain)
 * @param params - Optional parameters for pagination and view mode
 * @returns Promise resolving to ServiceResponse with ApolloContactsResponse
 * 
 * @example
 * ```typescript
 * const result = await searchContactsFromApolloUrl(
 *   'https://app.apollo.io/#/people?personTitles[]=CEO&personLocations[]=California',
 *   { limit: 25, view: 'simple' }
 * );
 * 
 * if (result.success && result.data) {
 *   console.log('Contacts:', result.data.results);
 *   console.log('Mapping Summary:', result.data.mapping_summary);
 *   console.log('Unmapped Parameters:', result.data.unmapped_categories);
 * } else {
 *   console.error('Error:', result.message);
 * }
 * ```
 */
export const searchContactsFromApolloUrl = async (
  url: string,
  params?: ApolloContactsSearchParams
): Promise<ServiceResponse<ApolloContactsResponse>> => {
  try {
    // Validate URL
    const validation = validateApolloUrl(url);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || 'Invalid URL',
        error: {
          message: validation.error || 'Invalid URL',
          statusCode: 400,
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    // Build query parameters
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset !== undefined) query.set('offset', params.offset.toString());
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.view) query.set('view', params.view);
    if (params?.include_company_name) query.set('include_company_name', params.include_company_name);
    if (params?.exclude_company_name && Array.isArray(params.exclude_company_name)) {
      // Add each value as a separate query parameter (repeated params)
      params.exclude_company_name.forEach((value) => {
        if (value && value.trim()) {
          query.append('exclude_company_name', value.trim());
        }
      });
    }
    if (params?.include_domain_list && Array.isArray(params.include_domain_list)) {
      // Add each domain as a separate query parameter (repeated params)
      params.include_domain_list.forEach((domain) => {
        if (domain && domain.trim()) {
          query.append('include_domain_list', domain.trim());
        }
      });
    }
    if (params?.exclude_domain_list && Array.isArray(params.exclude_domain_list)) {
      // Add each domain as a separate query parameter (repeated params)
      params.exclude_domain_list.forEach((domain) => {
        if (domain && domain.trim()) {
          query.append('exclude_domain_list', domain.trim());
        }
      });
    }

    const queryString = query.toString();
    const endpoint = queryString
      ? `${API_BASE_URL}/api/v2/apollo/contacts?${queryString}`
      : `${API_BASE_URL}/api/v2/apollo/contacts`;

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (params?.requestId) {
      headers['X-Request-Id'] = params.requestId;
    }

    // Prepare request body
    const requestBody: ApolloContactsRequest = { url };

    // Make API request
    const response = await axiosAuthenticatedRequest(endpoint, {
      method: 'POST',
      headers,
      data: requestBody,
      useQueue: true,
      useCache: false,
    });

    if (!response.ok) {
      const error = await parseApiError(
        response,
        'Failed to search contacts from Apollo URL'
      );
      return {
        success: false,
        message: formatErrorMessage(
          error,
          'Failed to search contacts from Apollo URL'
        ),
        error,
      };
    }

    const data: ApiApolloContactsResponse = await response.json();

    // Map API contacts to frontend Contact type
    const contacts = (data.results || []).map((apiContact: ApiContact) => {
      try {
        return mapApiToContact(apiContact);
      } catch (error) {
        console.warn('[APOLLO] Failed to map contact:', apiContact, error);
        return null;
      }
    }).filter((contact): contact is Contact => contact !== null);

    // Build response with mapped contacts
    const apolloContactsResponse: ApolloContactsResponse = {
      next: data.next,
      previous: data.previous,
      results: contacts,
      meta: data.meta,
      apollo_url: data.apollo_url,
      mapping_summary: data.mapping_summary,
      unmapped_categories: data.unmapped_categories,
    };

    return {
      success: true,
      message: `Found ${contacts.length} contact(s) matching Apollo URL criteria`,
      data: apolloContactsResponse,
    };
  } catch (error) {
    const parsedError = parseExceptionError(
      error,
      'Failed to search contacts from Apollo URL'
    );
    console.error('[APOLLO] Search contacts error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(
        parsedError,
        'Failed to search contacts from Apollo URL'
      ),
      error: parsedError,
    };
  }
};

/**
 * Count Contacts from Apollo.io URL
 * 
 * Counts contacts matching Apollo.io URL parameters. This endpoint converts an
 * Apollo.io People Search URL into contact filter parameters and returns the total
 * count of matching contacts from your database.
 * 
 * **Endpoint:** POST /api/v2/apollo/contacts/count
 * 
 * **Authentication:** Required (JWT Bearer token)
 * 
 * **Query Parameters:**
 * - `include_company_name` (string, optional): Include contacts whose company name matches this value (case-insensitive substring match). Supports comma-separated values for OR logic.
 * - `exclude_company_name` (array of strings, optional): Exclude contacts whose company name matches any provided value (case-insensitive). Can be provided multiple times or as comma-separated values.
 * - `include_domain_list` (array of strings, optional): Include contacts whose company website domain matches any provided domain (case-insensitive). Domains are extracted from `CompanyMetadata.website` column.
 * - `exclude_domain_list` (array of strings, optional): Exclude contacts whose company website domain matches any provided domain (case-insensitive). Domains are extracted from `CompanyMetadata.website` column.
 * 
 * **Response:**
 * Returns a simple count response: `{ count: number }`
 * 
 * **Parameter Mappings:**
 * Same as `/api/v2/apollo/contacts` endpoint - all Apollo URL parameters are mapped
 * to contact filters using the same logic.
 * 
 * **Error Handling:**
 * - 200 OK: Count retrieved successfully
 * - 400 Bad Request: Invalid URL, not from Apollo.io domain, or invalid filter parameters
 * - 401 Unauthorized: Authentication required
 * - 500 Internal Server Error: Error occurred while counting contacts
 * 
 * **Use Cases:**
 * 1. Quick Count Check: Get the total number of contacts matching an Apollo search before fetching results
 * 2. Progress Tracking: Monitor how many contacts match specific criteria
 * 3. Filter Validation: Verify that your Apollo URL filters are working as expected
 * 4. Resource Planning: Estimate data volume before processing large result sets
 * 
 * @param url - Apollo.io URL to convert and count (must be from apollo.io domain)
 * @param params - Optional parameters for company name filtering and domain filtering
 * @returns Promise resolving to ServiceResponse with count number
 * 
 * @example
 * ```typescript
 * const result = await countContactsFromApolloUrl(
 *   'https://app.apollo.io/#/people?personTitles[]=CEO&personLocations[]=California',
 *   { include_company_name: 'Tech' }
 * );
 * 
 * if (result.success && result.data) {
 *   console.log('Total contacts:', result.data);
 * } else {
 *   console.error('Error:', result.message);
 * }
 * ```
 */
export const countContactsFromApolloUrl = async (
  url: string,
  params?: {
    include_company_name?: string;
    exclude_company_name?: string[];
    include_domain_list?: string[];
    exclude_domain_list?: string[];
    requestId?: string;
  }
): Promise<ServiceResponse<number>> => {
  try {
    // Validate URL
    const validation = validateApolloUrl(url);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || 'Invalid URL',
        error: {
          message: validation.error || 'Invalid URL',
          statusCode: 400,
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    // Build query parameters
    const query = new URLSearchParams();
    if (params?.include_company_name) {
      query.set('include_company_name', params.include_company_name);
    }
    if (params?.exclude_company_name && Array.isArray(params.exclude_company_name)) {
      // Add each value as a separate query parameter (repeated params)
      params.exclude_company_name.forEach((value) => {
        if (value && value.trim()) {
          query.append('exclude_company_name', value.trim());
        }
      });
    }
    if (params?.include_domain_list && Array.isArray(params.include_domain_list)) {
      // Add each domain as a separate query parameter (repeated params)
      params.include_domain_list.forEach((domain) => {
        if (domain && domain.trim()) {
          query.append('include_domain_list', domain.trim());
        }
      });
    }
    if (params?.exclude_domain_list && Array.isArray(params.exclude_domain_list)) {
      // Add each domain as a separate query parameter (repeated params)
      params.exclude_domain_list.forEach((domain) => {
        if (domain && domain.trim()) {
          query.append('exclude_domain_list', domain.trim());
        }
      });
    }

    const queryString = query.toString();
    const endpoint = queryString
      ? `${API_BASE_URL}/api/v2/apollo/contacts/count?${queryString}`
      : `${API_BASE_URL}/api/v2/apollo/contacts/count`;

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (params?.requestId) {
      headers['X-Request-Id'] = params.requestId;
    }

    // Prepare request body
    const requestBody: ApolloContactsCountRequest = { url };

    // Make API request
    const response = await axiosAuthenticatedRequest(endpoint, {
      method: 'POST',
      headers,
      data: requestBody,
      useQueue: true,
      useCache: false,
    });

    if (!response.ok) {
      const error = await parseApiError(
        response,
        'Failed to count contacts from Apollo URL'
      );
      return {
        success: false,
        message: formatErrorMessage(
          error,
          'Failed to count contacts from Apollo URL'
        ),
        error,
      };
    }

    const data: ApolloContactsCountResponse = await response.json();

    return {
      success: true,
      message: `Found ${data.count} contact(s) matching Apollo URL criteria`,
      data: data.count,
    };
  } catch (error) {
    const parsedError = parseExceptionError(
      error,
      'Failed to count contacts from Apollo URL'
    );
    console.error('[APOLLO] Count contacts error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(
        parsedError,
        'Failed to count contacts from Apollo URL'
      ),
      error: parsedError,
    };
  }
};

/**
 * Get Contact UUIDs from Apollo.io URL
 * 
 * Get a list of contact UUIDs matching Apollo.io URL parameters. This endpoint converts an
 * Apollo.io People Search URL into contact filter parameters and returns matching contact UUIDs
 * from your database.
 * 
 * **Endpoint:** POST /api/v2/apollo/contacts/count/uuids
 * 
 * **Authentication:** Required (JWT Bearer token)
 * 
 * **Query Parameters:**
 * - `include_company_name` (string, optional): Include contacts whose company name matches this value (case-insensitive substring match). Supports comma-separated values for OR logic.
 * - `exclude_company_name` (array of strings, optional): Exclude contacts whose company name matches any provided value (case-insensitive). Can be provided multiple times or as comma-separated values.
 * - `include_domain_list` (array of strings, optional): Include contacts whose company website domain matches any provided domain (case-insensitive). Domains are extracted from `CompanyMetadata.website` column.
 * - `exclude_domain_list` (array of strings, optional): Exclude contacts whose company website domain matches any provided domain (case-insensitive). Domains are extracted from `CompanyMetadata.website` column.
 * - `limit` (integer, optional): Maximum number of UUIDs to return. If not provided, returns all matching UUIDs (unlimited).
 * 
 * **Response:**
 * Returns count and list of UUIDs:
 * - `count` (integer): Total number of matching contacts
 * - `uuids` (array[string]): Array of contact UUIDs
 * 
 * **Parameter Mappings:**
 * Same as `/api/v2/apollo/contacts` endpoint - all Apollo URL parameters are mapped
 * to contact filters using the same logic.
 * 
 * **Error Handling:**
 * - 200 OK: UUIDs retrieved successfully
 * - 400 Bad Request: Invalid URL, not from Apollo.io domain, or invalid filter parameters
 * - 401 Unauthorized: Authentication required
 * - 500 Internal Server Error: Error occurred while retrieving UUIDs
 * 
 * **Use Cases:**
 * 1. Bulk Operations: Get UUIDs for bulk updates or exports
 * 2. Efficient Filtering: Retrieve only UUIDs without full contact data
 * 3. Export Preparation: Get UUID list before exporting specific contact sets
 * 4. Integration: Use UUIDs for downstream processing or API calls
 * 
 * @param url - Apollo.io URL to convert and search (must be from apollo.io domain)
 * @param params - Optional parameters for company name filtering, domain filtering, and limit
 * @returns Promise resolving to ServiceResponse with ApolloContactsUuidsResponse
 * 
 * @example
 * ```typescript
 * const result = await getContactUuidsFromApolloUrl(
 *   'https://app.apollo.io/#/people?personTitles[]=CEO&personLocations[]=California',
 *   { include_company_name: 'Tech', limit: 1000 }
 * );
 * 
 * if (result.success && result.data) {
 *   console.log('Total contacts:', result.data.count);
 *   console.log('UUIDs:', result.data.uuids);
 * } else {
 *   console.error('Error:', result.message);
 * }
 * ```
 */
export const getContactUuidsFromApolloUrl = async (
  url: string,
  params?: ApolloContactsUuidsParams
): Promise<ServiceResponse<ApolloContactsUuidsResponse>> => {
  try {
    // Validate URL
    const validation = validateApolloUrl(url);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || 'Invalid URL',
        error: {
          message: validation.error || 'Invalid URL',
          statusCode: 400,
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    // Build query parameters
    const query = new URLSearchParams();
    if (params?.include_company_name) {
      query.set('include_company_name', params.include_company_name);
    }
    if (params?.exclude_company_name && Array.isArray(params.exclude_company_name)) {
      // Add each value as a separate query parameter (repeated params)
      params.exclude_company_name.forEach((value) => {
        if (value && value.trim()) {
          query.append('exclude_company_name', value.trim());
        }
      });
    }
    if (params?.include_domain_list && Array.isArray(params.include_domain_list)) {
      // Add each domain as a separate query parameter (repeated params)
      params.include_domain_list.forEach((domain) => {
        if (domain && domain.trim()) {
          query.append('include_domain_list', domain.trim());
        }
      });
    }
    if (params?.exclude_domain_list && Array.isArray(params.exclude_domain_list)) {
      // Add each domain as a separate query parameter (repeated params)
      params.exclude_domain_list.forEach((domain) => {
        if (domain && domain.trim()) {
          query.append('exclude_domain_list', domain.trim());
        }
      });
    }
    if (params?.limit !== undefined) {
      query.set('limit', params.limit.toString());
    }

    const queryString = query.toString();
    const endpoint = queryString
      ? `${API_BASE_URL}/api/v2/apollo/contacts/count/uuids?${queryString}`
      : `${API_BASE_URL}/api/v2/apollo/contacts/count/uuids`;

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (params?.requestId) {
      headers['X-Request-Id'] = params.requestId;
    }

    // Prepare request body
    const requestBody: ApolloContactsUuidsRequest = { url };

    // Make API request
    const response = await axiosAuthenticatedRequest(endpoint, {
      method: 'POST',
      headers,
      data: requestBody,
      useQueue: true,
      useCache: false,
    });

    if (!response.ok) {
      const error = await parseApiError(
        response,
        'Failed to get contact UUIDs from Apollo URL'
      );
      return {
        success: false,
        message: formatErrorMessage(
          error,
          'Failed to get contact UUIDs from Apollo URL'
        ),
        error,
      };
    }

    const data: ApolloContactsUuidsResponse = await response.json();

    return {
      success: true,
      message: `Found ${data.count} contact UUID(s) matching Apollo URL criteria`,
      data,
    };
  } catch (error) {
    const parsedError = parseExceptionError(
      error,
      'Failed to get contact UUIDs from Apollo URL'
    );
    console.error('[APOLLO] Get contact UUIDs error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(
        parsedError,
        'Failed to get contact UUIDs from Apollo URL'
      ),
      error: parsedError,
    };
  }
};

/**
 * Progress callback for paginated UUID fetching
 */
export type ApolloUuidFetchProgressCallback = (progress: {
  fetched: number;
  total: number;
  percentage: number;
}) => void;

/**
 * Get Contact UUIDs from Apollo.io URL with Pagination
 * 
 * Fetches contact UUIDs in batches to handle large datasets efficiently.
 * Reports progress via callback and supports cancellation.
 * 
 * Note: This function uses the same endpoint but handles pagination by making
 * multiple requests with offset/limit if the backend supports it, or falls back
 * to the standard single request.
 * 
 * @param url - Apollo.io URL to convert and search (must be from apollo.io domain)
 * @param params - Optional parameters for company name filtering, domain filtering, limit, and pagination
 * @returns Promise resolving to ServiceResponse with ApolloContactsUuidsResponse
 * 
 * @example
 * ```typescript
 * const abortController = new AbortController();
 * const result = await getContactUuidsFromApolloUrlPaginated(
 *   'https://app.apollo.io/#/people?personTitles[]=CEO',
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
export const getContactUuidsFromApolloUrlPaginated = async (
  url: string,
  params?: ApolloContactsUuidsParams & {
    batchSize?: number;
    maxUuids?: number;
    onProgress?: ApolloUuidFetchProgressCallback;
    signal?: AbortSignal;
  }
): Promise<ServiceResponse<ApolloContactsUuidsResponse>> => {
  const batchSize = params?.batchSize || 1000;
  const maxUuids = params?.maxUuids;
  const onProgress = params?.onProgress;
  const signal = params?.signal;

  try {
    // Validate URL
    const validation = validateApolloUrl(url);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || 'Invalid URL',
        error: {
          message: validation.error || 'Invalid URL',
          statusCode: 400,
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    // First, get the total count
    const countResult = await countContactsFromApolloUrl(url, {
      include_company_name: params?.include_company_name,
      exclude_company_name: params?.exclude_company_name,
      include_domain_list: params?.include_domain_list,
      exclude_domain_list: params?.exclude_domain_list,
      requestId: params?.requestId,
    });

    if (!countResult.success || countResult.data === undefined) {
      return {
        success: false,
        message: countResult.message || 'Failed to get contact count from Apollo URL',
        error: countResult.error,
      };
    }

    const totalCount = countResult.data;
    let targetCount = totalCount;

    // If maxUuids is specified, limit targetCount
    if (maxUuids !== undefined && totalCount > maxUuids) {
      targetCount = maxUuids;
    }

    // If total count is small or no pagination needed, use standard function
    if (totalCount <= batchSize && maxUuids === undefined) {
      return await getContactUuidsFromApolloUrl(url, {
        ...params,
        limit: totalCount,
      });
    }

    // Fetch UUIDs in batches
    const allUuids: string[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore && !signal?.aborted && allUuids.length < targetCount) {
      const currentLimit = Math.min(batchSize, targetCount - allUuids.length);

      // Build query parameters
      const query = new URLSearchParams();
      if (params?.include_company_name) {
        query.set('include_company_name', params.include_company_name);
      }
      if (params?.exclude_company_name && Array.isArray(params.exclude_company_name)) {
        params.exclude_company_name.forEach((value) => {
          if (value && value.trim()) {
            query.append('exclude_company_name', value.trim());
          }
        });
      }
      if (params?.include_domain_list && Array.isArray(params.include_domain_list)) {
        params.include_domain_list.forEach((domain) => {
          if (domain && domain.trim()) {
            query.append('include_domain_list', domain.trim());
          }
        });
      }
      if (params?.exclude_domain_list && Array.isArray(params.exclude_domain_list)) {
        params.exclude_domain_list.forEach((domain) => {
          if (domain && domain.trim()) {
            query.append('exclude_domain_list', domain.trim());
          }
        });
      }
      query.set('limit', currentLimit.toString());
      query.set('offset', offset.toString());

      const queryString = query.toString();
      const endpoint = `${API_BASE_URL}/api/v2/apollo/contacts/count/uuids?${queryString}`;

      // Prepare headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (params?.requestId) {
        headers['X-Request-Id'] = params.requestId;
      }

      // Prepare request body
      const requestBody: ApolloContactsUuidsRequest = { url };

      // Make API request
      const response = await axiosAuthenticatedRequest(endpoint, {
        method: 'POST',
        headers,
        data: requestBody,
        useQueue: true,
        useCache: false,
        timeout: 336000000, // 30 second timeout for Apollo UUID fetch
        priority: 5, // Higher priority for export-related requests
      });

      if (!response.ok) {
        const error = await parseApiError(
          response,
          'Failed to get contact UUIDs from Apollo URL'
        );
        return {
          success: false,
          message: formatErrorMessage(
            error,
            'Failed to get contact UUIDs from Apollo URL'
          ),
          error,
        };
      }

      const data: ApolloContactsUuidsResponse = await response.json();
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
        const percentage = targetCount > 0 
          ? Math.min(100, Math.round((allUuids.length / targetCount) * 100))
          : 0;
        onProgress({
          fetched: allUuids.length,
          total: targetCount,
          percentage,
        });
      }

      // Check if we have more to fetch
      if (batchUuids.length < currentLimit || allUuids.length >= targetCount) {
        hasMore = false;
      } else {
        offset += batchSize;
      }
    }

    // Handle cancellation
    if (signal?.aborted) {
      return {
        success: true,
        message: `Fetched ${allUuids.length} contact UUID(s) (cancelled)`,
        data: {
          count: allUuids.length,
          uuids: allUuids,
        },
      };
    }

    return {
      success: true,
      message: `Found ${allUuids.length} contact UUID(s) matching Apollo URL criteria`,
      data: {
        count: allUuids.length,
        uuids: allUuids,
      },
    };
  } catch (error) {
    const parsedError = parseExceptionError(
      error,
      'Failed to get contact UUIDs from Apollo URL'
    );
    console.error('[APOLLO] Get contact UUIDs error (paginated):', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(
        parsedError,
        'Failed to get contact UUIDs from Apollo URL'
      ),
      error: parsedError,
    };
  }
};

