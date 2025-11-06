import { authenticatedFetch } from './auth';
import { API_BASE_URL } from './api';
import { parseApiError, parseExceptionError, formatErrorMessage, ParsedError } from '../utils/errorHandler';
import { Contact } from '../types/index';

/**
 * Message interface with proper typing
 */
export interface Message {
  sender: 'user' | 'ai';
  text: string;
  contacts?: Contact[];
  timestamp?: string;
}

/**
 * Chat history item interface
 */
export interface ChatHistoryItem {
  id: string;
  title: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Chat data interface
 */
export interface ChatData {
  id?: string;
  user_id: string;
  title: string;
  messages: Message[];
  created_at?: string;
  updated_at?: string;
}

/**
 * API response for chat history (paginated)
 */
interface ChatHistoryResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: Array<{
    id: number | string;
    title: string;
    created_at: string;
    updated_at?: string;
  }>;
}

/**
 * API response for single chat
 */
interface ChatResponse {
  id: number | string;
  user_id: number | string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at?: string;
}

/**
 * Standardized service response
 */
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ParsedError;
  message?: string;
}

/**
 * Validate message structure
 */
const validateMessage = (message: any): message is Message => {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message.sender === 'user' || message.sender === 'ai') &&
    typeof message.text === 'string'
  );
};

/**
 * Validate and normalize messages array
 */
const validateMessages = (messages: any[]): Message[] => {
  if (!Array.isArray(messages)) {
    return [];
  }
  return messages.filter(validateMessage).map(msg => ({
    ...msg,
    contacts: Array.isArray(msg.contacts) ? msg.contacts : undefined,
  }));
};

/**
 * Get user's chat history with pagination support
 */
export const getChatHistory = async (params?: {
  limit?: number;
  offset?: number;
  cursor?: string;
}): Promise<ServiceResponse<ChatHistoryItem[]>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());
    if (params?.cursor) queryParams.set('cursor', params.cursor);

    const url = `${API_BASE_URL}/ai-chats/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await authenticatedFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          data: [],
          error: await parseApiError(response, 'Authentication required'),
          message: 'Authentication required. Please log in again.',
        };
      }
      const error = await parseApiError(response, 'Failed to fetch chat history');
      return {
        success: false,
        data: [],
        error,
        message: formatErrorMessage(error, 'Failed to fetch chat history'),
      };
    }

    const data: ChatHistoryResponse | ChatHistoryItem[] = await response.json();
    
    // Handle both paginated and non-paginated responses
    const results = 'results' in data ? data.results : data;
    
    const chatHistory: ChatHistoryItem[] = results.map((item) => ({
      id: String(item.id),
      title: item.title || 'Untitled Chat',
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    return {
      success: true,
      data: chatHistory,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to fetch chat history');
    console.error('[AI_CHAT] Get chat history error:', parsedError);
    return {
      success: false,
      data: [],
      error: parsedError,
      message: formatErrorMessage(parsedError, 'Failed to fetch chat history'),
    };
  }
};

/**
 * Get specific chat by ID
 */
export const getChat = async (id: string): Promise<ServiceResponse<ChatData | null>> => {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        data: null,
        error: {
          message: 'Invalid chat ID',
          isNetworkError: false,
          isTimeoutError: false,
        },
        message: 'Invalid chat ID provided',
      };
    }

    const response = await authenticatedFetch(`${API_BASE_URL}/ai-chats/${id}/`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: true,
          data: null,
          message: 'Chat not found',
        };
      }
      const error = await parseApiError(response, 'Failed to fetch chat');
      return {
        success: false,
        data: null,
        error,
        message: formatErrorMessage(error, 'Failed to fetch chat'),
      };
    }

    const data: ChatResponse = await response.json();
    
    // Validate and normalize messages
    const messages = validateMessages(data.messages || []);

    const chatData: ChatData = {
      id: String(data.id),
      user_id: String(data.user_id),
      title: data.title || 'Untitled Chat',
      messages,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return {
      success: true,
      data: chatData,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to fetch chat');
    console.error('[AI_CHAT] Get chat error:', parsedError);
    return {
      success: false,
      data: null,
      error: parsedError,
      message: formatErrorMessage(parsedError, 'Failed to fetch chat'),
    };
  }
};

/**
 * Create new chat
 */
export const createChat = async (
  chatData: Omit<ChatData, 'id' | 'created_at' | 'updated_at'>
): Promise<ServiceResponse<ChatHistoryItem>> => {
  try {
    // Validate input
    if (!chatData.user_id || !chatData.title) {
      return {
        success: false,
        error: {
          message: 'User ID and title are required',
          isNetworkError: false,
          isTimeoutError: false,
        },
        message: 'User ID and title are required to create a chat',
      };
    }

    // Validate messages
    const messages = validateMessages(chatData.messages || []);

    const response = await authenticatedFetch(`${API_BASE_URL}/ai-chats/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: chatData.user_id,
        title: chatData.title,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to create chat');
      return {
        success: false,
        error,
        message: formatErrorMessage(error, 'Failed to create chat'),
      };
    }

    const data: ChatResponse = await response.json();
    const chatItem: ChatHistoryItem = {
      id: String(data.id),
      title: data.title || 'Untitled Chat',
      created_at: data.created_at,
    };

    return {
      success: true,
      data: chatItem,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to create chat');
    console.error('[AI_CHAT] Create chat error:', parsedError);
    return {
      success: false,
      error: parsedError,
      message: formatErrorMessage(parsedError, 'Failed to create chat'),
    };
  }
};

/**
 * Update existing chat
 */
export const updateChat = async (
  id: string,
  chatData: Partial<ChatData>
): Promise<ServiceResponse<boolean>> => {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        data: false,
        error: {
          message: 'Invalid chat ID',
          isNetworkError: false,
          isTimeoutError: false,
        },
        message: 'Invalid chat ID provided',
      };
    }

    const updateData: Partial<ChatResponse> = {};
    
    if (chatData.title !== undefined) {
      updateData.title = chatData.title;
    }
    
    if (chatData.messages !== undefined) {
      // Validate messages before sending
      updateData.messages = validateMessages(chatData.messages);
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    const response = await authenticatedFetch(`${API_BASE_URL}/ai-chats/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to update chat');
      return {
        success: false,
        data: false,
        error,
        message: formatErrorMessage(error, 'Failed to update chat'),
      };
    }

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to update chat');
    console.error('[AI_CHAT] Update chat error:', parsedError);
    return {
      success: false,
      data: false,
      error: parsedError,
      message: formatErrorMessage(parsedError, 'Failed to update chat'),
    };
  }
};

/**
 * Delete chat
 */
export const deleteChat = async (id: string): Promise<ServiceResponse<boolean>> => {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        data: false,
        error: {
          message: 'Invalid chat ID',
          isNetworkError: false,
          isTimeoutError: false,
        },
        message: 'Invalid chat ID provided',
      };
    }

    const response = await authenticatedFetch(`${API_BASE_URL}/ai-chats/${id}/`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Already deleted, consider it successful
        return {
          success: true,
          data: true,
          message: 'Chat already deleted',
        };
      }
      const error = await parseApiError(response, 'Failed to delete chat');
      return {
        success: false,
        data: false,
        error,
        message: formatErrorMessage(error, 'Failed to delete chat'),
      };
    }

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to delete chat');
    console.error('[AI_CHAT] Delete chat error:', parsedError);
    return {
      success: false,
      data: false,
      error: parsedError,
      message: formatErrorMessage(parsedError, 'Failed to delete chat'),
    };
  }
};
