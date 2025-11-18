/**
 * Export Service
 * 
 * Handles contact and company export operations including CSV generation and secure download via signed URLs.
 * 
 * **Key Functions:**
 * - `createContactExport()` - Create a CSV export of selected contacts
 * - `createCompanyExport()` - Create a CSV export of selected companies
 * - `listExports()` - List all exports for the current user
 * - `downloadExport()` - Download a CSV export file using a signed URL
 * - `deleteAllExports()` - Delete all CSV files (admin only)
 * 
 * **Authentication:**
 * All endpoints require JWT authentication via Bearer token.
 * 
 * **API Endpoints:**
 * - POST /api/v2/exports/contacts/export - Create Contact Export
 * - POST /api/v2/exports/companies/export - Create Company Export
 * - GET /api/v2/exports/ - List Exports
 * - GET /api/v2/exports/{export_id}/download - Download Export
 * - DELETE /api/v2/exports/files - Delete All CSV Files (Admin only)
 */

// Re-export all types
export type {
  ServiceResponse,
  CreateContactExportRequest,
  CreateContactExportResponse,
  CreateCompanyExportRequest,
  CreateCompanyExportResponse,
  ExportListItem,
  ListExportsResponse,
  DeleteAllExportsResponse,
} from './types';

// Re-export all functions
export {
  createContactExport,
  downloadExport,
} from './contacts';

export {
  createCompanyExport,
} from './companies';

export {
  listExports,
  deleteAllExports,
} from './list';

