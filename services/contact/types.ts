/**
 * Contact Service Types
 * 
 * All type definitions and interfaces for the contact service.
 */

import { Contact } from '@/types/index';
import { ParsedError } from '@utils/error';

/**
 * Service response interface
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: ParsedError;
  fieldErrors?: Record<string, string[]>; // Field-specific errors for easier access
  nonFieldErrors?: string[]; // Non-field errors for easier access
}

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
    
    // Exact match numeric filters
    employees_count?: string | number;
    annual_revenue?: string | number;
    total_funding?: string | number;
    
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
export interface CursorListResponse {
  next: string | null;
  previous: string | null;
  results: ApiContact[] | ContactSimpleItem[];
  meta?: ResponseMeta;
}

/**
 * Limit-offset pagination response (used with custom ordering)
 */
export interface OffsetListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiContact[] | ContactSimpleItem[];
  meta?: ResponseMeta;
}

/**
 * Count response
 */
export interface CountResponse {
  count: number;
}

/**
 * API Contact response shape (snake_case from backend)
 * 
 * Matches the exact structure returned by the Contacts API.
 */
export interface ApiContact {
  uuid: string;
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

