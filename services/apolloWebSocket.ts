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

import { getToken } from './auth';
import { API_BASE_URL as API_BASE_URL_CONFIG } from '@utils/config';
import {
  ApolloUrlAnalysisResponse,
  ApolloContactsResponse,
  ApolloContactsSearchParams,
  ApolloContactsUuidsResponse,
  ApolloContactsUuidsParams,
} from '@/types/apollo';
import { Contact } from '@/types/index';

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
type PendingRequestCallback<T> = (response: ApolloWebSocketResponse<T>) => void;

/**
 * Connection state change callback
 */
type ConnectionStateCallback = (state: WebSocketConnectionState) => void;

/**
 * API Contact response shape (snake_case from backend)
 */
interface ApiContact {
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
interface ApiApolloContactsResponse {
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

/**
 * Maps snake_case API response to camelCase Contact type
 */
const mapApiToContact = (apiContact: ApiContact): Contact => {
  if (!apiContact || typeof apiContact !== 'object') {
    throw new Error('Invalid contact data received from API');
  }

  const firstName = apiContact.first_name || '';
  const lastName = apiContact.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'N/A';

  const phone = apiContact.work_direct_phone ||
    apiContact.mobile_phone ||
    apiContact.home_phone ||
    apiContact.corporate_phone ||
    apiContact.other_phone ||
    '';

  return {
    uuid: apiContact.uuid,
    name: fullName,
    email: apiContact.email || '',
    company: apiContact.company || '',
    phone: phone,
    status: (apiContact.stage || 'Lead') as Contact['status'],
    avatarUrl: apiContact.photo_url || `https://picsum.photos/seed/${apiContact.uuid}/40/40`,
    title: apiContact.title,
    industry: apiContact.industry,
    companySize: apiContact.company_size,
    companyAddress: apiContact.company_address,
    website: apiContact.website,
    employeesCount: apiContact.employees,
    annualRevenue: apiContact.annual_revenue,
    totalFunding: apiContact.total_funding,
    latestFundingAmount: apiContact.latest_funding_amount,
    latestFunding: apiContact.latest_funding,
    lastRaisedAt: apiContact.last_raised_at,
    seniority: apiContact.seniority,
    departments: apiContact.departments,
    keywords: apiContact.keywords,
    technologies: apiContact.technologies,
    emailStatus: apiContact.email_status,
    primaryEmailCatchAllStatus: apiContact.primary_email_catch_all_status,
    stage: apiContact.stage,
    city: apiContact.city,
    state: apiContact.state,
    country: apiContact.country,
    postalCode: apiContact.postal_code,
    companyCity: apiContact.company_city,
    companyState: apiContact.company_state,
    companyCountry: apiContact.company_country,
    companyPhone: apiContact.company_phone,
    companyNameForEmails: apiContact.company_name_for_emails,
    personLinkedinUrl: apiContact.person_linkedin_url,
    companyLinkedinUrl: apiContact.company_linkedin_url,
    facebookUrl: apiContact.facebook_url,
    twitterUrl: apiContact.twitter_url,
    notes: apiContact.notes,
    tags: apiContact.keywords,
    isActive: apiContact.is_active ?? true,
    createdAt: apiContact.created_at,
    updatedAt: apiContact.updated_at,
    userId: apiContact.user_id,
  };
};

/**
 * Convert API base URL to WebSocket URL
 */
const getWebSocketUrl = (): string => {
  // API_BASE_URL_CONFIG is without protocol (e.g., "54.87.173.234:8000")
  // Add ws:// protocol for WebSocket connection
  return `ws://${API_BASE_URL_CONFIG}`;
};

/**
 * Apollo WebSocket Client Class
 */
export class ApolloWebSocketClient {
  private ws: WebSocket | null = null;
  private connectionState: WebSocketConnectionState = 'disconnected';
  private pendingRequests: Map<string, PendingRequestCallback<any>> = new Map();
  private connectionStateCallbacks: Set<ConnectionStateCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private requestIdCounter = 0;
  private connectionPromise: Promise<void> | null = null; // Track ongoing connection attempts

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${++this.requestIdCounter}`;
  }

  /**
   * Get WebSocket URL with authentication token
   */
  private getWebSocketUrlWithToken(): string {
    const baseUrl = getWebSocketUrl();
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    return `${baseUrl}/api/v2/apollo/ws?token=${encodeURIComponent(token)}`;
  }

  /**
   * Set connection state and notify callbacks
   */
  private setConnectionState(state: WebSocketConnectionState) {
    if (this.connectionState !== state) {
      const previousState = this.connectionState;
      this.connectionState = state;
      console.log(`[APOLLO_WS] Connection state changed: ${previousState} -> ${state}`, {
        previousState,
        newState: state,
        callbackCount: this.connectionStateCallbacks.size,
        timestamp: new Date().toISOString(),
      });
      
      this.connectionStateCallbacks.forEach(callback => {
        try {
          callback(state);
        } catch (error) {
          console.error('[APOLLO_WS] Error in connection state callback:', error);
        }
      });
    } else {
      // Log when state is set to the same value (for debugging)
      console.debug(`[APOLLO_WS] Connection state unchanged: ${state}`, {
        state,
        callbackCount: this.connectionStateCallbacks.size,
      });
    }
  }

  /**
   * Handle WebSocket message
   */
  private handleMessage = (event: MessageEvent) => {
    try {
      const response: ApolloWebSocketResponse = JSON.parse(event.data);
      const { request_id, status, data, error } = response;

      // Find and execute pending request callback
      const callback = this.pendingRequests.get(request_id);
      if (callback) {
        this.pendingRequests.delete(request_id);
        
        // Transform data for search_contacts action
        if (response.action === 'search_contacts' && status === 'success' && data) {
          const apiResponse = data as ApiApolloContactsResponse;
          const contacts = (apiResponse.results || []).map((apiContact: ApiContact) => {
            try {
              return mapApiToContact(apiContact);
            } catch (error) {
              console.warn('[APOLLO_WS] Failed to map contact:', apiContact, error);
              return null;
            }
          }).filter((contact): contact is Contact => contact !== null);

          const transformedData: ApolloContactsResponse = {
            next: apiResponse.next,
            previous: apiResponse.previous,
            results: contacts,
            meta: apiResponse.meta,
            apollo_url: apiResponse.apollo_url,
            mapping_summary: apiResponse.mapping_summary,
            unmapped_categories: apiResponse.unmapped_categories,
          };

          callback({
            ...response,
            data: transformedData,
          });
        } else {
          callback(response);
        }
      } else {
        console.warn('[APOLLO_WS] Received response for unknown request_id:', request_id);
      }
    } catch (error) {
      console.error('[APOLLO_WS] Error parsing WebSocket message:', error);
    }
  };

  /**
   * Handle WebSocket error
   */
  private handleError = (error: Event) => {
    const errorMessage = error instanceof ErrorEvent 
      ? error.message 
      : 'WebSocket connection error';
    
    // Get more detailed error information
    const ws = error.target as WebSocket;
    const wsUrl = ws?.url || 'unknown';
    const readyState = ws?.readyState;
    
    const errorDetails = {
      type: error.type,
      timestamp: new Date().toISOString(),
      connectionState: this.connectionState,
      readyState: readyState,
      url: wsUrl,
      readyStateName: readyState === WebSocket.CONNECTING ? 'CONNECTING' :
                      readyState === WebSocket.OPEN ? 'OPEN' :
                      readyState === WebSocket.CLOSING ? 'CLOSING' :
                      readyState === WebSocket.CLOSED ? 'CLOSED' : 'UNKNOWN',
    };
    
    // Log error with appropriate level
    if (this.connectionState === 'connecting') {
      // During connection, this might be a connection failure
      console.error('[APOLLO_WS] WebSocket connection error:', {
        message: errorMessage,
        ...errorDetails,
        hint: readyState === WebSocket.CONNECTING 
          ? 'Connection failed during handshake. Check server availability and URL.' 
          : 'Connection error occurred.',
      });
    } else {
      // During normal operation
      console.error('[APOLLO_WS] WebSocket error:', {
        message: errorMessage,
        ...errorDetails,
      });
    }
    
    this.setConnectionState('error');
    
    // If we're in the middle of a connection attempt, the promise will be rejected
    // by the onerror handler in connect()
  };

  /**
   * Handle WebSocket close
   */
  private handleClose = (event: CloseEvent) => {
    const closeDetails = {
      code: event.code,
      reason: event.reason || 'No reason provided',
      wasClean: event.wasClean,
      previousState: this.connectionState,
      timestamp: new Date().toISOString(),
    };

    // Log with appropriate level based on closure type
    if (event.wasClean || event.code === 1000) {
      console.log('[APOLLO_WS] WebSocket closed cleanly:', closeDetails);
    } else {
      console.warn('[APOLLO_WS] WebSocket closed unexpectedly:', closeDetails);
    }

    this.setConnectionState('disconnected');
    this.ws = null;

    // Clear all pending requests with appropriate error
    const pendingCount = this.pendingRequests.size;
    if (pendingCount > 0) {
      console.warn(`[APOLLO_WS] Clearing ${pendingCount} pending request(s) due to connection closure`);
      this.pendingRequests.forEach((callback, requestId) => {
        callback({
          request_id: requestId,
          action: 'analyze', // Default action
          status: 'error',
          data: null,
          error: {
            message: `WebSocket connection closed: ${event.code} ${event.reason || 'No reason provided'}${event.wasClean ? ' (clean)' : ' (unclean)'}`,
            code: 'connection_closed',
          },
        });
      });
      this.pendingRequests.clear();
    }

    // Attempt reconnection if enabled and not an intentional disconnect
    if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      // Don't reconnect for normal closures (code 1000) or if shouldReconnect is false
      if (event.code !== 1000) {
        this.scheduleReconnect();
      }
    } else if (!this.shouldReconnect) {
      console.log('[APOLLO_WS] Reconnection disabled, not attempting to reconnect');
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[APOLLO_WS] Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
    }
  };

  /**
   * Handle WebSocket open
   */
  private handleOpen = () => {
    console.log('[APOLLO_WS] WebSocket connected successfully', {
      timestamp: new Date().toISOString(),
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.ws?.readyState,
    });
    
    // Verify WebSocket is actually open before setting state
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.setConnectionState('connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000; // Reset delay
    } else {
      console.warn('[APOLLO_WS] WebSocket onopen fired but readyState is not OPEN', {
        readyState: this.ws?.readyState,
        expectedState: WebSocket.OPEN,
      });
      // Still set state to connected as the event fired, but log the discrepancy
      this.setConnectionState('connected');
    }
  };

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 336000000); // Max 30 seconds

    console.log(`[APOLLO_WS] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`, {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delayMs: delay,
      timestamp: new Date().toISOString(),
    });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect) {
        console.log(`[APOLLO_WS] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect().catch((error) => {
          console.error(`[APOLLO_WS] Reconnection attempt ${this.reconnectAttempts} failed:`, error);
        });
      }
    }, delay);
  }

  /**
   * Connect to WebSocket
   */
  connect(): Promise<void> {
    // If already connected, resolve immediately
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    // If already connecting, return the existing promise
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // If WebSocket exists but is in CONNECTING state, wait for it
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          if (this.ws) {
            if (this.ws.readyState === WebSocket.OPEN) {
              resolve();
            } else if (this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING) {
              // Connection failed, try again
              this.connectionPromise = null;
              this.connect().then(resolve).catch(reject);
            } else {
              // Still connecting, check again
              setTimeout(checkConnection, 100);
            }
          } else {
            reject(new Error('WebSocket connection lost'));
          }
        };
        checkConnection();
      });
    }

    // Create new connection
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const url = this.getWebSocketUrlWithToken();
        this.setConnectionState('connecting');
        
        console.log('[APOLLO_WS] Attempting WebSocket connection to:', url.replace(/token=[^&]+/, 'token=***'));
        
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          this.handleOpen();
          this.connectionPromise = null;
          resolve();
        };
        
        this.ws.onmessage = this.handleMessage;
        this.ws.onerror = (error) => {
          this.handleError(error);
          this.connectionPromise = null;
          const wsUrl = this.ws?.url || url;
          const errorMsg = `WebSocket connection failed to ${wsUrl.replace(/token=[^&]+/, 'token=***')}. Check server availability and network connectivity.`;
          reject(new Error(errorMsg));
        };
        
        this.ws.onclose = (event) => {
          // Store state before handleClose changes it
          const wasConnecting = this.connectionState === 'connecting';
          this.connectionPromise = null;
          this.handleClose(event);
          
          // If this was an unexpected closure during initial connection attempt, reject the promise
          // This helps surface connection errors to the caller
          if (wasConnecting && this.shouldReconnect && event.code !== 1000) {
            const wsUrl = this.ws?.url || url;
            const errorMsg = `WebSocket connection closed during handshake (code: ${event.code}, reason: ${event.reason || 'No reason provided'}). URL: ${wsUrl.replace(/token=[^&]+/, 'token=***')}`;
            reject(new Error(errorMsg));
          }
          // Note: handleClose will handle reconnection if shouldReconnect is true
        };
      } catch (error) {
        this.setConnectionState('error');
        this.connectionPromise = null;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error during WebSocket connection setup';
        reject(new Error(`Failed to create WebSocket connection: ${errorMsg}`));
      }
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect from WebSocket
   * @param disableReconnect - If true, disables automatic reconnection (default: true)
   *                           Set to false for temporary disconnects (e.g., React Strict Mode cleanup)
   */
  disconnect(disableReconnect: boolean = true) {
    if (disableReconnect) {
      this.shouldReconnect = false;
    }
    
    // Clear any pending connection promise
    this.connectionPromise = null;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      const readyState = this.ws.readyState;
      
      // Handle different connection states
      if (readyState === WebSocket.CONNECTING) {
        // If connecting, don't close immediately to avoid "closed before connection established" error
        // Remove handlers first to prevent callbacks, then close after a brief delay
        const wsRef = this.ws;
        // Remove handlers to prevent callbacks
        this.ws.onopen = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.onmessage = null;
        
        // Close after a short delay to allow connection to complete or fail naturally
        setTimeout(() => {
          // Only close if still in CONNECTING or OPEN state
          if (wsRef && (wsRef.readyState === WebSocket.CONNECTING || wsRef.readyState === WebSocket.OPEN)) {
            try {
              wsRef.close();
            } catch (error) {
              // Ignore errors - connection may have closed naturally
            }
          }
        }, 50);
      } else if (readyState === WebSocket.OPEN) {
        // For OPEN state, close normally
        try {
          this.ws.close();
        } catch (error) {
          // Ignore errors when closing (e.g., if already closed)
          console.warn('[APOLLO_WS] Error closing WebSocket:', error);
        }
      }
      // For CLOSED or CLOSING states, no action needed
      
      this.ws = null;
    }

    this.setConnectionState('disconnected');
  }

  /**
   * Send WebSocket request
   */
  private sendRequest<T>(
    action: ApolloWebSocketAction,
    data: Record<string, any>,
    timeout: number = 336000000
  ): Promise<ApolloWebSocketResponse<T>> {
    return new Promise((resolve, reject) => {
      // Ensure connection
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.connect()
          .then(() => {
            // Retry after connection
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
              reject(new Error('WebSocket connection not available'));
              return;
            }
            this.sendRequestInternal<T>(action, data, timeout, resolve, reject);
          })
          .catch(reject);
      } else {
        this.sendRequestInternal<T>(action, data, timeout, resolve, reject);
      }
    });
  }

  /**
   * Internal method to send request
   */
  private sendRequestInternal<T>(
    action: ApolloWebSocketAction,
    data: Record<string, any>,
    timeout: number,
    resolve: (value: ApolloWebSocketResponse<T>) => void,
    reject: (reason?: any) => void
  ) {
    const requestId = this.generateRequestId();
    const request: ApolloWebSocketRequest = {
      action,
      request_id: requestId,
      data,
    };

    // Set up timeout
    const timeoutId = setTimeout(() => {
      this.pendingRequests.delete(requestId);
      reject(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);

    // Set up response callback
    this.pendingRequests.set(requestId, (response: ApolloWebSocketResponse<T>) => {
      clearTimeout(timeoutId);
      if (response.status === 'error') {
        reject(new Error(response.error?.message || 'WebSocket request failed'));
      } else {
        resolve(response);
      }
    });

    // Send request
    try {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(requestId);
        reject(new Error('WebSocket connection not available'));
        return;
      }

      this.ws.send(JSON.stringify(request));
    } catch (error) {
      clearTimeout(timeoutId);
      this.pendingRequests.delete(requestId);
      reject(error);
    }
  }

  /**
   * Analyze Apollo URL
   */
  async analyze(url: string): Promise<ApolloUrlAnalysisResponse> {
    const response = await this.sendRequest<ApolloUrlAnalysisResponse>('analyze', { url });
    if (!response.data) {
      throw new Error('No data in response');
    }
    return response.data;
  }

  /**
   * Search contacts from Apollo URL
   */
  async searchContacts(
    url: string,
    params?: ApolloContactsSearchParams
  ): Promise<ApolloContactsResponse> {
    const data: Record<string, any> = { url };
    
    if (params?.limit !== undefined) data.limit = params.limit;
    if (params?.offset !== undefined) data.offset = params.offset;
    if (params?.cursor) data.cursor = params.cursor;
    if (params?.view) data.view = params.view;
    if (params?.include_company_name) data.include_company_name = params.include_company_name;
    if (params?.exclude_company_name) data.exclude_company_name = params.exclude_company_name;
    if (params?.include_domain_list) data.include_domain_list = params.include_domain_list;
    if (params?.exclude_domain_list) data.exclude_domain_list = params.exclude_domain_list;

    const response = await this.sendRequest<ApolloContactsResponse>('search_contacts', data);
    if (!response.data) {
      throw new Error('No data in response');
    }
    return response.data;
  }

  /**
   * Count contacts from Apollo URL
   */
  async countContacts(
    url: string,
    params?: {
      include_company_name?: string;
      exclude_company_name?: string[];
      include_domain_list?: string[];
      exclude_domain_list?: string[];
    }
  ): Promise<number> {
    const data: Record<string, any> = { url };
    
    if (params?.include_company_name) data.include_company_name = params.include_company_name;
    if (params?.exclude_company_name) data.exclude_company_name = params.exclude_company_name;
    if (params?.include_domain_list) data.include_domain_list = params.include_domain_list;
    if (params?.exclude_domain_list) data.exclude_domain_list = params.exclude_domain_list;

    const response = await this.sendRequest<{ count: number }>('count_contacts', data);
    if (!response.data || typeof response.data.count !== 'number') {
      throw new Error('Invalid count response');
    }
    return response.data.count;
  }

  /**
   * Get contact UUIDs from Apollo URL
   */
  async getUuids(
    url: string,
    params?: ApolloContactsUuidsParams
  ): Promise<ApolloContactsUuidsResponse> {
    const data: Record<string, any> = { url };
    
    if (params?.include_company_name) data.include_company_name = params.include_company_name;
    if (params?.exclude_company_name) data.exclude_company_name = params.exclude_company_name;
    if (params?.include_domain_list) data.include_domain_list = params.include_domain_list;
    if (params?.exclude_domain_list) data.exclude_domain_list = params.exclude_domain_list;
    if (params?.limit !== undefined) data.limit = params.limit;

    const response = await this.sendRequest<ApolloContactsUuidsResponse>('get_uuids', data);
    if (!response.data) {
      throw new Error('No data in response');
    }
    return response.data;
  }

  /**
   * Get current connection state
   */
  getConnectionState(): WebSocketConnectionState {
    return this.connectionState;
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionStateChange(callback: ConnectionStateCallback): () => void {
    // Add callback to the set
    this.connectionStateCallbacks.add(callback);
    
    console.log('[APOLLO_WS] Callback subscribed', {
      callbackCount: this.connectionStateCallbacks.size,
      currentState: this.connectionState,
      timestamp: new Date().toISOString(),
    });
    
    // Immediately call callback with current state to ensure synchronization
    // This is critical for cases where the WebSocket connects before the callback is registered
    // or when React Strict Mode causes remounts
    try {
      callback(this.connectionState);
    } catch (error) {
      console.error('[APOLLO_WS] Error calling connection state callback on subscribe:', error);
    }
    
    // Return unsubscribe function
    return () => {
      const removed = this.connectionStateCallbacks.delete(callback);
      console.log('[APOLLO_WS] Callback unsubscribed', {
        removed,
        remainingCallbacks: this.connectionStateCallbacks.size,
        currentState: this.connectionState,
        timestamp: new Date().toISOString(),
      });
    };
  }
}

/**
 * Singleton instance
 */
let clientInstance: ApolloWebSocketClient | null = null;

/**
 * Get or create WebSocket client instance
 */
export const getApolloWebSocketClient = (): ApolloWebSocketClient => {
  if (!clientInstance) {
    clientInstance = new ApolloWebSocketClient();
  }
  return clientInstance;
};

