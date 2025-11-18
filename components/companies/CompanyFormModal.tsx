/**
 * CompanyFormModal Component
 * 
 * Modal form for creating or editing companies.
 * Supports all fields from the CompanyCreate/CompanyUpdate schema.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Company, CompanyCreate, CompanyUpdate } from '@/types/company';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { Textarea } from '@components/ui/Textarea';
import { Button } from '@components/ui/Button';
import { SaveIcon, CancelIcon } from '@components/icons';

interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CompanyCreate | CompanyUpdate) => Promise<void>;
  company?: Company | null;
  isSubmitting?: boolean;
}

export const CompanyFormModal: React.FC<CompanyFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  company,
  isSubmitting = false,
}) => {
  const isEditMode = Boolean(company);

  // Form state
  const [formData, setFormData] = useState<CompanyCreate>({
    name: '',
    employees_count: undefined,
    annual_revenue: undefined,
    total_funding: undefined,
    industries: [],
    keywords: [],
    technologies: [],
    address: '',
    metadata: {
      city: '',
      state: '',
      country: '',
      phone_number: '',
      website: '',
      linkedin_url: '',
      facebook_url: '',
      twitter_url: '',
    },
  });

  // Text fields for arrays (comma-separated)
  const [industriesText, setIndustriesText] = useState('');
  const [keywordsText, setKeywordsText] = useState('');
  const [technologiesText, setTechnologiesText] = useState('');

  // Initialize form with company data when editing
  useEffect(() => {
    if (company && isOpen) {
      setFormData({
        name: company.name || '',
        employees_count: company.employeesCount,
        annual_revenue: company.annualRevenue,
        total_funding: company.totalFunding,
        industries: company.industries || [],
        keywords: company.keywords || [],
        technologies: company.technologies || [],
        address: company.address || '',
        metadata: {
          city: company.metadata?.city || '',
          state: company.metadata?.state || '',
          country: company.metadata?.country || '',
          phone_number: company.metadata?.phone_number || '',
          website: company.metadata?.website || '',
          linkedin_url: company.metadata?.linkedin_url || '',
          facebook_url: company.metadata?.facebook_url || '',
          twitter_url: company.metadata?.twitter_url || '',
        },
      });
      setIndustriesText(company.industries?.join(', ') || '');
      setKeywordsText(company.keywords?.join(', ') || '');
      setTechnologiesText(company.technologies?.join(', ') || '');
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        name: '',
        employees_count: undefined,
        annual_revenue: undefined,
        total_funding: undefined,
        industries: [],
        keywords: [],
        technologies: [],
        address: '',
        metadata: {
          city: '',
          state: '',
          country: '',
          phone_number: '',
          website: '',
          linkedin_url: '',
          facebook_url: '',
          twitter_url: '',
        },
      });
      setIndustriesText('');
      setKeywordsText('');
      setTechnologiesText('');
    }
  }, [company, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse comma-separated arrays
    const industries = industriesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const keywords = keywordsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const technologies = technologiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // Prepare submission data (only include non-empty fields)
    const submitData: CompanyCreate = {};

    if (formData.name) submitData.name = formData.name;
    if (formData.employees_count !== undefined && formData.employees_count !== null) {
      submitData.employees_count = Number(formData.employees_count);
    }
    if (formData.annual_revenue !== undefined && formData.annual_revenue !== null) {
      submitData.annual_revenue = Number(formData.annual_revenue);
    }
    if (formData.total_funding !== undefined && formData.total_funding !== null) {
      submitData.total_funding = Number(formData.total_funding);
    }
    if (industries.length > 0) submitData.industries = industries;
    if (keywords.length > 0) submitData.keywords = keywords;
    if (technologies.length > 0) submitData.technologies = technologies;
    if (formData.address) submitData.address = formData.address;

    // Include metadata only if at least one field is filled
    const hasMetadata = Object.values(formData.metadata || {}).some(
      (v) => v && v.trim()
    );
    if (hasMetadata) {
      submitData.metadata = {};
      if (formData.metadata?.city) submitData.metadata.city = formData.metadata.city;
      if (formData.metadata?.state) submitData.metadata.state = formData.metadata.state;
      if (formData.metadata?.country) submitData.metadata.country = formData.metadata.country;
      if (formData.metadata?.phone_number) submitData.metadata.phone_number = formData.metadata.phone_number;
      if (formData.metadata?.website) submitData.metadata.website = formData.metadata.website;
      if (formData.metadata?.linkedin_url) submitData.metadata.linkedin_url = formData.metadata.linkedin_url;
      if (formData.metadata?.facebook_url) submitData.metadata.facebook_url = formData.metadata.facebook_url;
      if (formData.metadata?.twitter_url) submitData.metadata.twitter_url = formData.metadata.twitter_url;
    }

    await onSubmit(submitData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Company' : 'Create Company'}
      size="lg"
      closeOnOverlayClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit} className="company-form-modal__form">
        {/* Basic Information */}
        <div className="company-form-modal__section">
          <h3 className="company-form-modal__section-title">
            Basic Information
          </h3>
          <div className="company-form-modal__section-content">
            <Input
              label="Company Name"
              value={formData.name || ''}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter company name"
              required
            />

            <div className="company-form-modal__section-grid company-form-modal__section-grid--3-cols">
              <Input
                label="Employees"
                type="number"
                value={formData.employees_count || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    employees_count: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="Number of employees"
              />

              <Input
                label="Annual Revenue ($)"
                type="number"
                value={formData.annual_revenue || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    annual_revenue: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="Annual revenue"
              />

              <Input
                label="Total Funding ($)"
                type="number"
                value={formData.total_funding || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    total_funding: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="Total funding"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="company-form-modal__section">
          <h3 className="company-form-modal__section-title">
            Categories
          </h3>
          <div className="company-form-modal__section-content">
            <Input
              label="Industries"
              value={industriesText}
              onChange={(e) => setIndustriesText(e.target.value)}
              placeholder="Technology, Software, AI (comma-separated)"
              helperText="Enter multiple industries separated by commas"
            />

            <Input
              label="Keywords"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="saas, enterprise, cloud (comma-separated)"
              helperText="Enter multiple keywords separated by commas"
            />

            <Input
              label="Technologies"
              value={technologiesText}
              onChange={(e) => setTechnologiesText(e.target.value)}
              placeholder="Python, AWS, PostgreSQL (comma-separated)"
              helperText="Enter multiple technologies separated by commas"
            />
          </div>
        </div>

        {/* Location */}
        <div className="company-form-modal__section">
          <h3 className="company-form-modal__section-title">Location</h3>
          <div className="company-form-modal__section-content">
            <Textarea
              label="Address"
              value={formData.address || ''}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="123 Main St, Suite 100"
              rows={2}
            />

            <div className="company-form-modal__section-grid company-form-modal__section-grid--3-cols">
              <Input
                label="City"
                value={formData.metadata?.city || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, city: e.target.value },
                  })
                }
                placeholder="San Francisco"
              />

              <Input
                label="State"
                value={formData.metadata?.state || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, state: e.target.value },
                  })
                }
                placeholder="CA"
              />

              <Input
                label="Country"
                value={formData.metadata?.country || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, country: e.target.value },
                  })
                }
                placeholder="United States"
              />
            </div>
          </div>
        </div>

        {/* Contact & Social */}
        <div className="company-form-modal__section">
          <h3 className="company-form-modal__section-title">
            Contact & Social
          </h3>
          <div className="company-form-modal__section-content">
            <div className="company-form-modal__section-grid company-form-modal__section-grid--2-cols">
              <Input
                label="Phone Number"
                value={formData.metadata?.phone_number || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      phone_number: e.target.value,
                    },
                  })
                }
                placeholder="+1-415-555-0100"
              />

              <Input
                label="Website"
                value={formData.metadata?.website || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, website: e.target.value },
                  })
                }
                placeholder="https://example.com"
              />
            </div>

            <Input
              label="LinkedIn URL"
              value={formData.metadata?.linkedin_url || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  metadata: {
                    ...formData.metadata,
                    linkedin_url: e.target.value,
                  },
                })
              }
              placeholder="https://linkedin.com/company/example"
            />

            <div className="company-form-modal__section-grid company-form-modal__section-grid--2-cols">
              <Input
                label="Facebook URL"
                value={formData.metadata?.facebook_url || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      facebook_url: e.target.value,
                    },
                  })
                }
                placeholder="https://facebook.com/example"
              />

              <Input
                label="Twitter URL"
                value={formData.metadata?.twitter_url || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      twitter_url: e.target.value,
                    },
                  })
                }
                placeholder="https://twitter.com/example"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="company-form-modal__footer">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !formData.name}
            leftIcon={<SaveIcon />}
          >
            {isSubmitting
              ? 'Saving...'
              : isEditMode
              ? 'Update Company'
              : 'Create Company'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

