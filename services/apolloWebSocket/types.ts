/**
 * Apollo WebSocket Service Types
 * 
 * Type definitions for the Apollo WebSocket service.
 */

/**
 * WebSocket connection states
 */
export type WebSocketConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * WebSocket message types
 */
export type ApolloWebSocketAction = 'analyze' | 'search_contacts' | 'count_contacts' | 'get_uuids';

/**
 * WebSocket request message format
 */
export interface ApolloWebSocketRequest {
  action: ApolloWebSocketAction;
  request_id: string;
  data: Record<string, any>;
}

/**
 * WebSocket response message format
 */
export interface ApolloWebSocketResponse<T = any> {
  request_id: string;
  action: ApolloWebSocketAction;
  status: 'success' | 'error';
  data: T | null;
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Pending request callback
 */
export type PendingRequestCallback<T> = (response: ApolloWebSocketResponse<T>) => void;

/**
 * Connection state change callback
 */
export type ConnectionStateCallback = (state: WebSocketConnectionState) => void;

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

