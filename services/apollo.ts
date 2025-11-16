/**
 * Apollo Service
 * 
 * Handles Apollo.io URL analysis and contact search operations.
 * 
 * **Key Functions:**
 * - `analyzeApolloUrl()` - Analyze Apollo.io URL and return structured parameter breakdown
 * - `searchContactsFromApolloUrl()` - Search contacts using Apollo.io URL parameters
 * - `countContactsFromApolloUrl()` - Count contacts matching Apollo.io URL parameters
 * - `getContactUuidsFromApolloUrl()` - Get contact UUIDs matching Apollo.io URL parameters
 * 
 * **Authentication:**
 * All endpoints require JWT authentication via Bearer token.
 * 
 * **API Endpoints:**
 * - POST /api/v2/apollo/analyze - Analyze Apollo URL
 * - POST /api/v2/apollo/contacts - Search contacts from Apollo URL
 * - POST /api/v2/apollo/contacts/count - Count contacts from Apollo URL
 * - POST /api/v2/apollo/contacts/count/uuids - Get contact UUIDs from Apollo URL
 */

import { API_BASE_URL } from './api';
import { axiosAuthenticatedRequest } from '@utils/axiosRequest';
import {
  parseApiError,
  parseExceptionError,
  formatErrorMessage,
  ParsedError,
} from '../utils/errorHandler';
import {
  ApolloUrlAnalysisResponse,
  ApolloContactsResponse,
  ApolloContactsSearchParams,
  ApolloAnalyzeRequest,
  ApolloContactsRequest,
  ApolloContactsCountRequest,
  ApolloContactsCountResponse,
  ApolloContactsUuidsRequest,
  ApolloContactsUuidsResponse,
  ApolloContactsUuidsParams,
} from '@/types/apollo';

// Re-export types for convenience
export type { ApolloContactsUuidsParams };
import { Contact } from '@/types/index';
import { ResponseMeta } from './contact';

/**
 * Service response interface
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: ParsedError;
}

/**
 * API Contact response shape (snake_case from backend)
 */
interface ApiContact {
  uuid: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  company?: string;
  email?: string;
  email_status?: string;
  seniority?: string;
  employees?: number;
  city?: string;
  state?: string;
  country?: string;
  person_linkedin_url?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

/**
 * API response for Apollo contacts endpoint
 */
interface ApiApolloContactsResponse {
  next: string | null;
  previous: string | null;
  results: ApiContact[];
  meta?: ResponseMeta;
  apollo_url: string;
  mapping_summary: {
    total_apollo_parameters: number;
    mapped_parameters: number;
    unmapped_parameters: number;
    mapped_parameter_names: string[];
    unmapped_parameter_names: string[];
  };
  unmapped_categories: Array<{
    name: string;
    total_parameters: number;
    parameters: Array<{
      name: string;
      values: string[];
      category: string;
      reason: string;
    }>;
  }>;
}

/**
 * Maps snake_case API response to camelCase Contact type
 */
const mapApiToContact = (apiContact: ApiContact): Contact => {
  if (!apiContact || typeof apiContact !== 'object') {
    throw new Error('Invalid contact data received from API');
  }

  const firstName = apiContact.first_name || '';
  const lastName = apiContact.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'N/A';

  const phone = apiContact.work_direct_phone ||
    apiContact.mobile_phone ||
    apiContact.home_phone ||
    apiContact.corporate_phone ||
    apiContact.other_phone ||
    '';

  return {
    uuid: apiContact.uuid,
    name: fullName,
    email: apiContact.email || '',
    company: apiContact.company || '',
    phone: phone,
    status: (apiContact.stage || 'Lead') as Contact['status'],
    avatarUrl: apiContact.photo_url || `https://picsum.photos/seed/${apiContact.uuid}/40/40`,
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
 * Validate Apollo.io URL
 * 
 * Checks if the URL is from the apollo.io domain.
 */
const validateApolloUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return {
      valid: false,
      error: 'URL is required and must be a string',
    };
  }

  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('apollo.io')) {
      return {
        valid: false,
        error: 'URL must be from apollo.io domain',
      };
    }
    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }
};

/**
 * Analyze Apollo.io URL
 * 
 * Analyzes an Apollo.io URL and returns structured parameter breakdown.
 * This endpoint parses Apollo.io search URLs and extracts all query parameters,
 * categorizing them into logical groups.
 * 
 * **Endpoint:** POST /api/v2/apollo/analyze
 * 
 * **Authentication:** Required (JWT Bearer token)
 * 
 * **URL Validation:**
 * - URL must be from apollo.io domain
 * - URL must be a valid string
 * 
 * **Response includes:**
 * - URL structure breakdown (base URL, hash path, query string)
 * - Parameter categories (Pagination, Sorting, Person Filters, etc.)
 * - Statistics (total parameters, categories used)
 * - Raw parameters dictionary
 * 
 * **Error Handling:**
 * - 400 Bad Request: Invalid URL or not from Apollo.io domain
 * - 401 Unauthorized: Authentication required
 * - 500 Internal Server Error: Error occurred while analyzing URL
 * 
 * @param url - Apollo.io URL to analyze (must be from apollo.io domain)
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to ServiceResponse with ApolloUrlAnalysisResponse
 * 
 * @example
 * ```typescript
 * const result = await analyzeApolloUrl(
 *   'https://app.apollo.io/#/people?personTitles[]=CEO&personLocations[]=California'
 * );
 * 
 * if (result.success && result.data) {
 *   console.log('Categories:', result.data.categories);
 *   console.log('Statistics:', result.data.statistics);
 * } else {
 *   console.error('Error:', result.message);
 * }
 * ```
 */
export const analyzeApolloUrl = async (
  url: string,
  requestId?: string
): Promise<ServiceResponse<ApolloUrlAnalysisResponse>> => {
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

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    // Prepare request body
    const requestBody: ApolloAnalyzeRequest = { url };

    // Make API request
    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v2/apollo/analyze`,
      {
        method: 'POST',
        headers,
        data: requestBody,
        useQueue: true,
        useCache: false,
      }
    );

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to analyze Apollo URL');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to analyze Apollo URL'),
        error,
      };
    }

    const data: ApolloUrlAnalysisResponse = await response.json();

    return {
      success: true,
      message: 'Apollo URL analyzed successfully',
      data,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to analyze Apollo URL');
    console.error('[APOLLO] Analyze URL error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to analyze Apollo URL'),
      error: parsedError,
    };
  }
};

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

