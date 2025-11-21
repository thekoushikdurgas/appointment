/**
 * Export Service Types
 * 
 * All type definitions and interfaces for the export service.
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
 * Create Contact Export Request
 */
export interface CreateContactExportRequest {
  contact_uuids: string[];
}

/**
 * Create Contact Export Response
 */
export interface CreateContactExportResponse {
  export_id: string;
  download_url: string;
  expires_at: string;
  contact_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  job_id?: string;
}

/**
 * Create Company Export Request
 */
export interface CreateCompanyExportRequest {
  company_uuids: string[];
}

/**
 * Create Company Export Response
 */
export interface CreateCompanyExportResponse {
  export_id: string;
  download_url: string;
  expires_at: string;
  company_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  job_id?: string;
}

/**
 * Export List Item
 */
export interface ExportListItem {
  export_id: string;
  user_id: string;
  export_type: 'contacts' | 'companies';
  file_path?: string;
  file_name?: string;
  contact_count: number;
  contact_uuids?: string[] | null;
  company_count: number;
  company_uuids?: string[] | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  expires_at?: string | null;
  download_url?: string | null;
}

/**
 * List Exports Response
 */
export interface ListExportsResponse {
  exports: ExportListItem[];
  total: number;
}

/**
 * Delete All Exports Response
 */
export interface DeleteAllExportsResponse {
  message: string;
  deleted_count: number;
}

/**
 * Chunked Export Progress Callback
 */
export type ChunkedExportProgressCallback = (progress: {
  completed: number;
  total: number;
  percentage: number;
  currentChunk: number;
}) => void;

/**
 * Chunked Export Result
 */
export interface ChunkedExportResult {
  export_id?: string; // Main export ID (when using backend chunked endpoint)
  chunk_ids?: string[]; // Chunk export IDs (when using backend chunked endpoint)
  exportIds?: string[]; // Legacy: array of export IDs (when using frontend chunking)
  totalCount: number;
  total_count?: number; // Backend field name
  successfulChunks?: number;
  failedChunks?: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  job_id?: string;
  errors?: string[];
}

/**
 * Export Status Response
 */
export interface ExportStatusResponse {
  export_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress_percentage?: number;
  estimated_time?: number;
  error_message?: string;
  download_url?: string | null;
  expires_at?: string | null;
}

