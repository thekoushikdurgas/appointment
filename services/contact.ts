/**
 * Contact Service
 * 
 * Handles all contact-related API operations including fetching, filtering, querying, and creating contacts.
 * 
 * **Read Operations (GET):**
 * - List contacts with filtering, searching, and pagination
 * - Get contact by ID
 * - Count contacts with optional filters
 * - Fetch distinct field values (attribute lookups)
 * 
 * **Write Operations (POST):**
 * - Create contact (requires admin authentication and X-Contacts-Write-Key header)
 * 
 * All endpoints require authentication via Bearer token except where noted.
 * Write operations additionally require the X-Contacts-Write-Key header.
 */

import { Contact, ContactCreate } from '../types/index';
import { API_BASE_URL } from './api';
import { authenticatedFetch } from './auth';
import { parseApiError, parseExceptionError, formatErrorMessage, formatErrorForLogging, ParsedError } from '../utils/errorHandler';

// Simple in-memory cache for count requests (5 minute TTL)
interface CacheEntry {
  data: number;
  timestamp: number;
}

const COUNT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const countCache = new Map<string, CacheEntry>();

/**
 * Service response interface
 */
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: ParsedError;
  fieldErrors?: Record<string, string[]>; // Field-specific errors for easier access
  nonFieldErrors?: string[]; // Non-field errors for easier access
}

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

// Maps UI sort column names to API field names
const mapSortColumn = (column: string): string => {
    const mapping: { [key: string]: string } = {
        'name': 'first_name',
        'emailStatus': 'email_status',
        'created_at': 'created_at',
    };
    
    if (mapping[column]) {
        return mapping[column];
    }
    
    return column.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Maps UI filter keys to API parameter names
 * 
 * Handles conversion from camelCase UI keys to snake_case API parameters.
 * Special mappings are defined for fields that don't follow standard conversion rules.
 * 
 * @param key - The filter key from ContactFilters interface
 * @returns The corresponding API parameter name in snake_case
 */
const mapFilterKey = (key: string): string => {
    // Special mappings for fields that don't follow standard camelCase to snake_case conversion
    const mapping: { [key: string]: string } = {
        // Status and stage
        'status': 'stage',
        'emailStatus': 'email_status',
        'primary_email_catch_all_status': 'primary_email_catch_all_status', // Already snake_case
        
        // Aliases
        'tags': 'keywords',
        
        // Phone fields (already snake_case in API)
        'work_direct_phone': 'work_direct_phone',
        'home_phone': 'home_phone',
        'mobile_phone': 'mobile_phone',
        'corporate_phone': 'corporate_phone',
        'other_phone': 'other_phone',
        
        // Person fields
        'first_name': 'first_name',
        'last_name': 'last_name',
        
        // Company fields (already snake_case in API)
        'company_name_for_emails': 'company_name_for_emails',
        'company_address': 'company_address',
        'company_city': 'company_city',
        'company_state': 'company_state',
        'company_country': 'company_country',
        'company_phone': 'company_phone',
        
        // URL fields (already snake_case in API)
        'person_linkedin_url': 'person_linkedin_url',
        'company_linkedin_url': 'company_linkedin_url',
        'facebook_url': 'facebook_url',
        'twitter_url': 'twitter_url',
        
        // Funding fields (already snake_case in API)
        'latest_funding': 'latest_funding',
        'last_raised_at': 'last_raised_at',
        
        // Date range filters (already snake_case in API)
        'created_at_after': 'created_at_after',
        'created_at_before': 'created_at_before',
        'updated_at_after': 'updated_at_after',
        'updated_at_before': 'updated_at_before',
        
        // Numeric range filters (already snake_case in API)
        'employees_min': 'employees_min',
        'employees_max': 'employees_max',
        'annual_revenue_min': 'annual_revenue_min',
        'annual_revenue_max': 'annual_revenue_max',
        'total_funding_min': 'total_funding_min',
        'total_funding_max': 'total_funding_max',
        'latest_funding_amount_min': 'latest_funding_amount_min',
        'latest_funding_amount_max': 'latest_funding_amount_max',
    };
    
    // Return mapped value if exists, otherwise convert camelCase to snake_case
    if (mapping[key]) {
        return mapping[key];
    }
    
    // Convert camelCase to snake_case (e.g., "emailStatus" -> "email_status")
    return key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Contact Filters Interface
 * 
 * Comprehensive filter options matching the Contacts API documentation.
 * All filters support case-insensitive matching unless otherwise specified.
 * 
 * **Text Filters (case-insensitive contains):**
 * - Text filters support partial matching across fields like first_name, last_name, 
 *   company, email, phone numbers, addresses, URLs, etc.
 * 
 * **Exact Match Filters (case-insensitive exact):**
 * - email_status, primary_email_catch_all_status, stage, seniority
 * 
 * **Numeric Range Filters:**
 * - Use _min and _max suffixes for range queries (e.g., employees_min, employees_max)
 * 
 * **Date Range Filters (ISO datetime format):**
 * - Use ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ (e.g., "2024-01-01T00:00:00Z")
 * - created_at_after, created_at_before, updated_at_after, updated_at_before
 * 
 * @example
 * ```typescript
 * const filters: ContactFilters = {
 *   first_name: 'John',
 *   country: 'United States',
 *   employees_min: 50,
 *   created_at_after: '2024-01-01T00:00:00Z',
 *   email_status: 'valid'
 * };
 * ```
 */
export interface ContactFilters {
    // Status and stage filters
    status?: Contact['status'] | 'All';
    emailStatus?: 'All' | 'Verified' | 'Unverified' | 'Bounced' | string;
    stage?: string;
    seniority?: string;
    primary_email_catch_all_status?: string;
    
    // Text filters - Person information
    first_name?: string;
    last_name?: string;
    title?: string;
    email?: string;
    departments?: string;
    
    // Text filters - Phone numbers
    work_direct_phone?: string;
    home_phone?: string;
    mobile_phone?: string;
    corporate_phone?: string;
    other_phone?: string;
    
    // Text filters - Person location
    city?: string;
    state?: string;
    country?: string;
    
    // Text filters - Company information
    company?: string;
    company_name_for_emails?: string;
    company_address?: string;
    company_city?: string;
    company_state?: string;
    company_country?: string;
    company_phone?: string;
    industry?: string;
    
    // Text filters - URLs and web presence
    person_linkedin_url?: string;
    company_linkedin_url?: string;
    facebook_url?: string;
    twitter_url?: string;
    website?: string;
    
    // Text filters - Technologies and keywords
    technologies?: string;
    keywords?: string;
    tags?: string; // Alias for keywords
    
    // Text filters - Funding information
    latest_funding?: string;
    last_raised_at?: string;
    
    // Numeric range filters - Company size
    employees_min?: string | number;
    employees_max?: string | number;
    
    // Numeric range filters - Revenue
    annual_revenue_min?: string | number;
    annual_revenue_max?: string | number;
    
    // Numeric range filters - Funding
    total_funding_min?: string | number;
    total_funding_max?: string | number;
    latest_funding_amount_min?: string | number;
    latest_funding_amount_max?: string | number;
    
    // Date range filters (ISO datetime format: YYYY-MM-DDTHH:MM:SSZ)
    created_at_after?: string;
    created_at_before?: string;
    updated_at_after?: string;
    updated_at_before?: string;
    
    // Location filters
    company_location?: string;
    contact_location?: string;
    
    // Exclusion filters (multi-value, case-insensitive)
    exclude_company_ids?: string[];
    exclude_titles?: string[];
    exclude_company_locations?: string[];
    exclude_contact_locations?: string[];
    exclude_seniorities?: string[];
    exclude_departments?: string[];
    exclude_technologies?: string[];
    exclude_keywords?: string[];
    exclude_industries?: string[];
    
    // Index signature for additional dynamic filters
    [key: string]: string | number | string[] | undefined;
}

/**
 * Fetch contacts parameters
 * 
 * @param search - Full-text search across multiple fields (first_name, last_name, title, company, email, etc.)
 * @param filters - ContactFilters object with filter criteria
 * @param sortColumn - Column name to sort by (uses cursor pagination if not provided, limit-offset if provided)
 * @param sortDirection - Sort direction ('asc' or 'desc')
 * @param limit - Number of results per page (max 100, used with custom ordering)
 * @param offset - Offset for pagination (used when custom ordering is applied)
 * @param pageSize - Page size for cursor pagination (used when ordering by created_at, default: 25, max: 100)
 * @param cursor - Cursor for cursor-based pagination (used when using default ordering)
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @param view - When set to "simple", returns simplified contact data (ContactSimpleItem). Omit for full ContactListItem response.
 * @param include_meta - When true, includes the meta_data JSON column in list responses. Defaults to false for lean payloads.
 * @param use_replica - When true and a replica database is configured, routes reads to that replica. Defaults to the CONTACTS_DEFAULT_REPLICA_READ setting.
 */
export interface FetchContactsParams {
    search?: string;
    filters?: ContactFilters;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    pageSize?: number;
    cursor?: string | null;
    requestId?: string;
    view?: 'simple' | 'full';
    include_meta?: boolean;
    use_replica?: boolean;
}

/**
 * API Response Types
 * 
 * Type definitions matching the Contacts API documentation.
 */

/**
 * Response metadata describing how the data was produced
 */
export interface ResponseMeta {
  strategy: 'cursor' | 'offset';
  count_mode?: 'estimated' | 'actual';
  count?: number;
  filters_applied: boolean;
  ordering?: string;
  returned_records: number;
  page_size: number;
  page_size_cap: number;
  using_replica: boolean;
}

/**
 * ContactSimpleItem - Simplified contact data returned when view=simple
 */
export interface ContactSimpleItem {
  id: number;
  uuid: string;
  first_name: string;
  last_name: string;
  title?: string;
  location: {
    city?: string;
    state?: string;
    country?: string;
  };
  company_name: string;
  person_linkedin_url?: string;
  company_domain?: string;
}

/**
 * Cursor pagination response (used with default ordering by created_at)
 */
interface CursorListResponse {
  next: string | null;
  previous: string | null;
  results: ApiContact[] | ContactSimpleItem[];
  meta?: ResponseMeta;
}

/**
 * Limit-offset pagination response (used with custom ordering)
 */
interface OffsetListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiContact[] | ContactSimpleItem[];
  meta?: ResponseMeta;
}

/**
 * Count response
 */
interface CountResponse {
  count: number;
}

/**
 * API Contact response shape (snake_case from backend)
 * 
 * Matches the exact structure returned by the Contacts API.
 */
interface ApiContact {
  id: number;
  first_name?: string;
  last_name?: string;
  title?: string;
  company?: string;
  company_name_for_emails?: string;
  email?: string;
  email_status?: string;
  primary_email_catch_all_status?: string;
  seniority?: string;
  departments?: string;
  work_direct_phone?: string;
  home_phone?: string;
  mobile_phone?: string;
  corporate_phone?: string;
  other_phone?: string;
  stage?: string;
  employees?: number;
  industry?: string;
  keywords?: string;
  person_linkedin_url?: string;
  website?: string;
  company_linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  city?: string;
  state?: string;
  country?: string;
  company_address?: string;
  company_city?: string;
  company_state?: string;
  company_country?: string;
  company_phone?: string;
  technologies?: string;
  annual_revenue?: number;
  total_funding?: number;
  latest_funding?: string;
  latest_funding_amount?: number;
  last_raised_at?: string;
  meta_data?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  photo_url?: string;
  company_size?: string;
  postal_code?: string;
  notes?: string;
  is_active?: boolean;
  user_id?: string;
}

export type FetchContactsResult = {
  contacts: Contact[];
  count: number;
  next: string | null;
  previous: string | null;
  meta?: ResponseMeta;
  error?: ParsedError;
};

/**
 * Maps snake_case API response to camelCase Contact type
 * 
 * Converts the API response format (snake_case) to the frontend Contact type (camelCase).
 * Handles all fields from the API documentation including optional fields.
 * 
 * @param apiContact - The contact object from the API response
 * @returns Contact object in camelCase format
 * @throws Error if contact data is invalid
 */
const mapApiToContact = (apiContact: ApiContact | any): Contact => {
  if (!apiContact || typeof apiContact !== 'object') {
    throw new Error('Invalid contact data received from API');
  }

  // Determine primary phone number (priority order)
  const phone = apiContact.work_direct_phone || 
                apiContact.mobile_phone || 
                apiContact.home_phone || 
                apiContact.corporate_phone || 
                apiContact.other_phone || 
                apiContact.phone_number || 
                '';
  
  // Build full name from first and last name
  const firstName = apiContact.first_name || '';
  const lastName = apiContact.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'N/A';
  
  return {
    id: apiContact.id,
    name: fullName,
    email: apiContact.email || '',
    company: apiContact.company || '',
    phone: phone,
    status: (apiContact.stage || 'Lead') as Contact['status'],
    avatarUrl: apiContact.photo_url || `https://picsum.photos/seed/${apiContact.id}/40/40`,
    title: apiContact.title,
    industry: apiContact.industry,
    companySize: apiContact.company_size,
    companyAddress: apiContact.company_address,
    website: apiContact.website,
    employeesCount: apiContact.employees,
    annualRevenue: apiContact.annual_revenue,
    totalFunding: apiContact.total_funding,
    latestFundingAmount: apiContact.latest_funding_amount,
    latestFunding: apiContact.latest_funding,
    lastRaisedAt: apiContact.last_raised_at,
    seniority: apiContact.seniority,
    departments: apiContact.departments,
    keywords: apiContact.keywords,
    technologies: apiContact.technologies,
    emailStatus: apiContact.email_status,
    primaryEmailCatchAllStatus: apiContact.primary_email_catch_all_status,
    stage: apiContact.stage,
    city: apiContact.city,
    state: apiContact.state,
    country: apiContact.country,
    postalCode: apiContact.postal_code,
    companyCity: apiContact.company_city,
    companyState: apiContact.company_state,
    companyCountry: apiContact.company_country,
    companyPhone: apiContact.company_phone,
    companyNameForEmails: apiContact.company_name_for_emails,
    personLinkedinUrl: apiContact.person_linkedin_url,
    companyLinkedinUrl: apiContact.company_linkedin_url,
    facebookUrl: apiContact.facebook_url,
    twitterUrl: apiContact.twitter_url,
    notes: apiContact.notes,
    tags: apiContact.keywords,
    isActive: apiContact.is_active ?? true,
    createdAt: apiContact.created_at,
    updatedAt: apiContact.updated_at,
    userId: apiContact.user_id,
  };
};

/**
 * Maps ContactSimpleItem to Contact type
 * 
 * Converts the simplified contact response (view=simple) to the frontend Contact type.
 * 
 * @param simpleItem - The ContactSimpleItem from the API response
 * @returns Contact object in camelCase format
 * @throws Error if contact data is invalid
 */
const mapSimpleItemToContact = (simpleItem: ContactSimpleItem): Contact => {
  if (!simpleItem || typeof simpleItem !== 'object') {
    throw new Error('Invalid simple contact data received from API');
  }

  const fullName = `${simpleItem.first_name || ''} ${simpleItem.last_name || ''}`.trim() || 'N/A';
  const location = simpleItem.location || {};
  
  return {
    id: simpleItem.id,
    name: fullName,
    email: '', // Not available in simple view
    company: simpleItem.company_name || '',
    phone: '', // Not available in simple view
    status: 'Lead' as Contact['status'], // Default value, not available in simple view
    avatarUrl: `https://picsum.photos/seed/${simpleItem.id}/40/40`,
    title: simpleItem.title,
    city: location.city,
    state: location.state,
    country: location.country,
    personLinkedinUrl: simpleItem.person_linkedin_url,
    website: simpleItem.company_domain,
  };
};

/**
 * Build query string from filters
 * 
 * Converts ContactFilters object and search term into URLSearchParams for API requests.
 * Filters out empty values, 'All' values, and properly maps filter keys to API parameter names.
 * 
 * @param filters - ContactFilters object with filter criteria
 * @param search - Full-text search term
 * @returns URLSearchParams object ready for API request
 */
const buildFilterQuery = (filters?: ContactFilters, search?: string): URLSearchParams => {
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
          value.forEach(v => {
            if (v && v.trim()) {
              query.append(apiKey, v.trim());
            }
          });
        }
        continue;
      }
      
      // Skip empty values, 'All' values
      if (value === 'All' || value === '') {
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
        const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/contacts/?${query.toString()}`, {
          method: 'GET',
          headers,
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
            
            const countResp = await authenticatedFetch(countUrl, {
              method: 'GET',
              headers: requestId ? { 'X-Request-Id': requestId } : undefined,
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
            console.error('[CONTACT] Failed to fetch contact count:', e);
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
        if (distinct) query.set('distinct', 'true');
        if (company) query.set('company', company);
        if (ordering) query.set('ordering', ordering);
        query.set('limit', String(limit));
        query.set('offset', String(offset));

        const headers: HeadersInit = {};
        if (requestId) {
            headers['X-Request-Id'] = requestId;
        }

        const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/contacts/${field}/?${query.toString()}`, {
          method: 'GET',
          headers,
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
 * Interface for keywords endpoint response item
 */
export interface KeywordItem {
    id: number;
    keywords: string;
}

/**
 * Interface for keywords endpoint response
 */
export interface KeywordsResponse {
    next: string | null;
    previous: string | null;
    results: KeywordItem[];
}

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

        const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/contacts/keywords/?${query.toString()}`, {
          method: 'GET',
          headers,
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

/**
 * Get a single contact by ID
 * 
 * Retrieves detailed information about a specific contact by its ID.
 * 
 * **Error Handling:**
 * - Returns `null` if contact is not found (404)
 * - Throws error for other failures
 * 
 * @param id - The contact ID
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to Contact object or null if not found
 * 
 * @example
 * ```typescript
 * const contact = await getContactById(123);
 * if (contact) {
 *   console.log(contact.name, contact.email);
 * }
 * ```
 */
export const getContactById = async (id: number, requestId?: string): Promise<Contact | null> => {
    try {
        if (!id || typeof id !== 'number') {
          throw new Error('Invalid contact ID');
        }

        const headers: HeadersInit = {};
        if (requestId) {
            headers['X-Request-Id'] = requestId;
        }

        const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/contacts/${id}/`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          const error = await parseApiError(response, `Failed to fetch contact ${id}`);
          throw error;
        }

        const data: ApiContact = await response.json();
        return mapApiToContact(data);
    } catch (error) {
        const parsedError = parseExceptionError(error, `Failed to fetch contact ${id}`);
        console.error(`[CONTACT] Failed to fetch contact ${id}:`, {
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

        const response = await authenticatedFetch(url, {
          method: 'GET',
          headers,
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
 * Get the contacts write key from environment variable
 */
const getContactsWriteKey = (): string | null => {
  if (typeof window === 'undefined') {
    // Server-side: use process.env
    return process.env.NEXT_PUBLIC_CONTACTS_WRITE_KEY || null;
  }
  // Client-side: use window.env or process.env
  return (window as any).env?.NEXT_PUBLIC_CONTACTS_WRITE_KEY || 
         process.env.NEXT_PUBLIC_CONTACTS_WRITE_KEY || 
         null;
};

/**
 * Create a new contact
 * 
 * Creates a new contact record using the ContactCreate schema. All body fields are optional.
 * Requires admin authentication and the X-Contacts-Write-Key header.
 * 
 * **Field Requirements:**
 * All fields are optional:
 * - uuid (string, optional): Contact UUID. If not provided, one will be generated.
 * - first_name (string, optional): Contact's first name.
 * - last_name (string, optional): Contact's last name.
 * - company_id (string, optional): UUID of the related company.
 * - email (string, optional): Contact's email address.
 * - title (string, optional): Contact's job title.
 * - departments (array[string], optional): List of department names.
 * - mobile_phone (string, optional): Contact's mobile phone number.
 * - email_status (string, optional): Email verification status.
 * - text_search (string, optional): Free-form search text, e.g., location information.
 * - seniority (string, optional): Contact's seniority level.
 * 
 * **Authentication:**
 * - Requires admin authentication (Bearer token)
 * - Requires X-Contacts-Write-Key header matching the configured CONTACTS_WRITE_KEY value
 * 
 * **Response Codes:**
 * - 201 Created: Contact created successfully
 * - 400 Bad Request: Invalid request data
 * - 401 Unauthorized: Authentication required
 * - 403 Forbidden: Admin access required or invalid write key
 * 
 * @param contactData - ContactCreate data with contact information
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to ServiceResponse<Contact> with created contact
 * 
 * @example
 * ```typescript
 * const result = await createContact({
 *   first_name: 'John',
 *   last_name: 'Doe',
 *   email: 'john@example.com',
 *   title: 'CEO',
 *   departments: ['executive'],
 *   mobile_phone: '+1234567890',
 *   email_status: 'valid',
 *   text_search: 'San Francisco, CA',
 *   seniority: 'c-level'
 * });
 * 
 * if (result.success && result.data) {
 *   console.log('Contact created:', result.data.id);
 * } else {
 *   console.error('Error:', result.message);
 * }
 * ```
 */
export const createContact = async (
  contactData: ContactCreate,
  requestId?: string
): Promise<ServiceResponse<Contact>> => {
  try {
    // Get write key from environment
    const writeKey = getContactsWriteKey();
    if (!writeKey) {
      return {
        success: false,
        message: 'Contacts write key not configured. Please set NEXT_PUBLIC_CONTACTS_WRITE_KEY environment variable.',
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
      'X-Contacts-Write-Key': writeKey,
    };
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    // Prepare request body (only include defined fields)
    const requestBody: ContactCreate = {};
    if (contactData.uuid !== undefined) requestBody.uuid = contactData.uuid;
    if (contactData.first_name !== undefined) requestBody.first_name = contactData.first_name;
    if (contactData.last_name !== undefined) requestBody.last_name = contactData.last_name;
    if (contactData.company_id !== undefined) requestBody.company_id = contactData.company_id;
    if (contactData.email !== undefined) requestBody.email = contactData.email;
    if (contactData.title !== undefined) requestBody.title = contactData.title;
    if (contactData.departments !== undefined) requestBody.departments = contactData.departments;
    if (contactData.mobile_phone !== undefined) requestBody.mobile_phone = contactData.mobile_phone;
    if (contactData.email_status !== undefined) requestBody.email_status = contactData.email_status;
    if (contactData.text_search !== undefined) requestBody.text_search = contactData.text_search;
    if (contactData.seniority !== undefined) requestBody.seniority = contactData.seniority;

    const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/contacts/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

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
          message: 'Admin access required or invalid write key. Please check your X-Contacts-Write-Key header.',
          error,
          fieldErrors: error.fieldErrors,
          nonFieldErrors: error.nonFieldErrors,
        };
      }
      const error = await parseApiError(response, 'Failed to create contact');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to create contact'),
        error,
        fieldErrors: error.fieldErrors,
        nonFieldErrors: error.nonFieldErrors,
      };
    }

    // Handle 201 Created response
    const data: ApiContact = await response.json();
    const contact = mapApiToContact(data);

    return {
      success: true,
      message: 'Contact created successfully',
      data: contact,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to create contact');
    console.error('[CONTACT] Create contact error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to create contact'),
      error: parsedError,
      fieldErrors: parsedError.fieldErrors,
      nonFieldErrors: parsedError.nonFieldErrors,
    };
  }
};
