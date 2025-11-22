/**
 * Contact Service Field Values Operations
 * 
 * Functions for fetching field values, distinct values, and keywords.
 */

import { API_BASE_URL } from '../api';
import { axiosAuthenticatedRequest } from '@utils/request';
import { parseApiError, parseExceptionError, formatErrorForLogging } from '@utils/error';
import { KeywordItem, KeywordsResponse } from './types';

/**
 * Fetch distinct values for a specific field
 * 
 * Retrieves field-specific data from the API. Returns only the `id` and the specified field value
 * for each contact. Useful for getting unique values or searching specific fields.
 * 
 * **Supported Fields:**
 * - title, company, industry, keywords, technologies
 * - city, state, country (person location)
 * - company_address, company_city, company_state, company_country (company location)
 * - contact_address (person address)
 * 
 * **Parameters:**
 * - `search`: Search term to filter results (case-insensitive, searches within the field)
 * - `distinct`: If `true`, returns only distinct field values (default: `false`)
 * - `limit`: Number of results per page (max 100, default: 25)
 * - `offset`: Offset for pagination
 * - `company`: Filter results to a single company (case-insensitive substring match)
 * - `ordering`: Sort by field. Prepend '-' for descending. Valid: 'value', '-value' (default: no ordering)
 * - `requestId`: Optional X-Request-Id header value for request tracking
 * 
 * **Attribute Lookup Endpoints:**
 * This function supports all attribute lookup endpoints from the Postman collection:
 * - `/contacts/title/` - Contact job titles
 * - `/contacts/company/` - Company names
 * - `/contacts/industry/` - Industries (supports `separated` parameter for array fields)
 * - `/contacts/keywords/` - Keywords (supports `separated` parameter)
 * - `/contacts/technologies/` - Technologies (supports `separated` parameter)
 * - `/contacts/company_address/` - Company addresses
 * - `/contacts/contact_address/` - Contact addresses
 * - `/contacts/city/` - Contact cities
 * - `/contacts/state/` - Contact states
 * - `/contacts/country/` - Contact countries
 * - `/contacts/company_city/` - Company cities
 * - `/contacts/company_state/` - Company states
 * - `/contacts/company_country/` - Company countries
 * 
 * @param field - The field name (e.g., 'title', 'company', 'industry')
 * @param params - Optional parameters for search, distinct, pagination, company filter, ordering, and request tracking
 * @returns Promise resolving to array of objects with `id` and field value
 * 
 * @example
 * ```typescript
 * // Get distinct industries
 * const industries = await fetchFieldValues('industry', { distinct: true, limit: 100 });
 * 
 * // Search companies with ordering
 * const companies = await fetchFieldValues('company', { 
 *   search: 'tech', 
 *   limit: 50,
 *   ordering: 'value'
 * });
 * 
 * // Get titles for a specific company
 * const titles = await fetchFieldValues('title', {
 *   company: 'Acme Corp',
 *   distinct: true,
 *   ordering: 'value'
 * });
 * ```
 */
export const fetchFieldValues = async (
    field: string,
    params?: { 
        search?: string; 
        distinct?: boolean; 
        limit?: number; 
        offset?: number;
        company?: string;
        ordering?: string;
        requestId?: string;
    }
): Promise<Array<Record<string, any>>> => {
    try {
        if (!field || typeof field !== 'string') {
          throw new Error('Invalid field name');
        }

        const { 
            search, 
            distinct = false, 
            limit = 25, 
            offset = 0, 
            company,
            ordering,
            requestId 
        } = params || {};
        
        const query = new URLSearchParams();
        if (search) query.set('search', search);
        if (distinct !== undefined) {
            query.set('distinct', distinct.toString());
        }
        if (company) query.set('company', company);
        if (ordering) query.set('ordering', ordering);
        query.set('limit', String(limit));
        query.set('offset', String(offset));

        const headers: HeadersInit = {};
        if (requestId) {
            headers['X-Request-Id'] = requestId;
        }

        const response = await axiosAuthenticatedRequest(`${API_BASE_URL}/api/v1/contacts/${field}/?${query.toString()}`, {
          method: 'GET',
          headers,
          useCache: true,
        });

        if (!response.ok) {
          const error = await parseApiError(response, `Failed to fetch field values for ${field}`);
          throw error;
        }

        const data = await response.json();
        return (data.results || []) as Array<Record<string, any>>;
    } catch (error) {
        const parsedError = parseExceptionError(error, `Failed to fetch field values for ${field}`);
        const errorLog = formatErrorForLogging(parsedError);
        console.error(`[CONTACT] Failed to fetch field values for ${field}:`, errorLog);
        // Also log the original error for debugging if it's different from parsed error
        if (error && error !== parsedError && error instanceof Error) {
            console.error(`[CONTACT] Original error for ${field}:`, {
                name: error.name,
                message: error.message,
                stack: error.stack,
            });
        }
        return [];
    }
};

/**
 * Fetch distinct values for a specific field
 * 
 * Convenience function that fetches distinct field values and returns them as a string array.
 * Automatically handles pagination to get all distinct values (up to 1000).
 * 
 * @param field - The field name (e.g., 'title', 'company', 'industry')
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to array of distinct string values
 * 
 * @example
 * ```typescript
 * const industries = await fetchDistinctValues('industry');
 * // Returns: ['Technology', 'Healthcare', 'Finance', ...]
 * ```
 */
export const fetchDistinctValues = async (field: string, requestId?: string): Promise<string[]> => {
    try {
      const rows = await fetchFieldValues(field, { distinct: true, limit: 1000, offset: 0, requestId });
      return rows.map((item) => String(item[field] || '')).filter((v) => Boolean(v) && v !== 'undefined');
    } catch (error) {
      console.error(`[CONTACT] Failed to fetch distinct values for ${field}:`, error);
      return [];
    }
};

/**
 * Fetch keywords with support for separated and distinct parameters
 * 
 * Retrieves keywords from contacts with special handling for comma-separated values.
 * 
 * **Parameters:**
 * - `search`: Search term to filter results. When `separated=true`, uses two-stage filtering
 *   (pre-filter at DB level, then post-filter individual keywords after expansion)
 * - `separated`: If `true`, expands comma-separated keywords into individual records.
 *   Each contact ID may appear multiple times (one per keyword).
 * - `distinct`: If `true`, returns only distinct keyword values. When combined with `separated=true`,
 *   returns unique individual keywords across all contacts.
 * - `limit`: Number of results per page (max 100, default: 25)
 * - `offset`: Offset for pagination
 * - `requestId`: Optional X-Request-Id header value for request tracking
 * 
 * **Behavior:**
 * - When `separated=false` (default): Returns keywords as stored (comma-separated strings)
 * - When `separated=true`: Expands keywords, processing in batches to avoid memory issues
 * - Empty keywords are skipped when expanding
 * 
 * @param params - Optional parameters for search, separated, distinct, pagination, and request tracking
 * @returns Promise resolving to KeywordsResponse with pagination and results
 * 
 * @example
 * ```typescript
 * // Get keywords as stored
 * const result = await fetchKeywords({ search: 'technology' });
 * 
 * // Get individual keywords (expanded)
 * const result = await fetchKeywords({ separated: true, distinct: true });
 * ```
 */
export const fetchKeywords = async (params?: {
    search?: string;
    separated?: boolean;
    distinct?: boolean;
    limit?: number;
    offset?: number;
    requestId?: string;
}): Promise<KeywordsResponse> => {
    try {
        const { search, separated, distinct, limit = 25, offset = 0, requestId } = params || {};
        const query = new URLSearchParams();

        if (search) {
            query.set('search', search);
        }
        if (separated !== undefined) {
            query.set('separated', separated.toString());
        }
        if (distinct !== undefined) {
            query.set('distinct', distinct.toString());
        }
        query.set('limit', limit.toString());
        query.set('offset', offset.toString());

        const headers: HeadersInit = {};
        if (requestId) {
            headers['X-Request-Id'] = requestId;
        }

        const response = await axiosAuthenticatedRequest(`${API_BASE_URL}/api/v1/contacts/keywords/?${query.toString()}`, {
          method: 'GET',
          headers,
          useCache: true,
        });

        if (!response.ok) {
          const error = await parseApiError(response, 'Failed to fetch keywords');
          throw error;
        }

        const data = await response.json();
        return data as KeywordsResponse;
    } catch (error) {
        const parsedError = parseExceptionError(error, 'Failed to fetch keywords');
        console.error('[CONTACT] Failed to fetch keywords:', {
            message: parsedError.message,
            statusCode: parsedError.statusCode,
            isNetworkError: parsedError.isNetworkError,
            isTimeoutError: parsedError.isTimeoutError,
        });
        return {
            next: null,
            previous: null,
            results: [],
        };
    }
};

