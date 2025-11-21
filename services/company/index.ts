/**
 * Company Service
 * 
 * Handles all company-related API operations including fetching, filtering, searching, field-specific queries, and CRUD operations.
 * 
 * **Read Operations (GET):**
 * - List companies with filtering, searching, and pagination
 * - Get company by ID
 * - Count companies with optional filters
 * - Fetch distinct field values (attribute lookups)
 * 
 * **Write Operations (POST/PUT/DELETE):**
 * - Create company (requires admin authentication and X-Companies-Write-Key header)
 * - Update company (requires admin authentication and X-Companies-Write-Key header)
 * - Delete company (requires admin authentication and X-Companies-Write-Key header)
 * 
 * **Company Contacts Operations:**
 * - Fetch contacts for a specific company
 * - Get company contacts count
 * - Get company contact UUIDs
 * - Fetch company contact attributes
 * 
 * All endpoints require authentication via Bearer token except where noted.
 * Write operations additionally require the X-Companies-Write-Key header.
 */

// Re-export all functions
export {
  fetchCompanies,
  getCompanyByUuid,
  getCompanyCount,
  getCompanyUuids,
  fetchCompanyUuidsPaginated,
} from './fetch';

// Re-export types from fetch
export type { UuidFetchProgressCallback } from './fetch';

export {
  fetchFieldValues,
  fetchDistinctValues,
} from './fieldValues';

export {
  createCompany,
  updateCompany,
  deleteCompany,
} from './crud';

export {
  fetchCompanyContacts,
  getCompanyContactsCount,
  getCompanyContactUuids,
  fetchCompanyContactAttribute,
  fetchCompanyContactFirstNames,
  fetchCompanyContactLastNames,
  fetchCompanyContactTitles,
  fetchCompanyContactSeniorities,
  fetchCompanyContactDepartments,
  fetchCompanyContactEmailStatuses,
} from './contacts';

export {
  clearCountCache,
  clearContactCountCache,
} from './cache';

// Re-export mappers (internal use, but available if needed)
export {
  mapApiToCompany,
  mapApiToCompanyContact,
} from './mappers';

