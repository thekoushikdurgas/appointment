/**
 * Companies Page
 * 
 * Main page for managing companies with full CRUD operations,
 * filtering, searching, sorting, and pagination.
 */

'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Company, CompanyCreate, CompanyUpdate, CompanyFilters } from '@/types/company';
import {
  SearchIcon,
  XMarkIcon,
  FilterIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  BuildingIcon,
  UsersIcon,
  DollarIcon,
  MapPinIcon,
  GlobeAltIcon,
  LinkedInIcon,
  EditIcon,
  DeleteIcon,
  CalendarIcon,
  DownloadIcon,
  CheckIcon,
} from '@components/icons/IconComponents';
import { useDebounce } from '@hooks/useDebounce';
import {
  fetchCompanies,
  getCompanyCount,
  createCompany,
  updateCompany,
  deleteCompany,
} from '@services/company';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@components/ui/Table';
import { Card, CardContent } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Tooltip } from '@components/ui/Tooltip';
import { CompanyCard } from '@components/companies/CompanyCard';
import { CompanyDetailsModal } from '@components/companies/CompanyDetailsModal';
import { CompanyFormModal } from '@components/companies/CompanyFormModal';
import { CompanyFilterDrawer } from '@components/companies/CompanyFilterDrawer';
import { CompanySkeletonLoader, CompanyStatsSkeletonLoader } from '@components/companies/CompanySkeletonLoader';
import { CompanyEmptyState } from '@components/companies/CompanyEmptyState';
import { ExportModal } from '@components/contacts/ExportModal';

type SortableColumn = 'name' | 'employeesCount' | 'annualRevenue' | 'totalFunding' | 'created_at';
type SortDirection = 'asc' | 'desc';

interface Filters extends CompanyFilters {
  name?: string;
  industries?: string;
  keywords?: string;
  technologies?: string;
  city?: string;
  state?: string;
  country?: string;
  employees_min?: string | number;
  employees_max?: string | number;
  annual_revenue_min?: string | number;
  annual_revenue_max?: string | number;
  total_funding_min?: string | number;
  total_funding_max?: string | number;
  website?: string;
  phone_number?: string;
  linkedin_url?: string;
  created_at_after?: string;
  created_at_before?: string;
  exclude_industries?: string[];
  exclude_keywords?: string[];
  exclude_technologies?: string[];
}

const initialFilters: Filters = {
  name: '',
  industries: '',
  keywords: '',
  technologies: '',
  city: '',
  state: '',
  country: '',
  employees_min: '',
  employees_max: '',
  annual_revenue_min: '',
  annual_revenue_max: '',
  total_funding_min: '',
  total_funding_max: '',
  website: '',
  phone_number: '',
  linkedin_url: '',
  created_at_after: '',
  created_at_before: '',
  exclude_industries: [],
  exclude_keywords: [],
  exclude_technologies: [],
};

export default function CompaniesPage() {
  // State management
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Ref for search input
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  
  // Sorting
  const [sortColumn, setSortColumn] = useState<SortableColumn>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursor, setPrevCursor] = useState<string | null>(null);
  
  // Modals
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Selection state
  const [selectedCompanyUuids, setSelectedCompanyUuids] = useState<Set<string>>(new Set());
  
  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K - Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        showToast('Search focused', 'success');
      }
      
      // Cmd/Ctrl + F - Toggle filters
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setShowFilters(prev => !prev);
        showToast(showFilters ? 'Filters closed' : 'Filters opened', 'success');
      }
      
      // Cmd/Ctrl + N - New company
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleCreateCompany();
      }
      
      // Escape - Close modals
      if (e.key === 'Escape') {
        if (showDetailsModal) {
          setShowDetailsModal(false);
          setSelectedCompany(null);
        }
        if (showFormModal) {
          setShowFormModal(false);
          setEditingCompany(null);
        }
        if (showFilters) {
          setShowFilters(false);
        }
      }
      
      // Arrow keys for pagination (when not in input)
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        if (e.key === 'ArrowLeft' && currentPage > 1) {
          e.preventDefault();
          handlePrevPage();
        }
        if (e.key === 'ArrowRight' && currentPage < totalPages) {
          e.preventDefault();
          handleNextPage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDetailsModal, showFormModal, showFilters, currentPage, totalCount, pageSize]);

  // Fetch companies
  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchCompanies({
        search: debouncedSearchTerm,
        filters,
        sortColumn,
        sortDirection,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        cursor,
      });

      if (result.error) {
        setError('Failed to load companies. Please try again.');
        setCompanies([]);
        setTotalCount(0);
      } else {
        setCompanies(result.companies);
        setTotalCount(result.count);
        setNextCursor(result.next ? new URL(result.next).searchParams.get('cursor') : null);
        setPrevCursor(result.previous ? new URL(result.previous).searchParams.get('cursor') : null);
      }
    } catch (err) {
      console.error('Error loading companies:', err);
      setError('Failed to load companies. Please try again.');
      setCompanies([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, filters, sortColumn, sortDirection, currentPage, pageSize, cursor]);

  // Load companies on mount and when dependencies change
  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // Handle sort
  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Handle pagination
  const handleNextPage = () => {
    if (nextCursor) {
      setCursor(nextCursor);
      setCurrentPage(currentPage + 1);
    } else if (currentPage * pageSize < totalCount) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (prevCursor) {
      setCursor(prevCursor);
      setCurrentPage(currentPage - 1);
    } else if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setCursor(null);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
    setCursor(null);
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== '' && value !== undefined && value !== null;
    });
  }, [filters]);

  // Selection helper functions
  const toggleCompanySelection = useCallback((uuid: string | undefined) => {
    if (!uuid) return;
    setSelectedCompanyUuids(prev => {
      const newSet = new Set(prev);
      if (newSet.has(uuid)) {
        newSet.delete(uuid);
      } else {
        newSet.add(uuid);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const allUuids = companies.filter(c => c.uuid).map(c => c.uuid!);
    if (allUuids.length === 0) return;
    
    const allSelected = allUuids.every(uuid => selectedCompanyUuids.has(uuid));
    if (allSelected) {
      // Deselect all
      setSelectedCompanyUuids(new Set());
    } else {
      // Select all
      setSelectedCompanyUuids(new Set(allUuids));
    }
  }, [companies, selectedCompanyUuids]);

  const isSelectAllChecked = useMemo(() => {
    const allUuids = companies.filter(c => c.uuid).map(c => c.uuid!);
    return allUuids.length > 0 && allUuids.every(uuid => selectedCompanyUuids.has(uuid));
  }, [companies, selectedCompanyUuids]);

  const isSelectAllIndeterminate = useMemo(() => {
    const allUuids = companies.filter(c => c.uuid).map(c => c.uuid!);
    if (allUuids.length === 0) return false;
    const selectedCount = allUuids.filter(uuid => selectedCompanyUuids.has(uuid)).length;
    return selectedCount > 0 && selectedCount < allUuids.length;
  }, [companies, selectedCompanyUuids]);

  // Handle company actions
  const handleViewDetails = (company: Company) => {
    setSelectedCompany(company);
    setShowDetailsModal(true);
  };

  const handleCreateCompany = () => {
    setEditingCompany(null);
    setShowFormModal(true);
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setShowFormModal(true);
    setShowDetailsModal(false);
  };

  const handleDeleteCompany = async (company: Company) => {
    if (!confirm(`Are you sure you want to delete "${company.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await deleteCompany(company.uuid);
      if (result.success) {
        showToast('Company deleted successfully', 'success');
        loadCompanies();
        setShowDetailsModal(false);
      } else {
        showToast(result.message || 'Failed to delete company', 'error');
      }
    } catch (err) {
      console.error('Error deleting company:', err);
      showToast('Failed to delete company', 'error');
    }
  };

  const handleSubmitForm = async (data: CompanyCreate | CompanyUpdate) => {
    setIsSubmitting(true);
    
    try {
      let result;
      if (editingCompany) {
        result = await updateCompany(editingCompany.uuid, data as CompanyUpdate);
      } else {
        result = await createCompany(data as CompanyCreate);
      }

      if (result.success) {
        showToast(
          editingCompany ? 'Company updated successfully' : 'Company created successfully',
          'success'
        );
        setShowFormModal(false);
        setEditingCompany(null);
        loadCompanies();
      } else {
        showToast(result.message || 'Failed to save company', 'error');
      }
    } catch (err) {
      console.error('Error saving company:', err);
      showToast('Failed to save company', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format currency
  const formatCurrency = (amount?: number): string => {
    if (!amount) return 'N/A';
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`;
    }
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
  };

  const formatNumber = (num?: number): string => {
    if (!num) return 'N/A';
    return num.toLocaleString();
  };

  // Render sort icon
  const renderSortIcon = (column: SortableColumn) => {
    if (sortColumn !== column) {
      return <ChevronUpDownIcon className="companies-table-sort-icon" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="companies-table-sort-icon companies-table-sort-icon--active" />
    ) : (
      <ChevronDownIcon className="companies-table-sort-icon companies-table-sort-icon--active" />
    );
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // Calculate stats
  const stats = useMemo(() => {
    if (loading || companies.length === 0) return null;
    
    const totalEmployees = companies.reduce((sum, c) => sum + (c.employeesCount || 0), 0);
    const totalRevenue = companies.reduce((sum, c) => sum + (c.annualRevenue || 0), 0);
    const totalFunding = companies.reduce((sum, c) => sum + (c.totalFunding || 0), 0);
    const avgEmployees = Math.round(totalEmployees / companies.length);
    
    return {
      total: totalCount,
      avgEmployees,
      totalRevenue,
      totalFunding,
    };
  }, [companies, totalCount, loading]);

  return (
    <div className="companies-page">
      {/* Header with Glassmorphism */}
      <div className="companies-page-header">
        <div className="companies-page-header-content">
          <div>
            <div className="companies-page-header-title-wrapper">
              <div className="companies-page-header-icon-wrapper">
                <BuildingIcon className="companies-page-header-icon" />
              </div>
              <h1 className="companies-page-title">Companies</h1>
            </div>
            <p className="companies-page-description">
              Manage and explore company data with advanced filtering and search
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleCreateCompany}
            leftIcon={<PlusIcon />}
            className="companies-page-header-create-btn"
          >
            Create Company
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <CompanyStatsSkeletonLoader />
      ) : stats ? (
        <div className="companies-stats-grid">
          <div className="companies-stats-card">
            <div className="companies-stats-card-header">
              <div className="companies-stats-card-icon">
                <BuildingIcon />
              </div>
              <Badge variant="glass-primary" size="sm">Total</Badge>
            </div>
            <p className="companies-stats-card-value">{stats.total.toLocaleString()}</p>
            <p className="companies-stats-card-label">Companies</p>
          </div>

          <div className="companies-stats-card" style={{ '--animation-delay': '50ms' } as React.CSSProperties}>
            <div className="companies-stats-card-header">
              <div className="companies-stats-card-icon">
                <UsersIcon />
              </div>
              <Badge variant="glass-primary" size="sm">Avg</Badge>
            </div>
            <p className="companies-stats-card-value">{stats.avgEmployees.toLocaleString()}</p>
            <p className="companies-stats-card-label">Employees</p>
          </div>

          <div className="companies-stats-card" style={{ '--animation-delay': '100ms' } as React.CSSProperties}>
            <div className="companies-stats-card-header">
              <div className="companies-stats-card-icon">
                <DollarIcon />
              </div>
              <Badge variant="glass-success" size="sm">Total</Badge>
            </div>
            <p className="companies-stats-card-value">{formatCurrency(stats.totalRevenue)}</p>
            <p className="companies-stats-card-label">Revenue</p>
          </div>

          <div className="companies-stats-card" style={{ '--animation-delay': '150ms' } as React.CSSProperties}>
            <div className="companies-stats-card-header">
              <div className="companies-stats-card-icon">
                <DollarIcon />
              </div>
              <Badge variant="glass-success" size="sm">Total</Badge>
            </div>
            <p className="companies-stats-card-value">{formatCurrency(stats.totalFunding)}</p>
            <p className="companies-stats-card-label">Funding</p>
          </div>
        </div>
      ) : null}

      {/* Search and Actions Bar */}
      <div className="companies-search-bar">
        <div className="companies-search-bar-content">
          {/* Search Input */}
          <div className="companies-search-input-wrapper">
            <SearchIcon className="companies-search-icon" />
            <Input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
                setCursor(null);
              }}
              placeholder="Search companies by name, industry, location... (⌘K)"
              className="companies-search-input"
              aria-label="Search companies"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                  setCursor(null);
                }}
                className="companies-search-clear"
              >
                <XMarkIcon />
              </button>
            )}
          </div>

          {/* Filter Button (Mobile) */}
          <Button
            variant="secondary"
            onClick={() => setShowFilters(true)}
            leftIcon={<FilterIcon />}
            className="companies-filter-btn-mobile"
          >
            Filters {hasActiveFilters && `(${Object.values(filters).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length})`}
          </Button>

          {/* Export Button */}
          {selectedCompanyUuids.size > 0 && (
            <Button
              variant="secondary"
              onClick={() => setShowExportModal(true)}
              leftIcon={<DownloadIcon />}
              className="companies-export-btn"
            >
              Export ({selectedCompanyUuids.size})
            </Button>
          )}

          {/* Create Button */}
          <Button
            variant="primary"
            onClick={handleCreateCompany}
            leftIcon={<PlusIcon />}
          >
            <span className="companies-create-btn-text-desktop">Create Company</span>
            <span className="companies-create-btn-text-mobile">Create</span>
          </Button>
        </div>

        {/* Desktop Filters */}
        <div className="companies-filters-desktop">
          <div className="companies-filters-grid">
            <Input
              label="Industries"
              value={filters.industries || ''}
              onChange={(e) => handleFilterChange({ ...filters, industries: e.target.value })}
              placeholder="Technology, Software"
            />
            <Input
              label="City"
              value={filters.city || ''}
              onChange={(e) => handleFilterChange({ ...filters, city: e.target.value })}
              placeholder="San Francisco"
            />
            <Input
              label="Min Employees"
              type="number"
              value={filters.employees_min || ''}
              onChange={(e) => handleFilterChange({ ...filters, employees_min: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Min Revenue ($)"
              type="number"
              value={filters.annual_revenue_min || ''}
              onChange={(e) => handleFilterChange({ ...filters, annual_revenue_min: e.target.value })}
              placeholder="0"
            />
          </div>
          {hasActiveFilters && (
            <div className="companies-filters-summary">
              <span className="companies-filters-summary-text">
                {Object.values(filters).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length} filter(s) active
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="companies-results-summary">
        <p className="companies-results-summary-text">
          {loading ? (
            'Loading...'
          ) : error ? (
            <span className="companies-results-summary-error">
              <span className="companies-results-summary-error-dot" />
              {error}
            </span>
          ) : (
            <>
              Showing <span className="companies-results-summary-strong">{companies.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, totalCount)}</span> of <span className="companies-results-summary-strong">{totalCount.toLocaleString()}</span> companies
            </>
          )}
        </p>
      </div>

      {/* Desktop Table View */}
      <div className="companies-table-wrapper">
        <Table>
          <TableHeader className="companies-table-header">
            <TableRow>
              <TableHead className="companies-table-head companies-table-head--checkbox">
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
                    aria-label="Select all companies"
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
              <TableHead onClick={() => handleSort('name')} className="companies-table-head companies-table-head--sortable">
                <div className="companies-table-head-content">
                  Company Name
                  {renderSortIcon('name')}
                </div>
              </TableHead>
              <TableHead className="companies-table-head">Industries</TableHead>
              <TableHead onClick={() => handleSort('employeesCount')} className="companies-table-head companies-table-head--sortable">
                <div className="companies-table-head-content">
                  Employees
                  {renderSortIcon('employeesCount')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('annualRevenue')} className="companies-table-head companies-table-head--sortable">
                <div className="companies-table-head-content">
                  Revenue
                  {renderSortIcon('annualRevenue')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('totalFunding')} className="companies-table-head companies-table-head--sortable">
                <div className="companies-table-head-content">
                  Funding
                  {renderSortIcon('totalFunding')}
                </div>
              </TableHead>
              <TableHead className="companies-table-head">Location</TableHead>
              <TableHead className="companies-table-head">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <CompanySkeletonLoader count={5} variant="table" />
            ) : companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="companies-table-empty-cell">
                  <CompanyEmptyState
                    variant={searchTerm || hasActiveFilters ? 'no-results' : 'no-data'}
                    onAction={searchTerm || hasActiveFilters ? () => {
                      setSearchTerm('');
                      handleClearFilters();
                    } : handleCreateCompany}
                    actionLabel={searchTerm || hasActiveFilters ? 'Clear Filters' : 'Add Company'}
                  />
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company, index) => {
                const isSelected = company.uuid ? selectedCompanyUuids.has(company.uuid) : false;
                return (
                <TableRow
                  key={company.uuid || `company-${index}`}
                  onClick={() => {
                    if (company.uuid) {
                      window.open(`/companies/${company.uuid}`, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className={`companies-table-row ${isSelected ? 'companies-table-row-selected' : ''}`}
                  title="Click to view company details in new tab"
                >
                  <TableCell 
                    className="companies-table-cell companies-table-cell--compact"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="checkbox-input-wrapper">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleCompanySelection(company.uuid);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${company.name || 'company'}`}
                        className="checkbox-input"
                      />
                      <div 
                        className="checkbox-box"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompanySelection(company.uuid);
                        }}
                      >
                        {isSelected && (
                          <CheckIcon className="checkbox-icon" />
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="companies-table-cell companies-table-cell--name">
                    <div className="companies-table-cell-name-content">
                      <div className="companies-table-cell-name-icon">
                        <BuildingIcon />
                      </div>
                      {company.name || 'Unnamed Company'}
                    </div>
                  </TableCell>
                  <TableCell className="companies-table-cell">
                    {company.industries && company.industries.length > 0 ? (
                      <div className="companies-table-industries">
                        {company.industries.slice(0, 2).map((industry, idx) => (
                          <span key={`${company.uuid}-industry-${idx}-${industry}`} className="companies-table-industry-badge">
                            {industry}
                          </span>
                        ))}
                        {company.industries.length > 2 && (
                          <Badge variant="glass" size="sm">
                            +{company.industries.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="companies-table-cell-empty">-</span>
                    )}
                  </TableCell>
                  <TableCell className="companies-table-cell">{formatNumber(company.employeesCount)}</TableCell>
                  <TableCell className="companies-table-cell">{formatCurrency(company.annualRevenue)}</TableCell>
                  <TableCell className="companies-table-cell">{formatCurrency(company.totalFunding)}</TableCell>
                  <TableCell className="companies-table-cell">
                    {company.metadata?.city || company.metadata?.state || company.metadata?.country ? (
                      <div className="companies-table-location">
                        <MapPinIcon className="companies-table-location-icon" />
                        {[company.metadata?.city, company.metadata?.state, company.metadata?.country]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    ) : (
                      <span className="companies-table-cell-empty">-</span>
                    )}
                  </TableCell>
                  <TableCell className="companies-table-cell">
                    <div className="companies-table-actions">
                      <Tooltip content="Edit">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCompany(company);
                          }}
                          className="companies-table-action-btn companies-table-action-btn--edit"
                          aria-label="Edit company"
                        >
                          <EditIcon />
                        </button>
                      </Tooltip>
                      <Tooltip content="Delete">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCompany(company);
                          }}
                          className="companies-table-action-btn companies-table-action-btn--delete"
                          aria-label="Delete company"
                        >
                          <DeleteIcon />
                        </button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="companies-mobile-view">
        {loading ? (
          <CompanySkeletonLoader count={3} variant="card" />
        ) : companies.length === 0 ? (
          <CompanyEmptyState
            variant={searchTerm || hasActiveFilters ? 'no-results' : 'no-data'}
            onAction={searchTerm || hasActiveFilters ? () => {
              setSearchTerm('');
              handleClearFilters();
            } : handleCreateCompany}
            actionLabel={searchTerm || hasActiveFilters ? 'Clear Filters' : 'Add Company'}
          />
        ) : (
          companies.map((company, index) => (
            <CompanyCard
              key={company.uuid || `company-${index}`}
              company={company}
              onClick={() => {
                if (company.uuid) {
                  window.open(`/companies/${company.uuid}`, '_blank', 'noopener,noreferrer');
                }
              }}
              onEdit={() => handleEditCompany(company)}
              index={index}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && companies.length > 0 && (
        <div className="companies-pagination">
            <div className="companies-pagination-content">
              <Button
                variant="ghost"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                leftIcon={<ChevronLeftIcon />}
              >
                Previous
              </Button>
              <span className="companies-pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="ghost"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                rightIcon={<ChevronRightIcon />}
              >
                Next
              </Button>
            </div>
          </div>
      )}

      {/* Modals */}
      <CompanyDetailsModal
        company={selectedCompany}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedCompany(null);
        }}
        onEdit={handleEditCompany}
        onDelete={handleDeleteCompany}
      />

      <CompanyFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingCompany(null);
        }}
        onSubmit={handleSubmitForm}
        company={editingCompany}
        isSubmitting={isSubmitting}
      />

      <CompanyFilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={handleFilterChange}
        onApply={() => setShowFilters(false)}
        onClear={handleClearFilters}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => {
          setShowExportModal(false);
          setSelectedCompanyUuids(new Set());
        }}
        selectedContactUuids={Array.from(selectedCompanyUuids)}
        exportType="companies"
        currentPageData={companies}
        filters={filters}
        totalCount={totalCount}
        navigateToHistory={true}
        onExportComplete={() => {
          setSelectedCompanyUuids(new Set());
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`companies-toast companies-toast--${toast.type}`}>
          <div className="companies-toast-content">
            <div className={`companies-toast-indicator companies-toast-indicator--${toast.type}`} />
            <span className="companies-toast-message">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

