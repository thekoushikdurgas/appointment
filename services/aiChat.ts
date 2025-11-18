import { axiosAuthenticatedRequest } from '@utils/request';
import { API_BASE_URL } from './api';
import { parseApiError, parseExceptionError, formatErrorMessage, ParsedError } from '@utils/error';
import { Contact } from '@/types/index';

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
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{
    id: number | string;
    title: string;
    created_at: string;
    updated_at?: string | null;
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
  updated_at?: string | null;
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  count: number;
  next: string | null;
  previous: string | null;
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
 * Service response with pagination metadata
 */
interface PaginatedServiceResponse<T> extends ServiceResponse<T> {
  pagination?: PaginationMetadata;
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
  ordering?: 'created_at' | 'updated_at' | '-created_at' | '-updated_at';
}): Promise<PaginatedServiceResponse<ChatHistoryItem[]>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) {
      // Enforce max limit of 100
      const limit = Math.min(params.limit, 100);
      queryParams.set('limit', limit.toString());
    }
    if (params?.offset !== undefined) {
      queryParams.set('offset', params.offset.toString());
    }
    if (params?.ordering) {
      queryParams.set('ordering', params.ordering);
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/api/v2/ai-chats/${queryString ? `?${queryString}` : ''}`;
    const response = await axiosAuthenticatedRequest(url, {
      method: 'GET',
      useQueue: true,
      useCache: true,
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
      if (response.status === 403) {
        return {
          success: false,
          data: [],
          error: await parseApiError(response, 'Access forbidden'),
          message: 'You do not have permission to access this resource.',
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

    const data: ChatHistoryResponse = await response.json();
    
    const chatHistory: ChatHistoryItem[] = data.results.map((item) => ({
      id: String(item.id),
      title: item.title || 'Untitled Chat',
      created_at: item.created_at,
      updated_at: item.updated_at || undefined,
    }));

    return {
      success: true,
      data: chatHistory,
      pagination: {
        count: data.count,
        next: data.next,
        previous: data.previous,
      },
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to fetch chat history');
    console.error('[AI_CHAT] Get chat history error:', {
      message: parsedError.message,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
      statusCode: parsedError.statusCode,
    });
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

    const response = await axiosAuthenticatedRequest(`${API_BASE_URL}/api/v2/ai-chats/${id}/`, {
      method: 'GET',
      useQueue: true,
      useCache: true,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          data: null,
          error: {
            message: 'Chat not found',
            isNetworkError: false,
            isTimeoutError: false,
            statusCode: 404,
          },
          message: 'Chat not found',
        };
      }
      if (response.status === 403) {
        return {
          success: false,
          data: null,
          error: await parseApiError(response, 'Access forbidden'),
          message: 'You do not have permission to access this chat.',
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
      updated_at: data.updated_at || undefined,
    };

    return {
      success: true,
      data: chatData,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to fetch chat');
    console.error('[AI_CHAT] Get chat error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
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
 * 
 * Note: user_id is automatically set from the JWT token, so it should not be provided.
 * title and messages are optional (defaults to empty string and empty array respectively).
 */
export const createChat = async (
  chatData: {
    title?: string;
    messages?: Message[];
  }
): Promise<ServiceResponse<ChatData>> => {
  try {
    // Validate messages if provided
    const messages = chatData.messages ? validateMessages(chatData.messages) : [];

    // Prepare request body (user_id is set automatically from token)
    const requestBody: {
      title?: string;
      messages?: Message[];
    } = {};

    if (chatData.title !== undefined) {
      requestBody.title = chatData.title;
    }

    if (messages.length > 0) {
      requestBody.messages = messages;
    }

    const response = await axiosAuthenticatedRequest(`${API_BASE_URL}/api/v2/ai-chats/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: requestBody,
      useQueue: true,
      useCache: false,
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: await parseApiError(response, 'Authentication required'),
          message: 'Authentication required. Please log in again.',
        };
      }
      const error = await parseApiError(response, 'Failed to create chat');
      return {
        success: false,
        error,
        message: formatErrorMessage(error, 'Failed to create chat'),
      };
    }

    const data: ChatResponse = await response.json();
    
    // Validate and normalize messages
    const normalizedMessages = validateMessages(data.messages || []);

    const chatDataResult: ChatData = {
      id: String(data.id),
      user_id: String(data.user_id),
      title: data.title || '',
      messages: normalizedMessages,
      created_at: data.created_at,
      updated_at: data.updated_at || undefined,
    };

    return {
      success: true,
      data: chatDataResult,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to create chat');
    console.error('[AI_CHAT] Create chat error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      error: parsedError,
      message: formatErrorMessage(parsedError, 'Failed to create chat'),
    };
  }
};

/**
 * Update existing chat
 * 
 * Note: This is a partial update - only provided fields will be updated.
 * updated_at is automatically set by the API, so it should not be sent.
 */
export const updateChat = async (
  id: string,
  chatData: Partial<Pick<ChatData, 'title' | 'messages'>>
): Promise<ServiceResponse<ChatData>> => {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: {
          message: 'Invalid chat ID',
          isNetworkError: false,
          isTimeoutError: false,
        },
        message: 'Invalid chat ID provided',
      };
    }

    // Prepare update data (only include provided fields)
    const updateData: {
      title?: string;
      messages?: Message[];
    } = {};
    
    if (chatData.title !== undefined) {
      updateData.title = chatData.title;
    }
    
    if (chatData.messages !== undefined) {
      // Validate messages before sending
      updateData.messages = validateMessages(chatData.messages);
    }

    const response = await axiosAuthenticatedRequest(`${API_BASE_URL}/api/v2/ai-chats/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      data: updateData,
      useQueue: true,
      useCache: false,
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: await parseApiError(response, 'Authentication required'),
          message: 'Authentication required. Please log in again.',
        };
      }
      if (response.status === 403) {
        return {
          success: false,
          error: await parseApiError(response, 'Access forbidden'),
          message: 'You do not have permission to update this chat.',
        };
      }
      if (response.status === 404) {
        return {
          success: false,
          error: {
            message: 'Chat not found',
            isNetworkError: false,
            isTimeoutError: false,
            statusCode: 404,
          },
          message: 'Chat not found',
        };
      }
      const error = await parseApiError(response, 'Failed to update chat');
      return {
        success: false,
        error,
        message: formatErrorMessage(error, 'Failed to update chat'),
      };
    }

    const data: ChatResponse = await response.json();
    
    // Validate and normalize messages
    const normalizedMessages = validateMessages(data.messages || []);

    const updatedChatData: ChatData = {
      id: String(data.id),
      user_id: String(data.user_id),
      title: data.title || '',
      messages: normalizedMessages,
      created_at: data.created_at,
      updated_at: data.updated_at || undefined,
    };

    return {
      success: true,
      data: updatedChatData,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to update chat');
    console.error('[AI_CHAT] Update chat error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      error: parsedError,
      message: formatErrorMessage(parsedError, 'Failed to update chat'),
    };
  }
};

/**
 * Delete chat
 * 
 * Note: Returns 204 No Content on success (empty response body).
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

    const response = await axiosAuthenticatedRequest(`${API_BASE_URL}/api/v2/ai-chats/${id}/`, {
      method: 'DELETE',
      useQueue: true,
      useCache: false,
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          data: false,
          error: await parseApiError(response, 'Authentication required'),
          message: 'Authentication required. Please log in again.',
        };
      }
      if (response.status === 403) {
        return {
          success: false,
          data: false,
          error: await parseApiError(response, 'Access forbidden'),
          message: 'You do not have permission to delete this chat.',
        };
      }
      if (response.status === 404) {
        return {
          success: false,
          data: false,
          error: {
            message: 'Chat not found',
            isNetworkError: false,
            isTimeoutError: false,
            statusCode: 404,
          },
          message: 'Chat not found',
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

    // 204 No Content - successful deletion (no response body)
    return {
      success: true,
      data: true,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to delete chat');
    console.error('[AI_CHAT] Delete chat error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      data: false,
      error: parsedError,
      message: formatErrorMessage(parsedError, 'Failed to delete chat'),
    };
  }
};
