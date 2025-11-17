/**
 * Apollo WebSocket Hook
 * 
 * React hook for managing Apollo WebSocket connections and operations.
 * Provides a convenient interface for components to interact with the Apollo WebSocket API.
 * 
 * **Features:**
 * - Automatic connection management
 * - Connection state tracking
 * - Auto-reconnect on connection loss
 * - Cleanup on unmount
 * - Methods for all 4 Apollo actions
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getApolloWebSocketClient,
  WebSocketConnectionState,
  ApolloWebSocketClient,
} from '@/services/apolloWebSocket';
import {
  ApolloUrlAnalysisResponse,
  ApolloContactsResponse,
  ApolloContactsSearchParams,
  ApolloContactsUuidsResponse,
  ApolloContactsUuidsParams,
} from '@/types/apollo';

/**
 * Hook return type
 */
export interface UseApolloWebSocketReturn {
  // Connection state
  connectionState: WebSocketConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnected: boolean;
  hasError: boolean;

  // Action methods
  analyze: (url: string) => Promise<ApolloUrlAnalysisResponse>;
  searchContacts: (url: string, params?: ApolloContactsSearchParams) => Promise<ApolloContactsResponse>;
  countContacts: (
    url: string,
    params?: {
      include_company_name?: string;
      exclude_company_name?: string[];
      include_domain_list?: string[];
      exclude_domain_list?: string[];
    }
  ) => Promise<number>;
  getUuids: (url: string, params?: ApolloContactsUuidsParams) => Promise<ApolloContactsUuidsResponse>;

  // Connection management
  connect: () => Promise<void>;
  disconnect: () => void;
}

/**
 * Apollo WebSocket Hook
 * 
 * @param autoConnect - Whether to automatically connect on mount (default: true)
 * @returns Hook interface with connection state and action methods
 * 
 * @example
 * ```tsx
 * const { isConnected, analyze, searchContacts } = useApolloWebSocket();
 * 
 * useEffect(() => {
 *   if (isConnected) {
 *     analyze(url).then(result => {
 *       console.log('Analysis:', result);
 *     });
 *   }
 * }, [isConnected, url]);
 * ```
 */
export const useApolloWebSocket = (autoConnect: boolean = true): UseApolloWebSocketReturn => {
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>('disconnected');
  const clientRef = useRef<ApolloWebSocketClient | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);
  const connectionAttemptRef = useRef<Promise<void> | null>(null);

  // Initialize client
  useEffect(() => {
    isMountedRef.current = true;
    
    if (!clientRef.current) {
      clientRef.current = getApolloWebSocketClient();
      
      // Subscribe to connection state changes
      unsubscribeRef.current = clientRef.current.onConnectionStateChange((state) => {
        if (isMountedRef.current) {
          setConnectionState(state);
        }
      });

      // Set initial state
      setConnectionState(clientRef.current.getConnectionState());
    }

    return () => {
      // Cleanup on unmount
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && clientRef.current && isMountedRef.current) {
      // Prevent duplicate connection attempts
      if (connectionAttemptRef.current) {
        return;
      }

      connectionAttemptRef.current = clientRef.current.connect().catch((error) => {
        if (isMountedRef.current) {
          console.error('[APOLLO_WS] Auto-connect failed:', error);
        }
      }).finally(() => {
        connectionAttemptRef.current = null;
      });
    }

    return () => {
      // Disconnect on unmount if auto-connect was enabled
      // Use temporary disconnect (disableReconnect=false) to handle React Strict Mode
      // This allows reconnection if component remounts (React Strict Mode behavior)
      if (autoConnect && clientRef.current && isMountedRef.current) {
        const state = clientRef.current.getConnectionState();
        // Only disconnect if actually connected or in error state
        // For connecting state, use temporary disconnect to avoid premature closure
        if (state === 'connected' || state === 'error') {
          // Permanent disconnect for actual unmount
          clientRef.current.disconnect(true);
        } else if (state === 'connecting') {
          // Temporary disconnect for React Strict Mode - allows reconnection on remount
          clientRef.current.disconnect(false);
        }
        // If disconnected, no action needed
      }
    };
  }, [autoConnect]);

  // Connection state helpers
  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';
  const isDisconnected = connectionState === 'disconnected';
  const hasError = connectionState === 'error';

  // Action methods
  const analyze = useCallback(async (url: string): Promise<ApolloUrlAnalysisResponse> => {
    if (!clientRef.current) {
      throw new Error('WebSocket client not initialized');
    }
    return clientRef.current.analyze(url);
  }, []);

  const searchContacts = useCallback(
    async (url: string, params?: ApolloContactsSearchParams): Promise<ApolloContactsResponse> => {
      if (!clientRef.current) {
        throw new Error('WebSocket client not initialized');
      }
      return clientRef.current.searchContacts(url, params);
    },
    []
  );

  const countContacts = useCallback(
    async (
      url: string,
      params?: {
        include_company_name?: string;
        exclude_company_name?: string[];
        include_domain_list?: string[];
        exclude_domain_list?: string[];
      }
    ): Promise<number> => {
      if (!clientRef.current) {
        throw new Error('WebSocket client not initialized');
      }
      return clientRef.current.countContacts(url, params);
    },
    []
  );

  const getUuids = useCallback(
    async (url: string, params?: ApolloContactsUuidsParams): Promise<ApolloContactsUuidsResponse> => {
      if (!clientRef.current) {
        throw new Error('WebSocket client not initialized');
      }
      return clientRef.current.getUuids(url, params);
    },
    []
  );

  // Connection management
  const connect = useCallback(async (): Promise<void> => {
    if (!clientRef.current) {
      throw new Error('WebSocket client not initialized');
    }
    return clientRef.current.connect();
  }, []);

  const disconnect = useCallback((): void => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
  }, []);

  return {
    // Connection state
    connectionState,
    isConnected,
    isConnecting,
    isDisconnected,
    hasError,

    // Action methods
    analyze,
    searchContacts,
    countContacts,
    getUuids,

    // Connection management
    connect,
    disconnect,
  };
};

