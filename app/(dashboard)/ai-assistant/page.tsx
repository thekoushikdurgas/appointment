'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, Chat, Content } from '@google/genai';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useAuth } from '@hooks/useAuth';
import { Contact } from '@/types/index';
import { 
  LogoIcon, SparklesIcon, PlusIcon, ChatBubbleIcon, MenuIcon, SendIcon, UsersIcon, 
  DeleteIcon, ChevronLeftIcon, ChevronRightIcon, AlertTriangleIcon, SuccessIcon, 
  ChevronUpDownIcon, XMarkIcon, CopyIcon, RegenerateIcon, EditIcon, AttachIcon,
  EmojiIcon, MicrophoneIcon, SettingsIcon, ExportIcon, ClearIcon
} from '@components/icons/IconComponents';
import { fetchContacts } from '@services/contact';
import { getChatHistory, getChat, createChat, updateChat, deleteChat, Message, ChatHistoryItem, PaginationMetadata } from '@services/aiChat';
import { NEXT_PUBLIC_GEMINI_API_KEY } from '@utils/config';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Card, CardContent } from '@components/ui/Card';
import { Select } from '@components/ui/Select';
import { Tooltip } from '@components/ui/Tooltip';
import { useSwipeable } from '@hooks/useSwipeable';

// Type definition for searchContacts function arguments
interface SearchContactsArgs {
  query?: string;
  title?: string;
  status?: string;
  industry?: string;
  city?: string;
  state?: string;
  country?: string;
  tags?: string;
  limit?: number;
}

// Function declaration for searching contacts
const searchContactsFunctionDeclaration: FunctionDeclaration = {
  name: 'searchContacts',
  description: 'Searches for contacts based on various criteria like name, company, industry, job title/profession, status, location, or tags.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'A general search term. Can be a name, company, email, etc. This is used for broad searches.',
      },
      title: {
        type: Type.STRING,
        description: 'The job title or profession of the contact, e.g., "Software Engineer", "Healthcare Professional".',
      },
      status: {
        type: Type.STRING,
        description: 'The status of the contact. Can be "Lead", "Customer", or "Archived".',
      },
      industry: {
        type: Type.STRING,
        description: 'The industry the contact or their company belongs to, e.g., "Healthcare", "Technology".',
      },
      city: { type: Type.STRING, description: 'The city where the contact is located.' },
      state: { type: Type.STRING, description: 'The state where the contact is located.' },
      country: { type: Type.STRING, description: 'The country where the contact is located.' },
      tags: {
        type: Type.STRING,
        description: 'A single tag or comma-separated tags associated with the contact, e.g., "saas,b2b".',
      },
      limit: {
        type: Type.INTEGER,
        description: 'The maximum number of contacts to return. Defaults to 10 if not specified.',
      },
    },
    required: [],
  },
};

type SortOption = 'created_at' | 'updated_at' | '-created_at' | '-updated_at';

const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainChatRef = useRef<HTMLDivElement>(null);
  
  // Error and success messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const chatsPerPage = 25;
  
  // Sorting state
  const [sortOrder, setSortOrder] = useState<SortOption>('-created_at');
  
  // Loading states
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isDeletingChat, setIsDeletingChat] = useState<string | null>(null);
  
  // Delete confirmation
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  
  // Swipe state for chat history items
  const [swipedChatId, setSwipedChatId] = useState<string | null>(null);
  
  // Settings menu state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Hover state for message actions
  const [hoveredMessageIndex, setHoveredMessageIndex] = useState<number | null>(null);

  const suggestionPrompts = [
    "Who are my most recent leads?",
    "Find contacts in California in the software industry",
    "Show me all contacts with 'CEO' in their title",
    "Search for contacts tagged with 'saas'",
  ];

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
  };

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const initializeChatSession = async (history: Content[] = []) => {
    if (!user) return;
    try {
      const apiKey = NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }
      const ai = new GoogleGenAI({ apiKey });
      const newChatSession = ai.chats.create({
        model: 'gemini-2.5-pro',
        history,
        config: {
          systemInstruction: `You are NexusAI, an expert assistant for the NexusCRM. Your goal is to help the user manage their contacts efficiently. You can search for existing contacts using the available tools. For general conversation, be friendly, concise, and helpful.`,
          tools: [{ functionDeclarations: [searchContactsFunctionDeclaration] }],
        },
      });
      setChat(newChatSession);
    } catch (error) {
      console.error("Error initializing Gemini:", (error as Error).message);
      setMessages([{ sender: 'ai', text: "Sorry, I'm having trouble connecting to the AI service. Please check your API key configuration." }]);
    }
  };

  // Fetch chat history with pagination and sorting
  const fetchHistory = async (page: number = 1, ordering: SortOption = sortOrder) => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    setErrorMessage(null);
    
    try {
      const offset = (page - 1) * chatsPerPage;
      const result = await getChatHistory({
        limit: chatsPerPage,
        offset,
        ordering,
      });
      
      if (result.success && result.data) {
        setChatHistory(result.data);
        setPagination(result.pagination || null);
        setCurrentPage(page);
      } else {
        const errorMsg = result.message || 'Failed to load chat history';
        setErrorMessage(errorMsg);
        setChatHistory([]);
        setPagination(null);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrorMessage(errorMsg);
      setChatHistory([]);
      setPagination(null);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([{
      sender: 'ai',
      text: `Hello! I'm NexusAI, your smart CRM assistant. How can I help you find contacts today?`
    }]);
    initializeChatSession();
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchHistory(1, sortOrder);
    handleNewChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sortOrder]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectChat = async (chatId: string) => {
    if (isLoading || chatId === activeChatId) return;
    setIsLoading(true);
    setActiveChatId(chatId);
    setMessages([]);
    setIsSidebarOpen(false);
    setErrorMessage(null);

    try {
      const result = await getChat(chatId);
      
      if (!result.success || !result.data) {
        const errorMsg = result.message || 'Chat not found';
        setErrorMessage(errorMsg);
        setMessages([{ sender: 'ai', text: 'Sorry, I could not load this conversation.' }]);
        return;
      }
      
      const chatData = result.data;
      const loadedMessages: Message[] = chatData.messages || [];
      setMessages(loadedMessages);

      const history: Content[] = loadedMessages
        .slice(1)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));
      
      initializeChatSession(history);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrorMessage(errorMsg);
      setMessages([{ sender: 'ai', text: 'Sorry, I could not load this conversation.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate between chats with swipe
  const handleNavigateChat = useCallback((direction: 'left' | 'right') => {
    if (!activeChatId || chatHistory.length === 0) return;
    
    const currentIndex = chatHistory.findIndex(c => c.id === activeChatId);
    if (currentIndex === -1) return;
    
    const nextIndex = direction === 'left' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < chatHistory.length) {
      handleSelectChat(chatHistory[nextIndex].id);
    }
  }, [activeChatId, chatHistory]);

  // Main chat swipe handlers
  const mainChatSwipeHandlers = useSwipeable({
    onSwipeLeft: () => handleNavigateChat('left'),
    onSwipeRight: () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(true);
      } else {
        handleNavigateChat('right');
      }
    },
  }, { threshold: 80 });

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !chat) return;

    const userMessage: Message = { sender: 'user', text: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    const prompt = input;
    setInput('');
    setIsLoading(true);
    
    try {
      const result = await chat.sendMessage({ message: prompt });
      const response = result;
      let aiResponseText: string = response.text ?? '';
      let contactsForDisplay: Contact[] = [];

      if (response.functionCalls && response.functionCalls.length > 0) {
        const functionCall = response.functionCalls[0];
        let functionResponse;

        if (functionCall.name === 'searchContacts') {
          const args = functionCall.args as SearchContactsArgs;
          const { contacts, count } = await fetchContacts({
              search: args.query,
              filters: {
                  status: args.status as Contact['status'] | undefined,
                  industry: args.industry,
                  title: args.title,
                  city: args.city,
                  state: args.state,
                  country: args.country,
                  tags: args.tags,
              },
              limit: args.limit || 5,
          });
          
          contactsForDisplay = contacts;
          functionResponse = { name: 'searchContacts', response: { contacts, count }};
        }

        if (functionResponse) {
            const functionResponseResult = await chat.sendMessage({ message: [{ functionResponse }] });
            aiResponseText = functionResponseResult.text ?? '';
        }
      }

      const finalAiResponseText: string = aiResponseText || 'I apologize, but I could not generate a response.';
      const aiMessage: Message = { sender: 'ai', text: finalAiResponseText, contacts: contactsForDisplay };
      const finalMessages = [...currentMessages, aiMessage];
      setMessages(finalMessages);

      try {
        let currentChatId = activeChatId;
        
        if (!currentChatId) {
          const title = (prompt || 'New Chat').substring(0, 40) + ((prompt?.length || 0) > 40 ? '...' : '');
          const result = await createChat({
            title: title,
            messages: finalMessages,
          });

          if (result.success && result.data) {
            currentChatId = result.data.id!;
            setActiveChatId(currentChatId);
            setSuccessMessage('Chat saved successfully');
            await fetchHistory(currentPage, sortOrder);
          } else {
            const errorMsg = result.message || 'Failed to save chat';
            setErrorMessage(errorMsg);
          }
        } else {
          const result = await updateChat(currentChatId, {
            messages: finalMessages,
          });
          
          if (result.success) {
            setSuccessMessage('Chat updated successfully');
            await fetchHistory(currentPage, sortOrder);
          } else {
            const errorMsg = result.message || 'Failed to update chat';
            setErrorMessage(errorMsg);
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
        setErrorMessage(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrorMessage(errorMsg);
      setMessages(prev => [...prev, { sender: 'ai', text: "I'm sorry, an error occurred while processing your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete chat
  const handleDeleteChat = async (chatId: string) => {
    if (isDeletingChat) return;
    
    setIsDeletingChat(chatId);
    setErrorMessage(null);
    
    try {
      const result = await deleteChat(chatId);
      
      if (result.success) {
        setSuccessMessage('Chat deleted successfully');
        setChatToDelete(null);
        setSwipedChatId(null);
        
        if (activeChatId === chatId) {
          handleNewChat();
        }
        
        await fetchHistory(currentPage, sortOrder);
      } else {
        const errorMsg = result.message || 'Failed to delete chat';
        setErrorMessage(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrorMessage(errorMsg);
    } finally {
      setIsDeletingChat(null);
    }
  };

  // Handle sort change
  const handleSortChange = (newSort: SortOption) => {
    setSortOrder(newSort);
    setCurrentPage(1);
  };

  // Copy message to clipboard
  const handleCopyMessage = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMessage('Message copied to clipboard');
    } catch (error) {
      setErrorMessage('Failed to copy message');
    }
  };

  // Regenerate AI response
  const handleRegenerateResponse = async (messageIndex: number) => {
    if (messageIndex < 1 || !chat) return;
    
    const userMessage = messages[messageIndex - 1];
    if (userMessage.sender !== 'user') return;
    
    setIsLoading(true);
    const newMessages = messages.slice(0, messageIndex);
    setMessages(newMessages);
    
    try {
      const result = await chat.sendMessage({ message: userMessage.text });
      const aiResponseText: string = result.text ?? 'I apologize, but I could not generate a response.';
      const aiMessage: Message = { sender: 'ai', text: aiResponseText };
      setMessages([...newMessages, aiMessage]);
    } catch (error) {
      setErrorMessage('Failed to regenerate response');
    } finally {
      setIsLoading(false);
    }
  };

  // Export chat
  const handleExportChat = () => {
    if (messages.length === 0) return;
    
    const chatText = messages.map(msg => `${msg.sender.toUpperCase()}: ${msg.text}`).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${activeChatId || 'new'}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSuccessMessage('Chat exported successfully');
  };

  // Clear conversation
  const handleClearConversation = () => {
    handleNewChat();
    setSuccessMessage('Conversation cleared');
  };

  const renderMessageContent = (message: Message, index: number) => (
    <div 
      className="ai-assistant-message-content-wrapper"
      onMouseEnter={() => setHoveredMessageIndex(index)}
      onMouseLeave={() => setHoveredMessageIndex(null)}
    >
      <div className="ai-assistant-message-content-header">
        <p className="ai-assistant-message-text">{message.text}</p>
        
        {/* Message Actions */}
        <div className={`ai-assistant-message-actions ${hoveredMessageIndex === index ? 'ai-assistant-message-actions--visible' : ''}`}>
          <Tooltip content="Copy message">
            <button
              onClick={() => handleCopyMessage(message.text)}
              className="ai-assistant-message-action-btn"
              aria-label="Copy message"
            >
              <CopyIcon className="ai-assistant-message-action-icon" />
            </button>
          </Tooltip>
          
          {message.sender === 'ai' && index > 0 && (
            <Tooltip content="Regenerate response">
              <button
                onClick={() => handleRegenerateResponse(index)}
                className="ai-assistant-message-action-btn"
                aria-label="Regenerate response"
                disabled={isLoading}
              >
                <RegenerateIcon className="ai-assistant-message-action-icon" />
              </button>
            </Tooltip>
          )}
          
          {message.sender === 'user' && (
            <Tooltip content="Edit message">
              <button
                className="ai-assistant-message-action-btn"
                aria-label="Edit message"
              >
                <EditIcon className="ai-assistant-message-action-icon" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
      
      {message.contacts && message.contacts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="ai-assistant-message-contacts"
        >
          {message.contacts.map((contact, idx) => (
            <motion.div
              key={contact.uuid}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * idx }}
            >
              <Card 
                variant="outlined" 
                padding="md" 
                className="ai-assistant-message-contact-card"
              >
                <div className="ai-assistant-message-contact-content">
                  <div className="ai-assistant-message-contact-avatar">
                    <UsersIcon className="ai-assistant-message-contact-avatar-icon" />
                  </div>
                  <div className="ai-assistant-message-contact-info">
                    <p className="ai-assistant-message-contact-name">{contact.name}</p>
                    <p className="ai-assistant-message-contact-title">{contact.title || 'No title'}</p>
                    <p className="ai-assistant-message-contact-company">{contact.company}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );

  const totalPages = pagination ? Math.ceil(pagination.count / chatsPerPage) : 1;
  const startItem = pagination ? (currentPage - 1) * chatsPerPage + 1 : 0;
  const endItem = pagination ? Math.min(currentPage * chatsPerPage, pagination.count) : 0;

  return (
    <div className="ai-assistant-page">
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="ai-assistant-overlay"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Error and Success Messages */}
      <AnimatePresence>
        {(errorMessage || successMessage) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="ai-assistant-messages-container"
          >
            {errorMessage && (
              <Card className="ai-assistant-message-card ai-assistant-message-card--error">
                <CardContent className="ai-assistant-message-content">
                  <AlertTriangleIcon className="ai-assistant-message-icon" />
                  <p className="ai-assistant-message-text ai-assistant-message-text--error">{errorMessage}</p>
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="ai-assistant-message-dismiss ai-assistant-message-dismiss--error"
                    aria-label="Dismiss error"
                  >
                    <XMarkIcon />
                  </button>
                </CardContent>
              </Card>
            )}
            {successMessage && (
              <Card className="ai-assistant-message-card ai-assistant-message-card--success">
                <CardContent className="ai-assistant-message-content">
                  <SuccessIcon className="ai-assistant-message-icon" />
                  <p className="ai-assistant-message-text ai-assistant-message-text--success">{successMessage}</p>
                  <button
                    onClick={() => setSuccessMessage(null)}
                    className="ai-assistant-message-dismiss ai-assistant-message-dismiss--success"
                    aria-label="Dismiss success"
                  >
                    <XMarkIcon />
                  </button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat History Sidebar */}
      <motion.div 
        initial={false}
        animate={{ x: isSidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="ai-assistant-sidebar"
      >
        <div className="ai-assistant-sidebar-header">
          <Button
            onClick={handleNewChat}
            variant="glass-primary"
            size="md"
            fullWidth
            leftIcon={<PlusIcon />}
            className="ai-assistant-new-chat-btn"
          >
            New Chat
          </Button>
          
          {/* Sort Dropdown */}
          <div className="ai-assistant-sort-wrapper">
            <label htmlFor="sort-select" className="ai-assistant-sort-label">
              Sort:
            </label>
            <Select
              id="sort-select"
              value={sortOrder}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="ai-assistant-sort-select"
              options={[
                { value: '-created_at', label: 'Newest First' },
                { value: 'created_at', label: 'Oldest First' },
                { value: '-updated_at', label: 'Recently Updated' },
                { value: 'updated_at', label: 'Least Recently Updated' },
              ]}
            />
          </div>
        </div>
        
        <nav className="ai-assistant-sidebar-nav">
          {isLoadingHistory ? (
            <div className="ai-assistant-sidebar-loading">
              <div className="ai-assistant-sidebar-loading-dots">
                <span className="ai-assistant-sidebar-loading-dot" style={{ animationDelay: '-0.3s' }}></span>
                <span className="ai-assistant-sidebar-loading-dot" style={{ animationDelay: '-0.15s' }}></span>
                <span className="ai-assistant-sidebar-loading-dot"></span>
              </div>
              <p className="ai-assistant-sidebar-loading-text">Loading chat history...</p>
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="ai-assistant-sidebar-empty">
              <ChatBubbleIcon className="ai-assistant-sidebar-empty-icon" />
              <p className="ai-assistant-sidebar-empty-title">No chat history yet</p>
              <p className="ai-assistant-sidebar-empty-description">Start a new conversation</p>
            </div>
          ) : (
            <>
              <ul className="ai-assistant-chat-list">
                {chatHistory.map((item, idx) => {
                  const isActive = activeChatId === item.id;
                  const isSwiped = swipedChatId === item.id;
                  
                  return (
                    <motion.li 
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <motion.div
                        drag="x"
                        dragConstraints={{ left: -80, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, info: PanInfo) => {
                          if (info.offset.x < -60) {
                            setSwipedChatId(item.id);
                          } else {
                            setSwipedChatId(null);
                          }
                        }}
                        className="ai-assistant-chat-item-wrapper"
                      >
                        {/* Delete button revealed on swipe */}
                        <div className="ai-assistant-chat-item-delete">
                          <DeleteIcon className="ai-assistant-chat-item-delete-icon" />
                        </div>
                        
                        <div className={`ai-assistant-chat-item ${isActive ? 'ai-assistant-chat-item--active' : ''}`}>
                          <button 
                            onClick={() => handleSelectChat(item.id)} 
                            className={`ai-assistant-chat-item-button ${isActive ? 'ai-assistant-chat-item-button--active' : ''}`}
                            aria-label={`Select chat: ${item.title}`}
                            title={item.title}
                          >
                            <ChatBubbleIcon className={`ai-assistant-chat-item-icon ${isActive ? 'ai-assistant-chat-item-icon--active' : ''}`} />
                            <div className="ai-assistant-chat-item-content">
                              <p className="ai-assistant-chat-item-title">{item.title || 'Untitled Chat'}</p>
                              <p className={`ai-assistant-chat-item-meta ${isActive ? 'ai-assistant-chat-item-meta--active' : ''}`}>
                                {item.updated_at ? `Updated ${timeAgo(item.updated_at)}` : `Created ${timeAgo(item.created_at)}`}
                              </p>
                            </div>
                          </button>
                          
                          <Tooltip content="Delete chat">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setChatToDelete(item.id);
                              }}
                              className={`ai-assistant-chat-item-delete-btn ${isActive ? 'ai-assistant-chat-item-delete-btn--visible' : ''}`}
                              aria-label={`Delete chat: ${item.title}`}
                              disabled={isDeletingChat === item.id}
                            >
                              {isDeletingChat === item.id ? (
                                <div className="ai-assistant-chat-item-delete-spinner"></div>
                              ) : (
                                <DeleteIcon />
                              )}
                            </button>
                          </Tooltip>
                        </div>
                      </motion.div>
                    </motion.li>
                  );
                })}
              </ul>
              
              {/* Pagination Controls */}
              {pagination && pagination.count > chatsPerPage && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ai-assistant-sidebar-pagination"
                >
                  <div className="ai-assistant-sidebar-pagination-info">
                    Showing <strong className="ai-assistant-sidebar-pagination-strong">{startItem}</strong> to <strong className="ai-assistant-sidebar-pagination-strong">{endItem}</strong> of <strong className="ai-assistant-sidebar-pagination-strong">{pagination.count}</strong> chats
                  </div>
                  <div className="ai-assistant-sidebar-pagination-controls">
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => fetchHistory(currentPage - 1, sortOrder)}
                      disabled={!pagination.previous || isLoadingHistory}
                      iconOnly
                      aria-label="Previous page"
                    >
                      <ChevronLeftIcon />
                    </Button>
                    <span className="ai-assistant-sidebar-pagination-page">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => fetchHistory(currentPage + 1, sortOrder)}
                      disabled={!pagination.next || isLoadingHistory}
                      iconOnly
                      aria-label="Next page"
                    >
                      <ChevronRightIcon />
                    </Button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </nav>
      </motion.div>

      {/* Main Chat Area */}
      <div 
        ref={mainChatRef}
        {...mainChatSwipeHandlers}
        className="ai-assistant-main"
      >
        <header className="ai-assistant-header">
          <Tooltip content="Toggle sidebar">
            <Button
              variant="glass"
              size="sm"
              iconOnly
              onClick={() => setIsSidebarOpen(true)}
              className="ai-assistant-header-menu-btn"
              aria-label="Open chat history"
            >
              <MenuIcon />
            </Button>
          </Tooltip>
          
          <div className="ai-assistant-header-icon-wrapper">
            <SparklesIcon className="ai-assistant-header-icon" />
          </div>
          
          <h1 className="ai-assistant-header-title">
            {activeChatId ? chatHistory.find(c => c.id === activeChatId)?.title : 'AI Assistant'}
          </h1>
          
          {/* Settings Menu */}
          <div className="ai-assistant-header-settings">
            <Tooltip content="Chat settings">
              <Button
                variant="glass"
                size="sm"
                iconOnly
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="ai-assistant-header-settings-btn"
                aria-label="Chat settings"
              >
                <SettingsIcon />
              </Button>
            </Tooltip>
            
            <AnimatePresence>
              {isSettingsOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="ai-assistant-header-settings-menu"
                >
                  <div className="ai-assistant-header-settings-menu-content">
                    <button
                      onClick={() => {
                        handleExportChat();
                        setIsSettingsOpen(false);
                      }}
                      className="ai-assistant-header-settings-menu-item"
                    >
                      <ExportIcon />
                      <span className="ai-assistant-header-settings-menu-item-text">Export Chat</span>
                    </button>
                    <button
                      onClick={() => {
                        handleClearConversation();
                        setIsSettingsOpen(false);
                      }}
                      className="ai-assistant-header-settings-menu-item"
                    >
                      <ClearIcon />
                      <span className="ai-assistant-header-settings-menu-item-text">Clear Conversation</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>
        
        <main className="ai-assistant-main-content">
          {messages.length === 0 && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ai-assistant-empty-state"
            >
              <div className="ai-assistant-empty-state-icon-wrapper">
                <SparklesIcon className="ai-assistant-empty-state-icon" />
              </div>
              <h2 className="ai-assistant-empty-state-title">AI Assistant</h2>
              <p className="ai-assistant-empty-state-description">
                Ask me anything about your contacts. I can help you search, filter, and analyze your contact database.
              </p>
            </motion.div>
          )}
          
          {messages.map((msg, index) => (
            <motion.div 
              key={`message-${index}-${msg.sender}-${msg.timestamp || msg.text.substring(0, 20)}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`ai-assistant-message ${msg.sender === 'user' ? 'ai-assistant-message--user' : ''}`}
            >
              {msg.sender === 'ai' && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ai-assistant-message-avatar ai-assistant-message-avatar--ai"
                >
                  <LogoIcon className="ai-assistant-message-avatar-icon" />
                </motion.div>
              )}
              
              <div className={`ai-assistant-message-bubble ${msg.sender === 'ai' ? 'ai-assistant-message-bubble--ai' : 'ai-assistant-message-bubble--user'}`}>
                {renderMessageContent(msg, index)}
              </div>
              
              {msg.sender === 'user' && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ai-assistant-message-avatar ai-assistant-message-avatar--user"
                >
                  <UsersIcon className="ai-assistant-message-avatar-icon" />
                </motion.div>
              )}
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ai-assistant-message ai-assistant-message--loading"
            >
              <div className="ai-assistant-message-avatar ai-assistant-message-avatar--ai">
                <LogoIcon className="ai-assistant-message-avatar-icon" />
              </div>
              <div className="ai-assistant-message-bubble ai-assistant-message-bubble--ai">
                <div className="ai-assistant-message-loading-dots">
                  <span className="ai-assistant-message-loading-dot" style={{ animationDelay: '-0.3s' }}></span>
                  <span className="ai-assistant-message-loading-dot" style={{ animationDelay: '-0.15s' }}></span>
                  <span className="ai-assistant-message-loading-dot"></span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </main>

        <footer className="ai-assistant-footer">
          {!activeChatId && !isLoading && messages.length <= 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="ai-assistant-suggestions"
            >
              {suggestionPrompts.map((prompt, idx) => (
                <motion.div
                  key={prompt}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setInput(prompt)}
                    className="ai-assistant-suggestion-btn"
                  >
                    {prompt}
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
          
          <div className="ai-assistant-input-wrapper">
            {/* Input Toolbar */}
            <div className="ai-assistant-input-toolbar">
              <Tooltip content="Attach file">
                <button
                  className="ai-assistant-input-toolbar-btn"
                  aria-label="Attach file"
                >
                  <AttachIcon className="ai-assistant-input-toolbar-icon" />
                </button>
              </Tooltip>
              
              <Tooltip content="Add emoji">
                <button
                  className="ai-assistant-input-toolbar-btn"
                  aria-label="Add emoji"
                >
                  <EmojiIcon className="ai-assistant-input-toolbar-icon" />
                </button>
              </Tooltip>
              
              <Tooltip content="Voice input">
                <button
                  className="ai-assistant-input-toolbar-btn"
                  aria-label="Voice input"
                >
                  <MicrophoneIcon className="ai-assistant-input-toolbar-icon" />
                </button>
              </Tooltip>
            </div>
            
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Ask about your contacts..."
              disabled={isLoading || !chat}
              variant="glass-frosted"
              rightIcon={
                <Button
                  variant="glass-primary"
                  size="sm"
                  iconOnly
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim() || !chat}
                  aria-label="Send message"
                  className="ai-assistant-send-btn"
                >
                  <SendIcon />
                </Button>
              }
              fullWidth
              className="ai-assistant-input"
            />
          </div>
        </footer>
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {chatToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="ai-assistant-delete-dialog-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <Card className="ai-assistant-delete-dialog">
                <CardContent className="ai-assistant-delete-dialog-content">
                  <div className="ai-assistant-delete-dialog-header">
                    <div className="ai-assistant-delete-dialog-icon-wrapper">
                      <AlertTriangleIcon className="ai-assistant-delete-dialog-icon" />
                    </div>
                    <h3 className="ai-assistant-delete-dialog-title">Delete Chat?</h3>
                  </div>
                  <p className="ai-assistant-delete-dialog-message">
                    Are you sure you want to delete this chat? This action cannot be undone.
                  </p>
                  <div className="ai-assistant-delete-dialog-actions">
                    <Button
                      variant="glass"
                      size="md"
                      onClick={() => setChatToDelete(null)}
                      disabled={isDeletingChat === chatToDelete}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="glass-primary"
                      size="md"
                      onClick={() => handleDeleteChat(chatToDelete)}
                      disabled={isDeletingChat === chatToDelete}
                      leftIcon={isDeletingChat === chatToDelete ? undefined : <DeleteIcon />}
                      className="ai-assistant-delete-dialog-delete-btn"
                    >
                      {isDeletingChat === chatToDelete ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIAssistantPage;
