/**
 * Company Contact Filter Drawer Component
 * 
 * Comprehensive filter drawer for company contacts with multiple filter categories.
 * Supports identity filters, professional info, location, status, exclusions, and date ranges.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CompanyContactFilters } from '../../types/company';
import { 
  XMarkIcon, 
  FilterIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '../icons/IconComponents';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';

interface CompanyContactFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CompanyContactFilters;
  onFiltersChange: (filters: CompanyContactFilters) => void;
  onApply: () => void;
  onClear: () => void;
  className?: string;
}

/**
 * Collapsible Section Component
 */
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="company-contact-filter-drawer__collapsible-section">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="company-contact-filter-drawer__collapsible-trigger"
      >
        <h4 className="company-contact-filter-drawer__collapsible-title">{title}</h4>
        {isOpen ? (
          <ChevronUpIcon className="company-contact-filter-drawer__collapsible-icon" />
        ) : (
          <ChevronDownIcon className="company-contact-filter-drawer__collapsible-icon" />
        )}
      </button>
      {isOpen && <div className="company-contact-filter-drawer__collapsible-content">{children}</div>}
    </div>
  );
};

/**
 * Multi-Input Component for Exclusion Filters
 */
interface MultiInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

const MultiInput: React.FC<MultiInputProps> = ({
  label,
  values,
  onChange,
  placeholder = 'Add item...',
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim() && !values.includes(inputValue.trim())) {
      onChange([...values, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemove = (value: string) => {
    onChange(values.filter(v => v !== value));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="company-contact-filter-drawer__multi-input">
      <label className="company-contact-filter-drawer__multi-input-label">
        {label}
      </label>
      <div className="company-contact-filter-drawer__multi-input-controls">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="company-contact-filter-drawer__multi-input-field"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
        >
          Add
        </Button>
      </div>
      {values.length > 0 && (
        <div className="company-contact-filter-drawer__multi-input-badges">
          {values.map((value, idx) => (
            <Badge
              key={idx}
              variant="glass"
              className="company-contact-filter-drawer__multi-input-badge"
            >
              {value}
              <button
                onClick={() => handleRemove(value)}
                className="company-contact-filter-drawer__multi-input-remove-btn"
              >
                <XMarkIcon className="company-contact-filter-drawer__multi-input-remove-icon" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export const CompanyContactFilterDrawer: React.FC<CompanyContactFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onClear,
  className,
}) => {
  const [localFilters, setLocalFilters] = useState<CompanyContactFilters>(filters);

  // Sync local filters with prop changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof CompanyContactFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply();
  };

  const handleClear = () => {
    const emptyFilters: CompanyContactFilters = {
      exclude_titles: [],
      exclude_contact_locations: [],
      exclude_seniorities: [],
      exclude_departments: [],
    };
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    onClear();
  };

  // Count active filters
  const activeFilterCount = Object.entries(localFilters).filter(([key, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  }).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="company-contact-filter-drawer__backdrop"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`company-contact-filter-drawer__panel${className ? ' ' + className : ''}`}
      >
        {/* Header */}
        <div className="company-contact-filter-drawer__header">
          <div className="company-contact-filter-drawer__header-content">
            <div className="company-contact-filter-drawer__header-left">
              <FilterIcon className="company-contact-filter-drawer__header-icon" />
              <h3 className="company-contact-filter-drawer__header-title">
                Filter Contacts
              </h3>
            </div>
            <button
              onClick={onClose}
              className="company-contact-filter-drawer__close-btn"
              aria-label="Close filters"
            >
              <XMarkIcon className="company-contact-filter-drawer__close-icon" />
            </button>
          </div>
          {activeFilterCount > 0 && (
            <p className="company-contact-filter-drawer__header-info">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </p>
          )}
        </div>

        {/* Filter Content */}
        <div className="company-contact-filter-drawer__body">
          {/* Basic Info */}
          <CollapsibleSection title="Basic Information" defaultOpen={true}>
            <Input
              label="First Name"
              value={localFilters.first_name || ''}
              onChange={(e) => handleFilterChange('first_name', e.target.value)}
              placeholder="Search by first name..."
            />
            <Input
              label="Last Name"
              value={localFilters.last_name || ''}
              onChange={(e) => handleFilterChange('last_name', e.target.value)}
              placeholder="Search by last name..."
            />
            <Input
              label="Email"
              type="email"
              value={localFilters.email || ''}
              onChange={(e) => handleFilterChange('email', e.target.value)}
              placeholder="Search by email..."
            />
          </CollapsibleSection>

          {/* Professional Info */}
          <CollapsibleSection title="Professional Information" defaultOpen={true}>
            <Input
              label="Title"
              value={localFilters.title || ''}
              onChange={(e) => handleFilterChange('title', e.target.value)}
              placeholder="e.g., Software Engineer"
            />
            <Select
              label="Seniority"
              value={localFilters.seniority || ''}
              onChange={(e) => handleFilterChange('seniority', e.target.value)}
              options={[
                { value: '', label: 'All Seniorities' },
                { value: 'junior', label: 'Junior' },
                { value: 'mid', label: 'Mid' },
                { value: 'senior', label: 'Senior' },
                { value: 'executive', label: 'Executive' }
              ]}
            />
            <Input
              label="Department"
              value={localFilters.department || ''}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              placeholder="e.g., Engineering"
            />
          </CollapsibleSection>

          {/* Location */}
          <CollapsibleSection title="Location" defaultOpen={false}>
            <Input
              label="City"
              value={localFilters.city || ''}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              placeholder="e.g., San Francisco"
            />
            <Input
              label="State"
              value={localFilters.state || ''}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              placeholder="e.g., CA"
            />
            <Input
              label="Country"
              value={localFilters.country || ''}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              placeholder="e.g., United States"
            />
          </CollapsibleSection>

          {/* Status */}
          <CollapsibleSection title="Status" defaultOpen={false}>
            <Select
              label="Email Status"
              value={localFilters.email_status || ''}
              onChange={(e) => handleFilterChange('email_status', e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'verified', label: 'Verified' },
                { value: 'unverified', label: 'Unverified' },
                { value: 'bounced', label: 'Bounced' },
                { value: 'catch_all', label: 'Catch All' }
              ]}
            />
            <Input
              label="Stage"
              value={localFilters.stage || ''}
              onChange={(e) => handleFilterChange('stage', e.target.value)}
              placeholder="e.g., Lead, Customer"
            />
          </CollapsibleSection>

          {/* Exclusion Filters */}
          <CollapsibleSection title="Exclusions" defaultOpen={false}>
            <MultiInput
              label="Exclude Titles"
              values={localFilters.exclude_titles || []}
              onChange={(values) => handleFilterChange('exclude_titles', values)}
              placeholder="Add title to exclude..."
            />
            <MultiInput
              label="Exclude Departments"
              values={localFilters.exclude_departments || []}
              onChange={(values) => handleFilterChange('exclude_departments', values)}
              placeholder="Add department to exclude..."
            />
            <MultiInput
              label="Exclude Seniorities"
              values={localFilters.exclude_seniorities || []}
              onChange={(values) => handleFilterChange('exclude_seniorities', values)}
              placeholder="Add seniority to exclude..."
            />
          </CollapsibleSection>

          {/* Date Ranges */}
          <CollapsibleSection title="Date Ranges" defaultOpen={false}>
            <Input
              label="Created After"
              type="date"
              value={localFilters.created_at_after?.split('T')[0] || ''}
              onChange={(e) => {
                const value = e.target.value ? `${e.target.value}T00:00:00Z` : '';
                handleFilterChange('created_at_after', value);
              }}
            />
            <Input
              label="Created Before"
              type="date"
              value={localFilters.created_at_before?.split('T')[0] || ''}
              onChange={(e) => {
                const value = e.target.value ? `${e.target.value}T23:59:59Z` : '';
                handleFilterChange('created_at_before', value);
              }}
            />
            <Input
              label="Updated After"
              type="date"
              value={localFilters.updated_at_after?.split('T')[0] || ''}
              onChange={(e) => {
                const value = e.target.value ? `${e.target.value}T00:00:00Z` : '';
                handleFilterChange('updated_at_after', value);
              }}
            />
            <Input
              label="Updated Before"
              type="date"
              value={localFilters.updated_at_before?.split('T')[0] || ''}
              onChange={(e) => {
                const value = e.target.value ? `${e.target.value}T23:59:59Z` : '';
                handleFilterChange('updated_at_before', value);
              }}
            />
          </CollapsibleSection>
        </div>

        {/* Footer Actions */}
        <div className="company-contact-filter-drawer__footer">
          <Button
            variant="primary"
            onClick={handleApply}
            className="company-contact-filter-drawer__footer-btn"
          >
            Apply Filters
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Button>
          <Button
            variant="ghost"
            onClick={handleClear}
            className="company-contact-filter-drawer__footer-btn"
            disabled={activeFilterCount === 0}
          >
            Clear All Filters
          </Button>
        </div>
      </div>
    </>
  );
};

