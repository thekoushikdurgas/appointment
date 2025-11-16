'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Contact, ContactCreate } from '@/types/index';
import { SearchIcon, XMarkIcon, GlobeAltIcon, LinkedInIcon, FacebookIcon, TwitterIcon, OfficeBuildingIcon, ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon, FilterIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, MailIcon, PhoneIcon, BuildingIcon, MapPinIcon, CalendarIcon, UsersIcon, EditIcon, SuccessIcon, AlertTriangleIcon, LoadingSpinner, DownloadIcon, CheckIcon } from '@components/icons/IconComponents';
import { useDebounce } from '@hooks/useDebounce';
import { fetchContacts, fetchDistinctValues, fetchFieldValues, ContactFilters, createContact } from '@services/contact';
import { uploadContactsCSV, getImportJobStatus, pollImportJobStatus, getImportErrors, ImportJob, ImportError } from '@services/import';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@components/ui/Table';
import { Card, CardContent } from '@components/ui/Card';
import { Textarea } from '@components/ui/Textarea';
import { Select } from '@components/ui/Select';
import { Tooltip } from '@components/ui/Tooltip';
import { ContactCard } from '@components/contacts/ContactCard';
import { MobileFilterDrawer } from '@components/contacts/MobileFilterDrawer';
import { ExportModal } from '@components/contacts/ExportModal';
import { filterLogger } from '@utils/filterLogger';

type SortableColumn = 'name' | 'company' | 'title' | 'status' | 'emailStatus' | 'city' | 'state' | 'country' | 'industry' | 'phone' | 'created_at';
type SortDirection = 'asc' | 'desc';

/**
 * Filters Interface
 * 
 * Comprehensive filter options for the contacts page, extending ContactFilters from the API service.
 * Includes all 60+ API parameters organized by category.
 * 
 * **Filter Categories:**
 * - Text Filters (31): Partial matching on names, emails, phones, URLs, etc.
 * - Exact Match Filters (8): Exact matching on status, seniority, stage, and numeric values
 * - Numeric Range Filters (8 pairs): Min/max ranges for employees, revenue, funding
 * - Date Range Filters (4): ISO datetime ranges for created/updated timestamps
 * - Location Filters (2): Full-text search on company and contact locations
 * - Exclusion Filters (9): Array-based filters to exclude specific values
 * 
 * **Usage:**
 * All string filters default to empty string (''), arrays default to [], and status/industry default to 'All'.
 * Empty values and 'All' are filtered out when building API requests.
 */
interface Filters extends ContactFilters {
    status: Contact['status'] | 'All';
    emailStatus: 'All' | 'Verified' | 'Unverified' | 'Bounced';
    industry: string;
    title: string;
    tags: string;
    city: string;
    state: string;
    country: string;
    // Numeric exact match filters
    employees_count: string;
    annual_revenue: string;
    total_funding: string;
    // Numeric range filters
    employees_min: string;
    employees_max: string;
    annual_revenue_min: string;
    annual_revenue_max: string;
    // Person filters
    first_name: string;
    last_name: string;
    email: string;
    departments: string;
    // Phone filters
    work_direct_phone: string;
    home_phone: string;
    mobile_phone: string;
    corporate_phone: string;
    other_phone: string;
    // Company detail filters
    company_name_for_emails: string;
    company_address: string;
    company_city: string;
    company_state: string;
    company_country: string;
    company_phone: string;
    // URL filters
    person_linkedin_url: string;
    company_linkedin_url: string;
    facebook_url: string;
    twitter_url: string;
    website: string;
    // Technology and funding filters
    technologies: string;
    latest_funding: string;
    last_raised_at: string;
    // Additional numeric ranges
    total_funding_min: string;
    total_funding_max: string;
    latest_funding_amount_min: string;
    latest_funding_amount_max: string;
    // Exact match filters
    primary_email_catch_all_status: string;
    seniority: string;
    stage: string;
    // Date range filters (ISO datetime format strings)
    created_at_after: string;
    created_at_before: string;
    updated_at_after: string;
    updated_at_before: string;
    // Location filters
    company_location?: string;
    contact_location?: string;
    // Exclusion filters (multi-value, case-insensitive)
    exclude_company_ids?: string[];
    exclude_titles?: string[];
    exclude_company_locations?: string[];
    exclude_contact_locations?: string[];
    exclude_seniorities?: string[];
    exclude_departments?: string[];
    exclude_technologies?: string[];
    exclude_keywords?: string[];
    exclude_industries?: string[];
}

const initialFilters: Filters = {
    status: 'All',
    emailStatus: 'All',
    industry: 'All',
    title: '',
    tags: '',
    city: '',
    state: '',
    country: '',
    // Numeric exact match filters
    employees_count: '',
    annual_revenue: '',
    total_funding: '',
    // Numeric range filters
    employees_min: '',
    employees_max: '',
    annual_revenue_min: '',
    annual_revenue_max: '',
    // Person filters
    first_name: '',
    last_name: '',
    email: '',
    departments: '',
    // Phone filters
    work_direct_phone: '',
    home_phone: '',
    mobile_phone: '',
    corporate_phone: '',
    other_phone: '',
    // Company detail filters
    company_name_for_emails: '',
    company_address: '',
    company_city: '',
    company_state: '',
    company_country: '',
    company_phone: '',
    // URL filters
    person_linkedin_url: '',
    company_linkedin_url: '',
    facebook_url: '',
    twitter_url: '',
    website: '',
    // Technology and funding filters
    technologies: '',
    latest_funding: '',
    last_raised_at: '',
    // Additional numeric ranges
    total_funding_min: '',
    total_funding_max: '',
    latest_funding_amount_min: '',
    latest_funding_amount_max: '',
    // Exact match filters
    primary_email_catch_all_status: '',
    seniority: '',
    stage: '',
    // Date range filters
    created_at_after: '',
    created_at_before: '',
    updated_at_after: '',
    updated_at_before: '',
    // Location filters
    company_location: '',
    contact_location: '',
    // Exclusion filters
    exclude_company_ids: [],
    exclude_titles: [],
    exclude_company_locations: [],
    exclude_contact_locations: [],
    exclude_seniorities: [],
    exclude_departments: [],
    exclude_technologies: [],
    exclude_keywords: [],
    exclude_industries: [],
};

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

const DetailItem: React.FC<{label: string; value?: string | number | null}> = ({ label, value }) => (
    value ? (
        <div className="contact-detail-item">
            <p className="contact-detail-label">{label}</p>
            <p className="contact-detail-value">{value}</p>
        </div>
    ) : null
);

const FilterInput: React.FC<{ label: string; name: keyof Filters, value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; type?: string }> = 
({ label, name, value, onChange, placeholder, type = 'text' }) => {
    const nameString = String(name);
    return (
        <div className="filter-input-wrapper">
            <label htmlFor={nameString} className="form-label">{label}</label>
            <input id={nameString} name={nameString} type={type} value={value} onChange={onChange} placeholder={placeholder} className="input filter-input-sm"/>
        </div>
    );
};

const FilterRangeInput: React.FC<{ label: string; minName: keyof Filters, minValue: string; maxName: keyof Filters, maxValue: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> =
({ label, minName, minValue, maxName, maxValue, onChange }) => {
    const minNameString = String(minName);
    const maxNameString = String(maxName);
    return (
        <div className="filter-input-wrapper">
            <label className="form-label">{label}</label>
            <div className="filter-range-input-wrapper">
                <input name={minNameString} type="number" value={minValue} onChange={onChange} placeholder="Min" className="input filter-input-sm"/>
                <span className="filter-range-separator">-</span>
                <input name={maxNameString} type="number" value={maxValue} onChange={onChange} placeholder="Max" className="input filter-input-sm"/>
            </div>
        </div>
    );
};

/**
 * FilterDateRange component for date range inputs
 * Converts between user-friendly datetime-local format and ISO 8601 format for API
 */
const FilterDateRange: React.FC<{ 
    label: string; 
    afterName: keyof Filters; 
    afterValue: string; 
    beforeName: keyof Filters; 
    beforeValue: string; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, afterName, afterValue, beforeName, beforeValue, onChange }) => {
    const afterNameString = String(afterName);
    const beforeNameString = String(beforeName);
    
    // Convert ISO format to datetime-local format for display
    const isoToLocal = (iso: string): string => {
        if (!iso) return '';
        try {
            const date = new Date(iso);
            if (isNaN(date.getTime())) return '';
            // Format as YYYY-MM-DDTHH:mm for datetime-local input
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch {
            return '';
        }
    };
    
    // Convert datetime-local format to ISO format for API
    const localToIso = (local: string): string => {
        if (!local) return '';
        try {
            const date = new Date(local);
            if (isNaN(date.getTime())) return '';
            return date.toISOString();
        } catch {
            return '';
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const isoValue = localToIso(value);
        // Create a synthetic event with ISO value
        const syntheticEvent = {
            ...e,
            target: {
                ...e.target,
                name,
                value: isoValue,
            }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
    };
    
    return (
        <div className="filter-input-wrapper">
            <label className="form-label">{label}</label>
            <div className="filter-date-range-wrapper">
                <div>
                    <label htmlFor={`${afterNameString}_input`} className="filter-input-label filter-input-label--from">From</label>
                    <input 
                        id={`${afterNameString}_input`}
                        name={afterNameString} 
                        type="datetime-local" 
                        value={isoToLocal(afterValue)} 
                        onChange={handleChange}
                        className="input filter-input-sm"
                    />
                </div>
                <div>
                    <label htmlFor={`${beforeNameString}_input`} className="filter-input-label filter-input-label--to">To</label>
                    <input 
                        id={`${beforeNameString}_input`}
                        name={beforeNameString} 
                        type="datetime-local" 
                        value={isoToLocal(beforeValue)} 
                        onChange={handleChange}
                        className="input filter-input-sm"
                    />
                </div>
            </div>
        </div>
    );
};

/**
 * FilterMultiSelect component for managing exclusion filter arrays
 * Allows adding multiple values as tags/chips with remove functionality
 */
const FilterMultiSelect: React.FC<{
    label: string;
    name: keyof Filters;
    values: string[];
    onAdd: (name: keyof Filters, value: string) => void;
    onRemove: (name: keyof Filters, value: string) => void;
    placeholder?: string;
}> = ({ label, name, values, onAdd, onRemove, placeholder }) => {
    const [inputValue, setInputValue] = useState('');
    const nameString = String(name);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            const trimmed = inputValue.trim();
            if (!values.includes(trimmed)) {
                onAdd(name, trimmed);
                setInputValue('');
            }
        }
    };

    const handleBlur = () => {
        if (inputValue.trim()) {
            const trimmed = inputValue.trim();
            if (!values.includes(trimmed)) {
                onAdd(name, trimmed);
                setInputValue('');
            }
        }
    };

    return (
        <div className="filter-multi-select-wrapper">
            <label htmlFor={nameString} className="form-label">{label}</label>
            <div className="filter-multi-select-tags">
                {values.map((value, index) => (
                    <span
                        key={`filter-tag-${index}-${value || ''}`}
                        className="filter-multi-select-tag"
                    >
                        <span>{value}</span>
                        <button
                            type="button"
                            onClick={() => onRemove(name, value)}
                            className="filter-multi-select-tag-remove"
                            aria-label={`Remove ${value}`}
                        >
                            <XMarkIcon className="filter-multi-select-tag-icon" />
                        </button>
                    </span>
                ))}
            </div>
            <input
                id={nameString}
                name={nameString}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder={placeholder || 'Type and press Enter to add'}
                className="input filter-input-sm"
            />
        </div>
    );
};


const FilterSidebar: React.FC<{
    filters: Filters;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onAddExclusionValue: (name: keyof Filters, value: string) => void;
    onRemoveExclusionValue: (name: keyof Filters, value: string) => void;
    clearFilters: () => void;
    uniqueIndustries: string[];
    uniqueTitles: string[];
    uniqueCompanies: string[];
    isLoadingTitles: boolean;
    isLoadingCompanies: boolean;
}> = ({ filters, onFilterChange, onAddExclusionValue, onRemoveExclusionValue, clearFilters, uniqueIndustries, uniqueTitles, uniqueCompanies, isLoadingTitles, isLoadingCompanies }) => {
    const [openSections, setOpenSections] = useState<string[]>(['status', 'company']);

    const toggleSection = (section: string) => {
        setOpenSections(prev => 
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

    const AccordionSection: React.FC<{ title: string; id: string; children: React.ReactNode }> = ({ title, id, children }) => {
        const isOpen = openSections.includes(id);
        return (
            <div className="filter-accordion-section">
                <button 
                    onClick={() => toggleSection(id)} 
                    className="filter-accordion-button" 
                    aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${title} section`} 
                    aria-expanded={isOpen ? 'true' : 'false'}
                    title={`${isOpen ? 'Collapse' : 'Expand'} ${title} section`}
                >
                    <span>{title}</span>
                    {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </button>
                {isOpen && <div className="filter-accordion-content">{children}</div>}
            </div>
        );
    };
    
    // Count active filters for badge
    const activeFilterCount = useMemo(() => {
        let count = 0;
        Object.entries(filters).forEach(([key, value]) => {
            if (key === 'status' || key === 'emailStatus' || key === 'industry') {
                if (value && value !== 'All') count++;
            } else if (Array.isArray(value)) {
                // Count exclusion filters (non-empty arrays)
                if (value.length > 0) count++;
            } else if (value && value !== '') {
                count++;
            }
        });
        return count;
    }, [filters]);
    
    return (
        <aside className="filter-sidebar">
            <div className="filter-sidebar-header">
                <div className="filter-sidebar-title">
                    <FilterIcon />
                    <h2>Filters</h2>
                    {activeFilterCount > 0 && (
                        <span className="filter-sidebar-badge">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    aria-label="Clear all filters"
                >
                    Clear All
                </Button>
            </div>
            <div className="filter-sidebar-content">
                <AccordionSection title="Status & Stage" id="status">
                    <div>
                        <label htmlFor="status" className="form-label">Contact Status (Stage)</label>
                        <select id="status" name="status" value={filters.status} onChange={onFilterChange} className="select">
                            <option value="All">All Statuses</option>
                            <option value="Lead">Lead</option>
                            <option value="Customer">Customer</option>
                            <option value="Archived">Archived</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="emailStatus" className="form-label">Email Status</label>
                        <select id="emailStatus" name="emailStatus" value={filters.emailStatus} onChange={onFilterChange} className="select">
                            <option value="All">All Email Statuses</option>
                            <option value="valid">Verified</option>
                            <option value="unknown">Unverified</option>
                            <option value="invalid">Bounced</option>
                        </select>
                    </div>
                </AccordionSection>
                
                <AccordionSection title="Person Information" id="person">
                    <FilterInput label="First Name" name="first_name" value={filters.first_name} onChange={onFilterChange} placeholder="e.g. John" />
                    <FilterInput label="Last Name" name="last_name" value={filters.last_name} onChange={onFilterChange} placeholder="e.g. Doe" />
                    <FilterInput label="Email" name="email" value={filters.email} onChange={onFilterChange} placeholder="e.g. john@example.com" />
                    <FilterInput label="Departments" name="departments" value={filters.departments} onChange={onFilterChange} placeholder="e.g. executive, sales" />
                </AccordionSection>

                <AccordionSection title="Phone Numbers" id="phone">
                    <FilterInput label="Work Direct Phone" name="work_direct_phone" value={filters.work_direct_phone} onChange={onFilterChange} placeholder="+1234567890" />
                    <FilterInput label="Home Phone" name="home_phone" value={filters.home_phone} onChange={onFilterChange} placeholder="+1234567890" />
                    <FilterInput label="Mobile Phone" name="mobile_phone" value={filters.mobile_phone} onChange={onFilterChange} placeholder="+1234567890" />
                    <FilterInput label="Corporate Phone" name="corporate_phone" value={filters.corporate_phone} onChange={onFilterChange} placeholder="+1234567890" />
                    <FilterInput label="Other Phone" name="other_phone" value={filters.other_phone} onChange={onFilterChange} placeholder="+1234567890" />
                </AccordionSection>
                
                <AccordionSection title="Contact Info" id="contact">
                    <div>
                        <label htmlFor="title" className="form-label">Title</label>
                        <select 
                            id="title" 
                            name="title" 
                            value={filters.title} 
                            onChange={onFilterChange} 
                            className="select"
                            disabled={isLoadingTitles}
                        >
                            <option value="">All Titles</option>
                            {isLoadingTitles ? (
                                <option value="" disabled>Loading titles...</option>
                            ) : (
                                uniqueTitles.map(title => (
                                    <option key={title} value={title}>
                                        {title}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                    <FilterInput label="Keywords" name="tags" value={filters.tags} onChange={onFilterChange} placeholder="e.g. saas, b2b" />
                </AccordionSection>
                
                <AccordionSection title="Company Info" id="company">
                    <div>
                        <label htmlFor="industry" className="form-label">Industry</label>
                        <select id="industry" name="industry" value={filters.industry} onChange={onFilterChange} className="select">
                             <option value="All">All Industries</option>
                            {uniqueIndustries.map(industry => (
                                <option key={industry} value={industry}>
                                    {industry}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="company_name_for_emails" className="form-label">Company Name</label>
                        <select 
                            id="company_name_for_emails" 
                            name="company_name_for_emails" 
                            value={filters.company_name_for_emails} 
                            onChange={onFilterChange} 
                            className="select"
                            disabled={isLoadingCompanies}
                        >
                            <option value="">All Companies</option>
                            {isLoadingCompanies ? (
                                <option value="" disabled>Loading companies...</option>
                            ) : (
                                uniqueCompanies.map(company => (
                                    <option key={company} value={company}>
                                        {company}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                    <FilterInput label="Company Address" name="company_address" value={filters.company_address} onChange={onFilterChange} placeholder="e.g. 123 Main St" />
                    <FilterInput label="Company Phone" name="company_phone" value={filters.company_phone} onChange={onFilterChange} placeholder="+1234567890" />
                    
                    {/* Employees Filters */}
                    <div className="filter-field-group">
                        <h4 className="filter-section-title">Employees</h4>
                        <FilterInput 
                            label="Exact Count" 
                            name="employees_count" 
                            value={filters.employees_count} 
                            onChange={onFilterChange} 
                            placeholder="e.g. 100" 
                            type="number"
                        />
                        <FilterRangeInput 
                            label="Range" 
                            minName="employees_min" 
                            minValue={filters.employees_min} 
                            maxName="employees_max" 
                            maxValue={filters.employees_max} 
                            onChange={onFilterChange} 
                        />
                    </div>
                    
                    {/* Annual Revenue Filters */}
                    <div className="filter-field-group">
                        <h4 className="filter-section-title">Annual Revenue ($)</h4>
                        <FilterInput 
                            label="Exact Amount" 
                            name="annual_revenue" 
                            value={filters.annual_revenue} 
                            onChange={onFilterChange} 
                            placeholder="e.g. 10000000" 
                            type="number"
                        />
                        <FilterRangeInput 
                            label="Range" 
                            minName="annual_revenue_min" 
                            minValue={filters.annual_revenue_min} 
                            maxName="annual_revenue_max" 
                            maxValue={filters.annual_revenue_max} 
                            onChange={onFilterChange} 
                        />
                    </div>
                </AccordionSection>

                <AccordionSection title="Location" id="location">
                    <h4 className="filter-section-title">Location Search</h4>
                    <FilterInput 
                        label="Company Location" 
                        name="company_location" 
                        value={filters.company_location || ''} 
                        onChange={onFilterChange} 
                        placeholder="Search company address, city, state, country"
                    />
                    <FilterInput 
                        label="Contact Location" 
                        name="contact_location" 
                        value={filters.contact_location || ''} 
                        onChange={onFilterChange} 
                        placeholder="Search contact location metadata"
                    />
                    <h4 className="filter-section-title filter-section-title--spaced">Person Location</h4>
                    <FilterInput label="City" name="city" value={filters.city} onChange={onFilterChange} />
                    <FilterInput label="State" name="state" value={filters.state} onChange={onFilterChange} />
                    <FilterInput label="Country" name="country" value={filters.country} onChange={onFilterChange} />
                    <h4 className="filter-section-title filter-section-title--spaced">Company Location</h4>
                    <FilterInput label="Company City" name="company_city" value={filters.company_city} onChange={onFilterChange} />
                    <FilterInput label="Company State" name="company_state" value={filters.company_state} onChange={onFilterChange} />
                    <FilterInput label="Company Country" name="company_country" value={filters.company_country} onChange={onFilterChange} />
                </AccordionSection>

                <AccordionSection title="Funding & Revenue" id="funding">
                    {/* Total Funding Filters */}
                    <div className="filter-field-group">
                        <h4 className="filter-section-title">Total Funding ($)</h4>
                        <FilterInput 
                            label="Exact Amount" 
                            name="total_funding" 
                            value={filters.total_funding} 
                            onChange={onFilterChange} 
                            placeholder="e.g. 50000000" 
                            type="number"
                        />
                        <FilterRangeInput 
                            label="Range" 
                            minName="total_funding_min" 
                            minValue={filters.total_funding_min} 
                            maxName="total_funding_max" 
                            maxValue={filters.total_funding_max} 
                            onChange={onFilterChange} 
                        />
                    </div>
                    
                    <FilterRangeInput label="Latest Funding Amount" minName="latest_funding_amount_min" minValue={filters.latest_funding_amount_min} maxName="latest_funding_amount_max" maxValue={filters.latest_funding_amount_max} onChange={onFilterChange} />
                    <FilterInput label="Latest Funding" name="latest_funding" value={filters.latest_funding} onChange={onFilterChange} placeholder="e.g. Series B" />
                    <FilterInput label="Last Raised At" name="last_raised_at" value={filters.last_raised_at} onChange={onFilterChange} placeholder="e.g. 2023-06-01" />
                </AccordionSection>

                <AccordionSection title="Web Presence" id="web">
                    <FilterInput label="Person LinkedIn URL" name="person_linkedin_url" value={filters.person_linkedin_url} onChange={onFilterChange} placeholder="https://linkedin.com/in/..." />
                    <FilterInput label="Company LinkedIn URL" name="company_linkedin_url" value={filters.company_linkedin_url} onChange={onFilterChange} placeholder="https://linkedin.com/company/..." />
                    <FilterInput label="Facebook URL" name="facebook_url" value={filters.facebook_url} onChange={onFilterChange} placeholder="https://facebook.com/..." />
                    <FilterInput label="Twitter URL" name="twitter_url" value={filters.twitter_url} onChange={onFilterChange} placeholder="https://twitter.com/..." />
                    <FilterInput label="Website" name="website" value={filters.website} onChange={onFilterChange} placeholder="https://example.com" />
                </AccordionSection>

                <AccordionSection title="Technologies & Keywords" id="tech">
                    <FilterInput label="Technologies" name="technologies" value={filters.technologies} onChange={onFilterChange} placeholder="e.g. Python, Django, PostgreSQL" />
                    <FilterInput label="Keywords" name="tags" value={filters.tags} onChange={onFilterChange} placeholder="e.g. saas, b2b" />
                </AccordionSection>

                <AccordionSection title="Date Ranges" id="dates">
                    <FilterDateRange 
                        label="Created Date" 
                        afterName="created_at_after" 
                        afterValue={filters.created_at_after} 
                        beforeName="created_at_before" 
                        beforeValue={filters.created_at_before} 
                        onChange={onFilterChange} 
                    />
                    <FilterDateRange 
                        label="Updated Date" 
                        afterName="updated_at_after" 
                        afterValue={filters.updated_at_after} 
                        beforeName="updated_at_before" 
                        beforeValue={filters.updated_at_before} 
                        onChange={onFilterChange} 
                    />
                </AccordionSection>

                <AccordionSection title="Exclusion Filters" id="exclusion">
                    <p className="filter-exclude-text">Exclude contacts matching any of these values</p>
                    <FilterMultiSelect
                        label="Exclude Titles"
                        name="exclude_titles"
                        values={filters.exclude_titles || []}
                        onAdd={onAddExclusionValue}
                        onRemove={onRemoveExclusionValue}
                        placeholder="e.g. Intern, Junior"
                    />
                    <FilterMultiSelect
                        label="Exclude Industries"
                        name="exclude_industries"
                        values={filters.exclude_industries || []}
                        onAdd={onAddExclusionValue}
                        onRemove={onRemoveExclusionValue}
                        placeholder="e.g. Retail, Hospitality"
                    />
                    <FilterMultiSelect
                        label="Exclude Departments"
                        name="exclude_departments"
                        values={filters.exclude_departments || []}
                        onAdd={onAddExclusionValue}
                        onRemove={onRemoveExclusionValue}
                        placeholder="e.g. HR, Legal"
                    />
                    <FilterMultiSelect
                        label="Exclude Seniorities"
                        name="exclude_seniorities"
                        values={filters.exclude_seniorities || []}
                        onAdd={onAddExclusionValue}
                        onRemove={onRemoveExclusionValue}
                        placeholder="e.g. entry-level, intern"
                    />
                    <FilterMultiSelect
                        label="Exclude Technologies"
                        name="exclude_technologies"
                        values={filters.exclude_technologies || []}
                        onAdd={onAddExclusionValue}
                        onRemove={onRemoveExclusionValue}
                        placeholder="e.g. PHP, COBOL"
                    />
                    <FilterMultiSelect
                        label="Exclude Keywords"
                        name="exclude_keywords"
                        values={filters.exclude_keywords || []}
                        onAdd={onAddExclusionValue}
                        onRemove={onRemoveExclusionValue}
                        placeholder="e.g. startup, non-profit"
                    />
                    <FilterMultiSelect
                        label="Exclude Company Locations"
                        name="exclude_company_locations"
                        values={filters.exclude_company_locations || []}
                        onAdd={onAddExclusionValue}
                        onRemove={onRemoveExclusionValue}
                        placeholder="e.g. New York, London"
                    />
                    <FilterMultiSelect
                        label="Exclude Contact Locations"
                        name="exclude_contact_locations"
                        values={filters.exclude_contact_locations || []}
                        onAdd={onAddExclusionValue}
                        onRemove={onRemoveExclusionValue}
                        placeholder="e.g. San Francisco, Austin"
                    />
                </AccordionSection>

                <AccordionSection title="Advanced Filters" id="advanced">
                    <div>
                        <label htmlFor="stage" className="form-label">Stage</label>
                        <input id="stage" name="stage" type="text" value={filters.stage} onChange={onFilterChange} placeholder="e.g. lead, customer" className="input"/>
                    </div>
                    <div>
                        <label htmlFor="seniority" className="form-label">Seniority</label>
                        <input id="seniority" name="seniority" type="text" value={filters.seniority} onChange={onFilterChange} placeholder="e.g. c-level, director" className="input"/>
                    </div>
                    <div>
                        <label htmlFor="primary_email_catch_all_status" className="form-label">Primary Email Catch-All Status</label>
                        <input id="primary_email_catch_all_status" name="primary_email_catch_all_status" type="text" value={filters.primary_email_catch_all_status} onChange={onFilterChange} placeholder="e.g. valid, invalid" className="input"/>
                    </div>
                    <FilterMultiSelect
                        label="Exclude Company IDs"
                        name="exclude_company_ids"
                        values={filters.exclude_company_ids || []}
                        onAdd={onAddExclusionValue}
                        onRemove={onRemoveExclusionValue}
                        placeholder="Enter company UUID"
                    />
                </AccordionSection>
            </div>
        </aside>
    );
};

/**
 * FilterPill component for displaying active filters as removable pills
 */
const FilterPill: React.FC<{
    label: string;
    value: string | string[];
    onRemove: () => void;
}> = ({ label, value, onRemove }) => {
    const displayValue = Array.isArray(value) ? value.join(', ') : value;
    return (
        <span className="filter-pill">
            <span className="filter-pill__label">{label}:</span>
            <span className="filter-pill__value" title={displayValue}>{displayValue}</span>
            <button
                onClick={onRemove}
                className="filter-pill__remove"
                aria-label={`Remove ${label} filter`}
            >
                <XMarkIcon className="filter-pill__icon" />
            </button>
        </span>
    );
};

/**
 * FilterSummaryBar component for displaying active filters with clear actions
 */
const FilterSummaryBar: React.FC<{
    filters: Filters;
    onClearAll: () => void;
    onRemoveFilter: (key: keyof Filters) => void;
}> = ({ filters, onClearAll, onRemoveFilter }) => {
    const activeFilters = useMemo(() => {
        const active: Array<{ key: keyof Filters; label: string; value: string | string[] }> = [];
        
        Object.entries(filters).forEach(([key, value]) => {
            // Skip 'All' values and empty values
            if (value === 'All' || value === '' || value === null || value === undefined) {
                return;
            }
            // Handle array values (exclusion filters)
            if (Array.isArray(value) && value.length > 0) {
                active.push({
                    key: key as keyof Filters,
                    label: key.replace(/_/g, ' ').replace(/^exclude /, 'Exclude: '),
                    value: value
                });
            }
            // Handle string and number values
            else if (typeof value === 'string' || typeof value === 'number') {
                active.push({
                    key: key as keyof Filters,
                    label: key.replace(/_/g, ' '),
                    value: String(value)
                });
            }
        });
        
        return active;
    }, [filters]);

    if (activeFilters.length === 0) return null;

    return (
        <div className="filter-summary-bar">
            <span className="filter-summary-bar__label">
                Active Filters ({activeFilters.length}):
            </span>
            {activeFilters.map((filter) => (
                <FilterPill
                    key={filter.key}
                    label={filter.label}
                    value={filter.value}
                    onRemove={() => onRemoveFilter(filter.key)}
                />
            ))}
            <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="filter-summary-bar__clear"
            >
                Clear All
            </Button>
        </div>
    );
};

/**
 * Column configuration interface
 */
interface ColumnConfig {
    id: string;
    label: string;
    field: keyof Contact;
    visible: boolean;
    sortable: boolean;
    width?: string;
    category: 'essential' | 'person' | 'company' | 'metrics' | 'status' | 'timestamps' | 'urls' | 'other';
    render?: (contact: Contact) => React.ReactNode;
}

/**
 * ColumnTogglePanel component for configuring visible table columns
 */
const ColumnTogglePanel: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    columns: ColumnConfig[];
    onToggleColumn: (columnId: string) => void;
    onToggleAll: (visible: boolean) => void;
    onResetToDefault: () => void;
}> = ({ isOpen, onClose, columns, onToggleColumn, onToggleAll, onResetToDefault }) => {
    const columnsByCategory = useMemo(() => {
        const categories: Record<string, ColumnConfig[]> = {
            essential: [],
            person: [],
            company: [],
            metrics: [],
            status: [],
            timestamps: [],
            urls: [],
            other: []
        };
        
        columns.forEach(col => {
            categories[col.category].push(col);
        });
        
        return categories;
    }, [columns]);

    const visibleCount = columns.filter(c => c.visible).length;
    const allSelected = visibleCount === columns.length;

    if (!isOpen) return null;

    return (
        <div className="column-toggle-overlay" onClick={onClose}>
            <div className="column-toggle-panel" onClick={e => e.stopPropagation()}>
                <div className="column-toggle-header">
                    <h3 className="column-toggle-header__title">Configure Columns</h3>
                    <button
                        onClick={onClose}
                        className="column-toggle-header__close"
                        aria-label="Close column configuration"
                    >
                        <XMarkIcon className="column-toggle-header__close-icon" />
                    </button>
                </div>
                
                <div className="column-toggle-body">
                    <div className="column-toggle-body__header">
                        <span className="column-toggle-body__count">
                            Showing {visibleCount} of {columns.length} columns
                        </span>
                        <div className="column-toggle-body__actions">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onToggleAll(!allSelected)}
                            >
                                {allSelected ? 'Deselect All' : 'Select All'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onResetToDefault}
                            >
                                Reset to Default
                            </Button>
                        </div>
                    </div>

                    {Object.entries(columnsByCategory).map(([category, cols]) => {
                        if (cols.length === 0) return null;
                        return (
                            <div key={category} className="column-toggle-body__category">
                                <h4 className="column-toggle-body__category-title">
                                    {category}
                                </h4>
                                <div className="column-toggle-body__category-list">
                                    {cols.map(col => (
                                        <label
                                            key={col.id}
                                            className="column-toggle-body__category-item"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={col.visible}
                                                onChange={() => onToggleColumn(col.id)}
                                                className="checkbox-input"
                                            />
                                            <span className="column-toggle-body__category-item-label">{col.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="column-toggle-footer">
                    <Button variant="primary" onClick={onClose} className="column-toggle-footer__button">
                        Apply Changes
                    </Button>
                </div>
            </div>
        </div>
    );
};

/**
 * ImportJobStatus component for displaying import job progress and errors
 */
const ImportJobStatus: React.FC<{
    job: ImportJob;
    onClose: () => void;
    onViewErrors: () => void;
}> = ({ job, onClose, onViewErrors }) => {
    const progress = job.total_rows > 0 ? (job.success_count / job.total_rows) * 100 : 0;
    
    return (
        <div className="import-job-status">
            <div className="import-job-status__header">
                <h3 className="import-job-status__title">Import Status</h3>
                <button onClick={onClose} className="import-job-status__close" aria-label="Close">
                    <XMarkIcon className="import-job-status__close-icon" />
                </button>
            </div>
            
            <div className="import-job-status__content">
                <div className="import-job-status__section">
                    <div className="import-job-status__section-header">
                        <span className="import-job-status__section-label">Status</span>
                        <span className={`badge ${
                            job.status === 'completed' ? 'badge-status-customer' :
                            job.status === 'failed' ? 'badge-status-archived' :
                            job.status === 'running' ? 'badge-primary' :
                            'badge-secondary'
                        }`}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                    </div>
                    {job.message && (
                        <p className="import-job-status__message">{job.message}</p>
                    )}
                </div>

                {job.status === 'running' && (
                    <div className="import-job-status__progress">
                        <div className="import-job-status__progress-header">
                            <span className="import-job-status__section-label">Progress</span>
                            <span className="import-job-status__section-value">
                                {job.success_count + job.error_count} / {job.total_rows}
                            </span>
                        </div>
                        <div className="import-job-status__progress-bar-container">
                            <div 
                                className="import-job-status__progress-bar"
                                style={{ '--progress-width': `${progress}%` } as React.CSSProperties}
                            />
                        </div>
                    </div>
                )}

                <div className="import-job-status__stats">
                    <div className="import-job-status__stat">
                        <p className="import-job-status__stat-label">Total Rows</p>
                        <p className="import-job-status__stat-value">{job.total_rows.toLocaleString()}</p>
                    </div>
                    <div className="import-job-status__stat">
                        <p className="import-job-status__stat-label">Success</p>
                        <p className="import-job-status__stat-value import-job-status__stat-value--success">{job.success_count.toLocaleString()}</p>
                    </div>
                    {job.error_count > 0 && (
                        <div className="import-job-status__stat">
                            <p className="import-job-status__stat-label">Errors</p>
                            <p className="import-job-status__stat-value import-job-status__stat-value--destructive">{job.error_count.toLocaleString()}</p>
                        </div>
                    )}
                </div>

                {job.status === 'completed' && job.error_count > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onViewErrors}
                        className="import-job-status__view-errors"
                    >
                        View Errors ({job.error_count})
                    </Button>
                )}

                {job.started_at && (
                    <div className="import-job-status__timestamp">
                        Started: {new Date(job.started_at).toLocaleString()}
                    </div>
                )}
                {job.finished_at && (
                    <div className="import-job-status__timestamp">
                        Finished: {new Date(job.finished_at).toLocaleString()}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * ImportModal component for file upload and import initiation
 */
const ImportModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onImportStart: (jobId: string) => void;
}> = ({ isOpen, onClose, onImportStart }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    };

    const handleFileSelect = (selectedFile: File) => {
        setError(null);
        const allowedExtensions = ['.csv'];
        const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension) && 
            selectedFile.type !== 'text/csv' && 
            selectedFile.type !== 'application/vnd.ms-excel') {
            setError('Invalid file type. Only CSV files are allowed.');
            return;
        }

        const maxSize = 50 * 1024 * 1024; // 50MB
        if (selectedFile.size > maxSize) {
            setError('File too large. Maximum size is 50MB.');
            return;
        }

        setFile(selectedFile);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            handleFileSelect(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const result = await uploadContactsCSV(file);
            if (result.success && result.data) {
                onImportStart(result.data.jobId);
                setFile(null);
                onClose();
            } else {
                setError(result.message || 'Failed to upload file. Please try again.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            console.error('Upload error:', err);
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="contact-modal-overlay" onClick={onClose}>
            <div className="contact-modal-content contact-modal-content--medium" onClick={e => e.stopPropagation()}>
                <header className="contact-modal-header">
                    <h2 className="contact-modal-header__title">Import Contacts</h2>
                    <button onClick={onClose} className="contact-modal-header__close" aria-label="Close">
                        <XMarkIcon className="contact-modal-header__close-icon"/>
                    </button>
                </header>
                
                <main className="contact-modal-body">
                    <div className="contact-modal-body__section">
                        <label className="contact-modal-body__label">Upload CSV File</label>
                        <div
                            className={`contact-modal-body__dropzone ${isDragging ? 'contact-modal-body__dropzone--dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            {file ? (
                                <div className="contact-modal-body__dropzone-content">
                                    <div className="contact-modal-body__dropzone-file">
                                        <span className="contact-modal-body__dropzone-file-name">{file.name}</span>
                                        <button
                                            onClick={() => setFile(null)}
                                            className="contact-modal-body__dropzone-file-remove"
                                            aria-label="Remove file"
                                        >
                                            <XMarkIcon className="contact-modal-body__dropzone-file-remove-icon" />
                                        </button>
                                    </div>
                                    <p className="contact-modal-body__dropzone-file-size">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            ) : (
                                <div className="contact-modal-body__dropzone-content">
                                    <p className="contact-modal-body__dropzone-text">
                                        Drag and drop a CSV file here, or click to browse
                                    </p>
                                    <input
                                        type="file"
                                        accept=".csv,text/csv,application/vnd.ms-excel"
                                        onChange={handleFileInputChange}
                                        className="contacts-hidden"
                                        id="file-upload"
                                    />
                                    <label htmlFor="file-upload" className="contact-modal-file-label">
                                        <span className="contact-modal-file-label-inline">
                                            <Button variant="outline" size="sm" className="contact-modal-body__dropzone-browse">
                                                Browse Files
                                            </Button>
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="contact-modal-body__error">
                            {error}
                        </div>
                    )}

                    <div className="contact-modal-body__help">
                        <p className="contact-modal-body__help-item">• Maximum file size: 50MB</p>
                        <p className="contact-modal-body__help-item">• Only CSV files are supported</p>
                        <p className="contact-modal-body__help-item">• The import will be processed in the background</p>
                    </div>
                </main>

                <footer className="contact-modal-footer">
                    <Button variant="ghost" onClick={onClose} disabled={isUploading} className="contact-modal-footer__button">
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleUpload} 
                        disabled={!file || isUploading}
                        leftIcon={isUploading ? undefined : <PlusIcon />}
                        className="contact-modal-footer__button"
                    >
                        {isUploading ? 'Uploading...' : 'Upload & Import'}
                    </Button>
                </footer>
            </div>
        </div>
    );
};

/**
 * ImportErrorsModal component for displaying import errors
 */
const ImportErrorsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
}> = ({ isOpen, onClose, jobId }) => {
    const [errors, setErrors] = useState<ImportError[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadErrors = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getImportErrors(jobId);
            if (result.success && result.data) {
                setErrors(result.data);
            } else {
                setError(result.message || 'Failed to load errors.');
            }
        } catch (err) {
            setError('An unexpected error occurred.');
            console.error('Load errors error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [jobId]);

    useEffect(() => {
        if (isOpen && jobId) {
            loadErrors();
        }
    }, [isOpen, jobId, loadErrors]);

    if (!isOpen) return null;

    return (
        <div className="contact-modal-overlay" onClick={onClose}>
            <div className="contact-modal-content contact-modal-content--large" onClick={e => e.stopPropagation()}>
                <header className="contact-modal-header">
                    <h2 className="contact-modal-header__title">Import Errors</h2>
                    <button onClick={onClose} className="contact-modal-header__close" aria-label="Close">
                        <XMarkIcon className="contact-modal-header__close-icon"/>
                    </button>
                </header>
                
                <main className="contact-modal-body contact-modal-body--scrollable">
                    {isLoading ? (
                        <div className="contact-modal-center">
                            <div className="import-spinner"></div>
                            <p className="import-loading-text">Loading errors...</p>
                        </div>
                    ) : error ? (
                        <div className="contact-modal-body__error">
                            {error}
                        </div>
                    ) : errors.length === 0 ? (
                        <div className="contact-modal-center">
                            <p className="import-empty-text">No errors found.</p>
                        </div>
                    ) : (
                        <div className="contact-modal-body__errors-list">
                            {errors.map((err, index) => (
                                <div key={`error-row-${err.row_number || index}`} className="contact-modal-body__error-item">
                                    <div className="contact-modal-body__error-item-header">
                                        <div className="contact-modal-status-card-content">
                                            <p className="contact-modal-body__error-item-message">
                                                Row {err.row_number}
                                            </p>
                                            <p className="contact-modal-body__error-item-message contact-modal-error-message">{err.error_message}</p>
                                            {err.row_data && Object.keys(err.row_data).length > 0 && (
                                                <div className="contact-modal-body__error-item-data">
                                                    <p className="contact-modal-body__error-item-data-label">Row Data:</p>
                                                    <pre className="contact-modal-body__error-item-data-pre">
                                                        {JSON.stringify(err.row_data, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                <footer className="contact-modal-footer">
                    <Button variant="primary" onClick={onClose} className="contact-modal-footer__button">
                        Close
                    </Button>
                </footer>
            </div>
        </div>
    );
};

/**
 * CreateContactModal component for creating new contacts
 */
const CreateContactModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState<ContactCreate>({
        first_name: '',
        last_name: '',
        email: '',
        title: '',
        departments: [],
        mobile_phone: '',
        email_status: '',
        text_search: '',
        seniority: '',
        company_id: '',
    });
    const [departmentsInput, setDepartmentsInput] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                title: '',
                departments: [],
                mobile_phone: '',
                email_status: '',
                text_search: '',
                seniority: '',
                company_id: '',
            });
            setDepartmentsInput('');
            setErrors({});
            setGeneralError(null);
            setSuccessMessage(null);
        }
    }, [isOpen]);

    // Auto-dismiss success message
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    const validateEmail = (email: string): boolean => {
        if (!email) return true; // Optional field
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone: string): boolean => {
        if (!phone) return true; // Optional field
        // Basic phone validation - allows various formats
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7;
    };

    const handleFieldChange = (field: keyof ContactCreate, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
        setGeneralError(null);
    };

    const handleDepartmentsChange = (value: string) => {
        setDepartmentsInput(value);
        // Parse comma-separated departments
        const departments = value
            .split(',')
            .map(d => d.trim())
            .filter(Boolean);
        setFormData(prev => ({ ...prev, departments }));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (formData.email && !validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (formData.mobile_phone && !validatePhone(formData.mobile_phone)) {
            newErrors.mobile_phone = 'Please enter a valid phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError(null);
        setSuccessMessage(null);

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare contact data - only include defined fields
            const contactData: ContactCreate = {};
            if (formData.first_name) contactData.first_name = formData.first_name;
            if (formData.last_name) contactData.last_name = formData.last_name;
            if (formData.email) contactData.email = formData.email;
            if (formData.title) contactData.title = formData.title;
            if (formData.departments && formData.departments.length > 0) contactData.departments = formData.departments;
            if (formData.mobile_phone) contactData.mobile_phone = formData.mobile_phone;
            if (formData.email_status) contactData.email_status = formData.email_status;
            if (formData.text_search) contactData.text_search = formData.text_search;
            if (formData.seniority) contactData.seniority = formData.seniority;
            if (formData.company_id) contactData.company_id = formData.company_id;

            const result = await createContact(contactData);

            if (result.success && result.data) {
                setSuccessMessage('Contact created successfully!');
                // Wait a moment to show success message, then close and refresh
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1500);
            } else {
                // Handle field-specific errors
                if (result.fieldErrors) {
                    const fieldErrors: Record<string, string> = {};
                    Object.entries(result.fieldErrors).forEach(([field, messages]) => {
                        if (messages && messages.length > 0) {
                            fieldErrors[field] = messages[0];
                        }
                    });
                    setErrors(fieldErrors);
                }
                // Handle general errors
                if (result.nonFieldErrors && result.nonFieldErrors.length > 0) {
                    setGeneralError(result.nonFieldErrors[0]);
                } else {
                    setGeneralError(result.message || 'Failed to create contact. Please try again.');
                }
            }
        } catch (error) {
            console.error('Create contact error:', error);
            setGeneralError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="contact-modal-overlay" onClick={onClose}>
            <div className="contact-modal-content contact-modal-content--medium contact-modal-content--max-height" onClick={e => e.stopPropagation()}>
                <header className="contact-modal-header">
                    <h2 className="contact-modal-header__title">Create New Contact</h2>
                    <button 
                        onClick={onClose} 
                        className="contact-modal-header__close" 
                        aria-label="Close contact creation form"
                        title="Close"
                    >
                        <XMarkIcon className="contact-modal-header__close-icon"/>
                    </button>
                </header>
                
                <main className="contact-modal-body contact-modal-body--scrollable">
                    <form id="create-contact-form" onSubmit={handleSubmit} className="create-contact-form" noValidate>
                        {/* General Error */}
                        {generalError && (
                            <Card className="contacts-error-card">
                                <CardContent className="contacts-error-card-content">
                                    <AlertTriangleIcon className="contacts-error-card-icon" />
                                    <p className="create-contact-form__general-error">{generalError}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Success Message */}
                        {successMessage && (
                            <Card className="contacts-success-card">
                                <CardContent className="contacts-success-card-content">
                                    <SuccessIcon className="contacts-success-card-icon" />
                                    <p className="create-contact-form__success">{successMessage}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Name Fields */}
                        <div className="contact-modal-grid">
                            <div className="create-contact-form__field">
                                <Input
                                    label="First Name"
                                    id="first_name"
                                    type="text"
                                    value={formData.first_name || ''}
                                    onChange={(e) => handleFieldChange('first_name', e.target.value)}
                                    error={errors.first_name}
                                    placeholder="John"
                                    leftIcon={<UsersIcon />}
                                    fullWidth
                                />
                            </div>
                            <div className="create-contact-form__field">
                                <Input
                                    label="Last Name"
                                    id="last_name"
                                    type="text"
                                    value={formData.last_name || ''}
                                    onChange={(e) => handleFieldChange('last_name', e.target.value)}
                                    error={errors.last_name}
                                    placeholder="Doe"
                                    leftIcon={<UsersIcon />}
                                    fullWidth
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="create-contact-form__field">
                            <Input
                                label="Email"
                                id="email"
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => handleFieldChange('email', e.target.value)}
                                error={errors.email}
                                placeholder="john@example.com"
                                leftIcon={<MailIcon />}
                                fullWidth
                            />
                        </div>

                        {/* Title */}
                        <div className="create-contact-form__field">
                            <Input
                                label="Job Title"
                                id="title"
                                type="text"
                                value={formData.title || ''}
                                onChange={(e) => handleFieldChange('title', e.target.value)}
                                error={errors.title}
                                placeholder="CEO, Manager, etc."
                                leftIcon={<OfficeBuildingIcon />}
                                fullWidth
                            />
                        </div>

                        {/* Departments */}
                        <div className="create-contact-form__field">
                            <Input
                                label="Departments"
                                id="departments"
                                type="text"
                                value={departmentsInput}
                                onChange={(e) => handleDepartmentsChange(e.target.value)}
                                error={errors.departments}
                                placeholder="executive, sales (comma-separated)"
                                helperText="Enter departments separated by commas"
                                leftIcon={<BuildingIcon />}
                                fullWidth
                            />
                            {formData.departments && formData.departments.length > 0 && (
                                <div className="create-contact-form__departments-tags">
                                    {formData.departments.map((dept, index) => (
                                        <span key={`dept-${index}-${dept}`} className="create-contact-form__departments-tag">
                                            {dept}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newDepts = (formData.departments || []).filter((_, i) => i !== index);
                                                    setFormData(prev => ({ ...prev, departments: newDepts }));
                                                    setDepartmentsInput(newDepts.join(', '));
                                                }}
                                                className="create-contact-form__departments-tag-remove"
                                                aria-label={`Remove ${dept}`}
                                            >
                                                <XMarkIcon className="create-contact-form__departments-tag-icon" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Mobile Phone */}
                        <div className="create-contact-form__field">
                            <Input
                                label="Mobile Phone"
                                id="mobile_phone"
                                type="tel"
                                value={formData.mobile_phone || ''}
                                onChange={(e) => handleFieldChange('mobile_phone', e.target.value)}
                                error={errors.mobile_phone}
                                placeholder="+1234567890"
                                leftIcon={<PhoneIcon />}
                                fullWidth
                            />
                        </div>

                        {/* Email Status */}
                        <div className="create-contact-form__field">
                            <Select
                                label="Email Status"
                                id="email_status"
                                value={formData.email_status || ''}
                                onChange={(e) => handleFieldChange('email_status', e.target.value)}
                                error={errors.email_status}
                                options={[
                                    { value: '', label: 'Select email status (optional)' },
                                    { value: 'valid', label: 'Verified' },
                                    { value: 'unknown', label: 'Unverified' },
                                    { value: 'invalid', label: 'Bounced' },
                                ]}
                                placeholder="Select email status"
                                fullWidth
                            />
                        </div>

                        {/* Seniority */}
                        <div className="create-contact-form__field">
                            <Input
                                label="Seniority"
                                id="seniority"
                                type="text"
                                value={formData.seniority || ''}
                                onChange={(e) => handleFieldChange('seniority', e.target.value)}
                                error={errors.seniority}
                                placeholder="c-level, director, manager, etc."
                                fullWidth
                            />
                        </div>

                        {/* Company ID */}
                        <div className="create-contact-form__field">
                            <Input
                                label="Company ID (UUID)"
                                id="company_id"
                                type="text"
                                value={formData.company_id || ''}
                                onChange={(e) => handleFieldChange('company_id', e.target.value)}
                                error={errors.company_id}
                                placeholder="Company UUID (optional)"
                                leftIcon={<BuildingIcon />}
                                helperText="Optional: UUID of the related company"
                                fullWidth
                            />
                        </div>

                        {/* Text Search */}
                        <div className="create-contact-form__field">
                            <Textarea
                                label="Search Text / Location"
                                id="text_search"
                                value={formData.text_search || ''}
                                onChange={(e) => handleFieldChange('text_search', e.target.value)}
                                error={errors.text_search}
                                placeholder="Free-form search text, e.g., location information"
                                helperText="Optional: Additional searchable text or location information"
                                rows={3}
                                fullWidth
                            />
                        </div>
                    </form>
                </main>

                <footer className="contact-modal-footer">
                    <div className="create-contact-form__actions">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="contact-modal-footer__button"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            form="create-contact-form"
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                            leftIcon={!isSubmitting ? <PlusIcon /> : undefined}
                            className="contact-modal-footer__button"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Contact'}
                        </Button>
                    </div>
                </footer>
            </div>
        </div>
    );
};


const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // View mode state for responsive design
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [isMobile, setIsMobile] = useState(false);
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortableColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filter state
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [uniqueIndustries, setUniqueIndustries] = useState<string[]>([]);
  const [uniqueTitles, setUniqueTitles] = useState<string[]>([]);
  const [uniqueCompanies, setUniqueCompanies] = useState<string[]>([]);
  const [isLoadingTitles, setIsLoadingTitles] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  // Dual pagination state
  const [paginationMode, setPaginationMode] = useState<'cursor' | 'offset'>('cursor');
  const [pageSize, setPageSize] = useState(25); // For cursor pagination
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursor, setPrevCursor] = useState<string | null>(null);
  const [limit, setLimit] = useState(20); // For offset pagination
  const [offset, setOffset] = useState(0);
  const [totalContacts, setTotalContacts] = useState(0);
  const [responseMeta, setResponseMeta] = useState<any>(null);

  // Column configuration state
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  
  // Define default column configuration
  const defaultColumns: ColumnConfig[] = [
    // Essential columns (always visible by default)
    { id: 'name', label: 'Name', field: 'name', visible: true, sortable: true, category: 'essential', width: '250px' },
    { id: 'email', label: 'Email', field: 'email', visible: true, sortable: false, category: 'essential', width: '200px' },
    { id: 'company', label: 'Company', field: 'company', visible: true, sortable: true, category: 'essential', width: '200px' },
    { id: 'phone', label: 'Phone', field: 'phone', visible: true, sortable: false, category: 'essential', width: '150px' },
    { id: 'status', label: 'Status', field: 'status', visible: true, sortable: true, category: 'status', width: '100px' },
    
    // Person information columns
    { id: 'title', label: 'Title', field: 'title', visible: true, sortable: true, category: 'person', width: '150px' },
    { id: 'city', label: 'City', field: 'city', visible: true, sortable: true, category: 'person', width: '120px' },
    { id: 'state', label: 'State', field: 'state', visible: false, sortable: true, category: 'person', width: '100px' },
    { id: 'country', label: 'Country', field: 'country', visible: false, sortable: true, category: 'person', width: '120px' },
    { id: 'departments', label: 'Departments', field: 'departments', visible: false, sortable: false, category: 'person', width: '150px' },
    { id: 'seniority', label: 'Seniority', field: 'seniority', visible: false, sortable: false, category: 'person', width: '120px' },
    { id: 'stage', label: 'Stage', field: 'stage', visible: false, sortable: false, category: 'person', width: '100px' },
    
    // Company columns
    { id: 'industry', label: 'Industry', field: 'industry', visible: false, sortable: true, category: 'company', width: '150px' },
    { id: 'employeesCount', label: 'Employees', field: 'employeesCount', visible: false, sortable: false, category: 'company', width: '100px' },
    { id: 'companyAddress', label: 'Company Address', field: 'companyAddress', visible: false, sortable: false, category: 'company', width: '200px' },
    { id: 'companyCity', label: 'Company City', field: 'companyCity', visible: false, sortable: false, category: 'company', width: '120px' },
    { id: 'companyState', label: 'Company State', field: 'companyState', visible: false, sortable: false, category: 'company', width: '100px' },
    { id: 'companyCountry', label: 'Company Country', field: 'companyCountry', visible: false, sortable: false, category: 'company', width: '120px' },
    { id: 'companyPhone', label: 'Company Phone', field: 'companyPhone', visible: false, sortable: false, category: 'company', width: '150px' },
    
    // Metrics columns
    { id: 'annualRevenue', label: 'Annual Revenue', field: 'annualRevenue', visible: false, sortable: false, category: 'metrics', width: '150px' },
    { id: 'totalFunding', label: 'Total Funding', field: 'totalFunding', visible: false, sortable: false, category: 'metrics', width: '150px' },
    { id: 'latestFunding', label: 'Latest Funding', field: 'latestFunding', visible: false, sortable: false, category: 'metrics', width: '120px' },
    { id: 'latestFundingAmount', label: 'Latest Funding Amount', field: 'latestFundingAmount', visible: false, sortable: false, category: 'metrics', width: '180px' },
    { id: 'lastRaisedAt', label: 'Last Raised At', field: 'lastRaisedAt', visible: false, sortable: false, category: 'metrics', width: '120px' },
    
    // Status columns
    { id: 'emailStatus', label: 'Email Status', field: 'emailStatus', visible: true, sortable: true, category: 'status', width: '120px' },
    { id: 'primaryEmailCatchAllStatus', label: 'Catch-All Status', field: 'primaryEmailCatchAllStatus', visible: false, sortable: false, category: 'status', width: '150px' },
    
    // Timestamp columns
    { id: 'createdAt', label: 'Created At', field: 'createdAt', visible: true, sortable: true, category: 'timestamps', width: '120px' },
    { id: 'updatedAt', label: 'Updated At', field: 'updatedAt', visible: false, sortable: true, category: 'timestamps', width: '120px' },
    
    // URL columns
    { id: 'website', label: 'Website', field: 'website', visible: false, sortable: false, category: 'urls', width: '150px' },
    { id: 'personLinkedinUrl', label: 'LinkedIn (Person)', field: 'personLinkedinUrl', visible: false, sortable: false, category: 'urls', width: '150px' },
    { id: 'companyLinkedinUrl', label: 'LinkedIn (Company)', field: 'companyLinkedinUrl', visible: false, sortable: false, category: 'urls', width: '150px' },
    
    // Other columns
    { id: 'technologies', label: 'Technologies', field: 'technologies', visible: false, sortable: false, category: 'other', width: '150px' },
    { id: 'keywords', label: 'Keywords', field: 'keywords', visible: false, sortable: false, category: 'other', width: '150px' },
    { id: 'notes', label: 'Notes', field: 'notes', visible: false, sortable: false, category: 'other', width: '200px' },
  ];

  // Load column configuration from localStorage
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('contacts-columns-config');
      if (saved) {
        try {
          const savedColumns = JSON.parse(saved);
          // Merge with default columns to handle new columns
          return defaultColumns.map(col => {
            const savedCol = savedColumns.find((s: ColumnConfig) => s.id === col.id);
            return savedCol ? { ...col, visible: savedCol.visible } : col;
          });
        } catch (e) {
          console.error('Failed to parse saved columns:', e);
        }
      }
    }
    return defaultColumns;
  });

  // Save column configuration to localStorage
  const saveColumnsToLocalStorage = useCallback((cols: ColumnConfig[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('contacts-columns-config', JSON.stringify(cols));
    }
  }, []);

  // Column management functions
  const toggleColumn = useCallback((columnId: string) => {
    setColumns(prev => {
      const updated = prev.map(col => 
        col.id === columnId ? { ...col, visible: !col.visible } : col
      );
      saveColumnsToLocalStorage(updated);
      return updated;
    });
  }, [saveColumnsToLocalStorage]);

  const toggleAllColumns = useCallback((visible: boolean) => {
    setColumns(prev => {
      const updated = prev.map(col => ({ ...col, visible }));
      saveColumnsToLocalStorage(updated);
      return updated;
    });
  }, [saveColumnsToLocalStorage]);

  const resetColumnsToDefault = useCallback(() => {
    setColumns(defaultColumns);
    saveColumnsToLocalStorage(defaultColumns);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveColumnsToLocalStorage]);

  const visibleColumns = useMemo(() => columns.filter(col => col.visible), [columns]);

  // Import state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportStatusModalOpen, setIsImportStatusModalOpen] = useState(false);
  const [isImportErrorsModalOpen, setIsImportErrorsModalOpen] = useState(false);
  const [currentImportJob, setCurrentImportJob] = useState<ImportJob | null>(null);
  const [currentImportJobId, setCurrentImportJobId] = useState<string | null>(null);

  // Create contact state
  const [isCreateContactModalOpen, setIsCreateContactModalOpen] = useState(false);

  // Contact selection state
  const [selectedContactUuids, setSelectedContactUuids] = useState<Set<string>>(new Set());
  
  // Selection helper functions
  const toggleContactSelection = useCallback((uuid: string | undefined) => {
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
  }, []);

  const toggleSelectAll = useCallback(() => {
    const allUuids = contacts.filter(c => c.uuid).map(c => c.uuid!);
    if (allUuids.length === 0) return;
    
    const allSelected = allUuids.every(uuid => selectedContactUuids.has(uuid));
    if (allSelected) {
      // Deselect all
      setSelectedContactUuids(new Set());
    } else {
      // Select all
      setSelectedContactUuids(new Set(allUuids));
    }
  }, [contacts, selectedContactUuids]);

  const clearSelection = useCallback(() => {
    setSelectedContactUuids(new Set());
  }, []);

  const isSelectAllChecked = useMemo(() => {
    const allUuids = contacts.filter(c => c.uuid).map(c => c.uuid!);
    return allUuids.length > 0 && allUuids.every(uuid => selectedContactUuids.has(uuid));
  }, [contacts, selectedContactUuids]);

  const isSelectAllIndeterminate = useMemo(() => {
    const allUuids = contacts.filter(c => c.uuid).map(c => c.uuid!);
    const selectedCount = allUuids.filter(uuid => selectedContactUuids.has(uuid)).length;
    return selectedCount > 0 && selectedCount < allUuids.length;
  }, [contacts, selectedContactUuids]);

  // Export state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedFilters = useDebounce(filters, 300);
  const isSearching = searchTerm !== debouncedSearchTerm;

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'status' || key === 'emailStatus' || key === 'industry') {
        if (value && value !== 'All') count++;
      } else if (Array.isArray(value)) {
        if (value.length > 0) count++;
      } else if (value && value !== '') {
        count++;
      }
    });
    return count;
  }, [filters]);

  // Load contacts with dual pagination support
  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    const startTime = performance.now();
    
    try {
      // Determine pagination mode based on whether custom sorting is applied
      const isCustomSorting = sortColumn !== null;
      const mode = isCustomSorting ? 'offset' : 'cursor';
      
      // Update pagination mode if it changed
      if (paginationMode !== mode) {
        setPaginationMode(mode);
      }

      // Prepare fetch parameters based on pagination mode
      const fetchParams: any = {
        search: debouncedSearchTerm,
        filters: debouncedFilters,
        include_meta: true, // Request metadata
      };

      if (mode === 'cursor') {
        // Cursor pagination (default ordering by created_at)
        fetchParams.pageSize = pageSize;
        if (cursor) {
          fetchParams.cursor = cursor;
        }
        // Don't set sortColumn/sortDirection for cursor mode (uses default -created_at)
      } else {
        // Limit-offset pagination (custom ordering)
        fetchParams.sortColumn = sortColumn;
        fetchParams.sortDirection = sortDirection;
        fetchParams.limit = limit;
        fetchParams.offset = offset;
      }

      // Log active filters before API request
      filterLogger.logActiveFilters(debouncedFilters);
      
      // Build query params for logging
      const queryParams: Record<string, any> = {};
      if (debouncedSearchTerm) queryParams.search = debouncedSearchTerm;
      Object.entries(debouncedFilters).forEach(([key, value]) => {
        if (value && value !== 'All' && value !== '') {
          if (Array.isArray(value) && value.length > 0) {
            queryParams[key] = value;
          } else if (!Array.isArray(value)) {
            queryParams[key] = value;
          }
        }
      });
      if (mode === 'cursor') {
        queryParams.page_size = pageSize;
        if (cursor) queryParams.cursor = cursor;
      } else {
        queryParams.ordering = `${sortDirection === 'desc' ? '-' : ''}${sortColumn}`;
        queryParams.limit = limit;
        queryParams.offset = offset;
      }
      
      // Log API request
      filterLogger.logApiRequest('/api/v1/contacts/', queryParams, 'GET');

      const data = await fetchContacts(fetchParams);
      
      const duration = Math.round(performance.now() - startTime);
      
      // Log API response
      filterLogger.logApiResponse(200, {
        count: data.count,
        results: data.contacts,
        meta: data.meta,
      }, duration);
      
      setContacts(data.contacts);
      setTotalContacts(data.count);
      setResponseMeta(data.meta);

      // Extract cursor from next/previous URLs for cursor pagination
      if (mode === 'cursor') {
        if (data.next) {
          const nextUrl = new URL(data.next);
          const nextCursor = nextUrl.searchParams.get('cursor');
          setNextCursor(nextCursor);
        } else {
          setNextCursor(null);
        }
        
        if (data.previous) {
          const prevUrl = new URL(data.previous);
          const prevCursor = prevUrl.searchParams.get('cursor');
          setPrevCursor(prevCursor);
        } else {
          setPrevCursor(null);
        }
      }

      // Handle errors if present
      if (data.error) {
        console.error('Error fetching contacts:', {
          message: data.error.message,
          statusCode: data.error.statusCode,
          isNetworkError: data.error.isNetworkError,
          isTimeoutError: data.error.isTimeoutError,
        });
      }
    } catch (error) {
      console.error('Failed to load contacts:', error instanceof Error ? error.message : String(error));
      
      // Log API error
      filterLogger.error('Failed to load contacts', error);
      
      setContacts([]);
      setTotalContacts(0);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, debouncedFilters, sortColumn, sortDirection, pageSize, cursor, limit, offset, paginationMode]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Responsive view mode handling
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-switch to card view on mobile, table view on desktop
      setViewMode(mobile ? 'card' : 'table');
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadIndustries = async () => {
        const industries = await fetchDistinctValues('industry');
        setUniqueIndustries(industries.sort());
    };
    loadIndustries();
  }, []);

  // Load titles for dropdown
  useEffect(() => {
    const loadTitles = async () => {
        setIsLoadingTitles(true);
        try {
            const results = await fetchFieldValues('title', { distinct: true, ordering: 'value', limit: 100 });
            // Extract values from results - API returns objects with 'id' and field value
            const titles = results
                .map(item => {
                    // The API returns objects like { id: number, title: string } or { id: number, value: string }
                    return item.title || item.value || (item as any)[Object.keys(item).find(k => k !== 'id') || ''] || '';
                })
                .filter(Boolean)
                .sort();
            setUniqueTitles(titles);
        } catch (error) {
            console.error('Failed to load titles:', error);
        } finally {
            setIsLoadingTitles(false);
        }
    };
    loadTitles();
  }, []);

  // Load companies for dropdown
  useEffect(() => {
    const loadCompanies = async () => {
        setIsLoadingCompanies(true);
        try {
            const results = await fetchFieldValues('company', { distinct: true, ordering: 'value', limit: 100 });
            // Extract values from results - API returns objects with 'id' and field value
            const companies = results
                .map(item => {
                    // The API returns objects like { id: number, company: string } or { id: number, value: string }
                    return item.company || item.value || (item as any)[Object.keys(item).find(k => k !== 'id') || ''] || '';
                })
                .filter(Boolean)
                .sort();
            setUniqueCompanies(companies);
        } catch (error) {
            console.error('Failed to load companies:', error);
        } finally {
            setIsLoadingCompanies(false);
        }
    };
    loadCompanies();
  }, []);

  // Sorting handler - switches to offset pagination
  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    // Reset pagination when sorting changes
    setOffset(0);
    setCursor(null);
  };

  // Pagination handlers
  const handleNextPage = useCallback(() => {
    if (paginationMode === 'cursor') {
      if (nextCursor) {
        setCursor(nextCursor);
      }
    } else {
      setOffset(prev => prev + limit);
    }
  }, [paginationMode, nextCursor, limit]);

  const handlePrevPage = useCallback(() => {
    if (paginationMode === 'cursor') {
      if (prevCursor) {
        setCursor(prevCursor);
      }
    } else {
      setOffset(prev => Math.max(0, prev - limit));
    }
  }, [paginationMode, prevCursor, limit]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    if (paginationMode === 'cursor') {
      setPageSize(newSize);
      setCursor(null); // Reset to first page
    } else {
      setLimit(newSize);
      setOffset(0); // Reset to first page
    }
  }, [paginationMode]);

  // Calculate current page for offset pagination
  const currentPage = paginationMode === 'offset' ? Math.floor(offset / limit) + 1 : 1;
  const totalPages = paginationMode === 'offset' ? Math.ceil(totalContacts / limit) : 1;
  
  /**
   * Handle filter input changes
   * 
   * Updates filter state when user changes a filter input field.
   * Automatically resets pagination to show results from the beginning.
   * Logs the filter change for debugging purposes.
   * 
   * @param e - Change event from input or select element
   */
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const oldValue = filters[name as keyof Filters];
    
    // Log filter change
    filterLogger.logFilterChange(name, oldValue, value);
    
    setFilters(prev => ({ ...prev, [name]: value }));
    // Reset pagination on filter change
    setCursor(null);
    setOffset(0);
  };

  /**
   * Add a value to an exclusion filter
   * 
   * Exclusion filters are array-based filters that exclude contacts matching any of the values.
   * This function adds a new value to the exclusion array if it doesn't already exist.
   * Automatically resets pagination and logs the change.
   * 
   * @param name - Name of the exclusion filter (e.g., 'exclude_titles')
   * @param value - Value to add to the exclusion list
   */
  const addExclusionValue = (name: keyof Filters, value: string) => {
    const oldArray = (filters[name] as string[]) || [];
    const newArray = oldArray.includes(value) ? oldArray : [...oldArray, value];
    
    // Log filter change
    if (newArray.length !== oldArray.length) {
      filterLogger.logFilterChange(String(name), oldArray, newArray);
    }
    
    setFilters(prev => {
      const currentArray = (prev[name] as string[]) || [];
      if (!currentArray.includes(value)) {
        return { ...prev, [name]: [...currentArray, value] };
      }
      return prev;
    });
    // Reset pagination on filter change
    setCursor(null);
    setOffset(0);
  };

  /**
   * Remove a value from an exclusion filter
   * 
   * Removes a specific value from an exclusion filter array.
   * Automatically resets pagination and logs the change.
   * 
   * @param name - Name of the exclusion filter (e.g., 'exclude_titles')
   * @param value - Value to remove from the exclusion list
   */
  const removeExclusionValue = (name: keyof Filters, value: string) => {
    const oldArray = (filters[name] as string[]) || [];
    const newArray = oldArray.filter(v => v !== value);
    
    // Log filter change
    filterLogger.logFilterChange(String(name), oldArray, newArray);
    
    setFilters(prev => {
      const currentArray = (prev[name] as string[]) || [];
      return { ...prev, [name]: currentArray.filter(v => v !== value) };
    });
    // Reset pagination on filter change
    setCursor(null);
    setOffset(0);
  };

  /**
   * Clear all active filters
   * 
   * Resets all filters to their initial state (empty or 'All' values).
   * Logs which filters were cleared for debugging.
   * Automatically resets pagination.
   */
  const clearFilters = () => {
    // Get list of active filter names
    const activeFilterNames = Object.keys(filters).filter(key => {
      const value = filters[key as keyof Filters];
      if (value === 'All' || value === '' || value === null || value === undefined) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    });
    
    // Log filter clear
    filterLogger.logFilterClear(activeFilterNames);
    
    setFilters(initialFilters);
    // Reset pagination on filter change
    setCursor(null);
    setOffset(0);
  };

  // Remove single filter handler for FilterSummaryBar
  const removeFilter = useCallback((key: keyof Filters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      // Reset to initial value
      if (Array.isArray(initialFilters[key])) {
        newFilters[key] = [];
      } else {
        newFilters[key] = initialFilters[key];
      }
      return newFilters;
    });
    // Reset pagination on filter change
    setCursor(null);
    setOffset(0);
  }, []);

  // Import handlers
  const handleImportStart = async (jobId: string) => {
    setCurrentImportJobId(jobId);
    setIsImportStatusModalOpen(true);
    
    // Start polling for job status
    const result = await pollImportJobStatus(jobId, {
      interval: 2000,
      maxAttempts: 300,
      onProgress: (job) => {
        setCurrentImportJob(job);
      },
    });

    if (result.success && result.data) {
      setCurrentImportJob(result.data);
      // Reload contacts if import completed successfully
      if (result.data.status === 'completed') {
        loadContacts();
      }
    }
  };

  const handleViewErrors = () => {
    setIsImportErrorsModalOpen(true);
  };

  // Poll import job status periodically
  useEffect(() => {
    if (currentImportJobId && isImportStatusModalOpen) {
      const interval = setInterval(async () => {
        const result = await getImportJobStatus(currentImportJobId);
        if (result.success && result.data) {
          setCurrentImportJob(result.data);
          // Stop polling if job is completed or failed
          if (result.data.status === 'completed' || result.data.status === 'failed') {
            clearInterval(interval);
            if (result.data.status === 'completed') {
              loadContacts();
            }
          }
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [currentImportJobId, isImportStatusModalOpen, loadContacts]);

  // Helper function to render table cell content based on column
  const renderCellContent = useCallback((column: ColumnConfig, contact: Contact) => {
    const value = contact[column.field];
    
    // Special rendering for specific columns
    switch (column.id) {
      case 'name':
        return (
          <div className="contacts-table-name-cell">
            <div className="contacts-table-name-avatar">
              <UsersIcon />
            </div>
            <div className="contacts-table-name-content">
              <p className="contacts-table-name-text">
                <Highlight text={contact.name} highlight={debouncedSearchTerm} />
              </p>
              <p className="contacts-table-name-email">
                <Highlight text={contact.email} highlight={debouncedSearchTerm} />
              </p>
            </div>
          </div>
        );
      
      case 'company':
        return (
          <div className="contacts-table-company-cell">
            <BuildingIcon className="contacts-table-company-icon" />
            <Highlight text={contact.company} highlight={debouncedSearchTerm} />
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
      case 'updatedAt':
        return (
          <div className="contacts-table-date-cell">
            <CalendarIcon className="contacts-table-date-icon" />
            {value ? new Date(value as string).toLocaleDateString() : '-'}
          </div>
        );
      
      case 'annualRevenue':
      case 'totalFunding':
      case 'latestFundingAmount':
        return value ? `$${(value as number).toLocaleString()}` : '-';
      
      case 'employeesCount':
        return value ? (value as number).toLocaleString() : '-';
      
      case 'phone':
        return value ? (
          <div className="contacts-table-phone-cell">
            <PhoneIcon className="contacts-table-phone-icon" />
            {value as string}
          </div>
        ) : '-';
      
      case 'email':
        return value ? (
          <div className="contacts-table-email-cell">
            <MailIcon className="contacts-table-email-icon" />
            <Highlight text={value as string} highlight={debouncedSearchTerm} />
          </div>
        ) : '-';
      
      case 'website':
      case 'personLinkedinUrl':
      case 'companyLinkedinUrl':
        return value ? (
          <a href={value as string} target="_blank" rel="noopener noreferrer" className="contacts-table-link-cell" onClick={(e) => e.stopPropagation()}>
            <GlobeAltIcon className="contacts-table-link-icon" />
            <span className="contacts-table-link-text">{value as string}</span>
          </a>
        ) : '-';
      
      default:
        // Generic rendering for other columns
        if (column.render) {
          return column.render(contact);
        }
        return value ? String(value) : '-';
    }
  }, [debouncedSearchTerm]);

  return (
    <div className="contacts-page">
        {isFilterSidebarOpen && (
            <div className="contacts-filter-overlay" onClick={() => setIsFilterSidebarOpen(false)}></div>
        )}
        <div className={`contacts-filter-sidebar-mobile${isFilterSidebarOpen ? ' contacts-filter-sidebar-mobile--open' : ''}`}>
            <div className="contacts-header">
                <div className="contacts-header-actions">
                        <Button
                            onClick={() => setIsColumnPanelOpen(true)}
                            variant="outline"
                            size="md"
                            leftIcon={<FilterIcon />}
                        >
                        </Button>
                        <Button
                            onClick={() => setIsCreateContactModalOpen(true)}
                            variant="primary"
                            size="md"
                            leftIcon={<PlusIcon />}
                        >
                        </Button>
                    {/* <Tooltip content="Configure visible columns">
                    </Tooltip> */}
                    {/* <Tooltip content="Create a new contact">
                    </Tooltip> */}
                    {selectedContactUuids.size > 0 && (
                            <Button
                                onClick={() => setIsExportModalOpen(true)}
                                variant="outline"
                                size="md"
                                leftIcon={<DownloadIcon />}
                            >
                            </Button>
                        // <Tooltip content={`Export ${selectedContactUuids.size} selected contact(s)`}>
                        // </Tooltip>
                    )}
                    {selectedContactUuids.size > 0 && (
                        <Tooltip content="Clear selection">
                            <Button
                                onClick={clearSelection}
                                variant="ghost"
                                size="md"
                                iconOnly
                                aria-label="Clear selection"
                            >
                                <XMarkIcon />
                            </Button>
                        </Tooltip>
                    )}
                </div>
            </div>
             <FilterSidebar 
                filters={filters} 
                onFilterChange={handleFilterChange} 
                onAddExclusionValue={addExclusionValue}
                onRemoveExclusionValue={removeExclusionValue}
                clearFilters={clearFilters} 
                uniqueIndustries={uniqueIndustries}
                uniqueTitles={uniqueTitles}
                uniqueCompanies={uniqueCompanies}
                isLoadingTitles={isLoadingTitles}
                isLoadingCompanies={isLoadingCompanies}
            />
        </div>

        <div className="contacts-filter-sidebar-desktop">
            <div className="contacts-header">
                <div className="contacts-header-actions">
                        <Button
                            onClick={() => setIsColumnPanelOpen(true)}
                            variant="outline"
                            size="md"
                            leftIcon={<FilterIcon />}
                        >
                        </Button>
                    {/* <Tooltip content="Configure visible columns">
                    </Tooltip> */}
                        <Button
                            onClick={() => setIsCreateContactModalOpen(true)}
                            variant="primary"
                            size="md"
                            leftIcon={<PlusIcon />}
                        >
                        </Button>
                    {/* <Tooltip content="Create a new contact">
                    </Tooltip> */}
                    {selectedContactUuids.size > 0 && (
                            <Button
                                onClick={() => setIsExportModalOpen(true)}
                                variant="outline"
                                size="md"
                                leftIcon={<DownloadIcon />}
                            >
                            </Button>
                        // <Tooltip content={`Export ${selectedContactUuids.size} selected contact(s)`}>
                        // </Tooltip>
                    )}
                    {selectedContactUuids.size > 0 && (
                        <Tooltip content="Clear selection">
                            <Button
                                onClick={clearSelection}
                                variant="ghost"
                                size="md"
                                iconOnly
                                aria-label="Clear selection"
                            >
                                <XMarkIcon />
                            </Button>
                        </Tooltip>
                    )}
                </div>
            </div>
             <FilterSidebar 
                filters={filters} 
                onFilterChange={handleFilterChange} 
                onAddExclusionValue={addExclusionValue}
                onRemoveExclusionValue={removeExclusionValue}
                clearFilters={clearFilters} 
                uniqueIndustries={uniqueIndustries}
                uniqueTitles={uniqueTitles}
                uniqueCompanies={uniqueCompanies}
                isLoadingTitles={isLoadingTitles}
                isLoadingCompanies={isLoadingCompanies}
            />
        </div>

        <main className="contacts-main">
            {/* Selection Summary Bar */}
            {selectedContactUuids.size > 0 && (
                <div className="contacts-selection-summary">
                    <div className="contacts-selection-summary__content">
                        <strong>{selectedContactUuids.size}</strong>
                        <span>contact{selectedContactUuids.size !== 1 ? 's' : ''} selected</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSelection}
                    >
                        Clear Selection
                    </Button>
                </div>
            )}

            {/* Response Metadata Display */}
            {responseMeta && (
                <div className="contacts-response-meta">
                    <span className="contacts-response-meta-item">
                        <strong>Strategy:</strong> {responseMeta.strategy}
                    </span>
                    {responseMeta.count_mode && (
                        <span className="contacts-response-meta-item">
                            <strong>Count:</strong> {responseMeta.count_mode}
                        </span>
                    )}
                    {responseMeta.using_replica && (
                        <span className="contacts-response-meta-item contacts-response-meta-item--highlight">
                            <strong>Using Replica</strong>
                        </span>
                    )}
                    <span className="contacts-response-meta-item">
                        <strong>Records:</strong> {responseMeta.returned_records}/{responseMeta.page_size}
                    </span>
                </div>
            )}
            
            <div className="contacts-search-bar">
                <div className="contacts-search-input-wrapper">
                    <Input
                        type="text"
                        placeholder="Search by name, email, company..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCursor(null); setOffset(0); }}
                        leftIcon={<SearchIcon />}
                        rightIcon={isSearching ? (
                            <LoadingSpinner size="md" className="contacts-loading-spinner" />
                        ) : undefined}
                        fullWidth
                    />
                </div>
                <Tooltip content="Open filters">
                    <Button
                        onClick={() => isMobile ? setIsMobileFilterOpen(true) : setIsFilterSidebarOpen(true)}
                        variant="outline"
                        size="md"
                        iconOnly
                        className="contacts-filter-btn-mobile"
                        aria-label="Open filters"
                    >
                        <FilterIcon className="contacts-filter-icon" />
                        {activeFilterCount > 0 && (
                            <span className="contacts-badge-text">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                </Tooltip>
            </div>

            {/* Filter Summary Bar */}
            <FilterSummaryBar
                filters={filters}
                onClearAll={clearFilters}
                onRemoveFilter={removeFilter}
            />
      
            <div className="contacts-table-container">
            {isLoading ? (
              <div className="contacts-loading-container">
                  <div className="inline-block">
                    <div className="contacts-loading-spinner"></div>
                    <p className="contacts-loading-text">Loading contacts...</p>
                  </div>
              </div>
            ) : contacts.length === 0 ? (
              <Card className="contacts-empty-container">
                  <p className="contacts-empty-text">
                      No contacts found matching your criteria.
                  </p>
              </Card>
            ) : viewMode === 'card' ? (
              <div className="contacts-card-grid">
                {contacts.map((contact, index) => (
                  <ContactCard
                    key={contact.uuid || `contact-${index}`}
                    contact={contact}
                    searchTerm={debouncedSearchTerm}
                    className="stagger-item"
                  />
                ))}
              </div>
            ) : (
                  <Table responsive>
                    <TableHeader>
                      <TableRow>
                            <TableHead className="contacts-table-head--narrow">
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
                        {visibleColumns.map(column => (
                          <TableHead
                            key={column.id}
                            sortable={column.sortable}
                            sortDirection={sortColumn === column.id ? sortDirection : null}
                            onSort={column.sortable ? () => handleSort(column.id as SortableColumn) : undefined}
                            style={column.width ? { minWidth: column.width } : undefined}
                          >
                            {column.label}
                          </TableHead>
                        ))}
                        <TableHead className="table-head-actions">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact, index) => {
                        const isSelected = contact.uuid ? selectedContactUuids.has(contact.uuid) : false;
                        return (
                          <TableRow 
                            key={contact.uuid || `contact-${index}`}
                            onClick={() => {
                              if (contact.uuid) {
                                window.open(`/contacts/${contact.uuid}`, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            className={`contacts-table-row-interactive ${isSelected ? 'contacts-table-row-selected' : ''}`}
                            title="Click to view contact details in new tab"
                          >
                            <TableCell 
                              className="contacts-table-cell--compact"
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
                            {visibleColumns.map(column => (
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
            {!isLoading && contacts.length > 0 && (
                <div className="contacts-pagination">
                    <div className="contacts-pagination-info">
                        {paginationMode === 'cursor' ? (
                            <>
                                Showing <strong className="text-foreground">{contacts.length}</strong> contacts
                                {totalContacts > 0 && ` (Total: ${totalContacts.toLocaleString()})`}
                                <span className="contacts-pagination-note">(Cursor Pagination)</span>
                            </>
                        ) : (
                            <>
                                Showing <strong className="text-foreground">{offset + 1}</strong> to <strong className="text-foreground">{Math.min(offset + limit, totalContacts)}</strong> of <strong className="text-foreground">{totalContacts.toLocaleString()}</strong> results
                                <span className="contacts-pagination-note">(Page {currentPage} of {totalPages})</span>
                            </>
                        )}
                    </div>
                    <div className="contacts-pagination-controls">
                        <Tooltip content="Previous page">
                            <Button
                                variant="outline"
                                size="sm"
                                iconOnly
                                onClick={handlePrevPage}
                                disabled={paginationMode === 'cursor' ? !prevCursor : offset === 0}
                                aria-label="Previous page"
                            >
                                <ChevronLeftIcon />
                            </Button>
                        </Tooltip>
                        {paginationMode === 'offset' && (
                            <span className="contacts-pagination-page">Page {currentPage} of {totalPages}</span>
                        )}
                        {paginationMode === 'cursor' && (
                            <Select
                                value={String(pageSize)}
                                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                options={[
                                    { value: '10', label: '10 per page' },
                                    { value: '25', label: '25 per page' },
                                    { value: '50', label: '50 per page' },
                                    { value: '100', label: '100 per page' },
                                ]}
                                className="contacts-pagination-select"
                            />
                        )}
                        <Tooltip content="Next page">
                            <Button
                                variant="outline"
                                size="sm"
                                iconOnly
                                onClick={handleNextPage}
                                disabled={paginationMode === 'cursor' ? !nextCursor : offset + limit >= totalContacts}
                                aria-label="Next page"
                            >
                                <ChevronRightIcon />
                            </Button>
                        </Tooltip>
                    </div>
                </div>
            )}
        </main>
      
      {/* Column Toggle Panel */}
      <ColumnTogglePanel
        isOpen={isColumnPanelOpen}
        onClose={() => setIsColumnPanelOpen(false)}
        columns={columns}
        onToggleColumn={toggleColumn}
        onToggleAll={toggleAllColumns}
        onResetToDefault={resetColumnsToDefault}
      />
      
      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImportStart={handleImportStart}
      />
      {isImportStatusModalOpen && currentImportJob && (
        <div className="contact-modal-overlay" onClick={() => setIsImportStatusModalOpen(false)}>
          <div className="contact-modal-content contact-modal-content-wrapper" onClick={e => e.stopPropagation()}>
            <ImportJobStatus 
              job={currentImportJob} 
              onClose={() => setIsImportStatusModalOpen(false)}
              onViewErrors={handleViewErrors}
            />
          </div>
        </div>
      )}
      {currentImportJobId && (
        <ImportErrorsModal 
          isOpen={isImportErrorsModalOpen} 
          onClose={() => setIsImportErrorsModalOpen(false)} 
          jobId={currentImportJobId}
        />
      )}
      <CreateContactModal
        isOpen={isCreateContactModalOpen}
        onClose={() => setIsCreateContactModalOpen(false)}
        onSuccess={loadContacts}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        selectedContactUuids={Array.from(selectedContactUuids)}
        exportType="contacts"
        currentPageData={contacts}
        filters={filters}
        totalCount={totalContacts}
        navigateToHistory={true}
        onExportComplete={() => {
          clearSelection();
        }}
      />
      
      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Filters"
        activeFilterCount={activeFilterCount}
      >
        <FilterSidebar 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          onAddExclusionValue={addExclusionValue}
          onRemoveExclusionValue={removeExclusionValue}
          clearFilters={clearFilters} 
          uniqueIndustries={uniqueIndustries}
          uniqueTitles={uniqueTitles}
          uniqueCompanies={uniqueCompanies}
          isLoadingTitles={isLoadingTitles}
          isLoadingCompanies={isLoadingCompanies}
        />
      </MobileFilterDrawer>
    </div>
  );
};

export default Contacts;
