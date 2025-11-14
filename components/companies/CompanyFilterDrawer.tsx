/**
 * CompanyFilterDrawer Component
 * 
 * Mobile-friendly drawer for filtering companies.
 * Provides a slide-in panel with all filter options.
 */

'use client';

import React from 'react';
import { CompanyFilters } from '../../types/company';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { XMarkIcon, FilterIcon } from '../icons/IconComponents';

interface CompanyFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CompanyFilters;
  onFiltersChange: (filters: CompanyFilters) => void;
  onApply: () => void;
  onClear: () => void;
}

export const CompanyFilterDrawer: React.FC<CompanyFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onClear,
}) => {
  const updateFilter = (key: keyof CompanyFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="company-filter-drawer__backdrop"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`company-filter-drawer__panel${isOpen ? ' company-filter-drawer__panel--open' : ''}`}
      >
        {/* Header */}
        <div className="company-filter-drawer__header">
          <div className="company-filter-drawer__header-content">
            <FilterIcon className="company-filter-drawer__header-icon" />
            <h2 className="company-filter-drawer__header-title">Filters</h2>
          </div>
          <button
            onClick={onClose}
            className="company-filter-drawer__close-btn"
            aria-label="Close filters"
          >
            <XMarkIcon className="company-filter-drawer__close-icon" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="company-filter-drawer__body">
          {/* Basic Filters */}
          <div className="company-filter-drawer__section">
            <h3 className="company-filter-drawer__section-title">Basic Information</h3>
            <div className="company-filter-drawer__section-content">
              <Input
                label="Company Name"
                value={filters.name || ''}
                onChange={(e) => updateFilter('name', e.target.value)}
                placeholder="Search by name"
              />

              <Input
                label="Industries"
                value={filters.industries || ''}
                onChange={(e) => updateFilter('industries', e.target.value)}
                placeholder="Technology, Software"
                helperText="Comma-separated for OR logic"
              />

              <Input
                label="Keywords"
                value={filters.keywords || ''}
                onChange={(e) => updateFilter('keywords', e.target.value)}
                placeholder="saas, enterprise"
                helperText="Comma-separated for OR logic"
              />

              <Input
                label="Technologies"
                value={filters.technologies || ''}
                onChange={(e) => updateFilter('technologies', e.target.value)}
                placeholder="Python, AWS"
                helperText="Comma-separated for OR logic"
              />
            </div>
          </div>

          {/* Location Filters */}
          <div className="company-filter-drawer__section">
            <h3 className="company-filter-drawer__section-title">Location</h3>
            <div className="company-filter-drawer__section-content">
              <Input
                label="City"
                value={filters.city || ''}
                onChange={(e) => updateFilter('city', e.target.value)}
                placeholder="San Francisco"
              />

              <Input
                label="State"
                value={filters.state || ''}
                onChange={(e) => updateFilter('state', e.target.value)}
                placeholder="CA"
              />

              <Input
                label="Country"
                value={filters.country || ''}
                onChange={(e) => updateFilter('country', e.target.value)}
                placeholder="United States"
              />
            </div>
          </div>

          {/* Numeric Ranges */}
          <div className="company-filter-drawer__section">
            <h3 className="company-filter-drawer__section-title">Company Size</h3>
            <div className="company-filter-drawer__section-grid">
              <Input
                label="Min Employees"
                type="number"
                value={filters.employees_min || ''}
                onChange={(e) => updateFilter('employees_min', e.target.value)}
                placeholder="0"
              />

              <Input
                label="Max Employees"
                type="number"
                value={filters.employees_max || ''}
                onChange={(e) => updateFilter('employees_max', e.target.value)}
                placeholder="10000"
              />
            </div>
          </div>

          <div className="company-filter-drawer__section">
            <h3 className="company-filter-drawer__section-title">Annual Revenue ($)</h3>
            <div className="company-filter-drawer__section-grid">
              <Input
                label="Min Revenue"
                type="number"
                value={filters.annual_revenue_min || ''}
                onChange={(e) =>
                  updateFilter('annual_revenue_min', e.target.value)
                }
                placeholder="0"
              />

              <Input
                label="Max Revenue"
                type="number"
                value={filters.annual_revenue_max || ''}
                onChange={(e) =>
                  updateFilter('annual_revenue_max', e.target.value)
                }
                placeholder="1000000000"
              />
            </div>
          </div>

          <div className="company-filter-drawer__section">
            <h3 className="company-filter-drawer__section-title">Total Funding ($)</h3>
            <div className="company-filter-drawer__section-grid">
              <Input
                label="Min Funding"
                type="number"
                value={filters.total_funding_min || ''}
                onChange={(e) =>
                  updateFilter('total_funding_min', e.target.value)
                }
                placeholder="0"
              />

              <Input
                label="Max Funding"
                type="number"
                value={filters.total_funding_max || ''}
                onChange={(e) =>
                  updateFilter('total_funding_max', e.target.value)
                }
                placeholder="1000000000"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="company-filter-drawer__section">
            <h3 className="company-filter-drawer__section-title">Contact Information</h3>
            <div className="company-filter-drawer__section-content">
              <Input
                label="Website"
                value={filters.website || ''}
                onChange={(e) => updateFilter('website', e.target.value)}
                placeholder="example.com"
              />

              <Input
                label="Phone Number"
                value={filters.phone_number || ''}
                onChange={(e) => updateFilter('phone_number', e.target.value)}
                placeholder="+1-415-555-0100"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="company-filter-drawer__footer">
          <div className="company-filter-drawer__footer-actions">
            <Button
              variant="ghost"
              onClick={onClear}
              className="company-filter-drawer__footer-btn"
            >
              Clear All
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onApply();
                onClose();
              }}
              className="company-filter-drawer__footer-btn"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

