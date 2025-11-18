/**
 * Company Service Filter Utilities
 * 
 * Functions for building filter queries and mapping filter keys.
 */

import {
  CompanyFilters,
  CompanyContactFilters,
} from '@/types/company';

/**
 * Maps UI sort column names to API field names
 */
export const mapSortColumn = (column: string): string => {
  const mapping: { [key: string]: string } = {
    name: 'name',
    employeesCount: 'employees_count',
    annualRevenue: 'annual_revenue',
    totalFunding: 'total_funding',
    created_at: 'created_at',
    updated_at: 'updated_at',
  };

  if (mapping[column]) {
    return mapping[column];
  }

  // Convert camelCase to snake_case
  return column.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Maps UI filter keys to API parameter names
 * 
 * Handles conversion from camelCase UI keys to snake_case API parameters.
 */
export const mapFilterKey = (key: string): string => {
  // Special mappings for fields that don't follow standard conversion
  const mapping: { [key: string]: string } = {
    // Already snake_case
    company_location: 'company_location',
    employees_count: 'employees_count',
    annual_revenue: 'annual_revenue',
    total_funding: 'total_funding',
    employees_min: 'employees_min',
    employees_max: 'employees_max',
    annual_revenue_min: 'annual_revenue_min',
    annual_revenue_max: 'annual_revenue_max',
    total_funding_min: 'total_funding_min',
    total_funding_max: 'total_funding_max',
    created_at_after: 'created_at_after',
    created_at_before: 'created_at_before',
    updated_at_after: 'updated_at_after',
    updated_at_before: 'updated_at_before',
    phone_number: 'phone_number',
    linkedin_url: 'linkedin_url',
    facebook_url: 'facebook_url',
    twitter_url: 'twitter_url',
    text_search: 'text_search',
  };

  // Return mapped value if exists, otherwise convert camelCase to snake_case
  if (mapping[key]) {
    return mapping[key];
  }

  // Convert camelCase to snake_case
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Build query string from filters
 * 
 * Converts CompanyFilters object and search term into URLSearchParams for API requests.
 * Filters out empty values and properly maps filter keys to API parameter names.
 * 
 * @param filters - CompanyFilters object with filter criteria
 * @param search - Full-text search term
 * @returns URLSearchParams object ready for API request
 */
export const buildFilterQuery = (
  filters?: CompanyFilters,
  search?: string
): URLSearchParams => {
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
          value.forEach((v) => {
            if (v && v.toString().trim()) {
              query.append(apiKey, v.toString().trim());
            }
          });
        }
        continue;
      }

      // Skip empty values
      if (value === '') {
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
 * Build query string from company contact filters
 * 
 * Converts CompanyContactFilters object and search term into URLSearchParams for API requests.
 * Filters out empty values and properly maps filter keys to API parameter names.
 * 
 * @param filters - CompanyContactFilters object with filter criteria
 * @param search - Full-text search term
 * @returns URLSearchParams object ready for API request
 */
export const buildCompanyContactFilterQuery = (
  filters?: CompanyContactFilters,
  search?: string
): URLSearchParams => {
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
          // Add each value as a separate query parameter (repeated params)
          value.forEach((v) => {
            if (v && v.toString().trim()) {
              query.append(key, v.toString().trim());
            }
          });
        }
        continue;
      }

      // Skip empty values
      if (value === '') {
        continue;
      }

      // Convert to string, handling both string and array values
      query.set(key, String(value));
    }
  }

  return query;
};

