/**
 * Apollo WebSocket Service
 * 
 * Handles WebSocket connections for Apollo.io URL analysis and contact search operations.
 * Provides real-time bidirectional communication for Apollo operations.
 * 
 * **Key Features:**
 * - Unified WebSocket endpoint for all Apollo operations
 * - Request/response correlation using request_id
 * - Automatic reconnection with exponential backoff
 * - Connection state management
 * - Support for all 4 actions: analyze, search_contacts, count_contacts, get_uuids
 * 
 * **WebSocket URL:**
 * `ws://host:port/api/v2/apollo/ws?token=<jwt_token>`
 * 
 * **Authentication:**
 * JWT token passed as query parameter during WebSocket handshake
 */

// Re-export types
export type {
  WebSocketConnectionState,
  ApolloWebSocketAction,
  ApolloWebSocketRequest,
  ApolloWebSocketResponse,
  PendingRequestCallback,
  ConnectionStateCallback,
} from './types';

// Re-export client class and singleton
export {
  ApolloWebSocketClient,
  getApolloWebSocketClient,
} from './client';

// Re-export mappers (internal use, but available if needed)
export {
  mapApiToContact,
} from './mappers';

