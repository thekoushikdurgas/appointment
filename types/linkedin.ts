/**
 * LinkedIn Types and Interfaces
 * 
 * TypeScript definitions for the LinkedIn API integration.
 * Matches the API documentation at docs/api/linkdin.md
 */

import { ParsedError } from '@utils/error';
import { Contact } from './index';
import { Company } from './company';

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
 * Contact with relations (from LinkedIn search/create/update)
 */
export interface ContactWithRelations {
  contact: {
    uuid: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    title?: string | null;
    company_id?: string | null;
    seniority?: string | null;
    departments?: string[] | null;
    mobile_phone?: string | null;
    email_status?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  metadata: {
    uuid: string;
    linkedin_url?: string | null;
    website?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    work_direct_phone?: string | null;
    home_phone?: string | null;
    other_phone?: string | null;
    stage?: string | null;
  } | null;
  company: {
    uuid: string;
    name?: string | null;
    employees_count?: number | null;
    industries?: string[] | null;
    annual_revenue?: number | null;
    total_funding?: number | null;
    technologies?: string[] | null;
    created_at?: string | null;
    updated_at?: string | null;
  } | null;
  company_metadata: {
    uuid: string;
    linkedin_url?: string | null;
    website?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    phone_number?: string | null;
  } | null;
}

/**
 * Company with relations (from LinkedIn search/create/update)
 */
export interface CompanyWithRelations {
  company: {
    uuid: string;
    name?: string | null;
    employees_count?: number | null;
    industries?: string[] | null;
    annual_revenue?: number | null;
    total_funding?: number | null;
    technologies?: string[] | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  metadata: {
    uuid: string;
    linkedin_url?: string | null;
    website?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    phone_number?: string | null;
  } | null;
  contacts: ContactWithRelations[];
}

/**
 * LinkedIn Search Request
 */
export interface LinkedInSearchRequest {
  url: string;
}

/**
 * LinkedIn Search Response
 */
export interface LinkedInSearchResponse {
  contacts: ContactWithRelations[];
  companies: CompanyWithRelations[];
  total_contacts: number;
  total_companies: number;
}

/**
 * LinkedIn Create/Update Request
 */
export interface LinkedInCreateUpdateRequest {
  url: string;
  contact_data?: {
    uuid?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    title?: string;
    company_id?: string;
    seniority?: string;
    departments?: string[];
    mobile_phone?: string;
    email_status?: string;
    text_search?: string;
  };
  contact_metadata?: {
    website?: string;
    city?: string;
    state?: string;
    country?: string;
    work_direct_phone?: string;
    home_phone?: string;
    other_phone?: string;
    stage?: string;
  };
  company_data?: {
    uuid?: string;
    name?: string;
    employees_count?: number;
    industries?: string[];
    annual_revenue?: number;
    total_funding?: number;
    technologies?: string[];
    keywords?: string[];
    address?: string;
    text_search?: string;
  };
  company_metadata?: {
    website?: string;
    city?: string;
    state?: string;
    country?: string;
    phone_number?: string;
    facebook_url?: string;
    twitter_url?: string;
    company_name_for_emails?: string;
  };
}

/**
 * LinkedIn Create/Update Response
 */
export interface LinkedInCreateUpdateResponse {
  created: boolean;
  updated: boolean;
  contacts: ContactWithRelations[];
  companies: CompanyWithRelations[];
}

/**
 * LinkedIn Export Request
 */
export interface LinkedInExportRequest {
  urls: string[];
}

/**
 * LinkedIn Export Response
 */
export interface LinkedInExportResponse {
  export_id: string;
  download_url: string;
  expires_at: string;
  contact_count: number;
  company_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  job_id?: string;
}

