/**
 * Apollo Service Types
 * 
 * Local type definitions for the Apollo service.
 */

import { ParsedError } from '@utils/error';

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
export interface ApiContact {
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
export interface ApiApolloContactsResponse {
  next: string | null;
  previous: string | null;
  results: ApiContact[];
  meta?: any;
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

