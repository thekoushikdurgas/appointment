/**
 * Contact Service Filter Utilities
 * 
 * Functions for building filter queries and mapping filter keys.
 */

import { ContactFilters } from './types';

/**
 * Maps UI sort column names to API field names
 */
export const mapSortColumn = (column: string): string => {
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
export const mapFilterKey = (key: string): string => {
    // Special mappings for fields that don't follow standard camelCase to snake_case conversion
    const mapping: { [key: string]: string } = {
        // Status and stage
        'status': 'stage',
        'emailStatus': 'email_status',
        'primary_email_catch_all_status': 'primary_email_catch_all_status', // Already snake_case
        
        // Exact match numeric filters (already snake_case in API)
        'employees_count': 'employees_count',
        'annual_revenue': 'annual_revenue',
        'total_funding': 'total_funding',
        
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
        'departments': 'departments',
        'seniority': 'seniority',
        
        // Company fields (already snake_case in API)
        'company_name_for_emails': 'company_name_for_emails',
        'company_address': 'company_address',
        'company_domains': 'company_domains',
        'industry': 'industry',
        'keywords': 'keywords',
        'technologies': 'technologies',
        'contact_address': 'contact_address',
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
 * Build query string from filters
 * 
 * Converts ContactFilters object and search term into URLSearchParams for API requests.
 * Filters out empty values, 'All' values, and properly maps filter keys to API parameter names.
 * 
 * **Filter Handling:**
 * - Text filters: Partial matching (case-insensitive contains)
 * - Exact match filters: Exact matching (case-insensitive)
 * - Numeric range filters: Min/max range queries
 * - Date range filters: ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
 * - Exclusion filters: Array values, multiple parameters with same key
 * - Location filters: Full-text search on location fields
 * 
 * **Special Handling:**
 * - Skips undefined, null, empty string, and 'All' values
 * - Exclusion filters (arrays) are added as repeated query parameters
 * - All filter keys are mapped to API parameter names via mapFilterKey()
 * 
 * @param filters - ContactFilters object with filter criteria
 * @param search - Full-text search term
 * @returns URLSearchParams object ready for API request
 * 
 * @example
 * ```typescript
 * const filters = {
 *   first_name: 'John',
 *   country: 'United States',
 *   employees_min: 50,
 *   exclude_titles: ['Intern', 'Junior']
 * };
 * const query = buildFilterQuery(filters, 'technology');
 * // Returns: search=technology&first_name=John&country=United+States&employees_min=50&exclude_titles=Intern&exclude_titles=Junior
 * ```
 */
export const buildFilterQuery = (filters?: ContactFilters, search?: string): URLSearchParams => {
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
      
      // Skip company_domains as it's not a valid filter for the main contacts API
      // (it's only used for the distinct endpoint dropdown)
      if (key === 'company_domains') {
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
      
      // Handle company_name_for_emails as array (multi-value filter)
      if (key === 'company_name_for_emails' && Array.isArray(value)) {
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
      
      // Handle array-based multi-value filters
      const arrayFilters = [
        'title',
        'industry',
        'seniority',
        'departments',
        'keywords',
        'technologies',
        'company_address',
        'contact_address'
      ];
      
      if (arrayFilters.includes(key) && Array.isArray(value)) {
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
      
      // Skip empty values, 'All' values, and empty arrays
      if (value === 'All' || value === '' || (Array.isArray(value) && value.length === 0)) {
        continue;
      }
      
      const apiKey = mapFilterKey(key);
      
      // Convert to string, handling both string and number values
      query.set(apiKey, String(value));
    }
  }

  return query;
};

