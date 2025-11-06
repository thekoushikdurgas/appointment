'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, Chat, Content } from '@google/genai';
import { useAuth } from '../../../hooks/useAuth';
import { Contact } from '../../../types/index';
import { LogoIcon, SparklesIcon, PlusIcon, ChatBubbleIcon, MenuIcon } from '../../../components/icons/IconComponents';
import { fetchContacts } from '../../../services/contact';
import { getChatHistory, getChat, createChat, updateChat, Message, ChatHistoryItem } from '../../../services/aiChat';

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

  useEffect(() => {
    if (!user) return;
    
    const fetchHistory = async () => {
      try {
        const result = await getChatHistory();
        if (result.success && result.data) {
          setChatHistory(result.data);
        } else {
          console.error('Error fetching chat history:', result.message || result.error);
          setChatHistory([]);
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
        setChatHistory([]);
      }
    };

    fetchHistory();
    handleNewChat();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([{
      sender: 'ai',
      text: `Hello! I'm NexusAI, your smart CRM assistant. How can I help you find contacts today?`
    }]);
    initializeChatSession();
    setIsSidebarOpen(false);
  };

  const handleSelectChat = async (chatId: string) => {
    if (isLoading || chatId === activeChatId) return;
    setIsLoading(true);
    setActiveChatId(chatId);
    setMessages([]);
    setIsSidebarOpen(false);

    try {
      const result = await getChat(chatId);
      
      if (!result.success || !result.data) {
        const errorMsg = result.message || 'Chat not found';
        throw new Error(errorMsg);
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
      console.error('Error loading chat:', (error as Error).message);
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
      let aiResponseText = response.text;
      let contactsForDisplay: Contact[] = [];

      if (response.functionCalls && response.functionCalls.length > 0) {
        const functionCall = response.functionCalls[0];
        let functionResponse;

        if (functionCall.name === 'searchContacts') {
          const args = functionCall.args;
          const { contacts, count } = await fetchContacts({
              search: args.query,
              filters: {
                  status: args.status,
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
            aiResponseText = functionResponseResult.text;
        }
      }

      const aiMessage: Message = { sender: 'ai', text: aiResponseText, contacts: contactsForDisplay };
      const finalMessages = [...currentMessages, aiMessage];
      setMessages(finalMessages);

      try {
        let currentChatId = activeChatId;
        
        if (!currentChatId) {
          const title = prompt.substring(0, 40) + (prompt.length > 40 ? '...' : '');
          const result = await createChat({
            user_id: user!.id,
            title: title,
            messages: finalMessages,
          });

          if (result.success && result.data) {
            currentChatId = result.data.id;
            setActiveChatId(currentChatId);
            setChatHistory(prev => [result.data!, ...prev]);
          } else {
            console.error("Failed to create chat:", result.message || result.error);
          }
        } else {
          const result = await updateChat(currentChatId, {
            messages: finalMessages,
          });
          
          if (!result.success) {
            console.error("Failed to update chat history:", result.message || result.error);
          }
        }
      } catch (error) {
        console.error("Error saving chat history:", (error as Error).message);
      }
    } catch (error) {
      console.error("Error communicating with Gemini:", (error as Error).message);
      setMessages(prev => [...prev, { sender: 'ai', text: "I'm sorry, an error occurred." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (message: Message) => (
    <div className="prose prose-sm dark:prose-invert max-w-none">
        <p>{message.text}</p>
        {message.contacts && message.contacts.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 not-prose">
                {message.contacts.map(contact => (
                    <div key={contact.id} className="bg-background/50 p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                            <img src={contact.avatarUrl} alt={contact.name} className="w-10 h-10 rounded-full" />
                            <div>
                                <p className="font-bold text-foreground">{contact.name}</p>
                                <p className="text-xs text-muted-foreground">{contact.title || 'No title'}</p>
                                <p className="text-xs text-muted-foreground">{contact.company}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );

  return (
    <div className="flex h-full max-h-[calc(100vh-8rem)] bg-card rounded-lg shadow-md border border-border overflow-hidden">
        {/* Overlay for mobile */}
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/60 z-20 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
            ></div>
        )}

        {/* Chat History Sidebar */}
        <div className={`fixed md:relative inset-y-0 left-0 z-30 w-full max-w-xs bg-secondary/50 border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
            <div className="p-3 border-b border-border">
            <button onClick={handleNewChat} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold border border-border rounded-lg hover:bg-muted text-foreground transition-colors">
                <PlusIcon className="w-5 h-5"/>
                New Chat
            </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
                {chatHistory.map(item => (
                <li key={item.id}>
                    <button onClick={() => handleSelectChat(item.id)} className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${activeChatId === item.id ? 'bg-primary/10 text-primary-600 dark:text-primary-400' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                    <ChatBubbleIcon className="w-5 h-5 flex-shrink-0"/>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate font-medium text-sm">{item.title}</p>
                        <p className="text-xs">{timeAgo(item.created_at)}</p>
                    </div>
                    </button>
                </li>
                ))}
            </ul>
            </nav>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
            <header className="p-4 border-b border-border flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-muted-foreground p-1 -ml-1">
                    <MenuIcon className="w-6 h-6"/>
                </button>
                <SparklesIcon className="w-6 h-6 text-primary-500"/>
                <h1 className="text-xl font-bold text-card-foreground">
                    {activeChatId ? chatHistory.find(c => c.id === activeChatId)?.title : 'AI Assistant'}
                </h1>
            </header>
            
            <main className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-6">
                {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                    {msg.sender === 'ai' && (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <LogoIcon className="w-5 h-5 text-primary-500" />
                        </div>
                    )}
                    <div className={`p-4 rounded-2xl max-w-2xl ${msg.sender === 'ai' ? 'bg-secondary rounded-tl-none' : 'bg-primary text-primary-foreground rounded-br-none'}`}>
                    {renderMessageContent(msg)}
                    </div>
                    {msg.sender === 'user' && ( <img src={user?.avatarUrl} alt="You" className="w-8 h-8 rounded-full flex-shrink-0" /> )}
                </div>
                ))}
                {isLoading && (
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <LogoIcon className="w-5 h-5 text-primary-500" />
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary rounded-tl-none">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="h-2 w-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="h-2 w-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="h-2 w-2 bg-primary-500 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            </main>

            <footer className="p-4 border-t border-border">
            {!activeChatId && !isLoading && messages.length <= 1 && (
                <div className="flex items-center justify-start gap-2 flex-wrap pb-3">
                    {suggestionPrompts.map(prompt => (
                        <button key={prompt} onClick={() => setInput(prompt)} className="px-3 py-1.5 text-xs sm:text-sm bg-secondary rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            {prompt}
                        </button>
                    ))}
                </div>
            )}
            <div className="relative">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()} placeholder="Ask about your contacts..." className="w-full p-3 pr-12 border bg-background border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" disabled={isLoading || !chat}/>
                <button onClick={handleSendMessage} disabled={isLoading || !input.trim() || !chat} className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-muted-foreground hover:text-primary-500 disabled:text-muted-foreground/50 disabled:cursor-not-allowed" aria-label="Send message">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                </button>
            </div>
            </footer>
        </div>
    </div>
  );
};

export default AIAssistantPage;

