/**
 * LinkedInExportModal Component
 * 
 * Modal for exporting contacts and companies by multiple LinkedIn URLs.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { Textarea } from '@components/ui/Textarea';
import { Progress } from '@components/ui/Progress';
import {
  DownloadIcon,
  LoadingSpinner,
  SuccessIcon,
  AlertTriangleIcon,
  XMarkIcon,
  HistoryIcon,
} from '@components/icons';
import { useRouter } from 'next/navigation';
import { exportByLinkedInUrls, type LinkedInExportResponse } from '@services/linkedin';
import { pollExportStatus, downloadExport, type ExportStatusResponse } from '@services/export';
import { extractValidLinkedInUrls, validateLinkedInUrls } from '@utils/linkedinValidation';

interface LinkedInExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportComplete?: () => void;
  navigateToHistory?: boolean;
}

export const LinkedInExportModal: React.FC<LinkedInExportModalProps> = ({
  isOpen,
  onClose,
  onExportComplete,
  navigateToHistory = false,
}) => {
  const router = useRouter();
  const [urls, setUrls] = useState('');
  const [currentExport, setCurrentExport] = useState<LinkedInExportResponse | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'creating' | 'processing' | 'completed' | 'failed'>('idle');
  const [exportError, setExportError] = useState<string | null>(null);
  const [urlValidationErrors, setUrlValidationErrors] = useState<string[]>([]);
  const [exportProgress, setExportProgress] = useState<{
    percentage: number;
    status: string;
  } | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      if (exportStatus === 'idle' || exportStatus === 'failed') {
        setUrls('');
        setCurrentExport(null);
        setExportError(null);
        setExportProgress(null);
        setExportStatus('idle');
      }
    }
  }, [isOpen, exportStatus]);

  // Poll export status when export is created
  useEffect(() => {
    if (!currentExport || exportStatus !== 'processing') return;

    const pollInterval = setInterval(async () => {
      try {
        // Extract export_id from download_url
        const downloadUrl = new URL(currentExport.download_url);
        const pathParts = downloadUrl.pathname.split('/').filter(part => part);
        const downloadIndex = pathParts.indexOf('download');
        const exportId = downloadIndex > 0 ? pathParts[downloadIndex - 1] : '';

        if (!exportId) {
          clearInterval(pollInterval);
          setExportError('Invalid export ID');
          setExportStatus('failed');
          return;
        }

        const result = await pollExportStatus(exportId);

        if (result.success && result.data) {
          const status = result.data.status;
          const progress = result.data.progress_percentage || 0;

          setExportProgress({
            percentage: progress,
            status: status,
          });

          if (status === 'completed') {
            clearInterval(pollInterval);
            setExportStatus('completed');
            setCurrentExport({
              ...currentExport,
              download_url: result.data.download_url || currentExport.download_url,
              status: 'completed',
            });
          } else if (status === 'failed' || status === 'cancelled') {
            clearInterval(pollInterval);
            setExportStatus('failed');
            setExportError(result.data.error_message || 'Export failed');
          }
        } else {
          clearInterval(pollInterval);
          setExportError(result.message || 'Failed to check export status');
          setExportStatus('failed');
        }
      } catch (error) {
        console.error('Error polling export status:', error);
        clearInterval(pollInterval);
        setExportError('Failed to check export status');
        setExportStatus('failed');
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [currentExport, exportStatus]);

  const handleCreateExport = async () => {
    // Extract and validate LinkedIn URLs
    const validUrls = extractValidLinkedInUrls(urls);
    const allUrls = urls
      .split(/[\n,]+/)
      .map(url => url.trim())
      .filter(url => url.length > 0);

    // Validate all URLs and collect errors
    const validationResults = validateLinkedInUrls(allUrls);
    const invalidUrls = validationResults
      .map((result, index) => (!result.valid ? allUrls[index] : null))
      .filter((url): url is string => url !== null);
    
    const errors = validationResults
      .map((result, index) => (!result.valid ? `${allUrls[index]}: ${result.error}` : null))
      .filter((error): error is string => error !== null);

    if (validUrls.length === 0) {
      if (allUrls.length === 0) {
        setExportError('Please enter at least one LinkedIn URL');
      } else {
        setExportError(`No valid LinkedIn URLs found. ${errors.length > 0 ? errors[0] : 'Please check your URLs.'}`);
        setUrlValidationErrors(errors);
      }
      return;
    }

    // Show warnings for invalid URLs but proceed with valid ones
    if (invalidUrls.length > 0) {
      setUrlValidationErrors(errors);
    } else {
      setUrlValidationErrors([]);
    }

    setExportError(null);
    setExportStatus('creating');

    try {
      const result = await exportByLinkedInUrls(validUrls);

      if (result.success && result.data) {
        setCurrentExport(result.data);
        setExportStatus('processing');
        setExportProgress({
          percentage: 0,
          status: result.data.status,
        });
      } else {
        setExportError(result.message || 'Failed to create export');
        setExportStatus('failed');
      }
    } catch (error) {
      console.error('Error creating export:', error);
      setExportError('Failed to create export');
      setExportStatus('failed');
    }
  };

  const handleDownload = async () => {
    if (!currentExport) return;

    setExportError(null);

    try {
      // Parse the download URL to extract export_id and token
      const downloadUrl = new URL(currentExport.download_url);
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
        link.download = `linkedin_export_${exportId}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);

        if (onExportComplete) {
          onExportComplete();
        }

        // Close modal or navigate to history
        setTimeout(() => {
          if (navigateToHistory) {
            router.push('/history');
          } else {
            onClose();
          }
        }, 1000);
      } else {
        setExportError(result.message || 'Failed to download export');
      }
    } catch (error) {
      console.error('Download error:', error);
      setExportError('Failed to download export');
    }
  };

  // Get valid and invalid URL counts
  const validUrls = extractValidLinkedInUrls(urls);
  const allUrls = urls
    .split(/[\n,]+/)
    .map(url => url.trim())
    .filter(url => url.length > 0);
  const validationResults = validateLinkedInUrls(allUrls);
  const invalidCount = validationResults.filter(r => !r.valid).length;
  const validCount = validUrls.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export by LinkedIn URLs"
      size="lg"
      closeOnOverlayClick={exportStatus === 'idle' || exportStatus === 'failed'}
      closeOnEscape={exportStatus === 'idle' || exportStatus === 'failed'}
    >
      <div className="linkedin-export-modal">
        {exportStatus === 'idle' && (
          <>
            <div className="linkedin-export-modal__section">
              <label className="linkedin-export-modal__label">
                LinkedIn URLs (one per line or comma-separated)
              </label>
              <Textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="https://www.linkedin.com/in/john-doe&#10;https://www.linkedin.com/company/tech-corp&#10;https://www.linkedin.com/in/jane-smith"
                rows={10}
                className="linkedin-export-modal__textarea"
              />
              <p className="linkedin-export-modal__help-text">
                Enter LinkedIn profile or company URLs. Each URL should be on a new line or separated by commas.
                {validCount > 0 && (
                  <span className="linkedin-export-modal__url-count linkedin-export-modal__url-count--valid">
                    {' '}({validCount} valid URL{validCount !== 1 ? 's' : ''} detected)
                  </span>
                )}
                {invalidCount > 0 && validCount === 0 && (
                  <span className="linkedin-export-modal__url-count linkedin-export-modal__url-count--invalid">
                    {' '}({invalidCount} invalid URL{invalidCount !== 1 ? 's' : ''} - please check format)
                  </span>
                )}
                {invalidCount > 0 && validCount > 0 && (
                  <span className="linkedin-export-modal__url-count linkedin-export-modal__url-count--warning">
                    {' '}({validCount} valid, {invalidCount} invalid)
                  </span>
                )}
              </p>
              {urlValidationErrors.length > 0 && validCount > 0 && (
                <div className="linkedin-export-modal__validation-warnings" role="alert">
                  <p className="linkedin-export-modal__validation-warning-title">
                    <AlertTriangleIcon className="linkedin-export-modal__validation-warning-icon" />
                    {invalidCount} invalid URL{invalidCount !== 1 ? 's' : ''} will be skipped:
                  </p>
                  <ul className="linkedin-export-modal__validation-warning-list">
                    {urlValidationErrors.slice(0, 5).map((error, index) => (
                      <li key={index} className="linkedin-export-modal__validation-warning-item">
                        {error}
                      </li>
                    ))}
                    {urlValidationErrors.length > 5 && (
                      <li className="linkedin-export-modal__validation-warning-item">
                        ...and {urlValidationErrors.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {exportError && (
              <div className="linkedin-export-modal__error">
                <AlertTriangleIcon className="linkedin-export-modal__error-icon" />
                <span>{exportError}</span>
              </div>
            )}

            <div className="linkedin-export-modal__actions">
              <Button
                variant="ghost"
                onClick={onClose}
                leftIcon={<XMarkIcon />}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateExport}
                disabled={validCount === 0}
                leftIcon={<DownloadIcon />}
              >
                Create Export {validCount > 0 && `(${validCount} URL${validCount !== 1 ? 's' : ''})`}
              </Button>
            </div>
          </>
        )}

        {(exportStatus === 'creating' || exportStatus === 'processing') && (
          <>
            <div className="linkedin-export-modal__section">
              <div className="linkedin-export-modal__status">
                <LoadingSpinner className="linkedin-export-modal__status-icon" />
                <div className="linkedin-export-modal__status-content">
                  <h3 className="linkedin-export-modal__status-title">
                    {exportStatus === 'creating' ? 'Creating Export...' : 'Processing Export...'}
                  </h3>
                  <p className="linkedin-export-modal__status-description">
                    {exportStatus === 'creating'
                      ? 'Your export is being created. This may take a moment.'
                      : 'Searching LinkedIn URLs and generating CSV file. This may take a few minutes.'}
                  </p>
                </div>
              </div>

              {exportProgress && (
                <div className="linkedin-export-modal__progress">
                  <Progress value={exportProgress.percentage} />
                  <p className="linkedin-export-modal__progress-text">
                    {exportProgress.percentage}% - {exportProgress.status}
                  </p>
                </div>
              )}

              {currentExport && (
                <div className="linkedin-export-modal__export-info">
                  <p className="linkedin-export-modal__export-info-item">
                    <strong>Export ID:</strong> {currentExport.export_id}
                  </p>
                  {currentExport.job_id && (
                    <p className="linkedin-export-modal__export-info-item">
                      <strong>Job ID:</strong> {currentExport.job_id}
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {exportStatus === 'completed' && currentExport && (
          <>
            <div className="linkedin-export-modal__section">
              <div className="linkedin-export-modal__status">
                <SuccessIcon className="linkedin-export-modal__status-icon linkedin-export-modal__status-icon--success" />
                <div className="linkedin-export-modal__status-content">
                  <h3 className="linkedin-export-modal__status-title">Export Completed!</h3>
                  <p className="linkedin-export-modal__status-description">
                    Your export is ready to download. It includes {currentExport.contact_count} contact(s) and{' '}
                    {currentExport.company_count} company(ies).
                  </p>
                </div>
              </div>

              <div className="linkedin-export-modal__export-info">
                <p className="linkedin-export-modal__export-info-item">
                  <strong>Export ID:</strong> {currentExport.export_id}
                </p>
                <p className="linkedin-export-modal__export-info-item">
                  <strong>Expires:</strong>{' '}
                  {new Date(currentExport.expires_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="linkedin-export-modal__actions">
              <Button
                variant="ghost"
                onClick={() => router.push('/history')}
                leftIcon={<HistoryIcon />}
              >
                View History
              </Button>
              <Button
                variant="primary"
                onClick={handleDownload}
                leftIcon={<DownloadIcon />}
              >
                Download CSV
              </Button>
            </div>
          </>
        )}

        {exportStatus === 'failed' && (
          <>
            <div className="linkedin-export-modal__section">
              <div className="linkedin-export-modal__status">
                <AlertTriangleIcon className="linkedin-export-modal__status-icon linkedin-export-modal__status-icon--error" />
                <div className="linkedin-export-modal__status-content">
                  <h3 className="linkedin-export-modal__status-title">Export Failed</h3>
                  <p className="linkedin-export-modal__status-description">
                    {exportError || 'An error occurred while creating the export. Please try again.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="linkedin-export-modal__actions">
              <Button
                variant="ghost"
                onClick={() => {
                  setExportStatus('idle');
                  setExportError(null);
                  setCurrentExport(null);
                }}
              >
                Try Again
              </Button>
              <Button
                variant="primary"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

