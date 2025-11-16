/**
 * Apollo.io URL Analysis Types
 * 
 * Type definitions for Apollo.io URL analysis and contact search functionality.
 * Matches the API response schemas from /api/v2/apollo/* endpoints.
 */

import { Contact } from './index';
import { ResponseMeta } from '@/services/contact';

/**
 * Apollo URL Structure
 * 
 * Represents the parsed structure of an Apollo.io URL.
 */
export interface ApolloUrlStructure {
  base_url: string;
  hash_path: string | null;
  query_string: string | null;
  has_query_params: boolean;
}

/**
 * Apollo Parameter
 * 
 * Represents a single parameter extracted from an Apollo.io URL.
 */
export interface ApolloParameter {
  name: string;
  values: string[];
  description: string;
  category: string;
}

/**
 * Apollo Parameter Category
 * 
 * Groups related parameters together with metadata.
 */
export interface ApolloParameterCategory {
  name: string;
  parameters: ApolloParameter[];
  total_parameters: number;
}

/**
 * Apollo Statistics
 * 
 * Summary statistics about the analyzed URL parameters.
 */
export interface ApolloStatistics {
  total_parameters: number;
  total_parameter_values: number;
  categories_used: number;
  categories: string[];
}

/**
 * Apollo URL Analysis Response
 * 
 * Complete response from the /api/v2/apollo/analyze endpoint.
 */
export interface ApolloUrlAnalysisResponse {
  url: string;
  url_structure: ApolloUrlStructure;
  categories: ApolloParameterCategory[];
  statistics: ApolloStatistics;
  raw_parameters: Record<string, string[]>;
}

/**
 * Apollo Mapping Summary
 * 
 * Summary of how Apollo parameters were mapped to contact filters.
 */
export interface ApolloMappingSummary {
  total_apollo_parameters: number;
  mapped_parameters: number;
  unmapped_parameters: number;
  mapped_parameter_names: string[];
  unmapped_parameter_names: string[];
}

/**
 * Apollo Unmapped Parameter
 * 
 * Details about a parameter that could not be mapped to contact filters.
 */
export interface ApolloUnmappedParameter {
  name: string;
  values: string[];
  category: string;
  reason: string;
}

/**
 * Apollo Unmapped Category
 * 
 * Groups unmapped parameters by category with reasons.
 */
export interface ApolloUnmappedCategory {
  name: string;
  total_parameters: number;
  parameters: ApolloUnmappedParameter[];
}

/**
 * Apollo Contacts Response
 * 
 * Extended response from /api/v2/apollo/contacts endpoint.
 * Includes contact results plus Apollo URL mapping metadata.
 */
export interface ApolloContactsResponse {
  next: string | null;
  previous: string | null;
  results: Contact[];
  meta?: ResponseMeta;
  apollo_url: string;
  mapping_summary: ApolloMappingSummary;
  unmapped_categories: ApolloUnmappedCategory[];
}

/**
 * Apollo Contacts Search Parameters
 * 
 * Optional parameters for the /api/v2/apollo/contacts endpoint.
 */
export interface ApolloContactsSearchParams {
  limit?: number;
  offset?: number;
  cursor?: string | null;
  view?: 'simple' | 'full';
  include_company_name?: string;
  exclude_company_name?: string[];
  include_domain_list?: string[];
  exclude_domain_list?: string[];
  requestId?: string;
}

/**
 * Apollo Analyze Request
 * 
 * Request body for /api/v2/apollo/analyze endpoint.
 */
export interface ApolloAnalyzeRequest {
  url: string;
}

/**
 * Apollo Contacts Request
 * 
 * Request body for /api/v2/apollo/contacts endpoint.
 */
export interface ApolloContactsRequest {
  url: string;
}

/**
 * Apollo Contacts Count Request
 * 
 * Request body for /api/v2/apollo/contacts/count endpoint.
 */
export interface ApolloContactsCountRequest {
  url: string;
}

/**
 * Apollo Contacts Count Response
 * 
 * Response from /api/v2/apollo/contacts/count endpoint.
 */
export interface ApolloContactsCountResponse {
  count: number;
}

/**
 * Apollo Contacts UUIDs Request
 * 
 * Request body for /api/v2/apollo/contacts/count/uuids endpoint.
 */
export interface ApolloContactsUuidsRequest {
  url: string;
}

/**
 * Apollo Contacts UUIDs Response
 * 
 * Response from /api/v2/apollo/contacts/count/uuids endpoint.
 */
export interface ApolloContactsUuidsResponse {
  count: number;
  uuids: string[];
}

/**
 * Apollo Contacts UUIDs Parameters
 * 
 * Optional parameters for the /api/v2/apollo/contacts/count/uuids endpoint.
 */
export interface ApolloContactsUuidsParams {
  include_company_name?: string;
  exclude_company_name?: string[];
  include_domain_list?: string[];
  exclude_domain_list?: string[];
  limit?: number;
  requestId?: string;
}

/**
 * Apollo Parameter Category Names
 * 
 * Standard category names used by Apollo.io URL parameters.
 */
export type ApolloParameterCategoryName =
  | 'Pagination'
  | 'Sorting'
  | 'Person Filters'
  | 'Organization Filters'
  | 'Email Filters'
  | 'Keyword Filters'
  | 'Search Lists'
  | 'Technology'
  | 'Market Segments'
  | 'Intent'
  | 'Lookalike'
  | 'Prospecting'
  | 'Other';

/**
 * Apollo Unmapped Reason Types
 * 
 * Standard reasons why parameters might not be mapped.
 */
export type ApolloUnmappedReason =
  | 'ID-based filter (no name mapping available)'
  | 'Apollo-specific feature (search lists, personas)'
  | 'Unmapped filter'
  | 'Keyword field control'
  | 'UI flag or advanced filter (not applicable)'
  | 'Unknown parameter (no mapping defined)';

