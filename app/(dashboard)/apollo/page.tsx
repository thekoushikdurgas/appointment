'use client';

import React, { useState, useEffect } from 'react';
import { 
  SearchIcon, 
  XMarkIcon, 
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  CheckIcon,
  AlertTriangleIcon,
  SuccessIcon,
  InfoIcon,
  ChevronLeftIcon,
  ChevronRightIcon as ChevronRightPaginationIcon,
  DeleteIcon,
  DownloadIcon,
} from '../../../components/icons/IconComponents';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { Toast, ToastContainer, ToastProps } from '../../../components/ui/Toast';
import { ContactCard } from '../../../components/contacts/ContactCard';
import { analyzeApolloUrl, searchContactsFromApolloUrl } from '../../../services/apollo';
import { 
  ApolloUrlAnalysisResponse, 
  ApolloContactsResponse,
} from '../../../types/apollo';
import { ApolloAnalyzerSkeleton, ApolloContactsSkeleton } from '../../../components/apollo/ApolloSkeletonLoader';
import { ApolloEmptyState } from '../../../components/apollo/ApolloEmptyState';
import { ApolloStatsCards, ApolloStats } from '../../../components/apollo/ApolloStatsCards';

// Example Apollo URLs for quick testing
const EXAMPLE_URLS = [
  {
    label: 'Simple Search (CEO in California)',
    url: 'https://app.apollo.io/#/people?personTitles[]=CEO&personLocations[]=California&page=1',
  },
  {
    label: 'Complex Search (Multiple Filters)',
    url: 'https://app.apollo.io/#/people?contactEmailStatusV2[]=verified&personTitles[]=CEO&personLocations[]=california&organizationNumEmployeesRanges[]=11,50&page=1&sortByField=recommendations_score&sortAscending=false',
  },
  {
    label: 'With Keywords',
    url: 'https://app.apollo.io/#/people?qOrganizationKeywordTags[]=technology&personLocations[]=United States&organizationNumEmployeesRanges[]=51,100',
  },
];

export default function ApolloPage() {
  // Toast state
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  // Session stats state
  const [sessionStats, setSessionStats] = useState<ApolloStats>({
    totalAnalyses: 0,
    totalContactsFound: 0,
    lastAnalysisTime: null,
    successRate: 100,
  });

  // Tab state
  const [activeTab, setActiveTab] = useState<'analyzer' | 'search'>('analyzer');

  // Section 1: URL Analyzer State
  const [analyzeUrl, setAnalyzeUrl] = useState('');
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<ApolloUrlAnalysisResponse | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showRawParams, setShowRawParams] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Section 2: Contact Search State
  const [searchUrl, setSearchUrl] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<ApolloContactsResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'simple' | 'full'>('full');
  const [limit, setLimit] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedUnmappedCategories, setExpandedUnmappedCategories] = useState<Set<string>>(new Set());

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

  // Handle URL Analysis
  const handleAnalyze = async () => {
    if (!analyzeUrl.trim()) {
      showToast('Invalid Input', 'Please enter an Apollo.io URL', 'warning');
      return;
    }

    setAnalyzeLoading(true);
    setAnalyzeError(null);
    setAnalyzeResult(null);

    const result = await analyzeApolloUrl(analyzeUrl);

    setAnalyzeLoading(false);

    if (result.success && result.data) {
      setAnalyzeResult(result.data);
      const categoryNames = new Set(result.data.categories.map(c => c.name));
      setExpandedCategories(categoryNames);
      updateStats(true);
      showToast(
        'URL Analyzed Successfully!',
        `Found ${result.data.statistics.total_parameters} parameters across ${result.data.statistics.categories_used} categories`,
        'success'
      );
    } else {
      setAnalyzeError(result.message || 'Failed to analyze URL');
      updateStats(false);
      showToast('Analysis Failed', result.message || 'Failed to analyze URL', 'error');
    }
  };

  // Handle Contact Search
  const handleSearch = async () => {
    if (!searchUrl.trim()) {
      showToast('Invalid Input', 'Please enter an Apollo.io URL', 'warning');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);
    setCurrentPage(1);

    const result = await searchContactsFromApolloUrl(searchUrl, {
      limit,
      offset: 0,
      view: viewMode,
    });

    setSearchLoading(false);

    if (result.success && result.data) {
      setSearchResult(result.data);
      if (result.data.unmapped_categories.length > 0) {
        const unmappedNames = new Set(result.data.unmapped_categories.map(c => c.name));
        setExpandedUnmappedCategories(unmappedNames);
      }
      updateStats(true, result.data.results.length);
      showToast(
        'Search Complete!',
        `Found ${result.data.results.length} contact(s) matching your criteria`,
        'success'
      );
    } else {
      setSearchError(result.message || 'Failed to search contacts');
      updateStats(false);
      showToast('Search Failed', result.message || 'Failed to search contacts', 'error');
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
  const loadExample = (url: string, target: 'analyze' | 'search') => {
    if (target === 'analyze') {
      setAnalyzeUrl(url);
      setAnalyzeResult(null);
      setAnalyzeError(null);
      setActiveTab('analyzer');
    } else {
      setSearchUrl(url);
      setSearchResult(null);
      setSearchError(null);
      setActiveTab('search');
    }
    showToast('Example Loaded', 'Example URL loaded successfully', 'info');
  };

  // Clear all results
  const clearAllResults = () => {
    setAnalyzeUrl('');
    setAnalyzeResult(null);
    setAnalyzeError(null);
    setSearchUrl('');
    setSearchResult(null);
    setSearchError(null);
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
    a.download = `apollo-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Exported!', 'Results exported successfully', 'success');
  };

  return (
    <div className="apollo-page">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} position="top-right" />

      {/* Page Header */}
      <div className="apollo-page-header">
        <div className="apollo-page-header-content">
          <div>
            <h1 className="apollo-page-title">
              Apollo.io URL Tools
            </h1>
            <p className="apollo-page-description">
              Analyze Apollo.io URLs and search your contact database using Apollo search criteria
            </p>
          </div>
          <div className="apollo-page-actions">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllResults}
              disabled={!analyzeResult && !searchResult}
            >
              <DeleteIcon />
              Clear All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportResults}
              disabled={!analyzeResult && !searchResult}
            >
              <DownloadIcon />
              Export
            </Button>
          </div>
        </div>

        {/* Session Stats */}
        <div className="apollo-stats-wrapper">
          <ApolloStatsCards stats={sessionStats} />
        </div>
      </div>

      {/* Example URLs */}
      <Card>
        <CardContent className="apollo-example-card-content">
          <div className="apollo-example-header">
            <InfoIcon className="apollo-example-icon" />
            <div>
              <h3 className="apollo-example-title">Example Apollo URLs</h3>
              <p className="apollo-example-description">
                Click to load an example URL into either the analyzer or contact search
              </p>
            </div>
          </div>
          <div className="apollo-example-list">
            {EXAMPLE_URLS.map((example, index) => (
              <div
                key={index}
                className="apollo-example-item"
              >
                <div className="apollo-example-item-content">
                  <div className="apollo-example-item-label">
                    {example.label}
                  </div>
                  <div className="apollo-example-item-url">
                    {example.url}
                  </div>
                </div>
                <div className="apollo-example-item-actions">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadExample(example.url, 'analyze')}
                  >
                    Analyze
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadExample(example.url, 'search')}
                  >
                    Search
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Interface */}
      <div className="apollo-tabbed-interface">
        {/* Tab Headers */}
        <div className="apollo-tabs">
          <button
            onClick={() => setActiveTab('analyzer')}
            className={`apollo-tab-button ${activeTab === 'analyzer' ? 'apollo-tab-button--active' : 'apollo-tab-button--inactive'}`}
          >
            URL Analyzer
            {analyzeResult && (
              <span className="apollo-tab-badge">
                ✓
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`apollo-tab-button ${activeTab === 'search' ? 'apollo-tab-button--active' : 'apollo-tab-button--inactive'}`}
          >
            Contact Search
            {searchResult && (
              <span className="apollo-tab-badge">
                {searchResult.results.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <Card>
          <CardContent className="apollo-tab-content">
            {/* Analyzer Tab */}
            {activeTab === 'analyzer' && (
              <div>
                <div className="apollo-section-header">
                  <h2 className="apollo-section-title">
                    Apollo URL Analyzer
                  </h2>
                  <p className="apollo-section-description">
                    Parse and analyze Apollo.io search URLs to understand the parameters and filters
                  </p>
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
                        value={analyzeUrl}
                        onChange={(e) => setAnalyzeUrl(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                        className="apollo-input-full-width"
                      />
                      {analyzeUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAnalyzeUrl('');
                            setAnalyzeResult(null);
                            setAnalyzeError(null);
                          }}
                        >
                          <XMarkIcon />
                        </Button>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzeLoading || !analyzeUrl.trim()}
                    style={{ width: '100%' }}
                  >
                    {analyzeLoading ? (
                      <>
                        <div className="apollo-spinner" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <SearchIcon />
                        Analyze URL
                      </>
                    )}
                  </Button>
                </div>

                {/* Loading State */}
                {analyzeLoading && <ApolloAnalyzerSkeleton />}

                {/* Error Display */}
                {!analyzeLoading && analyzeError && (
                  <ApolloEmptyState
                    variant="error"
                    description={analyzeError}
                    action={{
                      label: 'Try Again',
                      onClick: handleAnalyze,
                    }}
                  />
                )}

                {/* Empty State */}
                {!analyzeLoading && !analyzeResult && !analyzeError && (
                  <ApolloEmptyState variant="no-analysis" />
                )}

                {/* Results Display */}
                {!analyzeLoading && analyzeResult && (
                  <div className="apollo-results">
                    {/* Success Message */}
                    <div className="apollo-success-message">
                      <SuccessIcon className="apollo-success-icon" />
                      <div className="apollo-success-content">
                        <h4 className="apollo-success-title">URL Analyzed Successfully</h4>
                        <p className="apollo-success-description">
                          Found {analyzeResult.statistics.total_parameters} parameter(s) across{' '}
                          {analyzeResult.statistics.categories_used} categor{analyzeResult.statistics.categories_used === 1 ? 'y' : 'ies'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(analyzeResult.url)}
                      >
                        {copiedUrl ? (
                          <CheckIcon className="apollo-copy-icon apollo-copy-icon--success" />
                        ) : (
                          <CopyIcon className="apollo-copy-icon" />
                        )}
                      </Button>
                    </div>

                    {/* URL Structure */}
                    <div className="apollo-section">
                      <h3 className="apollo-section-subtitle">URL Structure</h3>
                      <div className="apollo-url-structure">
                        <div className="apollo-url-structure-item">
                          <span className="apollo-url-structure-label">Base URL:</span>
                          <span className="apollo-url-structure-value">
                            {analyzeResult.url_structure.base_url}
                          </span>
                        </div>
                        {analyzeResult.url_structure.hash_path && (
                          <div className="apollo-url-structure-item">
                            <span className="apollo-url-structure-label">Hash Path:</span>
                            <span className="apollo-url-structure-value">
                              {analyzeResult.url_structure.hash_path}
                            </span>
                          </div>
                        )}
                        {analyzeResult.url_structure.query_string && (
                          <div className="apollo-url-structure-item">
                            <span className="apollo-url-structure-label">Query String:</span>
                            <div className="apollo-url-structure-query">
                              {analyzeResult.url_structure.query_string}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="apollo-section">
                      <h3 className="apollo-section-subtitle">Statistics</h3>
                      <div className="apollo-stats-grid">
                        <div className="apollo-stat-card">
                          <div className="apollo-stat-value">
                            {analyzeResult.statistics.total_parameters}
                          </div>
                          <div className="apollo-stat-label">Total Parameters</div>
                        </div>
                        <div className="apollo-stat-card">
                          <div className="apollo-stat-value">
                            {analyzeResult.statistics.total_parameter_values}
                          </div>
                          <div className="apollo-stat-label">Total Values</div>
                        </div>
                        <div className="apollo-stat-card">
                          <div className="apollo-stat-value">
                            {analyzeResult.statistics.categories_used}
                          </div>
                          <div className="apollo-stat-label">Categories Used</div>
                        </div>
                        <div className="apollo-stat-card">
                          <div className="apollo-stat-value">
                            {analyzeResult.categories.reduce((sum, cat) => sum + cat.total_parameters, 0)}
                          </div>
                          <div className="apollo-stat-label">Categorized Params</div>
                        </div>
                      </div>
                    </div>

                    {/* Parameter Categories */}
                    <div className="apollo-section">
                      <h3 className="apollo-section-subtitle">Parameter Categories</h3>
                      <div className="apollo-categories-list">
                        {analyzeResult.categories.map((category) => (
                          <div
                            key={category.name}
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
                                  <div key={idx} className="apollo-parameter-item">
                                    <div className="apollo-parameter-name">{param.name}</div>
                                    <div className="apollo-parameter-description">
                                      {param.description}
                                    </div>
                                    <div className="apollo-parameter-values">
                                      {param.values.map((value, vIdx) => (
                                        <span
                                          key={vIdx}
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

                    {/* Raw Parameters */}
                    <div className="apollo-section">
                      <button
                        onClick={() => setShowRawParams(!showRawParams)}
                        className="apollo-raw-toggle"
                      >
                        {showRawParams ? (
                          <ChevronDownIcon className="apollo-raw-toggle-icon" />
                        ) : (
                          <ChevronRightIcon className="apollo-raw-toggle-icon" />
                        )}
                        Raw Parameters (JSON)
                      </button>

                      {showRawParams && (
                        <div className="apollo-raw-content">
                          <pre className="apollo-raw-pre">
                            {JSON.stringify(analyzeResult.raw_parameters, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
              <div>
                <div className="apollo-section-header">
                  <h2 className="apollo-section-title">
                    Contact Search from Apollo URL
                  </h2>
                  <p className="apollo-section-description">
                    Search your contact database using Apollo.io URL parameters
                  </p>
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
                        value={searchUrl}
                        onChange={(e) => setSearchUrl(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="apollo-input-full-width"
                      />
                      {searchUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSearchUrl('');
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
                      <label htmlFor="apollo-view-mode" className="apollo-input-label">
                        View Mode
                      </label>
                      <select
                        id="apollo-view-mode"
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as 'simple' | 'full')}
                        className="input"
                        aria-label="View mode selection"
                      >
                        <option value="full">Full Details</option>
                        <option value="simple">Simple View</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="apollo-results-per-page" className="apollo-input-label">
                        Results Per Page
                      </label>
                      <select
                        id="apollo-results-per-page"
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="input"
                        aria-label="Results per page"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    onClick={handleSearch}
                    disabled={searchLoading || !searchUrl.trim()}
                    style={{ width: '100%' }}
                  >
                    {searchLoading ? (
                      <>
                        <div className="apollo-spinner" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <SearchIcon />
                        Search Contacts
                      </>
                    )}
                  </Button>
                </div>

                {/* Loading State */}
                {searchLoading && <ApolloContactsSkeleton />}

                {/* Error Display */}
                {!searchLoading && searchError && (
                  <ApolloEmptyState
                    variant="error"
                    description={searchError}
                    action={{
                      label: 'Try Again',
                      onClick: handleSearch,
                    }}
                  />
                )}

                {/* Empty State */}
                {!searchLoading && !searchResult && !searchError && (
                  <ApolloEmptyState variant="no-analysis" />
                )}

                {/* Results Display */}
                {!searchLoading && searchResult && (
                  <div className="apollo-results">
                    {/* Mapping Summary */}
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
                                key={idx}
                                className="apollo-mapping-tag"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Unmapped Parameters */}
                    {searchResult.unmapped_categories.length > 0 && (
                      <div className="apollo-section">
                        <h4 className="apollo-section-subtitle">Unmapped Parameters</h4>
                        <div className="apollo-unmapped-list">
                          {searchResult.unmapped_categories.map((category) => (
                            <div
                              key={category.name}
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
                                    <div key={idx} className="apollo-unmapped-parameter">
                                      <div className="apollo-unmapped-parameter-name">
                                        {param.name}
                                      </div>
                                      <div className="apollo-unmapped-parameter-reason">
                                        Reason: {param.reason}
                                      </div>
                                      <div className="apollo-unmapped-parameter-values">
                                        {param.values.map((value, vIdx) => (
                                          <span
                                            key={vIdx}
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
                        <h4 className="apollo-results-title">
                          Contact Results ({searchResult.results.length})
                        </h4>
                      </div>

                      {searchResult.results.length === 0 ? (
                        <ApolloEmptyState
                          variant="no-contacts"
                          action={{
                            label: 'View Unmapped Parameters',
                            onClick: () => {
                              // Scroll to unmapped section
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            },
                          }}
                        />
                      ) : (
                        <div className="apollo-contacts-grid">
                          {searchResult.results.map((contact) => (
                            <ContactCard key={contact.id} contact={contact} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pagination Info */}
                    {(searchResult.next || searchResult.previous) && (
                      <div className="apollo-pagination">
                        <div className="apollo-pagination-info">
                          Showing {searchResult.results.length} contact(s)
                        </div>
                        <div className="apollo-pagination-actions">
                          {searchResult.previous && (
                            <Button variant="outline" size="sm" disabled>
                              <ChevronLeftIcon />
                              Previous
                            </Button>
                          )}
                          {searchResult.next && (
                            <Button variant="outline" size="sm" disabled>
                              Next
                              <ChevronRightPaginationIcon />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
