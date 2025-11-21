/**
 * LinkedIn Service
 * 
 * Handles all LinkedIn URL-based API operations including searching, creating/updating, 
 * and exporting contacts and companies by LinkedIn URL.
 * 
 * **Read Operations (GET):**
 * - Search contacts and companies by LinkedIn URL
 * 
 * **Write Operations (POST):**
 * - Create or update contacts and companies by LinkedIn URL
 * - Export contacts and companies by multiple LinkedIn URLs
 * 
 * All endpoints require authentication via Bearer token.
 */

// Re-export all types
export type {
  ServiceResponse,
  ContactWithRelations,
  CompanyWithRelations,
  LinkedInSearchRequest,
  LinkedInSearchResponse,
  LinkedInCreateUpdateRequest,
  LinkedInCreateUpdateResponse,
  LinkedInExportRequest,
  LinkedInExportResponse,
} from './types';

// Re-export all functions
export {
  searchByLinkedInUrl,
} from './search';

export {
  createOrUpdateByLinkedInUrl,
} from './createUpdate';

export {
  exportByLinkedInUrls,
} from './export';

