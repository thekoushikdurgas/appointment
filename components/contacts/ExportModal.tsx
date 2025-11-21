'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { 
  DownloadIcon, 
  LoadingSpinner, 
  SuccessIcon, 
  AlertTriangleIcon,
  XMarkIcon,
  HistoryIcon
} from '@components/icons';
import { useRouter } from 'next/navigation';
import { 
  createContactExport, 
  createCompanyExport,
  createChunkedContactExport,
  createChunkedCompanyExport,
  downloadExport,
  pollExportStatus,
  type ExportStatusResponse,
  CreateContactExportResponse,
  CreateCompanyExportResponse,
  type ChunkedExportProgressCallback
} from '@services/export';
import { 
  getContactUuids, 
  fetchContactUuidsPaginated,
  type UuidFetchProgressCallback as ContactUuidFetchProgressCallback
} from '@services/contact';
import { 
  getCompanyUuids, 
  fetchCompanyUuidsPaginated,
  type UuidFetchProgressCallback as CompanyUuidFetchProgressCallback
} from '@services/company';
import { 
  getContactUuidsFromApolloUrl, 
  getContactUuidsFromApolloUrlPaginated,
  type ApolloUuidFetchProgressCallback,
  ApolloContactsUuidsParams 
} from '@services/apollo';
import { Toast, ToastContainer, ToastProps } from '@components/ui/Toast';

export type ExportType = 'contacts' | 'companies';
export type ExportMode = 'selected' | 'current_page' | 'specified_rows' | 'all';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContactUuids: string[]; // Used for both contacts and companies (legacy prop name)
  exportType?: ExportType;
  currentPageData?: any[]; // Current page items (contacts or companies)
  filters?: any; // Current filters
  totalCount?: number; // Total count of items
  onExportComplete?: () => void;
  navigateToHistory?: boolean; // Whether to navigate to history page after export
  // Apollo-specific props
  apolloUrl?: string; // Apollo.io URL for Apollo-based exports
  apolloParams?: ApolloContactsUuidsParams; // Apollo URL parameters (include/exclude company names)
}

type ExportStatus = 'idle' | 'creating' | 'processing' | 'completed' | 'failed';

type ExportResponse = CreateContactExportResponse | CreateCompanyExportResponse;

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  selectedContactUuids,
  exportType = 'contacts',
  currentPageData = [],
  filters = {},
  totalCount = 0,
  onExportComplete,
  navigateToHistory = false,
  apolloUrl,
  apolloParams,
}) => {
  const router = useRouter();
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [exportMode, setExportMode] = useState<ExportMode>('selected');
  const [specifiedRows, setSpecifiedRows] = useState<string>('');
  const [currentExport, setCurrentExport] = useState<ExportResponse | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [uuidsToExport, setUuidsToExport] = useState<string[]>([]);
  const [uuidFetchProgress, setUuidFetchProgress] = useState<{
    fetched: number;
    total: number;
    percentage: number;
  } | null>(null);
  const [isFetchingUuids, setIsFetchingUuids] = useState(false);
  const [uuidFetchAbortController, setUuidFetchAbortController] = useState<AbortController | null>(null);
  const [chunkedExportProgress, setChunkedExportProgress] = useState<{
    completed: number;
    total: number;
    percentage: number;
    currentChunk: number;
  } | null>(null);
  const [exportProcessingProgress, setExportProcessingProgress] = useState<{
    percentage: number;
    status: string;
  } | null>(null);

  // Reset state when modal opens/closes, but only if export is not in progress
  useEffect(() => {
    if (!isOpen) {
      // Cancel any ongoing UUID fetching
      if (uuidFetchAbortController) {
        uuidFetchAbortController.abort();
        setUuidFetchAbortController(null);
      }
      
      // Only reset if export is not in progress (idle or failed states)
      // Don't reset if export is creating, processing, or completed (background export continues)
      if (exportStatus === 'idle' || exportStatus === 'failed') {
        setExportStatus('idle');
        setCurrentExport(null);
        setExportError(null);
        setExportMode('selected');
        setSpecifiedRows('');
        setUuidsToExport([]);
        setIsFetchingUuids(false);
        setUuidFetchProgress(null);
      }
    }
  }, [isOpen, exportStatus]);
  
  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (uuidFetchAbortController) {
        uuidFetchAbortController.abort();
      }
    };
  }, [uuidFetchAbortController]);

  const showToast = (title: string, description?: string, variant: ToastProps['variant'] = 'default') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastProps = {
      id,
      title,
      description,
      variant,
      duration: variant === 'error' ? 7000 : variant === 'info' ? 6000 : 5000,
      onClose: (toastId) => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      },
    };
    setToasts(prev => [...prev, newToast]);
  };

  const getUuidsForMode = async (mode: ExportMode): Promise<string[]> => {
    switch (mode) {
      case 'selected':
        return selectedContactUuids;
      
      case 'current_page':
        // Extract UUIDs from current page data
        return currentPageData
          .map(item => item.uuid)
          .filter((uuid): uuid is string => Boolean(uuid));
      
      case 'specified_rows': {
        const limit = parseInt(specifiedRows, 10);
        if (isNaN(limit) || limit <= 0) {
          throw new Error('Please enter a valid number of rows');
        }
        
        // Use paginated fetching for better performance
        setIsFetchingUuids(true);
        setUuidFetchProgress({ fetched: 0, total: limit, percentage: 0 });
        
        const abortController = new AbortController();
        setUuidFetchAbortController(abortController);
        
        try {
          const progressCallback: ContactUuidFetchProgressCallback | CompanyUuidFetchProgressCallback | ApolloUuidFetchProgressCallback = (progress) => {
            setUuidFetchProgress(progress);
          };
          
          // Use Apollo URL if provided, otherwise use regular filters
          if (apolloUrl && exportType === 'contacts') {
            const result = await getContactUuidsFromApolloUrlPaginated(apolloUrl, {
              ...apolloParams,
              maxUuids: limit,
              onProgress: progressCallback,
              signal: abortController.signal,
            });
            
            if (result.success && result.data) {
              return result.data.uuids;
            } else {
              throw new Error(result.message || 'Failed to fetch contact UUIDs from Apollo URL');
            }
          } else {
            const result = exportType === 'contacts' 
              ? await fetchContactUuidsPaginated(filters, {
                  maxUuids: limit,
                  onProgress: progressCallback,
                  signal: abortController.signal,
                })
              : await fetchCompanyUuidsPaginated(filters, {
                  maxUuids: limit,
                  onProgress: progressCallback,
                  signal: abortController.signal,
                });
            
            return result.uuids;
          }
        } finally {
          setIsFetchingUuids(false);
          setUuidFetchAbortController(null);
          setUuidFetchProgress(null);
        }
      }
      
      case 'all': {
        // Use paginated fetching for better performance
        setIsFetchingUuids(true);
        setUuidFetchProgress({ fetched: 0, total: totalCount || 0, percentage: 0 });
        
        const abortController = new AbortController();
        setUuidFetchAbortController(abortController);
        
        try {
          const progressCallback: ContactUuidFetchProgressCallback | CompanyUuidFetchProgressCallback | ApolloUuidFetchProgressCallback = (progress) => {
            setUuidFetchProgress(progress);
          };
          
          // Use Apollo URL if provided, otherwise use regular filters
          if (apolloUrl && exportType === 'contacts') {
            const result = await getContactUuidsFromApolloUrlPaginated(apolloUrl, {
              ...apolloParams,
              onProgress: progressCallback,
              signal: abortController.signal,
            });
            
            if (result.success && result.data) {
              return result.data.uuids;
            } else {
              throw new Error(result.message || 'Failed to fetch contact UUIDs from Apollo URL');
            }
          } else {
            const result = exportType === 'contacts'
              ? await fetchContactUuidsPaginated(filters, {
                  onProgress: progressCallback,
                  signal: abortController.signal,
                })
              : await fetchCompanyUuidsPaginated(filters, {
                  onProgress: progressCallback,
                  signal: abortController.signal,
                });
            
            return result.uuids;
          }
        } finally {
          setIsFetchingUuids(false);
          setUuidFetchAbortController(null);
          setUuidFetchProgress(null);
        }
      }
      
      default:
        return [];
    }
  };

  const handleCreateExport = async () => {
    const entityName = getEntityName();
    const entityNamePlural = getEntityNamePlural();
    
    // Performance tracking
    const performanceMetrics = {
      uuidFetchStart: 0,
      uuidFetchEnd: 0,
      uuidFetchDuration: 0,
      exportCreationStart: 0,
      exportCreationEnd: 0,
      exportCreationDuration: 0,
      totalDuration: 0,
      recordCount: 0,
    };
    
    const totalStartTime = Date.now();
    
    // Close modal immediately after starting export
    onClose();
    
    try {
      // Check if we need to fetch UUIDs (for specified_rows or all modes)
      const needsFetching = exportMode === 'specified_rows' || exportMode === 'all';
      
      // Show toast notification when fetching starts
      if (needsFetching) {
        showToast(
          `Fetching ${entityNamePlural}...`,
          `Please wait while we gather the ${entityNamePlural} to export.`,
          'info'
        );
      }
      
      // Get UUIDs based on selected mode (this will fetch in background for specified_rows/all)
      performanceMetrics.uuidFetchStart = Date.now();
      const uuids = await getUuidsForMode(exportMode);
      performanceMetrics.uuidFetchEnd = Date.now();
      performanceMetrics.uuidFetchDuration = performanceMetrics.uuidFetchEnd - performanceMetrics.uuidFetchStart;
      
      if (uuids.length === 0) {
        showToast(
          `No ${entityNamePlural} to export`, 
          `No ${entityNamePlural} match the selected export criteria`, 
          'error'
        );
        return;
      }

      // Show toast when fetching completes
      if (needsFetching) {
        showToast(
          `Found ${uuids.length.toLocaleString()} ${entityNamePlural} to export`,
          `Proceeding with export creation...`,
          'success'
        );
      }

      setUuidsToExport(uuids);
      setExportStatus('creating');
      setExportError(null);
      performanceMetrics.recordCount = uuids.length;

      // Show toast for export creation
      showToast(
        'Creating export...',
        'Please wait while we prepare your export.',
        'info'
      );

      // Use chunked export for large exports (>5000 UUIDs)
      const CHUNK_THRESHOLD = 5000;
      const useChunked = uuids.length > CHUNK_THRESHOLD;
      
      performanceMetrics.exportCreationStart = Date.now();

      if (useChunked) {
        // Use chunked export
        const chunkedProgressCallback: ChunkedExportProgressCallback = (progress) => {
          setChunkedExportProgress(progress);
        };

        const result = exportType === 'contacts'
          ? await createChunkedContactExport(uuids, {
              onProgress: chunkedProgressCallback,
            })
          : await createChunkedCompanyExport(uuids, {
              onProgress: chunkedProgressCallback,
            });

        performanceMetrics.exportCreationEnd = Date.now();
        performanceMetrics.exportCreationDuration = performanceMetrics.exportCreationEnd - performanceMetrics.exportCreationStart;
        
        if (result.success && result.data) {
          // Backend chunked export returns a single export_id (main export ID)
          // and chunk_ids array for tracking individual chunks
          if (result.data.export_id) {
            // Create a mock export object for the main export
            const mainExport: CreateContactExportResponse | CreateCompanyExportResponse = {
              export_id: result.data.export_id,
              download_url: '',
              expires_at: '',
              contact_count: exportType === 'contacts' ? result.data.totalCount : 0,
              company_count: exportType === 'companies' ? result.data.totalCount : 0,
              status: result.data.status || 'pending',
            } as any;
            
            setCurrentExport(mainExport);
            
            // Check if export is already completed
            if (result.data.status === 'completed') {
              setExportStatus('completed');
              showToast(
                'Export Ready',
                navigateToHistory
                  ? 'Your export is ready. You can download it from the History page.'
                  : 'Your export is ready for download',
                'success'
              );
            } else {
              // Start polling for status using the main export ID
              setExportStatus('processing');
              showToast(
                'Processing export...',
                'This may take a few moments.',
                'info'
              );
              pollExportStatusLocal(result.data.export_id);
            }
          } else if (result.data.exportIds && result.data.exportIds.length > 0) {
            // Fallback for legacy frontend chunking (shouldn't happen with new backend)
            setExportStatus('completed');
            showToast(
              'Export Created',
              `Successfully created ${result.data.successfulChunks || 0} export chunk(s) with ${result.data.totalCount.toLocaleString()} ${entityNamePlural}. ${result.data.failedChunks && result.data.failedChunks > 0 ? `${result.data.failedChunks} chunk(s) failed. ` : ''}Check the History page to download.`,
              result.data.failedChunks && result.data.failedChunks > 0 ? 'info' : 'success'
            );
          } else {
            setExportStatus('failed');
            setExportError('Failed to create export');
            showToast('Export Failed', 'Failed to create export', 'error');
          }
          setChunkedExportProgress(null);
        } else {
          setExportStatus('failed');
          setExportError(result.message || 'Failed to create chunked export');
          showToast('Export Failed', result.message || 'Failed to create chunked export', 'error');
          setChunkedExportProgress(null);
        }
      } else {
        // Use regular export for smaller exports
        const result = exportType === 'contacts'
          ? await createContactExport(uuids)
          : await createCompanyExport(uuids);

        performanceMetrics.exportCreationEnd = Date.now();
        performanceMetrics.exportCreationDuration = performanceMetrics.exportCreationEnd - performanceMetrics.exportCreationStart;
        
        if (result.success && result.data) {
          setCurrentExport(result.data);
          
          // Check if export is already completed
          if (result.data.status === 'completed') {
            setExportStatus('completed');
            showToast(
              'Export Ready', 
              navigateToHistory 
                ? 'Your export is ready. You can download it from the History page.' 
                : 'Your export is ready for download', 
              'success'
            );
          } else {
            // Start polling for status
            setExportStatus('processing');
            showToast(
              'Processing export...',
              'This may take a few moments.',
              'info'
            );
            pollExportStatusLocal(result.data.export_id);
          }
        } else {
          setExportStatus('failed');
          setExportError(result.message || 'Failed to create export');
          showToast('Export Failed', result.message || 'Failed to create export', 'error');
        }
      }
      
      // Log performance metrics
      performanceMetrics.totalDuration = Date.now() - totalStartTime;
      console.log('[EXPORT] Performance Metrics:', {
        recordCount: performanceMetrics.recordCount,
        uuidFetchDuration: `${(performanceMetrics.uuidFetchDuration / 1000).toFixed(2)}s`,
        exportCreationDuration: `${(performanceMetrics.exportCreationDuration / 1000).toFixed(2)}s`,
        totalDuration: `${(performanceMetrics.totalDuration / 1000).toFixed(2)}s`,
        exportMode,
        exportType,
      });
      
      // Warn if export is slow
      if (performanceMetrics.totalDuration > 3600000) {
        console.warn('[EXPORT] Slow export detected:', {
          duration: `${(performanceMetrics.totalDuration / 1000).toFixed(2)}s`,
          recordCount: performanceMetrics.recordCount,
        });
      }
    } catch (error: any) {
      console.error('Export creation error:', error);
      setExportStatus('failed');
      setExportError(error.message || 'An unexpected error occurred while creating the export');
      showToast('Export Failed', error.message || 'An unexpected error occurred', 'error');
      
      // Log error metrics
      performanceMetrics.totalDuration = Date.now() - totalStartTime;
      console.error('[EXPORT] Export failed - Performance Metrics:', {
        recordCount: performanceMetrics.recordCount,
        uuidFetchDuration: `${(performanceMetrics.uuidFetchDuration / 1000).toFixed(2)}s`,
        exportCreationDuration: `${(performanceMetrics.exportCreationDuration / 1000).toFixed(2)}s`,
        totalDuration: `${(performanceMetrics.totalDuration / 1000).toFixed(2)}s`,
        error: error.message,
      });
    }
  };

  const pollExportStatusLocal = async (exportId: string) => {
    try {
      const result = await pollExportStatus(exportId, {
        interval: 2000, // Poll every 2 seconds
        maxAttempts: 150, // Max 5 minutes
        onProgress: (status: ExportStatusResponse) => {
          // Update progress state
          setExportProcessingProgress({
            percentage: status.progress_percentage || 0,
            status: status.status,
          });
          
          // Update current export if download URL becomes available
          if (status.download_url && currentExport) {
            setCurrentExport({
              ...currentExport,
              download_url: status.download_url,
              status: status.status as any,
            });
          }
        },
      });

      if (result.success && result.data) {
        const status = result.data;
        
        if (status.status === 'completed') {
          setExportStatus('completed');
          setExportProcessingProgress(null);
          
          // Update current export with latest download URL
          if (currentExport && status.download_url) {
            setCurrentExport({
              ...currentExport,
              download_url: status.download_url,
              status: 'completed',
            });
          }
          
          showToast(
            'Export Ready',
            navigateToHistory 
              ? 'Your export is ready. You can download it from the History page.' 
              : 'Your export is ready for download',
            'success'
          );
        } else if (status.status === 'failed') {
          setExportStatus('failed');
          setExportProcessingProgress(null);
          setExportError(status.error_message || 'Export processing failed');
          showToast(
            'Export Failed',
            status.error_message || 'Export processing failed',
            'error'
          );
        }
      } else {
        // Polling failed or timed out
        setExportStatus('failed');
        setExportProcessingProgress(null);
        setExportError(result.message || 'Failed to check export status');
        showToast(
          'Export Status Check Failed',
          result.message || 'Failed to check export status. Please check the History page.',
          'error'
        );
      }
    } catch (error: any) {
      console.error('Poll export status error:', error);
      setExportStatus('failed');
      setExportProcessingProgress(null);
      setExportError(error.message || 'Failed to poll export status');
      showToast(
        'Export Status Check Failed',
        error.message || 'Failed to check export status',
        'error'
      );
    }
  };

  const handleDownload = async () => {
    if (!currentExport) return;

    setExportError(null);

    try {
      // Parse the download URL to extract export_id and token
      const downloadUrl = new URL(currentExport.download_url);
      // Extract export_id from pathname: /api/v2/exports/{export_id}/download
      const pathParts = downloadUrl.pathname.split('/').filter(part => part);
      const downloadIndex = pathParts.indexOf('download');
      const exportId = downloadIndex > 0 ? pathParts[downloadIndex - 1] : '';
      const token = downloadUrl.searchParams.get('token') || '';

      if (!exportId || !token) {
        throw new Error('Invalid download URL');
      }

      const result = await downloadExport(exportId, token);

      if (result.success && result.data) {
        // Create download link
        const blobUrl = URL.createObjectURL(result.data);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `export_${exportId}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);

        showToast('Download Complete', 'Export downloaded successfully', 'success');
        
        if (onExportComplete) {
          onExportComplete();
        }
        
        // Close modal after a short delay, or navigate to history if enabled
        setTimeout(() => {
          if (navigateToHistory) {
            router.push('/history');
          } else {
            onClose();
          }
        }, 1000);
      } else {
        setExportError(result.message || 'Failed to download export');
        showToast('Download Failed', result.message || 'Failed to download export', 'error');
      }
    } catch (error) {
      console.error('Download error:', error);
      setExportError('An unexpected error occurred while downloading the export');
      showToast('Download Failed', 'An unexpected error occurred', 'error');
    }
  };

  const formatExpirationDate = (expiresAt: string) => {
    try {
      const date = new Date(expiresAt);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return expiresAt;
    }
  };

  const getEntityName = () => exportType === 'contacts' ? 'contact' : 'company';
  const getEntityNamePlural = () => exportType === 'contacts' ? 'contacts' : 'companies';
  const getEntityNameCapitalized = () => exportType === 'contacts' ? 'Contacts' : 'Companies';
  
  const handleCancelUuidFetch = () => {
    if (uuidFetchAbortController) {
      uuidFetchAbortController.abort();
      setUuidFetchAbortController(null);
      setIsFetchingUuids(false);
      setUuidFetchProgress(null);
      showToast('Cancelled', 'UUID fetching has been cancelled', 'info');
    }
  };

  const getExportCount = () => {
    switch (exportMode) {
      case 'selected':
        return selectedContactUuids.length;
      case 'current_page':
        return currentPageData.length;
      case 'specified_rows':
        return specifiedRows ? parseInt(specifiedRows, 10) : 0;
      case 'all':
        return totalCount;
      default:
        return 0;
    }
  };

  const getExportDescription = () => {
    const count = getExportCount();
    const entityName = getEntityNamePlural();
    
    switch (exportMode) {
      case 'selected':
        return `Export ${count} selected ${entityName}`;
      case 'current_page':
        return `Export ${count} ${entityName} from current page`;
      case 'specified_rows':
        return `Export up to ${count} ${entityName}`;
      case 'all':
        return `Export all ${count.toLocaleString()} ${entityName}`;
      default:
        return '';
    }
  };

  const getEstimatedTime = (count: number): string => {
    // Rough estimates: ~100 records per second for UUID fetch, ~50 records per second for export creation
    const uuidFetchTime = count / 100; // seconds
    const exportCreationTime = count / 50; // seconds
    const totalSeconds = uuidFetchTime + exportCreationTime;
    
    if (totalSeconds < 60) {
      return `${Math.ceil(totalSeconds)} seconds`;
    } else if (totalSeconds < 3600) {
      return `${Math.ceil(totalSeconds / 60)} minutes`;
    } else {
      return `${(totalSeconds / 3600).toFixed(1)} hours`;
    }
  };

  const shouldShowWarning = (): boolean => {
    const count = getExportCount();
    return count > 10000;
  };

  return (
    <>
      <ToastContainer toasts={toasts} position="top-right" />
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Export ${getEntityNameCapitalized()}`}
        description={getExportDescription()}
        size="md"
        variant="glass"
      >
        <div className="export-modal-content">
          {/* Export Options - Always show this state */}
          <div>
              <div className="export-modal-section">
                {/* Export Mode Selection */}
                <div className="export-modal-mode-selection">
                  <label className="export-modal-label">Export Options:</label>
                  <div className="export-modal-radio-group">
                    <label className="export-modal-radio">
                      <input
                        type="radio"
                        name="exportMode"
                        value="selected"
                        checked={exportMode === 'selected'}
                        onChange={(e) => setExportMode(e.target.value as ExportMode)}
                        disabled={selectedContactUuids.length === 0}
                      />
                      <div className="export-modal-radio-content">
                        <span className="export-modal-radio-label">Selected Rows</span>
                        <span className="export-modal-radio-count">
                          {selectedContactUuids.length > 0 ? `${selectedContactUuids.length} ${getEntityNamePlural()}` : 'No selection'}
                        </span>
                      </div>
                    </label>
                    <label className="export-modal-radio">
                      <input
                        type="radio"
                        name="exportMode"
                        value="current_page"
                        checked={exportMode === 'current_page'}
                        onChange={(e) => setExportMode(e.target.value as ExportMode)}
                        disabled={currentPageData.length === 0}
                      />
                      <div className="export-modal-radio-content">
                        <span className="export-modal-radio-label">Current Page</span>
                        <span className="export-modal-radio-count">
                          {currentPageData.length > 0 ? `${currentPageData.length} ${getEntityNamePlural()}` : 'No data'}
                        </span>
                      </div>
                    </label>
                    <label className="export-modal-radio">
                      <input
                        type="radio"
                        name="exportMode"
                        value="specified_rows"
                        checked={exportMode === 'specified_rows'}
                        onChange={(e) => setExportMode(e.target.value as ExportMode)}
                      />
                      <div className="export-modal-radio-content">
                        <span className="export-modal-radio-label">First N Rows</span>
                        <span className="export-modal-radio-count">Export first N rows matching filters</span>
                      </div>
                    </label>
                    <label className="export-modal-radio">
                      <input
                        type="radio"
                        name="exportMode"
                        value="all"
                        checked={exportMode === 'all'}
                        onChange={(e) => setExportMode(e.target.value as ExportMode)}
                      />
                      <div className="export-modal-radio-content">
                        <span className="export-modal-radio-label">All Data</span>
                        <span className="export-modal-radio-count">
                          {totalCount > 0 ? `${totalCount.toLocaleString()} ${getEntityNamePlural()}` : 'No data'}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Specified Rows Input */}
                {exportMode === 'specified_rows' && (
                  <div className="export-modal-specified-rows">
                    <Input
                      type="number"
                      label="Number of Rows"
                      value={specifiedRows}
                      onChange={(e) => setSpecifiedRows(e.target.value)}
                      placeholder="Enter number of rows (e.g., 100, 500, 1000)"
                      min={1}
                      helperText={`Export the first ${specifiedRows || 'N'} ${getEntityNamePlural()} matching your current filters`}
                    />
                  </div>
                )}

                {/* UUID Fetch Progress Indicator */}
                {isFetchingUuids && uuidFetchProgress && (
                  <div className="export-modal-progress">
                    <div className="export-modal-progress-header">
                      <span className="export-modal-progress-label">
                        Fetching {getEntityNamePlural()}...
                      </span>
                      <span className="export-modal-progress-percentage">
                        {uuidFetchProgress.percentage}%
                      </span>
                    </div>
                    <div className="export-modal-progress-bar-container">
                      <div 
                        className="export-modal-progress-bar"
                        style={{ width: `${uuidFetchProgress.percentage}%` }}
                      />
                    </div>
                    <div className="export-modal-progress-text">
                      {uuidFetchProgress.fetched.toLocaleString()} of {uuidFetchProgress.total.toLocaleString()} {getEntityNamePlural()}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelUuidFetch}
                      className="export-modal-progress-cancel"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {/* Chunked Export Progress Indicator */}
                {chunkedExportProgress && (
                  <div className="export-modal-progress">
                    <div className="export-modal-progress-header">
                      <span className="export-modal-progress-label">
                        Creating export chunks...
                      </span>
                      <span className="export-modal-progress-percentage">
                        {chunkedExportProgress.percentage}%
                      </span>
                    </div>
                    <div className="export-modal-progress-bar-container">
                      <div 
                        className="export-modal-progress-bar"
                        style={{ width: `${chunkedExportProgress.percentage}%` }}
                      />
                    </div>
                    <div className="export-modal-progress-text">
                      Chunk {chunkedExportProgress.currentChunk} of {chunkedExportProgress.total}
                    </div>
                  </div>
                )}

                {/* Export Processing Progress Indicator */}
                {exportProcessingProgress && exportStatus === 'processing' && (
                  <div className="export-modal-progress">
                    <div className="export-modal-progress-header">
                      <span className="export-modal-progress-label">
                        Processing export...
                      </span>
                      <span className="export-modal-progress-percentage">
                        {exportProcessingProgress.percentage}%
                      </span>
                    </div>
                    <div className="export-modal-progress-bar-container">
                      <div 
                        className="export-modal-progress-bar"
                        style={{ width: `${exportProcessingProgress.percentage}%` }}
                      />
                    </div>
                    <div className="export-modal-progress-text">
                      Status: {exportProcessingProgress.status}
                    </div>
                  </div>
                )}

                {/* Export Preview */}
                {(exportMode === 'specified_rows' || exportMode === 'all') && (
                  <div className="export-modal-preview">
                    <div className="export-modal-preview-info">
                      <div className="export-modal-preview-item">
                        <span className="export-modal-preview-label">Estimated Records:</span>
                        <span className="export-modal-preview-value">
                          {getExportCount().toLocaleString()} {getEntityNamePlural()}
                        </span>
                      </div>
                      <div className="export-modal-preview-item">
                        <span className="export-modal-preview-label">Estimated Time:</span>
                        <span className="export-modal-preview-value">
                          {getEstimatedTime(getExportCount())}
                        </span>
                      </div>
                    </div>
                    {shouldShowWarning() && (
                      <div className="export-modal-warning">
                        <AlertTriangleIcon className="export-modal-warning-icon" />
                        <div className="export-modal-warning-content">
                          <strong>Large Export Warning</strong>
                          <p>
                            Exporting {getExportCount().toLocaleString()} {getEntityNamePlural()} may take a significant amount of time. 
                            The export will be processed in the background and you'll be notified when it's ready.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <p className="export-modal-text--small">
                  The export will include all {getEntityName()}, company, and metadata fields. The download link will expire in 24 hours.
                </p>
              </div>
              <div className="export-modal-actions">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleCreateExport}
                  disabled={
                    isFetchingUuids ||
                    (exportMode === 'selected' && selectedContactUuids.length === 0) ||
                    (exportMode === 'current_page' && currentPageData.length === 0) ||
                    (exportMode === 'specified_rows' && (!specifiedRows || parseInt(specifiedRows, 10) <= 0)) ||
                    (exportMode === 'all' && totalCount === 0)
                  }
                >
                  {isFetchingUuids ? 'Fetching...' : 'Create Export'}
                </Button>
              </div>
            </div>
        </div>
      </Modal>
    </>
  );
};
