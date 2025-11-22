/**
 * LinkedIn Page
 * 
 * Main page for managing LinkedIn URL-based operations including search,
 * create/update, and export functionality.
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { LinkedInIcon, SearchIcon, PlusIcon, DownloadIcon, XMarkIcon } from '@components/icons';
import { useDebounce } from '@hooks/useDebounce';
import {
  searchByLinkedInUrl,
  createOrUpdateByLinkedInUrl,
  type LinkedInSearchResponse,
  type LinkedInCreateUpdateRequest,
} from '@services/linkedin';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Tabs } from '@components/ui/Tabs';
import { LinkedInSearchResults } from '@components/linkedin/LinkedInSearchResults';
import { LinkedInFormModal } from '@components/linkedin/LinkedInFormModal';
import { LinkedInExportModal } from '@components/linkedin/LinkedInExportModal';
import { LinkedInSkeletonLoader } from '@components/linkedin/LinkedInSkeletonLoader';
import { LinkedInEmptyState } from '@components/linkedin/LinkedInEmptyState';
import { validateLinkedInUrl, normalizeLinkedInUrl } from '@utils/linkedinValidation';

export default function LinkedInPage() {
  // State management
  const [activeTab, setActiveTab] = useState<'search' | 'create' | 'export'>('search');
  const [searchUrl, setSearchUrl] = useState('');
  const [searchResults, setSearchResults] = useState<LinkedInSearchResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [urlValidationError, setUrlValidationError] = useState<string | null>(null);
  
  // Debounced search URL
  const debouncedSearchUrl = useDebounce(searchUrl, 500);
  
  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000); // Increased to 5 seconds for better UX
  };

  // Validate URL and show validation errors
  const validateAndSetUrl = useCallback((url: string) => {
    setSearchUrl(url);
    setSearchError(null);
    
    if (!url.trim()) {
      setUrlValidationError(null);
      return;
    }

    const validation = validateLinkedInUrl(url);
    if (!validation.valid) {
      setUrlValidationError(validation.error || 'Invalid LinkedIn URL');
    } else {
      setUrlValidationError(null);
      // Normalize URL if valid
      if (validation.normalizedUrl && validation.normalizedUrl !== url) {
        // Update to normalized URL after a short delay to avoid cursor jumping
        setTimeout(() => {
          setSearchUrl(validation.normalizedUrl!);
        }, 100);
      }
    }
  }, []);

  // Handle search
  const handleSearch = useCallback(async (url: string) => {
    const timestamp = new Date().toISOString();
    console.log(`[LINKEDIN_PAGE] handleSearch called at ${timestamp}`, {
      originalUrl: url,
      urlLength: url?.length,
      urlTrimmed: url?.trim(),
    });

    if (!url.trim()) {
      console.log('[LINKEDIN_PAGE] Empty URL, clearing results');
      setSearchResults(null);
      return;
    }

    // Validate URL before searching
    console.log('[LINKEDIN_PAGE] Validating URL:', url);
    const validation = validateLinkedInUrl(url);
    console.log('[LINKEDIN_PAGE] Validation result:', {
      valid: validation.valid,
      error: validation.error,
      type: validation.type,
      normalizedUrl: validation.normalizedUrl,
    });

    if (!validation.valid) {
      const errorMsg = validation.error || 'Invalid LinkedIn URL';
      console.warn('[LINKEDIN_PAGE] URL validation failed:', errorMsg);
      setSearchError(errorMsg);
      setSearchResults(null);
      showToast(errorMsg, 'error');
      return;
    }

    // Use normalized URL for search
    const normalizedUrl = normalizeLinkedInUrl(url);
    console.log('[LINKEDIN_PAGE] URL normalized:', {
      original: url,
      normalized: normalizedUrl,
      changed: url !== normalizedUrl,
    });
    
    console.log('[LINKEDIN_PAGE] Setting loading state and clearing errors');
    setSearchLoading(true);
    setSearchError(null);
    setUrlValidationError(null);

    try {
      console.log('[LINKEDIN_PAGE] Calling searchByLinkedInUrl with normalized URL:', normalizedUrl);
      const apiCallStartTime = Date.now();
      const result = await searchByLinkedInUrl(normalizedUrl);
      const apiCallDuration = Date.now() - apiCallStartTime;
      
      console.log(`[LINKEDIN_PAGE] API call completed in ${apiCallDuration}ms`, {
        success: result.success,
        hasData: !!result.data,
        message: result.message,
        error: result.error ? {
          message: result.error.message,
          statusCode: result.error.statusCode,
          isNetworkError: result.error.isNetworkError,
          isTimeoutError: result.error.isTimeoutError,
        } : null,
        dataPreview: result.data ? {
          total_contacts: result.data.total_contacts,
          total_companies: result.data.total_companies,
          contactsLength: result.data.contacts?.length || 0,
          companiesLength: result.data.companies?.length || 0,
          firstContact: result.data.contacts?.[0] ? {
            contact_uuid: result.data.contacts[0].contact?.uuid,
            contact_name: `${result.data.contacts[0].contact?.first_name} ${result.data.contacts[0].contact?.last_name}`,
          } : null,
        } : null,
      });

      if (result.success && result.data) {
        console.log('[LINKEDIN_PAGE] Search successful, updating state with results');
        console.log('[LINKEDIN_PAGE] Full response data:', JSON.stringify(result.data, null, 2));
        
        setSearchResults(result.data);
        console.log('[LINKEDIN_PAGE] searchResults state updated');
        
        // Calculate totals from arrays if undefined
        const contactsCount = result.data.total_contacts !== undefined 
          ? result.data.total_contacts 
          : (result.data.contacts?.length || 0);
        const companiesCount = result.data.total_companies !== undefined 
          ? result.data.total_companies 
          : (result.data.companies?.length || 0);
        
        if (contactsCount === 0 && companiesCount === 0) {
          console.log('[LINKEDIN_PAGE] No results found (both totals are 0)');
          showToast('No results found for this LinkedIn URL', 'error');
        } else {
          const contactText = contactsCount === 1 ? 'contact' : 'contacts';
          const companyText = companiesCount === 1 ? 'company' : 'companies';
          const successMessage = `Found ${contactsCount} ${contactText} and ${companiesCount} ${companyText}`;
          console.log('[LINKEDIN_PAGE] Results found, showing success toast:', successMessage);
          showToast(successMessage, 'success');
        }
      } else {
        const errorMessage = result.message || 'Failed to search';
        console.error('[LINKEDIN_PAGE] Search failed (result.success is false):', {
          errorMessage,
          resultStructure: {
            success: result.success,
            hasData: !!result.data,
            hasError: !!result.error,
            message: result.message,
          },
        });
        setSearchError(errorMessage);
        setSearchResults(null);
        console.log('[LINKEDIN_PAGE] Error state updated, showing error toast');
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('[LINKEDIN_PAGE] Exception caught in handleSearch:', {
        error,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        url: normalizedUrl,
      });
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while searching';
      console.log('[LINKEDIN_PAGE] Setting error state and showing error toast');
      setSearchError(errorMessage);
      setSearchResults(null);
      showToast(errorMessage, 'error');
    } finally {
      console.log('[LINKEDIN_PAGE] Setting searchLoading to false');
      setSearchLoading(false);
      console.log('[LINKEDIN_PAGE] handleSearch completed');
    }
  }, []);

  // Trigger search when debounced URL changes (only if valid)
  useEffect(() => {
    if (debouncedSearchUrl.trim() && activeTab === 'search') {
      const validation = validateLinkedInUrl(debouncedSearchUrl);
      if (validation.valid) {
        handleSearch(debouncedSearchUrl);
      }
    }
  }, [debouncedSearchUrl, activeTab, handleSearch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter key to search (when in search tab and input is focused)
      if (e.key === 'Enter' && activeTab === 'search' && searchUrl.trim()) {
        e.preventDefault();
        const validation = validateLinkedInUrl(searchUrl);
        if (validation.valid) {
          handleSearch(searchUrl);
        } else {
          showToast(validation.error || 'Please enter a valid LinkedIn URL', 'error');
        }
      }
      
      // Escape key to clear search
      if (e.key === 'Escape' && activeTab === 'search' && searchUrl) {
        setSearchUrl('');
        setSearchResults(null);
        setSearchError(null);
        setUrlValidationError(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, searchUrl, handleSearch]);

  // Handle form submit
  const handleFormSubmit = async (data: LinkedInCreateUpdateRequest) => {
    setIsSubmitting(true);

    try {
      // Validate URL before submitting
      const validation = validateLinkedInUrl(data.url);
      if (!validation.valid) {
        showToast(validation.error || 'Invalid LinkedIn URL', 'error');
        setIsSubmitting(false);
        return;
      }

      // Use normalized URL
      const normalizedData = {
        ...data,
        url: normalizeLinkedInUrl(data.url),
      };

      const result = await createOrUpdateByLinkedInUrl(normalizedData);

      if (result.success && result.data) {
        const action = result.data.created ? 'created' : 'updated';
        const contactCount = result.data.contacts?.length || 0;
        const companyCount = result.data.companies?.length || 0;
        
        let message = `Records ${action} successfully`;
        if (contactCount > 0 || companyCount > 0) {
          const parts: string[] = [];
          if (contactCount > 0) parts.push(`${contactCount} contact${contactCount !== 1 ? 's' : ''}`);
          if (companyCount > 0) parts.push(`${companyCount} company${companyCount !== 1 ? 'ies' : 'y'}`);
          message = `${parts.join(' and ')} ${action}`;
        }
        
        showToast(message, 'success');
        setShowFormModal(false);
        
        // If we have a URL, trigger a search to show the results
        if (normalizedData.url) {
          setSearchUrl(normalizedData.url);
          await handleSearch(normalizedData.url);
        }
      } else {
        const errorMessage = result.message || 'Failed to save';
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Form submit error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while saving';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle export complete
  const handleExportComplete = () => {
    showToast('Export completed successfully', 'success');
  };

  return (
    <div className="linkedin-page">
      {/* Header */}
      <div className="linkedin-page-header">
        <div className="linkedin-page-header-content">
          <div>
            <div className="linkedin-page-header-title-wrapper">
              <div className="linkedin-page-header-icon-wrapper">
                <LinkedInIcon className="linkedin-page-header-icon" />
              </div>
              <h1 className="linkedin-page-title">LinkedIn</h1>
            </div>
            <p className="linkedin-page-description">
              Search, create, update, and export contacts and companies by LinkedIn URL
            </p>
          </div>
          <div className="linkedin-page-header-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setShowFormModal(true);
                setActiveTab('create');
              }}
              leftIcon={<PlusIcon />}
              className="linkedin-page-header-create-btn"
            >
              Create/Update
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowExportModal(true);
                setActiveTab('export');
              }}
              leftIcon={<DownloadIcon />}
              className="linkedin-page-header-export-btn"
            >
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="linkedin-page-tabs">
        <Tabs
          tabs={[
            {
              id: 'search',
              label: 'Search',
              icon: <SearchIcon className="linkedin-page-tab-icon" />,
              content: (
                <>
                  {/* Search Tab */}
            <div className="linkedin-page-search">
              <div className="linkedin-page-search-bar">
                <div className="linkedin-page-search-input-wrapper">
                  <SearchIcon className="linkedin-page-search-icon" />
                  <Input
                    ref={searchInputRef}
                    value={searchUrl}
                    onChange={(e) => validateAndSetUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchUrl.trim()) {
                        e.preventDefault();
                        const validation = validateLinkedInUrl(searchUrl);
                        if (validation.valid) {
                          handleSearch(searchUrl);
                        }
                      }
                    }}
                    placeholder="Enter LinkedIn URL (e.g., https://www.linkedin.com/in/username or https://www.linkedin.com/company/company-name)"
                    className="linkedin-page-search-input"
                    aria-label="Search LinkedIn URL"
                    aria-invalid={urlValidationError ? 'true' : 'false'}
                    aria-describedby={urlValidationError ? 'url-validation-error' : undefined}
                  />
                  {searchUrl && (
                    <button
                      onClick={() => {
                        setSearchUrl('');
                        setSearchResults(null);
                        setSearchError(null);
                      }}
                      className="linkedin-page-search-clear"
                      aria-label="Clear search"
                    >
                      <XMarkIcon />
                    </button>
                  )}
                </div>
                <Button
                  variant="primary"
                  onClick={() => {
                    const validation = validateLinkedInUrl(searchUrl);
                    if (validation.valid) {
                      handleSearch(searchUrl);
                    } else {
                      showToast(validation.error || 'Please enter a valid LinkedIn URL', 'error');
                    }
                  }}
                  disabled={!searchUrl.trim() || searchLoading || !!urlValidationError}
                  leftIcon={<SearchIcon />}
                  aria-label="Search LinkedIn URL"
                >
                  {searchLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {(urlValidationError || searchError) && (
                <div 
                  className="linkedin-page-error" 
                  id="url-validation-error"
                  role="alert"
                >
                  <span className="linkedin-page-error-dot" />
                  {urlValidationError || searchError}
                </div>
              )}

              {searchLoading ? (
                <LinkedInSkeletonLoader count={3} variant="card" />
              ) : (
                <LinkedInSearchResults
                  results={searchResults}
                  loading={searchLoading}
                  searchUrl={searchUrl}
                />
              )}
            </div>
                </>
              ),
            },
            {
              id: 'create',
              label: 'Create/Update',
              icon: <PlusIcon className="linkedin-page-tab-icon" />,
              content: (
                <>
                  {/* Create/Update Tab */}
            <div className="linkedin-page-create">
              <LinkedInEmptyState
                variant="no-data"
                onAction={() => setShowFormModal(true)}
                actionLabel="Create Record"
              />
            </div>
                </>
              ),
            },
            {
              id: 'export',
              label: 'Export',
              icon: <DownloadIcon className="linkedin-page-tab-icon" />,
              content: (
                <>
                  {/* Export Tab */}
            <div className="linkedin-page-export">
              <LinkedInEmptyState
                variant="no-data"
                onAction={() => setShowExportModal(true)}
                actionLabel="Create Export"
              />
            </div>
                </>
              ),
            },
          ]}
          defaultTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as 'search' | 'create' | 'export')}
        />
      </div>

      {/* Modals */}
      <LinkedInFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleFormSubmit}
        initialUrl={searchUrl}
        isSubmitting={isSubmitting}
      />

      <LinkedInExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExportComplete={handleExportComplete}
        navigateToHistory={true}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`linkedin-toast linkedin-toast--${toast.type}`}>
          <div className="linkedin-toast-content">
            <div className={`linkedin-toast-indicator linkedin-toast-indicator--${toast.type}`} />
            <span className="linkedin-toast-message">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

