/**
 * Contact Service
 * 
 * Handles all contact-related API operations including fetching, filtering, and querying contacts.
 * All contact operations in the backend are read-only (GET only).
 */

import { Contact } from '../types/index';
import { API_BASE_URL } from './api';
import { request } from '../utils/request';
import { parseApiError, parseExceptionError, formatErrorMessage, ParsedError } from '../utils/errorHandler';

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

// Maps UI filter keys to API parameter names
const mapFilterKey = (key: string): string => {
    const mapping: { [key: string]: string } = {
        'status': 'stage',
        'emailStatus': 'email_status',
        'tags': 'keywords',
    };
    
    if (mapping[key]) {
        return mapping[key];
    }
    
    return key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Strict filter types
 */
export interface ContactFilters {
    status?: Contact['status'] | 'All';
    emailStatus?: 'All' | 'Verified' | 'Unverified' | 'Bounced' | string;
    industry?: string;
    title?: string;
    tags?: string;
    city?: string;
    state?: string;
    country?: string;
    employees_min?: string | number;
    employees_max?: string | number;
    annual_revenue_min?: string | number;
    annual_revenue_max?: string | number;
    [key: string]: string | number | undefined;
}

/**
 * Fetch contacts parameters
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
}

// Response shapes for list endpoints
interface CursorListResponse {
  next: string | null;
  previous: string | null;
  results: any[];
}

interface OffsetListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: any[];
}

interface CountResponse {
  count: number;
}

export type FetchContactsResult = {
  contacts: Contact[];
  count: number;
  next: string | null;
  previous: string | null;
  error?: ParsedError;
};

// Maps snake_case API response to camelCase Contact type
const mapApiToContact = (apiContact: any): Contact => {
  if (!apiContact || typeof apiContact !== 'object') {
    throw new Error('Invalid contact data received from API');
  }

  const phone = apiContact.work_direct_phone || 
                apiContact.mobile_phone || 
                apiContact.home_phone || 
                apiContact.corporate_phone || 
                apiContact.other_phone || 
                apiContact.phone_number || 
                '';
  
  return {
    id: apiContact.id,
    name: `${apiContact.first_name || ''} ${apiContact.last_name || ''}`.trim() || 'N/A',
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
    seniority: apiContact.seniority,
    departments: apiContact.departments,
    keywords: apiContact.keywords,
    technologies: apiContact.technologies,
    emailStatus: apiContact.email_status,
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
 * Build query string from filters
 */
const buildFilterQuery = (filters?: ContactFilters, search?: string): URLSearchParams => {
  const query = new URLSearchParams();
  
  if (search) {
    query.set('search', search);
  }

  if (filters) {
    for (const key in filters) {
      const value = filters[key];
      if (value && value !== 'All' && value !== '') {
        const apiKey = mapFilterKey(key);
        query.set(apiKey, String(value));
      }
    }
  }

  return query;
};

/**
 * Fetch contacts with search, filters, sorting, and pagination
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
    } = params;

    const query = buildFilterQuery(filters, search);

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

    try {
        const response = await request(`${API_BASE_URL}/contacts/?${query.toString()}`, {
          method: 'GET',
          timeout: 30000,
          retries: 1,
        });

        if (!response.ok) {
          const error = await parseApiError(response, 'Failed to fetch contacts');
          console.error('[CONTACT] Failed to fetch contacts:', error);
          return {
            contacts: [],
            count: 0,
            next: null,
            previous: null,
            error,
          };
        }

        const data: CursorListResponse | OffsetListResponse = await response.json();
        const contacts = (data.results || []).map((item: any) => {
          try {
            return mapApiToContact(item);
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
              ? `${API_BASE_URL}/contacts/count/?${countQuery.toString()}`
              : `${API_BASE_URL}/contacts/count/`;
            
            const countResp = await request(countUrl, {
              method: 'GET',
              timeout: 10000,
              retries: 1,
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
        };
    } catch (error) {
        const parsedError = parseExceptionError(error, 'Failed to fetch contacts');
        console.error('[CONTACT] Failed to fetch contacts:', parsedError);
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
 */
export const fetchFieldValues = async (
    field: string,
    params?: { search?: string; distinct?: boolean; limit?: number; offset?: number }
): Promise<Array<Record<string, any>>> => {
    try {
        if (!field || typeof field !== 'string') {
          throw new Error('Invalid field name');
        }

        const { search, distinct = false, limit = 25, offset = 0 } = params || {};
        const query = new URLSearchParams();
        if (search) query.set('search', search);
        if (distinct) query.set('distinct', 'true');
        query.set('limit', String(limit));
        query.set('offset', String(offset));

        const response = await request(`${API_BASE_URL}/contacts/${field}/?${query.toString()}`, {
          method: 'GET',
          timeout: 15000,
          retries: 1,
        });

        if (!response.ok) {
          const error = await parseApiError(response, `Failed to fetch field values for ${field}`);
          throw error;
        }

        const data = await response.json();
        return (data.results || []) as Array<Record<string, any>>;
    } catch (error) {
        const parsedError = parseExceptionError(error, `Failed to fetch field values for ${field}`);
        console.error(`[CONTACT] Failed to fetch field values for ${field}:`, parsedError);
        return [];
    }
};

export const fetchDistinctValues = async (field: string): Promise<string[]> => {
    try {
      const rows = await fetchFieldValues(field, { distinct: true, limit: 1000, offset: 0 });
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
 */
export const fetchKeywords = async (params?: {
    search?: string;
    separated?: boolean;
    distinct?: boolean;
    limit?: number;
    offset?: number;
}): Promise<KeywordsResponse> => {
    try {
        const { search, separated, distinct, limit = 25, offset = 0 } = params || {};
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

        const response = await request(`${API_BASE_URL}/contacts/keywords/?${query.toString()}`, {
          method: 'GET',
          timeout: 15000,
          retries: 1,
        });

        if (!response.ok) {
          const error = await parseApiError(response, 'Failed to fetch keywords');
          throw error;
        }

        const data = await response.json();
        return data as KeywordsResponse;
    } catch (error) {
        const parsedError = parseExceptionError(error, 'Failed to fetch keywords');
        console.error('[CONTACT] Failed to fetch keywords:', parsedError);
        return {
            next: null,
            previous: null,
            results: [],
        };
    }
};

/**
 * Get a single contact by ID
 */
export const getContactById = async (id: number): Promise<Contact | null> => {
    try {
        if (!id || typeof id !== 'number') {
          throw new Error('Invalid contact ID');
        }

        const response = await request(`${API_BASE_URL}/contacts/${id}/`, {
          method: 'GET',
          timeout: 15000,
          retries: 1,
        });

        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          const error = await parseApiError(response, `Failed to fetch contact ${id}`);
          throw error;
        }

        const data = await response.json();
        return mapApiToContact(data);
    } catch (error) {
        const parsedError = parseExceptionError(error, `Failed to fetch contact ${id}`);
        console.error(`[CONTACT] Failed to fetch contact ${id}:`, parsedError);
        return null;
    }
};

/**
 * Get contact count with optional filters
 */
export const getContactCount = async (filters?: ContactFilters): Promise<number> => {
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
            ? `${API_BASE_URL}/contacts/count/?${queryString}`
            : `${API_BASE_URL}/contacts/count/`;

        const response = await request(url, {
          method: 'GET',
          timeout: 10000,
          retries: 1,
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
        console.error('[CONTACT] Failed to fetch contact count:', parsedError);
        return 0;
    }
};
