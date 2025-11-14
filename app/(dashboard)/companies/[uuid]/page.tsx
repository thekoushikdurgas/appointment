/**
 * Company Detail Page
 * 
 * Individual company detail page with UUID-based routing.
 * Opens in new tab when clicking table rows.
 * Features glassmorphism design, loading states, and full CRUD operations.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Company } from '../../../../types/company';
import { getCompanyByUuid, deleteCompany, updateCompany } from '../../../../services/company';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Tooltip } from '../../../../components/ui/Tooltip';
import { ConfirmDialog } from '../../../../components/contacts/ConfirmDialog';
import { CompanyDetailSkeletonLoader } from '../../../../components/companies/CompanyDetailSkeleton';
import { CompanyContactsSection } from '../../../../components/companies/CompanyContactsSection';
import {
  ArrowLeftIcon,
  EditIcon,
  TrashIcon,
  BuildingIcon,
  UsersIcon,
  DollarIcon,
  MapPinIcon,
  GlobeAltIcon,
  LinkedInIcon,
  FacebookIcon,
  TwitterIcon,
  PhoneIcon,
  CalendarIcon,
  ChartBarIcon,
} from '../../../../components/icons/IconComponents';

const CompanyDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!uuid) {
        setError('Invalid company ID');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null); // Clear any previous errors
        const fetchedCompany = await getCompanyByUuid(uuid);
        
        if (!fetchedCompany) {
          setError('Company not found. The company may have been deleted or the ID is incorrect.');
        } else {
          setCompany(fetchedCompany);
          setError(null);
        }
      } catch (err) {
        console.error('[COMPANY_PAGE] Error fetching company:', err);
        // Provide more detailed error message
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Failed to load company details. Please check your connection and try again.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompany();
  }, [uuid]);

  const handleBack = () => {
    window.close(); // Close the tab
    // Fallback: navigate back if window.close() doesn't work
    setTimeout(() => {
      router.push('/companies');
    }, 100);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async () => {
    if (!company) return;

    try {
      setIsDeleting(true);
      await deleteCompany(company.id);
      showToast('Company deleted successfully', 'success');
      setTimeout(() => {
        window.close();
        router.push('/companies');
      }, 1500);
    } catch (err) {
      console.error('Error deleting company:', err);
      showToast('Failed to delete company', 'error');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const formatCurrency = (amount?: number): string => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num?: number): string => {
    if (!num) return 'N/A';
    return num.toLocaleString();
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getLocationString = (): string => {
    if (!company) return 'N/A';
    const parts = [];
    if (company.metadata?.city) parts.push(company.metadata.city);
    if (company.metadata?.state) parts.push(company.metadata.state);
    if (company.metadata?.country) parts.push(company.metadata.country);
    return parts.join(', ') || 'N/A';
  };

  const getSizeCategory = (): string => {
    if (!company) return 'Unknown';
    const count = company.employeesCount || 0;
    if (count >= 10000) return 'Enterprise';
    if (count >= 1000) return 'Large';
    if (count >= 100) return 'Medium';
    if (count >= 10) return 'Small';
    return 'Startup';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="company-detail-page">
        <CompanyDetailSkeletonLoader />
      </div>
    );
  }

  // Error state
  if (error || !company) {
    return (
      <div className="company-detail-page">
        <div className="company-detail-error">
          <div className="company-detail-error-icon">
            <BuildingIcon />
          </div>
          <h1 className="company-detail-error-title">
            {error?.includes('not found') ? 'Company Not Found' : 'Error Loading Company'}
          </h1>
          <p className="company-detail-error-message">
            {error || 'The company you\'re looking for doesn\'t exist or has been removed.'}
          </p>
          {uuid && (
            <p className="company-detail-error-id">
              Company ID: {uuid}
            </p>
          )}
          <Button onClick={handleBack} variant="primary">
            <ArrowLeftIcon />
            Back to Companies
          </Button>
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className="company-detail-page">
      {/* Header */}
      <div className="company-detail-header">
        <div className="company-detail-header-content">
          <div className="company-detail-header-left">
            <Button
              variant="ghost"
              onClick={handleBack}
              leftIcon={<ArrowLeftIcon />}
              aria-label="Back to companies"
            >
              Back
            </Button>
            <div>
              <h1 className="company-detail-title">{company.name}</h1>
              <p className="company-detail-subtitle">
                Company Details • {getSizeCategory()}
              </p>
            </div>
          </div>
          <div className="company-detail-header-actions">
            <Tooltip content="Delete company">
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                leftIcon={<TrashIcon />}
                aria-label="Delete company"
              >
                Delete
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="company-detail-overview" style={{ animationDelay: '50ms' }}>
        <div className="company-detail-overview-header">
          <div className="company-detail-overview-icon">
            <BuildingIcon />
          </div>
          <div className="company-detail-overview-content">
            <h2 className="company-detail-overview-title">{company.name}</h2>
            {company.industries && company.industries.length > 0 && (
              <div className="company-detail-overview-industries">
                {company.industries.map((industry, idx) => (
                  <span key={idx} className="company-detail-industry-badge">
                    {industry}
                  </span>
                ))}
              </div>
            )}
            {company.technologies && company.technologies.length > 0 && (
              <div className="company-detail-overview-technologies">
                {company.technologies.map((tech, idx) => (
                  <span key={idx} className="company-detail-tech-badge">
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="company-detail-metrics-grid">
          <div className="company-detail-metric-card">
            <div className="company-detail-metric-card-header">
              <div className="company-detail-metric-card-icon">
                <UsersIcon />
              </div>
              <Badge variant="glass-primary" size="sm">Count</Badge>
            </div>
            <p className="company-detail-metric-value">{formatNumber(company.employeesCount)}</p>
            <p className="company-detail-metric-label">Employees</p>
          </div>

          <div className="company-detail-metric-card">
            <div className="company-detail-metric-card-header">
              <div className="company-detail-metric-card-icon">
                <DollarIcon />
              </div>
              <Badge variant="glass-success" size="sm">Annual</Badge>
            </div>
            <p className="company-detail-metric-value company-detail-metric-value--large">{formatCurrency(company.annualRevenue)}</p>
            <p className="company-detail-metric-label">Revenue</p>
          </div>

          <div className="company-detail-metric-card">
            <div className="company-detail-metric-card-header">
              <div className="company-detail-metric-card-icon">
                <ChartBarIcon />
              </div>
              <Badge variant="glass-success" size="sm">Total</Badge>
            </div>
            <p className="company-detail-metric-value company-detail-metric-value--large">{formatCurrency(company.totalFunding)}</p>
            <p className="company-detail-metric-label">Funding</p>
          </div>

          <div className="company-detail-metric-card">
            <div className="company-detail-metric-card-header">
              <div className="company-detail-metric-card-icon">
                <CalendarIcon />
              </div>
              <Badge variant="glass-primary" size="sm">Date</Badge>
            </div>
            <p className="company-detail-metric-date">{formatDate(company.createdAt)}</p>
            <p className="company-detail-metric-label">Added</p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="company-detail-details-grid">
        {/* Contact Information */}
        <div className="company-detail-section" style={{ animationDelay: '100ms' }}>
          <h3 className="company-detail-section-title">
            <GlobeAltIcon className="company-detail-section-title-icon" />
            Contact Information
          </h3>
          <div className="company-detail-section-content">
            {company.metadata?.website && (
              <div className="company-detail-info-item">
                <GlobeAltIcon className="company-detail-info-item-icon" />
                <div className="company-detail-info-item-content">
                  <p className="company-detail-info-item-label">Website</p>
                  <a
                    href={company.metadata.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="company-detail-info-item-link"
                  >
                    {company.metadata.website}
                  </a>
                </div>
              </div>
            )}
            {company.metadata?.phone_number && (
              <div className="company-detail-info-item">
                <PhoneIcon className="company-detail-info-item-icon" />
                <div className="company-detail-info-item-content">
                  <p className="company-detail-info-item-label">Phone</p>
                  <a
                    href={`tel:${company.metadata.phone_number}`}
                    className="company-detail-info-item-link company-detail-info-item-link--phone"
                  >
                    {company.metadata.phone_number}
                  </a>
                </div>
              </div>
            )}
            {company.metadata?.linkedin_url && (
              <div className="company-detail-info-item">
                <LinkedInIcon className="company-detail-info-item-icon" />
                <div className="company-detail-info-item-content">
                  <p className="company-detail-info-item-label">LinkedIn</p>
                  <a
                    href={company.metadata.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="company-detail-info-item-link"
                  >
                    {company.metadata.linkedin_url}
                  </a>
                </div>
              </div>
            )}
            {company.metadata?.facebook_url && (
              <div className="company-detail-info-item">
                <FacebookIcon className="company-detail-info-item-icon" />
                <div className="company-detail-info-item-content">
                  <p className="company-detail-info-item-label">Facebook</p>
                  <a
                    href={company.metadata.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="company-detail-info-item-link"
                  >
                    {company.metadata.facebook_url}
                  </a>
                </div>
              </div>
            )}
            {company.metadata?.twitter_url && (
              <div className="company-detail-info-item">
                <TwitterIcon className="company-detail-info-item-icon" />
                <div className="company-detail-info-item-content">
                  <p className="company-detail-info-item-label">Twitter</p>
                  <a
                    href={company.metadata.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="company-detail-info-item-link"
                  >
                    {company.metadata.twitter_url}
                  </a>
                </div>
              </div>
            )}
            {!company.metadata?.website && !company.metadata?.phone_number && !company.metadata?.linkedin_url && !company.metadata?.facebook_url && !company.metadata?.twitter_url && (
              <p className="company-detail-info-empty">No contact information available</p>
            )}
          </div>
        </div>

        {/* Location Information */}
        <div className="company-detail-section" style={{ animationDelay: '150ms' }}>
          <h3 className="company-detail-section-title">
            <MapPinIcon className="company-detail-section-title-icon" />
            Location Information
          </h3>
          <div className="company-detail-section-content">
            {company.address && (
              <div className="company-detail-info-item">
                <MapPinIcon className="company-detail-info-item-icon" />
                <div className="company-detail-info-item-content">
                  <p className="company-detail-info-item-label">Address</p>
                  <p className="company-detail-info-item-value">{company.address}</p>
                </div>
              </div>
            )}
            {(company.metadata?.city || company.metadata?.state || company.metadata?.country) && (
              <div className="company-detail-info-item">
                <MapPinIcon className="company-detail-info-item-icon" />
                <div className="company-detail-info-item-content">
                  <p className="company-detail-info-item-label">Location</p>
                  <p className="company-detail-info-item-value">{getLocationString()}</p>
                </div>
              </div>
            )}
            {!company.address && !company.metadata?.city && !company.metadata?.state && !company.metadata?.country && (
              <p className="company-detail-info-empty">No location information available</p>
            )}
          </div>
        </div>

        {/* Company Information */}
        <div className="company-detail-section" style={{ animationDelay: '200ms' }}>
          <h3 className="company-detail-section-title">
            <BuildingIcon className="company-detail-section-title-icon" />
            Company Information
          </h3>
          <div className="company-detail-section-info">
            {company.industries && company.industries.length > 0 && (
              <div className="company-detail-section-info-group">
                <p className="company-detail-section-info-label">Industries</p>
                <div className="company-detail-section-info-badges">
                  {company.industries.map((industry, idx) => (
                    <span key={idx} className="company-detail-industry-badge">
                      {industry}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {company.technologies && company.technologies.length > 0 && (
              <div className="company-detail-section-info-group">
                <p className="company-detail-section-info-label">Technologies</p>
                <div className="company-detail-section-info-badges">
                  {company.technologies.map((tech, idx) => (
                    <span key={idx} className="company-detail-tech-badge">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {company.keywords && company.keywords.length > 0 && (
              <div className="company-detail-section-info-group">
                <p className="company-detail-section-info-label">Keywords</p>
                <div className="company-detail-section-info-badges">
                  {company.keywords.map((keyword, idx) => (
                    <Badge key={idx} variant="glass" size="sm">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="company-detail-section" style={{ animationDelay: '250ms' }}>
          <h3 className="company-detail-section-title">
            <CalendarIcon className="company-detail-section-title-icon" />
            Metadata
          </h3>
          <div className="company-detail-section-content">
            <div className="company-detail-info-item">
              <CalendarIcon className="company-detail-info-item-icon" />
              <div className="company-detail-info-item-content">
                <p className="company-detail-info-item-label">Created</p>
                <p className="company-detail-info-item-value">{formatDate(company.createdAt)}</p>
              </div>
            </div>
            {company.updatedAt && (
              <div className="company-detail-info-item">
                <CalendarIcon className="company-detail-info-item-icon" />
                <div className="company-detail-info-item-content">
                  <p className="company-detail-info-item-label">Last Updated</p>
                  <p className="company-detail-info-item-value">{formatDate(company.updatedAt)}</p>
                </div>
              </div>
            )}
            {company.uuid && (
              <div className="company-detail-info-item">
                <BuildingIcon className="company-detail-info-item-icon" />
                <div className="company-detail-info-item-content">
                  <p className="company-detail-info-item-label">UUID</p>
                  <p className="company-detail-info-item-value company-detail-info-item-value--uuid">{company.uuid}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Company Contacts Section */}
        <CompanyContactsSection
          companyUuid={uuid}
          companyName={company.name}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Company"
        message={`Are you sure you want to delete "${company.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
        variant="danger"
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`company-detail-toast company-detail-toast--${toast.type}`}>
          <div className="company-detail-toast-content">
            <div className={`company-detail-toast-indicator company-detail-toast-indicator--${toast.type}`} />
            <span className="company-detail-toast-message">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDetailPage;

