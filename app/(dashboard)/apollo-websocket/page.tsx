'use client';

import React, { useState } from 'react';
import { 
  SearchIcon, 
  XMarkIcon, 
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  CheckIcon,
  SuccessIcon,
  ChevronLeftIcon,
  ChevronRightIcon as ChevronRightPaginationIcon,
  DeleteIcon,
  DownloadIcon,
  UsersIcon,
  BuildingIcon,
  MapPinIcon,
  CalendarIcon,
  MailIcon,
  PhoneIcon,
  GlobeAltIcon,
  EditIcon,
} from '@components/icons/IconComponents';
import { Input } from '@components/ui/Input';
import { Textarea } from '@components/ui/Textarea';
import { Button } from '@components/ui/Button';
import { Card, CardContent } from '@components/ui/Card';
import { Toast, ToastContainer, ToastProps } from '@components/ui/Toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@components/ui/Table';
import { Tooltip } from '@components/ui/Tooltip';
import { Contact } from '@/types/index';
import { useApolloWebSocket } from '@/hooks/useApolloWebSocket';
import { 
  ApolloUrlAnalysisResponse, 
  ApolloContactsResponse,
} from '@/types/apollo';
import { ApolloAnalyzerSkeleton, ApolloContactsSkeleton } from '@components/apollo/ApolloSkeletonLoader';
import { ApolloEmptyState } from '@components/apollo/ApolloEmptyState';
import { ApolloStatsCards, ApolloStats } from '@components/apollo/ApolloStatsCards';
import { ExportModal } from '@components/contacts/ExportModal';
import { parseMultiValueInput } from '@utils/apolloFilters';

// Helper Components
const StatusBadge: React.FC<{ status: Contact['status'] }> = ({ status }) => {
  const statusClasses = {
    Lead: "badge badge-status-lead",
    Customer: "badge badge-status-customer",
    Archived: "badge badge-status-archived",
  };
  const statusTooltips = {
    Lead: "Potential customer - not yet converted",
    Customer: "Active customer",
    Archived: "Inactive or archived contact",
  };
  return (
    <Tooltip content={statusTooltips[status]}>
      <span className={statusClasses[status]}>{status}</span>
    </Tooltip>
  );
};

const EmailStatusBadge: React.FC<{ status: string | undefined }> = ({ status }) => {
  if (!status) return <span className="contacts-empty-value">-</span>;
  
  const statusClasses: { [key: string]: string } = {
    valid: "badge badge-email-valid",
    unknown: "badge badge-email-unknown",
    invalid: "badge badge-email-invalid",
  };
  
  const statusTooltips: { [key: string]: string } = {
    valid: "Email address has been verified",
    unknown: "Email verification status unknown",
    invalid: "Email address is invalid or bounced",
  };
  
  const statusClass = statusClasses[status] || "badge badge-primary";
  const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
  const tooltip = statusTooltips[status] || "Email status";
  
  return (
    <Tooltip content={tooltip}>
      <span className={statusClass}>{formattedStatus}</span>
    </Tooltip>
  );
};

const Highlight: React.FC<{ text: string | undefined; highlight: string }> = ({ text, highlight }) => {
  const safeText = text || '';
  if (!highlight.trim()) {
    return <span>{safeText}</span>;
  }
  const escapedHighlight = highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedHighlight})`, 'gi');
  const parts = safeText.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="contacts-highlight">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

// Connection Status Badge Component
const ConnectionStatusBadge: React.FC<{ 
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  onReconnect?: () => void;
}> = ({ connectionState, onReconnect }) => {
  const statusConfig = {
    connecting: {
      label: 'Connecting...',
      className: 'apollo-ws-status apollo-ws-status--connecting',
      icon: '⏳',
    },
    connected: {
      label: 'Connected',
      className: 'apollo-ws-status apollo-ws-status--connected',
      icon: '🟢',
    },
    disconnected: {
      label: 'Disconnected',
      className: 'apollo-ws-status apollo-ws-status--disconnected',
      icon: '⚪',
    },
    error: {
      label: 'Connection Error',
      className: 'apollo-ws-status apollo-ws-status--error',
      icon: '🔴',
    },
  };

  const config = statusConfig[connectionState];

  return (
    <div className={config.className}>
      <span className="apollo-ws-status-icon">{config.icon}</span>
      <span className="apollo-ws-status-label">{config.label}</span>
      {(connectionState === 'disconnected' || connectionState === 'error') && onReconnect && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReconnect}
          className="apollo-ws-status-reconnect"
        >
          Reconnect
        </Button>
      )}
    </div>
  );
};

// Column Configuration
type ColumnConfig = {
  id: string;
  label: string;
  field: keyof Contact;
  width?: string;
};

const defaultColumns: ColumnConfig[] = [
  { id: 'name', label: 'Name', field: 'name', width: '250px' },
  { id: 'company', label: 'Company', field: 'company', width: '200px' },
  { id: 'title', label: 'Title', field: 'title', width: '150px' },
  { id: 'phone', label: 'Phone', field: 'phone', width: '150px' },
  { id: 'status', label: 'Status', field: 'status', width: '100px' },
  { id: 'emailStatus', label: 'Email Status', field: 'emailStatus', width: '120px' },
  { id: 'city', label: 'Location', field: 'city', width: '150px' },
  { id: 'createdAt', label: 'Created At', field: 'createdAt', width: '120px' },
];

export default function ApolloWebSocketPage() {
  // WebSocket hook
  const {
    connectionState,
    isConnected,
    isConnecting,
    analyze: wsAnalyze,
    searchContacts: wsSearchContacts,
    countContacts: wsCountContacts,
    connect: wsConnect,
  } = useApolloWebSocket(true);

  // Toast state
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  // Session stats state
  const [sessionStats, setSessionStats] = useState<ApolloStats>({
    totalAnalyses: 0,
    totalContactsFound: 0,
    lastAnalysisTime: null,
    successRate: 100,
  });

  // Unified URL state
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  
  // URL Analyzer State
  const [analyzeResult, setAnalyzeResult] = useState<ApolloUrlAnalysisResponse | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showRawParams, setShowRawParams] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Contact Search State
  const [searchResult, setSearchResult] = useState<ApolloContactsResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [limit, setLimit] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedUnmappedCategories, setExpandedUnmappedCategories] = useState<Set<string>>(new Set());
  
  // Pagination State - using offset instead of cursor
  const [currentOffset, setCurrentOffset] = useState(0);
  const [offsetHistory, setOffsetHistory] = useState<number[]>([]); // Stack for previous offsets
  
  // Company Name Filtering State
  const [includeCompanyName, setIncludeCompanyName] = useState('');
  const [excludeCompanyName, setExcludeCompanyName] = useState('');
  
  // Domain Filtering State
  const [includeDomainList, setIncludeDomainList] = useState('');
  const [excludeDomainList, setExcludeDomainList] = useState('');
  
  // Count State
  const [contactCount, setContactCount] = useState<number | null>(null);
  const [isCounting, setIsCounting] = useState(false);
  
  // Contact Selection State
  const [selectedContactUuids, setSelectedContactUuids] = useState<Set<string>>(new Set());
  
  // Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Toast helper function
  const showToast = (title: string, description?: string, variant: ToastProps['variant'] = 'default') => {
    const id = `toast-${Date.now()}`;
    const newToast: ToastProps = {
      id,
      title,
      description,
      variant,
      duration: variant === 'error' ? 7000 : 5000,
      onClose: (toastId) => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      },
    };
    setToasts(prev => [...prev, newToast]);
  };

  // Update session stats
  const updateStats = (success: boolean, contactsFound: number = 0) => {
    setSessionStats(prev => {
      const totalAttempts = prev.totalAnalyses + 1;
      const successfulAttempts = success 
        ? Math.floor((prev.successRate / 100) * prev.totalAnalyses) + 1
        : Math.floor((prev.successRate / 100) * prev.totalAnalyses);
      
      return {
        totalAnalyses: totalAttempts,
        totalContactsFound: prev.totalContactsFound + contactsFound,
        lastAnalysisTime: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        successRate: Math.round((successfulAttempts / totalAttempts) * 100),
      };
    });
  };

  // Handle Count Contacts
  const handleCountContacts = async () => {
    if (!url.trim()) {
      showToast('Invalid Input', 'Please enter an Apollo.io URL', 'warning');
      return;
    }

    if (!isConnected) {
      showToast('Not Connected', 'WebSocket connection is not available. Please wait for connection.', 'error');
      return;
    }

    setIsCounting(true);
    setContactCount(null);

    try {
      // Parse multi-value inputs
      const parsedIncludeCompanyNames = parseMultiValueInput(includeCompanyName);
      const parsedExcludeCompanyNames = parseMultiValueInput(excludeCompanyName);
      const parsedIncludeDomains = parseMultiValueInput(includeDomainList);
      const parsedExcludeDomains = parseMultiValueInput(excludeDomainList);
      
      // For include_company_name, join with comma (API expects comma-separated string)
      const includeCompanyNameParam = parsedIncludeCompanyNames.length > 0 
        ? parsedIncludeCompanyNames.join(', ') 
        : undefined;
      
      const count = await wsCountContacts(url, {
        include_company_name: includeCompanyNameParam,
        exclude_company_name: parsedExcludeCompanyNames.length > 0 ? parsedExcludeCompanyNames : undefined,
        include_domain_list: parsedIncludeDomains.length > 0 ? parsedIncludeDomains : undefined,
        exclude_domain_list: parsedExcludeDomains.length > 0 ? parsedExcludeDomains : undefined,
      });

      setContactCount(count);
      showToast(
        'Count Complete',
        `Found ${count.toLocaleString()} contact(s) matching your criteria`,
        'success'
      );
    } catch (error: any) {
      console.error('Count error:', error);
      showToast('Count Failed', error?.message || 'An error occurred while counting contacts', 'error');
    } finally {
      setIsCounting(false);
    }
  };

  // Handle Search Contacts (separate function for pagination)
  const handleSearchContacts = async (offset: number = 0, resetPagination: boolean = false) => {
    if (!url.trim()) {
      showToast('Invalid Input', 'Please enter an Apollo.io URL', 'warning');
      return;
    }

    if (!isConnected) {
      showToast('Not Connected', 'WebSocket connection is not available. Please wait for connection.', 'error');
      return;
    }

    setLoading(true);
    setSearchError(null);

    try {
      // Parse multi-value inputs
      const parsedIncludeCompanyNames = parseMultiValueInput(includeCompanyName);
      const parsedExcludeCompanyNames = parseMultiValueInput(excludeCompanyName);
      const parsedIncludeDomains = parseMultiValueInput(includeDomainList);
      const parsedExcludeDomains = parseMultiValueInput(excludeDomainList);
      
      // For include_company_name, join with comma (API expects comma-separated string)
      const includeCompanyNameParam = parsedIncludeCompanyNames.length > 0 
        ? parsedIncludeCompanyNames.join(', ') 
        : undefined;
      
      const searchParams: any = {
        limit,
        offset: resetPagination ? 0 : offset,
        include_company_name: includeCompanyNameParam,
        exclude_company_name: parsedExcludeCompanyNames.length > 0 ? parsedExcludeCompanyNames : undefined,
        include_domain_list: parsedIncludeDomains.length > 0 ? parsedIncludeDomains : undefined,
        exclude_domain_list: parsedExcludeDomains.length > 0 ? parsedExcludeDomains : undefined,
      };
      
      const result = await wsSearchContacts(url, searchParams);

      setSearchResult(result);
      if (result.unmapped_categories.length > 0) {
        const unmappedNames = new Set(result.unmapped_categories.map(c => c.name));
        setExpandedUnmappedCategories(unmappedNames);
      }
      
      // Update pagination state
      if (resetPagination) {
        setCurrentOffset(0);
        setOffsetHistory([]);
        setSelectedContactUuids(new Set());
      } else {
        setCurrentOffset(offset);
      }
    } catch (error: any) {
      setSearchError(error?.message || 'Failed to search contacts');
      showToast('Search Failed', error?.message || 'Failed to search contacts', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle unified Count, Analyze and Search
  const handleCountAnalyzeAndSearch = async () => {
    if (!url.trim()) {
      showToast('Invalid Input', 'Please enter an Apollo.io URL', 'warning');
      return;
    }

    if (!isConnected) {
      showToast('Not Connected', 'WebSocket connection is not available. Please wait for connection.', 'error');
      return;
    }

    // Reset all states
    setLoading(true);
    setIsCounting(true);
    setAnalyzeError(null);
    setAnalyzeResult(null);
    setSearchError(null);
    setSearchResult(null);
    setContactCount(null);
    setCurrentPage(1);
    setCurrentOffset(0);
    setOffsetHistory([]);
    setSelectedContactUuids(new Set());

    let countSuccess = false;
    let analyzeSuccess = false;
    let searchSuccess = false;
    let contactsFound = 0;
    let totalCount = 0;

    // Parse multi-value inputs (used in all operations)
    const parsedIncludeCompanyNames = parseMultiValueInput(includeCompanyName);
    const parsedExcludeCompanyNames = parseMultiValueInput(excludeCompanyName);
    const parsedIncludeDomains = parseMultiValueInput(includeDomainList);
    const parsedExcludeDomains = parseMultiValueInput(excludeDomainList);
    
    // For include_company_name, join with comma (API expects comma-separated string)
    const includeCompanyNameParam = parsedIncludeCompanyNames.length > 0 
      ? parsedIncludeCompanyNames.join(', ') 
      : undefined;

    // Step 1: Count Contacts
    try {
      const count = await wsCountContacts(url, {
        include_company_name: includeCompanyNameParam,
        exclude_company_name: parsedExcludeCompanyNames.length > 0 ? parsedExcludeCompanyNames : undefined,
        include_domain_list: parsedIncludeDomains.length > 0 ? parsedIncludeDomains : undefined,
        exclude_domain_list: parsedExcludeDomains.length > 0 ? parsedExcludeDomains : undefined,
      });

      setContactCount(count);
      totalCount = count;
      countSuccess = true;
    } catch (error: any) {
      console.error('Count error:', error);
    } finally {
      setIsCounting(false);
    }

    // Step 2: Analyze URL
    try {
      const result = await wsAnalyze(url);
      
      setAnalyzeResult(result);
      const categoryNames = new Set(result.categories.map(c => c.name));
      setExpandedCategories(categoryNames);
      analyzeSuccess = true;
    } catch (error: any) {
      setAnalyzeError(error?.message || 'Failed to analyze URL');
    }

    // Step 3: Search Contacts
    try {
      const result = await wsSearchContacts(url, {
        limit,
        offset: 0,
        include_company_name: includeCompanyNameParam,
        exclude_company_name: parsedExcludeCompanyNames.length > 0 ? parsedExcludeCompanyNames : undefined,
        include_domain_list: parsedIncludeDomains.length > 0 ? parsedIncludeDomains : undefined,
        exclude_domain_list: parsedExcludeDomains.length > 0 ? parsedExcludeDomains : undefined,
      });

      setSearchResult(result);
      if (result.unmapped_categories.length > 0) {
        const unmappedNames = new Set(result.unmapped_categories.map(c => c.name));
        setExpandedUnmappedCategories(unmappedNames);
      }
      contactsFound = result.results.length;
      searchSuccess = true;
      
      setCurrentOffset(0);
      setOffsetHistory([]);
    } catch (error: any) {
      setSearchError(error?.message || 'Failed to search contacts');
    }

    setLoading(false);

    // Update stats and show appropriate toasts
    const overallSuccess = countSuccess || analyzeSuccess || searchSuccess;
    updateStats(overallSuccess, contactsFound);

    if (countSuccess && analyzeSuccess && searchSuccess) {
      showToast(
        'Complete!',
        `Found ${totalCount.toLocaleString()} contact(s), analyzed ${analyzeResult?.statistics.total_parameters || 0} parameters, and loaded ${contactsFound} result(s)`,
        'success'
      );
    } else if (countSuccess && analyzeSuccess) {
      showToast(
        'Count & Analysis Complete!',
        `Found ${totalCount.toLocaleString()} contact(s) and analyzed ${analyzeResult?.statistics.total_parameters || 0} parameters`,
        'success'
      );
    } else if (countSuccess && searchSuccess) {
      showToast(
        'Count & Search Complete!',
        `Found ${totalCount.toLocaleString()} contact(s) total and loaded ${contactsFound} result(s)`,
        'success'
      );
    } else if (analyzeSuccess && searchSuccess) {
      showToast(
        'Analysis & Search Complete!',
        `Found ${contactsFound} contact(s) and analyzed ${analyzeResult?.statistics.total_parameters || 0} parameters`,
        'success'
      );
    } else if (countSuccess) {
      showToast(
        'Count Complete!',
        `Found ${totalCount.toLocaleString()} contact(s) matching your criteria`,
        'success'
      );
    } else if (analyzeSuccess) {
      showToast(
        'URL Analyzed Successfully!',
        `Found ${analyzeResult?.statistics.total_parameters || 0} parameters across ${analyzeResult?.statistics.categories_used || 0} categories`,
        'success'
      );
    } else if (searchSuccess) {
      showToast(
        'Search Complete!',
        `Found ${contactsFound} contact(s) matching your criteria`,
        'success'
      );
    } else {
      showToast('Operation Failed', 'All operations failed. Please check the URL and try again.', 'error');
    }
  };

  // Handle combined Analyze and Search (kept for backward compatibility if needed)
  const handleAnalyzeAndSearch = async () => {
    if (!url.trim()) {
      showToast('Invalid Input', 'Please enter an Apollo.io URL', 'warning');
      return;
    }

    if (!isConnected) {
      showToast('Not Connected', 'WebSocket connection is not available. Please wait for connection.', 'error');
      return;
    }

    setLoading(true);
    setAnalyzeError(null);
    setAnalyzeResult(null);
    setSearchError(null);
    setSearchResult(null);
    setCurrentPage(1);
    setCurrentOffset(0);
    setOffsetHistory([]);
    setSelectedContactUuids(new Set());

    let analyzeSuccess = false;
    let searchSuccess = false;
    let contactsFound = 0;

    // Step 1: Analyze URL
    try {
      const result = await wsAnalyze(url);
      
      setAnalyzeResult(result);
      const categoryNames = new Set(result.categories.map(c => c.name));
      setExpandedCategories(categoryNames);
      analyzeSuccess = true;
    } catch (error: any) {
      setAnalyzeError(error?.message || 'Failed to analyze URL');
    }

    // Step 2: Search Contacts
    try {
      // Parse multi-value inputs
      const parsedIncludeCompanyNames = parseMultiValueInput(includeCompanyName);
      const parsedExcludeCompanyNames = parseMultiValueInput(excludeCompanyName);
      const parsedIncludeDomains = parseMultiValueInput(includeDomainList);
      const parsedExcludeDomains = parseMultiValueInput(excludeDomainList);
      
      // For include_company_name, join with comma (API expects comma-separated string)
      const includeCompanyNameParam = parsedIncludeCompanyNames.length > 0 
        ? parsedIncludeCompanyNames.join(', ') 
        : undefined;
      
      const result = await wsSearchContacts(url, {
        limit,
        offset: 0,
        include_company_name: includeCompanyNameParam,
        exclude_company_name: parsedExcludeCompanyNames.length > 0 ? parsedExcludeCompanyNames : undefined,
        include_domain_list: parsedIncludeDomains.length > 0 ? parsedIncludeDomains : undefined,
        exclude_domain_list: parsedExcludeDomains.length > 0 ? parsedExcludeDomains : undefined,
      });

      setSearchResult(result);
      if (result.unmapped_categories.length > 0) {
        const unmappedNames = new Set(result.unmapped_categories.map(c => c.name));
        setExpandedUnmappedCategories(unmappedNames);
      }
      contactsFound = result.results.length;
      searchSuccess = true;
      setCurrentOffset(0);
      setOffsetHistory([]);
    } catch (error: any) {
      setSearchError(error?.message || 'Failed to search contacts');
    }

    setLoading(false);

    // Update stats and show appropriate toasts
    const overallSuccess = analyzeSuccess || searchSuccess;
    updateStats(overallSuccess, contactsFound);

    if (analyzeSuccess && searchSuccess) {
      showToast(
        'Analysis & Search Complete!',
        `Found ${contactsFound} contact(s) and analyzed ${analyzeResult?.statistics.total_parameters || 0} parameters`,
        'success'
      );
    } else if (analyzeSuccess) {
      showToast(
        'URL Analyzed Successfully!',
        `Found ${analyzeResult?.statistics.total_parameters || 0} parameters across ${analyzeResult?.statistics.categories_used || 0} categories`,
        'success'
      );
    } else if (searchSuccess) {
      showToast(
        'Search Complete!',
        `Found ${contactsFound} contact(s) matching your criteria`,
        'success'
      );
    } else {
      showToast('Operation Failed', 'Both analysis and search failed. Please check the URL and try again.', 'error');
    }
  };

  // Handle Next Page
  const handleNextPage = () => {
    if (!searchResult?.next) return;
    
    setOffsetHistory(prev => [...prev, currentOffset]);
    const nextOffset = currentOffset + limit;
    handleSearchContacts(nextOffset, false);
  };

  // Handle Previous Page
  const handlePreviousPage = () => {
    if (offsetHistory.length > 0) {
      const previousOffset = offsetHistory[offsetHistory.length - 1];
      setOffsetHistory(prev => prev.slice(0, -1));
      handleSearchContacts(previousOffset, false);
    } else {
      const previousOffset = Math.max(0, currentOffset - limit);
      handleSearchContacts(previousOffset, false);
    }
  };

  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  // Toggle unmapped category expansion
  const toggleUnmappedCategory = (categoryName: string) => {
    setExpandedUnmappedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(true);
      showToast('Copied!', 'URL copied to clipboard', 'success');
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('Copy Failed', 'Failed to copy to clipboard', 'error');
    }
  };

  // Load example URL
  const loadExample = (exampleUrl: string) => {
    setUrl(exampleUrl);
    setAnalyzeResult(null);
    setAnalyzeError(null);
    setSearchResult(null);
    setSearchError(null);
    showToast('Example Loaded', 'Example URL loaded successfully', 'info');
  };

  // Selection helper functions
  const toggleContactSelection = (uuid: string | undefined) => {
    if (!uuid) return;
    setSelectedContactUuids(prev => {
      const newSet = new Set(prev);
      if (newSet.has(uuid)) {
        newSet.delete(uuid);
      } else {
        newSet.add(uuid);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (!searchResult) return;
    const allUuids = searchResult.results.filter(c => c.uuid).map(c => c.uuid!);
    if (allUuids.length === 0) return;
    
    const allSelected = allUuids.every(uuid => selectedContactUuids.has(uuid));
    if (allSelected) {
      setSelectedContactUuids(new Set());
    } else {
      setSelectedContactUuids(new Set(allUuids));
    }
  };

  const clearSelection = () => {
    setSelectedContactUuids(new Set());
  };

  const isSelectAllChecked = searchResult ? searchResult.results.filter(c => c.uuid).every(c => selectedContactUuids.has(c.uuid!)) : false;
  const isSelectAllIndeterminate = searchResult ? searchResult.results.filter(c => c.uuid).some(c => selectedContactUuids.has(c.uuid!)) && !isSelectAllChecked : false;

  // Clear all results
  const clearAllResults = () => {
    setUrl('');
    setAnalyzeResult(null);
    setAnalyzeError(null);
    setSearchResult(null);
    setSearchError(null);
    setIncludeCompanyName('');
    setExcludeCompanyName('');
    setIncludeDomainList('');
    setExcludeDomainList('');
    setContactCount(null);
    setSelectedContactUuids(new Set());
    setCurrentOffset(0);
    setOffsetHistory([]);
    setCurrentPage(1);
    showToast('Cleared', 'All results have been cleared', 'info');
  };

  // Export results as JSON
  const exportResults = () => {
    const data = {
      analyzer: analyzeResult,
      search: searchResult,
      stats: sessionStats,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apollo-websocket-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Exported!', 'Results exported successfully', 'success');
  };

  // Render table cell content
  const renderCellContent = (column: ColumnConfig, contact: Contact) => {
    const value = contact[column.field];
    
    switch (column.id) {
      case 'name':
        return (
          <div className="contacts-table-name-cell">
            <div className="contacts-table-name-avatar">
              <UsersIcon />
            </div>
            <div className="contacts-table-name-content">
              <p className="contacts-table-name-text">
                {contact.name || '-'}
              </p>
              {contact.email && (
                <p className="contacts-table-name-email">
                  {contact.email}
                </p>
              )}
            </div>
          </div>
        );
      
      case 'company':
        return (
          <div className="contacts-table-company-cell">
            <BuildingIcon className="contacts-table-company-icon" />
            {contact.company || '-'}
          </div>
        );
      
      case 'status':
        return <StatusBadge status={contact.status} />;
      
      case 'emailStatus':
        return <EmailStatusBadge status={contact.emailStatus} />;
      
      case 'city':
        return (
          <div className="contacts-table-location-cell">
            <MapPinIcon className="contacts-table-location-icon" />
            {contact.city && contact.state ? `${contact.city}, ${contact.state}` : (contact.city || contact.state || contact.country || '-')}
          </div>
        );
      
      case 'createdAt':
        return (
          <div className="contacts-table-date-cell">
            <CalendarIcon className="contacts-table-date-icon" />
            {value ? new Date(value as string).toLocaleDateString() : '-'}
          </div>
        );
      
      case 'phone':
        return value ? (
          <div className="contacts-table-phone-cell">
            <PhoneIcon className="contacts-table-phone-icon" />
            {value as string}
          </div>
        ) : '-';
      
      default:
        return value ? String(value) : '-';
    }
  };

  return (
    <div className="apollo-page">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} position="top-right" />

      {/* Main Content */}
      <Card>
        <CardContent className="apollo-tab-content">
          {/* Connection Status Indicator */}
          <div className="apollo-ws-status-container">
            <ConnectionStatusBadge 
              connectionState={connectionState}
              onReconnect={() => {
                wsConnect().catch((error) => {
                  showToast('Reconnect Failed', error?.message || 'Failed to reconnect', 'error');
                });
              }}
            />
          </div>

          {/* Input Section */}
          <div className="apollo-input-section">
            <div>
              <label className="apollo-input-label">
                Apollo.io URL
              </label>
              <div className="apollo-input-wrapper">
                <Input
                  type="text"
                  placeholder="https://app.apollo.io/#/people?personTitles[]=CEO&personLocations[]=California"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAnalyzeAndSearch()}
                  className="apollo-input-full-width"
                />
                {url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUrl('');
                      setAnalyzeResult(null);
                      setAnalyzeError(null);
                      setSearchResult(null);
                      setSearchError(null);
                    }}
                  >
                    <XMarkIcon />
                  </Button>
                )}
              </div>
            </div>

            {/* Advanced Options */}
            <div className="apollo-advanced-options">
              <div>
                <label htmlFor="apollo-include-company-name" className="apollo-input-label">
                  Include Company Name
                </label>
                <Textarea
                  id="apollo-include-company-name"
                  placeholder="e.g., Tech, Software (comma or newline separated)"
                  value={includeCompanyName}
                  onChange={(e) => setIncludeCompanyName(e.target.value)}
                  rows={3}
                  aria-label="Include company name filter (comma or newline separated)"
                />
              </div>
              <div>
                <label htmlFor="apollo-exclude-company-name" className="apollo-input-label">
                  Exclude Company Names
                </label>
                <Textarea
                  id="apollo-exclude-company-name"
                  placeholder="e.g., Competitor Inc, Spam Corp (comma or newline separated)"
                  value={excludeCompanyName}
                  onChange={(e) => setExcludeCompanyName(e.target.value)}
                  rows={3}
                  aria-label="Exclude company name filter (comma or newline separated)"
                />
              </div>
              
              {/* Domain Filtering */}
              <div>
                <label htmlFor="apollo-include-domain-list" className="apollo-input-label">
                  Include Domains
                </label>
                <Textarea
                  id="apollo-include-domain-list"
                  placeholder="e.g., example.com, test.com (comma or newline separated)"
                  value={includeDomainList}
                  onChange={(e) => setIncludeDomainList(e.target.value)}
                  rows={3}
                  aria-label="Include domain filter (comma or newline separated)"
                />
              </div>
              <div>
                <label htmlFor="apollo-exclude-domain-list" className="apollo-input-label">
                  Exclude Domains
                </label>
                <Textarea
                  id="apollo-exclude-domain-list"
                  placeholder="e.g., spam.com, competitor.com (comma or newline separated)"
                  value={excludeDomainList}
                  onChange={(e) => setExcludeDomainList(e.target.value)}
                  rows={3}
                  aria-label="Exclude domain filter (comma or newline separated)"
                />
              </div>
            </div>

            <Button
              onClick={handleCountAnalyzeAndSearch}
              disabled={(loading || isCounting || !isConnected) || !url.trim()}
              className="apollo-unified-button"
            >
              {(loading || isCounting) ? (
                <>
                  <div className="apollo-spinner" />
                  {isCounting ? 'Counting...' : loading ? 'Analyzing & Searching...' : 'Processing...'}
                </>
              ) : (
                <>
                  <SearchIcon />
                  Count, Analyze & Search
                </>
              )}
            </Button>
          </div>

          {/* Loading State */}
          {(loading || isCounting) && (
            <>
              {isCounting && (
                <div className="apollo-count-banner apollo-count-banner--loading">
                  <div className="apollo-count-banner__content">
                    <div className="apollo-spinner" />
                    <span>Counting contacts...</span>
                  </div>
                </div>
              )}
              {loading && (
                <div className="apollo-results-split">
                  <div className="apollo-results-left">
                    <ApolloAnalyzerSkeleton />
                  </div>
                  <div className="apollo-results-right">
                    <ApolloContactsSkeleton />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Results Section - Split Layout */}
          {!loading && !isCounting && (
            <>
              {/* Split Container for Analysis (Left) and Search (Right) */}
              {(analyzeResult || searchResult || analyzeError || searchError) && (
                <div className="apollo-results-split">
                  {/* Left Side - Analysis Results */}
                  <div className="apollo-results-left">
                    {/* Analyzer Error Display */}
                    {analyzeError && (
                      <ApolloEmptyState
                        variant="error"
                        description={analyzeError}
                        action={{
                          label: 'Try Again',
                          onClick: handleCountAnalyzeAndSearch,
                        }}
                      />
                    )}

                    {/* Analyzer Results Display */}
                    {analyzeResult && (
                <div className="apollo-results">
                  {/* Contact Count Display */}
                  {contactCount !== null && (
                    <div className="apollo-count-display">
                      <div className="apollo-count-display__content">
                        <UsersIcon className="apollo-count-display__icon" />
                        <div className="apollo-count-display__text">
                          <strong className="apollo-count-display__value">
                            {contactCount.toLocaleString()}
                          </strong>
                          <span className="apollo-count-display__label">
                            contact{contactCount !== 1 ? 's' : ''} found
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Parameter Categories */}
                  <div className="apollo-section">
                    <h3 className="apollo-section-subtitle">Parameter Categories</h3>
                    <div className="apollo-categories-list">
                      {analyzeResult.categories.map((category, catIdx) => (
                        <div
                          key={`category-${category.name || catIdx}`}
                          className="apollo-category-card"
                        >
                          <button
                            onClick={() => toggleCategory(category.name)}
                            className="apollo-category-header"
                          >
                            <div className="apollo-category-header-content">
                              {expandedCategories.has(category.name) ? (
                                <ChevronDownIcon className="apollo-category-icon" />
                              ) : (
                                <ChevronRightIcon className="apollo-category-icon" />
                              )}
                              <span className="apollo-category-name">{category.name}</span>
                              <span className="apollo-category-count">
                                ({category.total_parameters} parameter{category.total_parameters !== 1 ? 's' : ''})
                              </span>
                            </div>
                          </button>

                          {expandedCategories.has(category.name) && (
                            <div className="apollo-category-content">
                              {category.parameters.map((param, idx) => (
                                <div key={`${category.name}-param-${param.name || idx}`} className="apollo-parameter-item">
                                  <div className="apollo-parameter-name">{param.name}</div>
                                  <div className="apollo-parameter-description">
                                    {param.description}
                                  </div>
                                  <div className="apollo-parameter-values">
                                    {param.values.map((value, vIdx) => (
                                      <span
                                        key={`${category.name}-param-${param.name || idx}-value-${value || vIdx}`}
                                        className="apollo-parameter-value"
                                      >
                                        {value}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Parameter Mapping Summary */}
                  {searchResult && (
                    <div className="apollo-section">
                      <div className="apollo-mapping-summary">
                        <h4 className="apollo-mapping-summary-title">Parameter Mapping Summary</h4>
                        <div className="apollo-mapping-stats">
                          <div className="apollo-mapping-stat">
                            <div className="apollo-mapping-stat-value apollo-mapping-stat-value--primary">
                              {searchResult.mapping_summary.total_apollo_parameters}
                            </div>
                            <div className="apollo-mapping-stat-label">Total Parameters</div>
                          </div>
                          <div className="apollo-mapping-stat">
                            <div className="apollo-mapping-stat-value apollo-mapping-stat-value--success">
                              {searchResult.mapping_summary.mapped_parameters}
                            </div>
                            <div className="apollo-mapping-stat-label">Mapped</div>
                          </div>
                          <div className="apollo-mapping-stat">
                            <div className="apollo-mapping-stat-value apollo-mapping-stat-value--warning">
                              {searchResult.mapping_summary.unmapped_parameters}
                            </div>
                            <div className="apollo-mapping-stat-label">Unmapped</div>
                          </div>
                        </div>
                        {searchResult.mapping_summary.mapped_parameter_names.length > 0 && (
                          <div className="apollo-mapping-tags">
                            <div className="apollo-mapping-tags-label">
                              Mapped Parameters:
                            </div>
                            <div className="apollo-mapping-tags-list">
                              {searchResult.mapping_summary.mapped_parameter_names.map((name, idx) => (
                                <span
                                  key={`mapped-param-${name || idx}`}
                                  className="apollo-mapping-tag"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                    )}
                  </div>

                  {/* Right Side - Search Results */}
                  <div className="apollo-results-right">
                    {/* Search Error Display */}
                    {searchError && (
                      <ApolloEmptyState
                        variant="error"
                        description={searchError}
                        action={{
                          label: 'Try Again',
                          onClick: handleCountAnalyzeAndSearch,
                        }}
                      />
                    )}

                    {/* Search Results Display */}
                    {searchResult && (
                      <div className="apollo-results">
                        {/* Unmapped Parameters */}
                  {searchResult.unmapped_categories.length > 0 && (
                    <div className="apollo-section">
                      <h4 className="apollo-section-subtitle">Unmapped Parameters</h4>
                      <div className="apollo-unmapped-list">
                        {searchResult.unmapped_categories.map((category, catIdx) => (
                          <div
                            key={`unmapped-category-${category.name || catIdx}`}
                            className="apollo-unmapped-card"
                          >
                            <button
                              onClick={() => toggleUnmappedCategory(category.name)}
                              className="apollo-unmapped-header"
                            >
                              <div className="apollo-unmapped-header-content">
                                {expandedUnmappedCategories.has(category.name) ? (
                                  <ChevronDownIcon className="apollo-unmapped-icon" />
                                ) : (
                                  <ChevronRightIcon className="apollo-unmapped-icon" />
                                )}
                                <span className="apollo-unmapped-name">{category.name}</span>
                                <span className="apollo-unmapped-count">
                                  ({category.total_parameters} parameter{category.total_parameters !== 1 ? 's' : ''})
                                </span>
                              </div>
                            </button>

                            {expandedUnmappedCategories.has(category.name) && (
                              <div className="apollo-unmapped-content">
                                {category.parameters.map((param, idx) => (
                                  <div key={`${category.name}-param-${param.name || idx}`} className="apollo-unmapped-parameter">
                                    <div className="apollo-unmapped-parameter-name">
                                      {param.name}
                                    </div>
                                    <div className="apollo-unmapped-parameter-reason">
                                      Reason: {param.reason}
                                    </div>
                                    <div className="apollo-unmapped-parameter-values">
                                      {param.values.map((value, vIdx) => (
                                        <span
                                          key={`${category.name}-param-${param.name || idx}-value-${value || vIdx}`}
                                          className="apollo-unmapped-parameter-value"
                                        >
                                          {value}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact Results */}
                  <div className="apollo-section">
                    <div className="apollo-results-header">
                      <div className="apollo-results-header__content">
                        {selectedContactUuids.size > 0 && (
                          <div className="apollo-results-header__selection">
                            <strong>{selectedContactUuids.size}</strong>
                            <span>contact{selectedContactUuids.size !== 1 ? 's' : ''} selected</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearSelection}
                            >
                              Clear
                            </Button>
                          </div>
                        )}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setIsExportModalOpen(true)}
                          leftIcon={<DownloadIcon />}
                          disabled={searchResult.results.length === 0}
                        >
                          {selectedContactUuids.size > 0 
                            ? `Export (${selectedContactUuids.size})` 
                            : 'Add Export'}
                        </Button>
                      </div>
                    </div>

                    {searchResult.results.length === 0 ? (
                      <ApolloEmptyState
                        variant="no-contacts"
                        action={{
                          label: 'View Unmapped Parameters',
                          onClick: () => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          },
                        }}
                      />
                    ) : (
                      <Table responsive>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="apollo-table-head--narrow">
                              <div className="checkbox-input-wrapper">
                                <input
                                  type="checkbox"
                                  checked={isSelectAllChecked}
                                  ref={(input) => {
                                    if (input) input.indeterminate = isSelectAllIndeterminate;
                                  }}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleSelectAll();
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label="Select all contacts"
                                  className="checkbox-input"
                                />
                                <div 
                                  className="checkbox-box"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelectAll();
                                  }}
                                >
                                  {isSelectAllChecked && (
                                    <CheckIcon className="checkbox-icon" />
                                  )}
                                  {isSelectAllIndeterminate && !isSelectAllChecked && (
                                    <div className="checkbox-indeterminate-indicator" />
                                  )}
                                </div>
                              </div>
                            </TableHead>
                            {defaultColumns.map(column => (
                              <TableHead
                                key={column.id}
                                style={column.width ? { minWidth: column.width } : undefined}
                              >
                                {column.label}
                              </TableHead>
                            ))}
                            <TableHead className="table-head-actions">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {searchResult.results.map((contact, index) => {
                            const isSelected = contact.uuid ? selectedContactUuids.has(contact.uuid) : false;
                            return (
                              <TableRow 
                                key={contact.uuid || `contact-${index}`}
                                onClick={(e) => {
                                  if ((e.target as HTMLElement).closest('.checkbox-input-wrapper, .checkbox-input, .checkbox-box')) {
                                    return;
                                  }
                                  if (contact.uuid) {
                                    window.open(`/contacts/${contact.uuid}`, '_blank', 'noopener,noreferrer');
                                  }
                                }}
                                className={`contacts-table-row-interactive ${isSelected ? 'contacts-table-row-selected' : ''}`}
                                title="Click to view contact details in new tab"
                              >
                                <TableCell 
                                  className="apollo-table-cell--compact"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="checkbox-input-wrapper">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        toggleContactSelection(contact.uuid);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      aria-label={`Select ${contact.name || 'contact'}`}
                                      className="checkbox-input"
                                    />
                                    <div 
                                      className="checkbox-box"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleContactSelection(contact.uuid);
                                      }}
                                    >
                                      {isSelected && (
                                        <CheckIcon className="checkbox-icon" />
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                {defaultColumns.map(column => (
                                  <TableCell
                                    key={column.id}
                                    className={column.id !== 'name' ? 'contacts-table-cell-nowrap' : ''}
                                    style={column.width ? { minWidth: column.width } : undefined}
                                  >
                                    {renderCellContent(column, contact)}
                                  </TableCell>
                                ))}
                                <TableCell className="table-cell-actions">
                                  <Tooltip content="Edit contact">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      iconOnly
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        alert('Edit functionality is not supported by the current API.');
                                      }}
                                      aria-label="Edit contact"
                                      className="icon-hover-scale"
                                    >
                                      <EditIcon />
                                    </Button>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                  {/* Pagination Info */}
                  {(searchResult.next || searchResult.previous || offsetHistory.length > 0 || currentOffset > 0) && (
                    <div className="apollo-pagination">
                      <div className="apollo-pagination-info">
                        Showing <strong>{searchResult.results.length}</strong> contact(s)
                        {searchResult.next && (
                          <span className="apollo-pagination-more">
                            {' '}(More available)
                          </span>
                        )}
                        {!searchResult.next && !searchResult.previous && offsetHistory.length === 0 && currentOffset === 0 && (
                          <span className="apollo-pagination-more">
                            {' '}(All results shown)
                          </span>
                        )}
                      </div>
                      <div className="apollo-pagination-actions">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handlePreviousPage}
                          disabled={(currentOffset === 0 && offsetHistory.length === 0) || loading}
                        >
                          <ChevronLeftIcon />
                          Previous
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleNextPage}
                          disabled={!searchResult.next || loading}
                        >
                          {loading ? (
                            <>
                              <div className="apollo-spinner" />
                              Loading...
                            </>
                          ) : (
                            <>
                              Next
                              <ChevronRightPaginationIcon />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State - Show when no results at all */}
          {!loading && !isCounting && !analyzeResult && !analyzeError && !searchResult && !searchError && (
            <ApolloEmptyState variant="no-analysis" />
          )}
        </>
      )}
        </CardContent>
      </Card>
      
      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        selectedContactUuids={Array.from(selectedContactUuids)}
        exportType="contacts"
        currentPageData={searchResult?.results || []}
        filters={{}}
        totalCount={contactCount || searchResult?.results.length || 0}
        navigateToHistory={true}
        onExportComplete={() => {
          clearSelection();
        }}
        apolloUrl={url || undefined}
        apolloParams={{
          include_company_name: (() => {
            const parsed = parseMultiValueInput(includeCompanyName);
            return parsed.length > 0 ? parsed.join(', ') : undefined;
          })(),
          exclude_company_name: (() => {
            const parsed = parseMultiValueInput(excludeCompanyName);
            return parsed.length > 0 ? parsed : undefined;
          })(),
          include_domain_list: (() => {
            const parsed = parseMultiValueInput(includeDomainList);
            return parsed.length > 0 ? parsed : undefined;
          })(),
          exclude_domain_list: (() => {
            const parsed = parseMultiValueInput(excludeDomainList);
            return parsed.length > 0 ? parsed : undefined;
          })(),
        }}
      />
    </div>
  );
}

