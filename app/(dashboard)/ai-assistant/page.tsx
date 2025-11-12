'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, Chat, Content } from '@google/genai';
import { useAuth } from '../../../hooks/useAuth';
import { Contact } from '../../../types/index';
import { LogoIcon, SparklesIcon, PlusIcon, ChatBubbleIcon, MenuIcon, SendIcon, UsersIcon, DeleteIcon, ChevronLeftIcon, ChevronRightIcon, AlertTriangleIcon, SuccessIcon, ChevronUpDownIcon, XMarkIcon } from '../../../components/icons/IconComponents';
import { fetchContacts } from '../../../services/contact';
import { getChatHistory, getChat, createChat, updateChat, deleteChat, Message, ChatHistoryItem, PaginationMetadata } from '../../../services/aiChat';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent } from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { cn } from '../../../utils/cn';

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
      // Use NEXT_PUBLIC_ prefix for client-side access in Next.js
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
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
        .slice(1) // Remove initial welcome message from history
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
          // Type assert the args to our defined interface
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

      // Ensure aiResponseText is always a string
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
            // Refresh history to get updated list with pagination
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
            // Refresh history to update the chat in the list
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
        
        // If deleted chat was active, clear it
        if (activeChatId === chatId) {
          handleNewChat();
        }
        
        // Refresh history
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

  const renderMessageContent = (message: Message) => (
    <div className="max-w-none">
        <p className="text-foreground whitespace-pre-wrap">{message.text}</p>
        {message.contacts && message.contacts.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {message.contacts.map(contact => (
                    <Card key={contact.id} variant="outlined" padding="md" className="hover-lift">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex-center">
                                <UsersIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-foreground text-truncate">{contact.name}</p>
                                <p className="text-xs text-muted-foreground text-truncate">{contact.title || 'No title'}</p>
                                <p className="text-xs text-muted-foreground text-truncate">{contact.company}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        )}
    </div>
  );

  const totalPages = pagination ? Math.ceil(pagination.count / chatsPerPage) : 1;
  const startItem = pagination ? (currentPage - 1) * chatsPerPage + 1 : 0;
  const endItem = pagination ? Math.min(currentPage * chatsPerPage, pagination.count) : 0;

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-full h-full bg-card rounded-lg shadow-lg border border-border overflow-hidden">
        {/* Overlay for mobile */}
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-backdrop z-20 lg:hidden animate-fade-in"
                onClick={() => setIsSidebarOpen(false)}
            ></div>
        )}

        {/* Error and Success Messages */}
        {(errorMessage || successMessage) && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
            {errorMessage && (
              <Card className="border-error/20 bg-error/5 animate-slide-up-fade mb-2">
                <CardContent className="flex items-center gap-3 p-4">
                  <AlertTriangleIcon className="w-5 h-5 text-error flex-shrink-0" />
                  <p className="text-sm text-error flex-1">{errorMessage}</p>
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="text-error hover:text-error/80"
                    aria-label="Dismiss error"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            )}
            {successMessage && (
              <Card className="border-success/20 bg-success/5 animate-slide-up-fade">
                <CardContent className="flex items-center gap-3 p-4">
                  <SuccessIcon className="w-5 h-5 text-success flex-shrink-0" />
                  <p className="text-sm text-success flex-1">{successMessage}</p>
                  <button
                    onClick={() => setSuccessMessage(null)}
                    className="text-success hover:text-success/80"
                    aria-label="Dismiss success"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Chat History Sidebar */}
        <div className={cn(
          'fixed lg:relative inset-y-0 left-0 z-30 w-full max-w-xs lg:max-w-sm bg-card border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none lg:h-full',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}>
            <div className="p-4 border-b border-border space-y-3">
                <Button
                    onClick={handleNewChat}
                    variant="primary"
                    size="md"
                    fullWidth
                    leftIcon={<PlusIcon className="w-5 h-5" />}
                >
                    New Chat
                </Button>
                
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-select" className="text-xs text-muted-foreground whitespace-nowrap">
                    Sort:
                  </label>
                  <Select
                    id="sort-select"
                    value={sortOrder}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    className="flex-1 text-sm"
                    options={[
                      { value: '-created_at', label: 'Newest First' },
                      { value: 'created_at', label: 'Oldest First' },
                      { value: '-updated_at', label: 'Recently Updated' },
                      { value: 'updated_at', label: 'Least Recently Updated' },
                    ]}
                  />
                </div>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {isLoadingHistory ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        <div className="flex items-center justify-center gap-2">
                            <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="h-2 w-2 bg-primary rounded-full animate-bounce"></span>
                        </div>
                        <p className="mt-3">Loading chat history...</p>
                    </div>
                ) : chatHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        <ChatBubbleIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No chat history yet</p>
                        <p className="text-xs mt-1">Start a new conversation</p>
                    </div>
                ) : (
                    <>
                        <ul className="space-y-1">
                            {chatHistory.map(item => (
                                <li key={item.id}>
                                    <div className={cn(
                                      'group flex items-center gap-2 p-1 rounded-lg',
                                      activeChatId === item.id && 'bg-primary/10'
                                    )}>
                                        <button 
                                            onClick={() => handleSelectChat(item.id)} 
                                            className={cn(
                                              'flex-1 flex items-center gap-3 p-2 rounded-lg text-left transition-all',
                                              activeChatId === item.id 
                                                ? 'bg-primary text-primary-foreground shadow-md' 
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            )}
                                            aria-label={`Select chat: ${item.title}`}
                                            title={item.title}
                                        >
                                            <ChatBubbleIcon className={cn('w-5 h-5 flex-shrink-0', activeChatId === item.id && 'text-primary-foreground')}/>
                                            <div className="flex-1 overflow-hidden min-w-0">
                                                <p className="text-truncate font-medium text-sm">{item.title || 'Untitled Chat'}</p>
                                                <p className={cn('text-xs text-truncate', activeChatId === item.id ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                                                    {item.updated_at ? `Updated ${timeAgo(item.updated_at)}` : `Created ${timeAgo(item.created_at)}`}
                                                </p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setChatToDelete(item.id);
                                            }}
                                            className={cn(
                                              'p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100',
                                              'text-muted-foreground hover:text-error hover:bg-error/10',
                                              activeChatId === item.id && 'opacity-100'
                                            )}
                                            aria-label={`Delete chat: ${item.title}`}
                                            title="Delete chat"
                                            disabled={isDeletingChat === item.id}
                                        >
                                            {isDeletingChat === item.id ? (
                                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <DeleteIcon className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        
                        {/* Pagination Controls */}
                        {pagination && pagination.count > chatsPerPage && (
                            <div className="mt-4 pt-4 border-t border-border space-y-2">
                                <div className="text-xs text-muted-foreground text-center">
                                    Showing <strong className="text-foreground">{startItem}</strong> to <strong className="text-foreground">{endItem}</strong> of <strong className="text-foreground">{pagination.count}</strong> chats
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchHistory(currentPage - 1, sortOrder)}
                                        disabled={!pagination.previous || isLoadingHistory}
                                        iconOnly
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeftIcon className="w-4 h-4" />
                                    </Button>
                                    <span className="text-xs text-muted-foreground">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchHistory(currentPage + 1, sortOrder)}
                                        disabled={!pagination.next || isLoadingHistory}
                                        iconOnly
                                        aria-label="Next page"
                                    >
                                        <ChevronRightIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </nav>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            <header className="p-4 sm:p-6 border-b border-border flex items-center gap-3 bg-card/50 backdrop-blur-sm flex-shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden"
                    aria-label="Open chat history"
                    title="Open chat history"
                >
                    <MenuIcon className="w-6 h-6"/>
                </Button>
                <div className="p-2 bg-primary/10 rounded-lg">
                    <SparklesIcon className="w-6 h-6 text-primary"/>
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                    {activeChatId ? chatHistory.find(c => c.id === activeChatId)?.title : 'AI Assistant'}
                </h1>
            </header>
            
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-hidden space-y-6 min-h-0">
                {messages.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                        <div className="p-4 bg-primary/10 rounded-2xl">
                            <SparklesIcon className="w-12 h-12 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">AI Assistant</h2>
                        <p className="text-muted-foreground max-w-md">
                            Ask me anything about your contacts. I can help you search, filter, and analyze your contact database.
                        </p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''} animate-slide-up-fade`}>
                        {msg.sender === 'ai' && (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20">
                                <LogoIcon className="w-5 h-5 text-primary" />
                            </div>
                        )}
                        <div className={cn(
                          'p-4 rounded-2xl max-w-2xl shadow-sm',
                          msg.sender === 'ai' 
                            ? 'bg-muted rounded-tl-none' 
                            : 'bg-primary text-primary-foreground rounded-br-none'
                        )}>
                            {renderMessageContent(msg)}
                        </div>
                        {msg.sender === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20">
                                <UsersIcon className="w-5 h-5 text-primary" />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3 animate-fade-in">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20">
                            <LogoIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="p-4 rounded-2xl bg-muted rounded-tl-none shadow-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-primary rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-4 sm:p-6 border-t border-border bg-card/50 backdrop-blur-sm space-y-4 flex-shrink-0">
                {!activeChatId && !isLoading && messages.length <= 1 && (
                    <div className="flex items-center justify-start gap-2 flex-wrap">
                        {suggestionPrompts.map(prompt => (
                            <Button
                                key={prompt}
                                variant="outline"
                                size="sm"
                                onClick={() => setInput(prompt)}
                                className="text-xs sm:text-sm"
                            >
                                {prompt}
                            </Button>
                        ))}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <Input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder="Ask about your contacts..."
                        disabled={isLoading || !chat}
                        rightIcon={
                            <Button
                                variant="ghost"
                                size="sm"
                                iconOnly
                                onClick={handleSendMessage}
                                disabled={isLoading || !input.trim() || !chat}
                                aria-label="Send message"
                            >
                                <SendIcon className="w-5 h-5" />
                            </Button>
                        }
                        fullWidth
                    />
                </div>
            </footer>
        </div>

        {/* Delete Confirmation Dialog */}
        {chatToDelete && (
            <div className="fixed inset-0 bg-backdrop z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md animate-fade-in">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-error/10 rounded-lg">
                                <AlertTriangleIcon className="w-6 h-6 text-error" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">Delete Chat?</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to delete this chat? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-2">
                            <Button
                                variant="outline"
                                size="md"
                                onClick={() => setChatToDelete(null)}
                                disabled={isDeletingChat === chatToDelete}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                size="md"
                                onClick={() => handleDeleteChat(chatToDelete)}
                                disabled={isDeletingChat === chatToDelete}
                                leftIcon={isDeletingChat === chatToDelete ? undefined : <DeleteIcon className="w-4 h-4" />}
                            >
                                {isDeletingChat === chatToDelete ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}
    </div>
  );
};

export default AIAssistantPage;

