/**
 * Company Contacts Section Component
 * 
 * Main section component for displaying and managing contacts within a company detail page.
 * Features search, filtering, pagination, sorting, and responsive layouts.
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CompanyContact, CompanyContactFilters } from '@/types/company';
import {
  fetchCompanyContacts,
  getCompanyContactsCount,
} from '@services/company';
import {
  SearchIcon,
  XMarkIcon,
  FilterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  UsersIcon,
  MailIcon,
  PhoneIcon,
  EyeIcon,
  CheckIcon,
} from '@components/icons/IconComponents';
import { useDebounce } from '@hooks/useDebounce';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Tooltip } from '@components/ui/Tooltip';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@components/ui/Table';
import { CompanyContactCard } from './CompanyContactCard';
import { CompanyContactFilterDrawer } from './CompanyContactFilterDrawer';
import { CompanyContactsSkeletonLoader, CompanyContactsFullSkeleton } from './CompanyContactsSkeletonLoader';
import { CompanyContactsEmptyState, CompanyContactsErrorState } from './CompanyContactsEmptyState';
import { ExportModal } from '@components/contacts/ExportModal';
import { DownloadIcon } from '@components/icons/IconComponents';

interface CompanyContactsSectionProps {
  companyUuid: string;
  companyName?: string;
  className?: string;
}

type SortableColumn = 'firstName' | 'lastName' | 'title' | 'seniority' | 'created_at';
type SortDirection = 'asc' | 'desc';

const initialFilters: CompanyContactFilters = {
  exclude_titles: [],
  exclude_contact_locations: [],
  exclude_seniorities: [],
  exclude_departments: [],
};

/**
 * Highlight component for search term highlighting
 */
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
        <mark key={i} className="company-contacts-section__highlight">
          {part}
        </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export const CompanyContactsSection: React.FC<CompanyContactsSectionProps> = ({
  companyUuid,
  companyName,
  className,
}) => {
  // State
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CompanyContactFilters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursor, setPrevCursor] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortableColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedContactUuids, setSelectedContactUuids] = useState<Set<string>>(new Set());
  const [showExportModal, setShowExportModal] = useState(false);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    }).length;
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = activeFilterCount > 0 || debouncedSearchTerm.trim() !== '';

  // Load contacts
  const loadContacts = useCallback(async () => {
    if (!companyUuid) return;

    setLoading(true);
    setError(null);

    try {
      // Build ordering string
      let ordering: string | undefined;
      if (sortColumn) {
        const direction = sortDirection === 'desc' ? '-' : '';
        // Map camelCase to snake_case for API
        const columnMap: Record<SortableColumn, string> = {
          firstName: 'first_name',
          lastName: 'last_name',
          title: 'title',
          seniority: 'seniority',
          created_at: 'created_at',
        };
        ordering = `${direction}${columnMap[sortColumn]}`;
      }

      const result = await fetchCompanyContacts(companyUuid, {
        search: debouncedSearchTerm,
        filters,
        ordering,
        pageSize,
        cursor,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to load contacts');
        setContacts([]);
        setTotalCount(0);
      } else {
        setContacts(result.contacts);
        setTotalCount(result.count);
        
        // Extract cursors from pagination links
        if (result.next) {
          const url = new URL(result.next);
          setNextCursor(url.searchParams.get('cursor'));
        } else {
          setNextCursor(null);
        }
        
        if (result.previous) {
          const url = new URL(result.previous);
          setPrevCursor(url.searchParams.get('cursor'));
        } else {
          setPrevCursor(null);
        }
      }
    } catch (err) {
      console.error('[COMPANY_CONTACTS] Error loading contacts:', err);
      setError('Failed to load contacts. Please try again.');
      setContacts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [companyUuid, debouncedSearchTerm, filters, sortColumn, sortDirection, pageSize, cursor]);

  // Load contacts on mount and when dependencies change
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Handle sort
  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
    setCursor(null);
  };

  // Handle pagination
  const handleNextPage = () => {
    if (nextCursor) {
      setCursor(nextCursor);
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (prevCursor) {
      setCursor(prevCursor);
      setCurrentPage(currentPage - 1);
    } else if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setCursor(null);
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: CompanyContactFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setCursor(null);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setSearchTerm('');
    setCurrentPage(1);
    setCursor(null);
  };

  // Handle retry
  const handleRetry = () => {
    loadContacts();
  };

  // Render sort icon
  const renderSortIcon = (column: SortableColumn) => {
    if (sortColumn !== column) {
      return <ChevronUpDownIcon className="company-contacts-section__table-sort-icon company-contacts-section__table-sort-icon--muted" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="company-contacts-section__table-sort-icon company-contacts-section__table-sort-icon--primary" />
    ) : (
      <ChevronDownIcon className="company-contacts-section__table-sort-icon company-contacts-section__table-sort-icon--primary" />
    );
  };

  // Format full name
  const getFullName = (contact: CompanyContact): string => {
    return [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Unnamed Contact';
  };

  // Handle contact click
  const handleContactClick = (contact: CompanyContact) => {
    if (contact.uuid) {
      window.open(`/contacts/${contact.uuid}`, '_blank', 'noopener,noreferrer');
    }
  };

  // Selection handlers
  const toggleContactSelection = useCallback((uuid: string | undefined) => {
    if (!uuid) return;
    
    setSelectedContactUuids(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(uuid)) {
        newSelection.delete(uuid);
      } else {
        newSelection.add(uuid);
      }
      return newSelection;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const allUuids = contacts.filter(c => c.uuid).map(c => c.uuid!);
    const allSelected = allUuids.length > 0 && allUuids.every(uuid => selectedContactUuids.has(uuid));
    
    if (allSelected) {
      setSelectedContactUuids(new Set());
    } else {
      setSelectedContactUuids(new Set(allUuids));
    }
  }, [contacts, selectedContactUuids]);

  const isSelectAllChecked = useMemo(() => {
    const allUuids = contacts.filter(c => c.uuid).map(c => c.uuid!);
    return allUuids.length > 0 && allUuids.every(uuid => selectedContactUuids.has(uuid));
  }, [contacts, selectedContactUuids]);

  const isSelectAllIndeterminate = useMemo(() => {
    const allUuids = contacts.filter(c => c.uuid).map(c => c.uuid!);
    const selectedCount = allUuids.filter(uuid => selectedContactUuids.has(uuid)).length;
    return selectedCount > 0 && selectedCount < allUuids.length;
  }, [contacts, selectedContactUuids]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className={`company-contacts-section${className ? ' ' + className : ''}`} style={{ animationDelay: '250ms' }}>
      {/* Section Header */}
      <div className="company-contacts-section__header">
        <div className="company-contacts-section__header-content">
          <div className="company-contacts-section__header-left">
            <div className="company-metric-icon company-contacts-section__header-icon-wrapper">
              <UsersIcon className="company-contacts-section__header-icon" />
            </div>
            <div className="company-contacts-section__header-text">
              <h3 className="company-contacts-section__header-title">
                Company Contacts
                {!loading && <span className="company-contacts-section__header-count">({totalCount})</span>}
              </h3>
              {companyName && (
                <p className="company-contacts-section__header-subtitle">
                  Contacts at {companyName}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {selectedContactUuids.size > 0 && (
              <>
                <span style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                  {selectedContactUuids.size} selected
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowExportModal(true)}
                  leftIcon={<DownloadIcon />}
                >
                  Export ({selectedContactUuids.size})
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              onClick={() => setShowFilters(true)}
              leftIcon={<FilterIcon />}
            >
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="glass-primary" size="sm" style={{ marginLeft: '0.5rem' }}>
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="company-contacts-section__search-wrapper">
          <SearchIcon className="company-contacts-section__search-icon" />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
              setCursor(null);
            }}
            placeholder="Search contacts by name, email, title..."
            className="company-contacts-section__search-input"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
                setCursor(null);
              }}
              className="company-contacts-section__search-clear-btn"
            >
              <XMarkIcon className="company-contacts-section__search-clear-icon" />
            </button>
          )}
        </div>

        {/* Results Summary */}
        {!loading && !error && (
          <div className="company-contacts-section__results-summary">
            <p className="company-contacts-section__results-text">
              {contacts.length > 0 ? (
                <>
                  Showing <span className="company-contacts-section__results-number">{(currentPage - 1) * pageSize + 1}</span> - <span className="company-contacts-section__results-number">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="company-contacts-section__results-number">{totalCount.toLocaleString()}</span> contacts
                </>
              ) : (
                'No contacts found'
              )}
            </p>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
              >
                Clear All
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="company-contacts-section__content">
        {loading ? (
          <CompanyContactsSkeletonLoader variant="table" count={5} className="company-contacts-section__table-wrapper" />
        ) : error ? (
          <CompanyContactsErrorState error={error} onRetry={handleRetry} />
        ) : contacts.length === 0 ? (
          <CompanyContactsEmptyState
            variant={hasActiveFilters ? 'no-results' : 'no-contacts'}
            onAction={hasActiveFilters ? handleClearFilters : undefined}
            actionLabel={hasActiveFilters ? 'Clear Filters' : undefined}
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="company-contacts-section__table-wrapper">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="company-contacts-section__table-header company-contacts-section__table-header--checkbox">
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
                    <TableHead onClick={() => handleSort('firstName')} className="company-contacts-section__table-header">
                      <div className="company-contacts-section__table-header-content">
                        Name
                        {renderSortIcon('firstName')}
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('title')} className="company-contacts-section__table-header">
                      <div className="company-contacts-section__table-header-content">
                        Title
                        {renderSortIcon('title')}
                      </div>
                    </TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead onClick={() => handleSort('seniority')} className="company-contacts-section__table-header">
                      <div className="company-contacts-section__table-header-content">
                        Seniority
                        {renderSortIcon('seniority')}
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact, index) => {
                    const isSelected = contact.uuid ? selectedContactUuids.has(contact.uuid) : false;
                    return (
                    <TableRow
                      key={contact.uuid || `contact-${index}`}
                      onClick={() => handleContactClick(contact)}
                      className={`companies-table-row-hover ${isSelected ? 'companies-table-row-selected' : ''}`}
                      style={{ cursor: 'pointer' }}
                      title="Click to view contact details in new tab"
                    >
                      <TableCell 
                        className="company-contacts-section__table-cell company-contacts-section__table-cell--checkbox"
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
                            aria-label={`Select ${getFullName(contact)}`}
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
                      <TableCell className="company-contacts-section__table-cell-name">
                        <div className="company-contacts-section__table-cell-name-content">
                          <div className="company-contacts-section__table-cell-avatar">
                            <UsersIcon className="company-contacts-section__table-cell-avatar-icon" />
                          </div>
                          <div className="company-contacts-section__table-cell-name-text">
                            <p className="company-contacts-section__table-cell-name-text-content">
                              <Highlight text={getFullName(contact)} highlight={debouncedSearchTerm} />
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact.title ? (
                          <Highlight text={contact.title} highlight={debouncedSearchTerm} />
                        ) : (
                          <span className="company-contacts-section__table-cell-empty">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.departments && contact.departments.length > 0 ? (
                          <div className="company-contacts-section__table-cell-departments">
                            {contact.departments.slice(0, 2).map((dept, idx) => (
                              <Badge key={`${contact.uuid}-dept-${idx}-${dept}`} variant="glass" size="sm">
                                {dept}
                              </Badge>
                            ))}
                            {contact.departments.length > 2 && (
                              <Badge variant="glass" size="sm">
                                +{contact.departments.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="company-contacts-section__table-cell-empty">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.email ? (
                          <div className="company-contacts-section__table-cell-email">
                            <MailIcon className="company-contacts-section__table-cell-email-icon" />
                            <span className="company-contacts-section__table-cell-email-text">
                              <Highlight text={contact.email} highlight={debouncedSearchTerm} />
                            </span>
                          </div>
                        ) : (
                          <span className="company-contacts-section__table-cell-empty">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.seniority ? (
                          <Badge variant="glass-primary" size="sm">
                            {contact.seniority.charAt(0).toUpperCase() + contact.seniority.slice(1)}
                          </Badge>
                        ) : (
                          <span className="company-contacts-section__table-cell-empty">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip content="View details">
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactClick(contact);
                            }}
                            aria-label="View contact details"
                          >
                            <EyeIcon className="company-contacts-section__table-cell-action-icon" />
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="company-contacts-section__mobile-view">
              {loading ? (
                <CompanyContactsSkeletonLoader variant="card" count={3} />
              ) : (
                contacts.map((contact, index) => (
                  <CompanyContactCard
                    key={contact.uuid || `contact-${index}`}
                    contact={contact}
                    searchTerm={debouncedSearchTerm}
                    onClick={() => handleContactClick(contact)}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="company-contacts-section__pagination">
                <Button
                  variant="ghost"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  leftIcon={<ChevronLeftIcon />}
                >
                  Previous
                </Button>
                <span className="company-contacts-section__pagination-text">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  onClick={handleNextPage}
                  disabled={!nextCursor && currentPage >= totalPages}
                  rightIcon={<ChevronRightIcon />}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Filter Drawer */}
      <CompanyContactFilterDrawer
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
          setSelectedContactUuids(new Set());
        }}
        selectedContactUuids={Array.from(selectedContactUuids)}
        exportType="contacts"
        currentPageData={contacts}
        totalCount={totalCount}
        navigateToHistory={true}
        onExportComplete={() => {
          setSelectedContactUuids(new Set());
        }}
      />
    </div>
  );
};

