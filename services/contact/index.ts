/**
 * Contact Service
 * 
 * Handles all contact-related API operations including fetching, filtering, querying, and creating contacts.
 * 
 * **Read Operations (GET):**
 * - List contacts with filtering, searching, and pagination
 * - Get contact by ID
 * - Count contacts with optional filters
 * - Fetch distinct field values (attribute lookups)
 * 
 * **Write Operations (POST):**
 * - Create contact (requires admin authentication and X-Contacts-Write-Key header)
 * 
 * All endpoints require authentication via Bearer token except where noted.
 * Write operations additionally require the X-Contacts-Write-Key header.
 */

// Re-export all types
export type {
  ContactFilters,
  FetchContactsParams,
  FetchContactsResult,
  ResponseMeta,
  ContactSimpleItem,
  ApiContact,
  KeywordItem,
  KeywordsResponse,
  ServiceResponse,
} from './types';

// Re-export all functions
export {
  fetchContacts,
  getContactByUuid,
  getContactCount,
  getContactUuids,
} from './fetch';

export {
  fetchFieldValues,
  fetchDistinctValues,
  fetchKeywords,
} from './fieldValues';

export {
  createContact,
} from './create';

export {
  clearCountCache,
} from './cache';

// Re-export mappers (internal use, but available if needed)
export {
  mapApiToContact,
  mapSimpleItemToContact,
} from './mappers';

