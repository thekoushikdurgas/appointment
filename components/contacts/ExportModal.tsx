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
  downloadExport, 
  CreateContactExportResponse,
  CreateCompanyExportResponse
} from '@services/export';
import { getContactUuids } from '@services/contact';
import { getCompanyUuids } from '@services/company';
import { getContactUuidsFromApolloUrl, ApolloContactsUuidsParams } from '@services/apollo';
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

type ExportStatus = 'idle' | 'fetching' | 'creating' | 'processing' | 'completed' | 'failed';

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

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setExportStatus('idle');
      setCurrentExport(null);
      setExportError(null);
      setExportMode('selected');
      setSpecifiedRows('');
      setUuidsToExport([]);
    }
  }, [isOpen]);

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
        
        setExportStatus('fetching');
        
        // Use Apollo URL if provided, otherwise use regular filters
        if (apolloUrl && exportType === 'contacts') {
          const result = await getContactUuidsFromApolloUrl(apolloUrl, {
            ...apolloParams,
            limit,
          });
          
          if (result.success && result.data) {
            return result.data.uuids;
          } else {
            throw new Error(result.message || 'Failed to fetch contact UUIDs from Apollo URL');
          }
        } else {
          const result = exportType === 'contacts' 
            ? await getContactUuids(filters, { limit })
            : await getCompanyUuids(filters, { limit });
          
          return result.uuids;
        }
      }
      
      case 'all': {
        setExportStatus('fetching');
        
        // Use Apollo URL if provided, otherwise use regular filters
        if (apolloUrl && exportType === 'contacts') {
          const result = await getContactUuidsFromApolloUrl(apolloUrl, apolloParams);
          
          if (result.success && result.data) {
            return result.data.uuids;
          } else {
            throw new Error(result.message || 'Failed to fetch contact UUIDs from Apollo URL');
          }
        } else {
          const result = exportType === 'contacts'
            ? await getContactUuids(filters)
            : await getCompanyUuids(filters);
          
          return result.uuids;
        }
      }
      
      default:
        return [];
    }
  };

  const handleCreateExport = async () => {
    try {
      // Get UUIDs based on selected mode
      const uuids = await getUuidsForMode(exportMode);
      
      if (uuids.length === 0) {
        const entityName = exportType === 'contacts' ? 'contacts' : 'companies';
        showToast(
          `No ${entityName} to export`, 
          `No ${entityName} match the selected export criteria`, 
          'error'
        );
        setExportStatus('idle');
        return;
      }

      setUuidsToExport(uuids);
      setExportStatus('creating');
      setExportError(null);

      // Create export based on type
      const result = exportType === 'contacts'
        ? await createContactExport(uuids)
        : await createCompanyExport(uuids);

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
          pollExportStatus(result.data.export_id);
        }
      } else {
        setExportStatus('failed');
        setExportError(result.message || 'Failed to create export');
        showToast('Export Failed', result.message || 'Failed to create export', 'error');
      }
    } catch (error: any) {
      console.error('Export creation error:', error);
      setExportStatus('failed');
      setExportError(error.message || 'An unexpected error occurred while creating the export');
      showToast('Export Failed', error.message || 'An unexpected error occurred', 'error');
    }
  };

  const pollExportStatus = async (exportId: string) => {
    // Note: Since we don't have a status endpoint, we'll assume exports complete quickly
    // If the status is 'pending' or 'processing', we'll show a processing state
    // In a production environment, you would poll a status endpoint here
    
    setTimeout(() => {
      // After a short delay, assume export is ready (or check status if endpoint exists)
      if (currentExport && (currentExport.status === 'pending' || currentExport.status === 'processing')) {
        // In a real implementation, you would check the status here
        // For now, we'll allow the user to try downloading
        setExportStatus('completed');
      }
    }, 3000);
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

  return (
    <>
      <ToastContainer toasts={toasts} position="top-right" />
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Export ${getEntityNameCapitalized()}`}
        description={exportStatus === 'idle' ? getExportDescription() : undefined}
        size="md"
        variant="glass"
      >
        <div className="export-modal-content">
          {/* Initial State */}
          {exportStatus === 'idle' && (
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
                    (exportMode === 'selected' && selectedContactUuids.length === 0) ||
                    (exportMode === 'current_page' && currentPageData.length === 0) ||
                    (exportMode === 'specified_rows' && (!specifiedRows || parseInt(specifiedRows, 10) <= 0)) ||
                    (exportMode === 'all' && totalCount === 0)
                  }
                >
                  Create Export
                </Button>
              </div>
            </div>
          )}

          {/* Fetching UUIDs State */}
          {exportStatus === 'fetching' && (
            <div className="export-modal-center">
              <div className="export-modal-spinner-wrapper">
                <LoadingSpinner size="lg" />
              </div>
              <p className="export-modal-text--bold">Fetching {getEntityNamePlural()}...</p>
              <p className="export-modal-text--small">
                Please wait while we gather the {getEntityNamePlural()} to export.
              </p>
            </div>
          )}

          {/* Creating State */}
          {exportStatus === 'creating' && (
            <div className="export-modal-center">
              <div className="export-modal-spinner-wrapper">
                <LoadingSpinner size="lg" />
              </div>
              <p className="export-modal-text--bold">Creating export...</p>
              <p className="export-modal-text--small">
                Please wait while we prepare your export.
              </p>
            </div>
          )}

          {/* Processing State */}
          {exportStatus === 'processing' && currentExport && (
            <div className="export-modal-center">
              <div className="export-modal-spinner-wrapper">
                <LoadingSpinner size="lg" />
              </div>
              <p className="export-modal-text--bold">Processing export...</p>
              <p className="export-modal-text--small export-modal-text">
                Status: <strong>{currentExport.status}</strong>
              </p>
              <p className="export-modal-text--small">
                This may take a few moments.
              </p>
            </div>
          )}

          {/* Completed State */}
          {exportStatus === 'completed' && currentExport && (
            <div>
              <div className="export-modal-status-card export-modal-status-card--success">
                <SuccessIcon className="export-modal-icon export-modal-icon--success" />
                <div className="export-modal-status-card-content">
                  <p className="export-modal-status-card-title">Export Ready!</p>
                  <p className="export-modal-status-card-message">
                    Your export is ready for download.
                  </p>
                </div>
              </div>

              <div className="export-modal-info">
                <div className="export-modal-info-item">
                  <strong>Export ID:</strong> {currentExport.export_id}
                </div>
                <div className="export-modal-info-item">
                  <strong>{getEntityNameCapitalized()}:</strong> {
                    exportType === 'contacts' 
                      ? (currentExport as CreateContactExportResponse).contact_count
                      : (currentExport as CreateCompanyExportResponse).company_count
                  }
                </div>
                <div className="export-modal-info-item export-modal-info-item--muted">
                  <strong>Expires:</strong> {formatExpirationDate(currentExport.expires_at)}
                </div>
              </div>

              <div className="export-modal-actions">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                {navigateToHistory ? (
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      onClose();
                      router.push('/history');
                    }} 
                    leftIcon={<HistoryIcon />}
                  >
                    View in History
                  </Button>
                ) : (
                  <Button variant="primary" onClick={handleDownload} leftIcon={<DownloadIcon />}>
                    Download CSV
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Failed State */}
          {exportStatus === 'failed' && (
            <div>
              <div className="export-modal-status-card export-modal-status-card--error">
                <AlertTriangleIcon className="export-modal-icon export-modal-icon--error" />
                <div className="export-modal-status-card-content">
                  <p className="export-modal-status-card-title">Export Failed</p>
                  <p className="export-modal-status-card-message">
                    {exportError || 'An error occurred while creating the export.'}
                  </p>
                </div>
              </div>

              <div className="export-modal-actions">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button variant="primary" onClick={handleCreateExport}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
