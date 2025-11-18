/**
 * Apollo Service
 * 
 * Handles Apollo.io URL analysis and contact search operations.
 * 
 * **Key Functions:**
 * - `analyzeApolloUrl()` - Analyze Apollo.io URL and return structured parameter breakdown
 * - `searchContactsFromApolloUrl()` - Search contacts using Apollo.io URL parameters
 * - `countContactsFromApolloUrl()` - Count contacts matching Apollo.io URL parameters
 * - `getContactUuidsFromApolloUrl()` - Get contact UUIDs matching Apollo.io URL parameters
 * 
 * **Authentication:**
 * All endpoints require JWT authentication via Bearer token.
 * 
 * **API Endpoints:**
 * - POST /api/v2/apollo/analyze - Analyze Apollo URL
 * - POST /api/v2/apollo/contacts - Search contacts from Apollo URL
 * - POST /api/v2/apollo/contacts/count - Count contacts from Apollo URL
 * - POST /api/v2/apollo/contacts/count/uuids - Get contact UUIDs from Apollo URL
 */

// Re-export types
export type { ApolloContactsUuidsParams } from '@/types/apollo';
export type { ServiceResponse } from './types';

// Re-export all functions
export {
  analyzeApolloUrl,
  validateApolloUrl,
} from './analyze';

export {
  searchContactsFromApolloUrl,
  countContactsFromApolloUrl,
  getContactUuidsFromApolloUrl,
} from './search';

// Re-export mappers (internal use, but available if needed)
export {
  mapApiToContact,
} from './mappers';

