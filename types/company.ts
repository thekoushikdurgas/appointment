/**
 * Company Types and Interfaces
 * 
 * TypeScript definitions for the Companies API integration.
 * Matches the API documentation at docs/api/company.md
 */

/**
 * Company metadata interface
 * Contains additional company information stored as nested object
 */
export interface CompanyMetadata {
  city?: string;
  state?: string;
  country?: string;
  phone_number?: string;
  website?: string;
  linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
}

/**
 * Company interface (camelCase for frontend use)
 * 
 * Main company data structure used throughout the frontend application.
 * Fields are in camelCase to match JavaScript/TypeScript conventions.
 */
export interface Company {
  id: number;
  uuid: string;
  name: string;
  employeesCount?: number;
  annualRevenue?: number;
  totalFunding?: number;
  industries?: string[];
  keywords?: string[];
  technologies?: string[];
  address?: string;
  textSearch?: string;
  metadata?: CompanyMetadata;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Company creation data interface
 * 
 * Matches the CompanyCreate schema from the API.
 * All fields are optional as per the API specification.
 */
export interface CompanyCreate {
  uuid?: string;
  name?: string;
  employees_count?: number;
  industries?: string[];
  keywords?: string[];
  address?: string;
  annual_revenue?: number;
  total_funding?: number;
  technologies?: string[];
  text_search?: string;
  metadata?: {
    city?: string;
    state?: string;
    country?: string;
    phone_number?: string;
    website?: string;
    linkedin_url?: string;
    facebook_url?: string;
    twitter_url?: string;
  };
}

/**
 * Company update data interface
 * 
 * Same as CompanyCreate - all fields are optional for partial updates
 */
export interface CompanyUpdate extends CompanyCreate {}

/**
 * API Company response shape (snake_case from backend)
 * 
 * Matches the exact structure returned by the Companies API.
 * Used internally for API response mapping.
 */
export interface ApiCompany {
  id: number;
  uuid: string;
  name?: string;
  employees_count?: number;
  annual_revenue?: number;
  total_funding?: number;
  industries?: string[];
  keywords?: string[];
  technologies?: string[];
  address?: string;
  text_search?: string;
  metadata?: {
    city?: string;
    state?: string;
    country?: string;
    phone_number?: string;
    website?: string;
    linkedin_url?: string;
    facebook_url?: string;
    twitter_url?: string;
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Company Filters Interface
 * 
 * Comprehensive filter options matching the Companies API documentation.
 * All filters support case-insensitive matching unless otherwise specified.
 * 
 * **Text Filters (case-insensitive contains):**
 * - Text filters support partial matching across fields
 * 
 * **Exact Match Filters:**
 * - employees_count, annual_revenue, total_funding (exact numeric match)
 * 
 * **Numeric Range Filters:**
 * - Use _min and _max suffixes for range queries
 * 
 * **Date Range Filters (ISO datetime format):**
 * - Use ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ
 * 
 * **Array Filters:**
 * - Comma-separated values for OR logic
 * 
 * **Exclusion Filters:**
 * - Multi-value arrays to exclude matching companies
 */
export interface CompanyFilters {
  // Text filters (case-insensitive contains)
  name?: string;
  address?: string;
  company_location?: string; // Searches text_search field
  city?: string;
  state?: string;
  country?: string;
  phone_number?: string;
  website?: string;
  linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  
  // Exact match filters
  employees_count?: number;
  annual_revenue?: number;
  total_funding?: number;
  
  // Numeric range filters
  employees_min?: number | string;
  employees_max?: number | string;
  annual_revenue_min?: number | string;
  annual_revenue_max?: number | string;
  total_funding_min?: number | string;
  total_funding_max?: number | string;
  
  // Array filters (comma-separated for OR logic)
  industries?: string;
  keywords?: string;
  technologies?: string;
  
  // Exclusion filters (multi-value, case-insensitive)
  exclude_industries?: string[];
  exclude_keywords?: string[];
  exclude_technologies?: string[];
  
  // Date range filters (ISO datetime format)
  created_at_after?: string;
  created_at_before?: string;
  updated_at_after?: string;
  updated_at_before?: string;
  
  // Index signature for additional dynamic filters
  [key: string]: string | number | string[] | undefined;
}

/**
 * Fetch companies parameters
 * 
 * @param search - Full-text search across multiple fields
 * @param filters - CompanyFilters object with filter criteria
 * @param sortColumn - Column name to sort by
 * @param sortDirection - Sort direction ('asc' or 'desc')
 * @param limit - Number of results per page (max 100, used with custom ordering)
 * @param offset - Offset for pagination (used when custom ordering is applied)
 * @param pageSize - Page size for cursor pagination (default: 25, max: 100)
 * @param cursor - Cursor for cursor-based pagination
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @param distinct - Return distinct companies based on primary key
 */
export interface FetchCompaniesParams {
  search?: string;
  filters?: CompanyFilters;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  pageSize?: number;
  cursor?: string | null;
  requestId?: string;
  distinct?: boolean;
}

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
}

/**
 * Cursor pagination response (used with default ordering by created_at)
 */
export interface CursorListResponse {
  next: string | null;
  previous: string | null;
  results: ApiCompany[];
  meta?: ResponseMeta;
}

/**
 * Limit-offset pagination response (used with custom ordering)
 */
export interface OffsetListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiCompany[];
  meta?: ResponseMeta;
}

/**
 * Count response
 */
export interface CountResponse {
  count: number;
}

/**
 * Attribute value response (for field-specific queries)
 */
export interface AttributeValueResponse {
  next: string | null;
  previous: string | null;
  results: Array<{
    value: string;
    count: number;
  }>;
}

/**
 * Fetch companies result
 */
export interface FetchCompaniesResult {
  companies: Company[];
  count: number;
  next: string | null;
  previous: string | null;
  meta?: ResponseMeta;
  error?: any;
}

/**
 * Service response interface
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: any;
  fieldErrors?: Record<string, string[]>;
  nonFieldErrors?: string[];
}

// ============================================================================
// Company Contacts Types
// ============================================================================

/**
 * Company Contact Metadata Interface
 * 
 * Contains additional contact information stored as nested object.
 * Matches the ContactMetadata structure from the API.
 */
export interface CompanyContactMetadata {
  city?: string;
  state?: string;
  country?: string;
  work_direct_phone?: string;
  home_phone?: string;
  other_phone?: string;
  linkedin_url?: string;
  website?: string;
  facebook_url?: string;
  twitter_url?: string;
  stage?: string;
}

/**
 * Company Contact Interface (camelCase for frontend use)
 * 
 * Contact data structure for company-specific contact responses.
 * Fields are in camelCase to match JavaScript/TypeScript conventions.
 */
export interface CompanyContact {
  id: number;
  uuid: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  title?: string;
  seniority?: string;
  departments?: string[];
  emailStatus?: string;
  mobilePhone?: string;
  company?: {
    uuid: string;
    name: string;
  };
  metadata?: CompanyContactMetadata;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * API Company Contact response shape (snake_case from backend)
 * 
 * Matches the exact structure returned by the Company Contacts API.
 * Used internally for API response mapping.
 */
export interface ApiCompanyContact {
  id: number;
  uuid: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  title?: string;
  seniority?: string;
  departments?: string[];
  email_status?: string;
  mobile_phone?: string;
  company?: {
    uuid: string;
    name: string;
  };
  metadata?: {
    city?: string;
    state?: string;
    country?: string;
    work_direct_phone?: string;
    home_phone?: string;
    other_phone?: string;
    linkedin_url?: string;
    website?: string;
    facebook_url?: string;
    twitter_url?: string;
    stage?: string;
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Company Contact Filters Interface
 * 
 * Comprehensive filter options for company contacts matching the API documentation.
 * All filters support case-insensitive matching unless otherwise specified.
 * 
 * **Contact Identity Filters:**
 * - first_name, last_name, title, seniority, department, email_status, email, contact_location
 * 
 * **Contact Metadata Filters:**
 * - work_direct_phone, home_phone, mobile_phone, city, state, country, person_linkedin_url, website, stage
 * 
 * **Exclusion Filters:**
 * - exclude_titles, exclude_contact_locations, exclude_seniorities, exclude_departments
 * 
 * **Temporal Filters (ISO datetime format):**
 * - created_at_after, created_at_before, updated_at_after, updated_at_before
 */
export interface CompanyContactFilters {
  // Contact identity filters (case-insensitive contains)
  first_name?: string;
  last_name?: string;
  title?: string;
  seniority?: string;
  department?: string;
  email_status?: string;
  email?: string;
  contact_location?: string; // Contact text-search column
  
  // Contact metadata filters (case-insensitive contains)
  work_direct_phone?: string;
  home_phone?: string;
  mobile_phone?: string;
  other_phone?: string;
  city?: string;
  state?: string;
  country?: string;
  person_linkedin_url?: string;
  website?: string;
  facebook_url?: string;
  twitter_url?: string;
  stage?: string;
  
  // Exclusion filters (multi-value, case-insensitive)
  exclude_titles?: string[];
  exclude_contact_locations?: string[];
  exclude_seniorities?: string[];
  exclude_departments?: string[];
  
  // Temporal filters (ISO datetime format)
  created_at_after?: string;
  created_at_before?: string;
  updated_at_after?: string;
  updated_at_before?: string;
  
  // Index signature for additional dynamic filters
  [key: string]: string | string[] | undefined;
}

/**
 * Fetch company contacts parameters
 * 
 * @param companyUuid - Company UUID identifier
 * @param search - General-purpose search term applied across contact text columns
 * @param filters - CompanyContactFilters object with filter criteria
 * @param ordering - Sort field (e.g., 'first_name', '-created_at', 'title')
 * @param limit - Number of items per page (>=1)
 * @param offset - Zero-based offset into result set (>=0)
 * @param cursor - Opaque cursor token for pagination
 * @param page - 1-indexed page number (>=1)
 * @param pageSize - Explicit page size override (>=1)
 * @param distinct - Return distinct contacts (default: false)
 * @param requestId - Optional X-Request-Id header value for request tracking
 */
export interface FetchCompanyContactsParams {
  search?: string;
  filters?: CompanyContactFilters;
  ordering?: string;
  limit?: number;
  offset?: number;
  cursor?: string | null;
  page?: number;
  pageSize?: number;
  distinct?: boolean;
  requestId?: string;
}

/**
 * Cursor pagination response for company contacts
 */
export interface CompanyContactCursorListResponse {
  next: string | null;
  previous: string | null;
  results: ApiCompanyContact[];
}

/**
 * Limit-offset pagination response for company contacts
 */
export interface CompanyContactOffsetListResponse {
  count?: number;
  next: string | null;
  previous: string | null;
  results: ApiCompanyContact[];
}

/**
 * Fetch company contacts result
 */
export interface FetchCompanyContactsResult {
  contacts: CompanyContact[];
  count: number;
  next: string | null;
  previous: string | null;
  error?: any;
}

/**
 * Company contact attribute response (for field-specific queries)
 * 
 * Returns array of distinct string values for contact attributes.
 * Used for endpoints like first_name, last_name, title, etc.
 */
export interface CompanyContactAttributeResponse {
  next: string | null;
  previous: string | null;
  results: string[];
}

/**
 * Fetch company contact attribute parameters
 * 
 * @param search - Case-insensitive search term to filter results
 * @param distinct - Return unique values (default: true)
 * @param limit - Maximum number of results (default: 25)
 * @param offset - Offset for pagination (default: 0)
 * @param ordering - Sort order ('value', '-value', 'count', '-count')
 * @param requestId - Optional X-Request-Id header value for request tracking
 */
export interface FetchCompanyContactAttributeParams {
  search?: string;
  distinct?: boolean;
  limit?: number;
  offset?: number;
  ordering?: string;
  requestId?: string;
}

