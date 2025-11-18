/**
 * Company Service Field Values Operations
 * 
 * Functions for fetching field values and distinct values.
 */

import {
  CompanyFilters,
  AttributeValueResponse,
} from '@/types/company';
import { API_BASE_URL } from '../api';
import { axiosAuthenticatedRequest } from '@utils/request';
import { parseApiError, parseExceptionError, formatErrorForLogging } from '@utils/error';

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

