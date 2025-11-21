/**
 * LinkedInFormModal Component
 * 
 * Modal form for creating or updating contacts and companies by LinkedIn URL.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { LinkedInCreateUpdateRequest } from '@/types/linkedin';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { Textarea } from '@components/ui/Textarea';
import { Button } from '@components/ui/Button';
import { Tabs } from '@components/ui/Tabs';
import { SaveIcon, CancelIcon, UserIcon, BuildingIcon } from '@components/icons';
import { validateLinkedInUrl, normalizeLinkedInUrl } from '@utils/linkedinValidation';

interface LinkedInFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LinkedInCreateUpdateRequest) => Promise<void>;
  initialUrl?: string;
  isSubmitting?: boolean;
}

export const LinkedInFormModal: React.FC<LinkedInFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialUrl = '',
  isSubmitting = false,
}) => {
  const [activeTab, setActiveTab] = useState<'contact' | 'company'>('contact');
  const [url, setUrl] = useState(initialUrl);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Contact data
  const [contactData, setContactData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    title: '',
    seniority: '',
    departments: '',
    mobile_phone: '',
    email_status: '',
  });

  const [contactMetadata, setContactMetadata] = useState({
    website: '',
    city: '',
    state: '',
    country: '',
    work_direct_phone: '',
    home_phone: '',
    other_phone: '',
    stage: '',
  });

  // Company data
  const [companyData, setCompanyData] = useState({
    name: '',
    employees_count: '',
    industries: '',
    annual_revenue: '',
    total_funding: '',
    technologies: '',
    keywords: '',
    address: '',
  });

  const [companyMetadata, setCompanyMetadata] = useState({
    website: '',
    city: '',
    state: '',
    country: '',
    phone_number: '',
    facebook_url: '',
    twitter_url: '',
    company_name_for_emails: '',
  });

  // Validation functions
  const validateEmail = (email: string): string | null => {
    if (!email.trim()) return null; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? null : 'Please enter a valid email address';
  };

  const validateUrl = (urlValue: string): string | null => {
    if (!urlValue.trim()) return null; // Optional field
    try {
      new URL(urlValue);
      return null;
    } catch {
      return 'Please enter a valid URL (e.g., https://example.com)';
    }
  };

  const validatePhone = (phone: string): string | null => {
    if (!phone.trim()) return null; // Optional field
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    const digitsOnly = phone.replace(/\D/g, '');
    if (!phoneRegex.test(phone) || digitsOnly.length < 7) {
      return 'Please enter a valid phone number';
    }
    return null;
  };

  const validateNumber = (value: string, fieldName: string): string | null => {
    if (!value.trim()) return null; // Optional field
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) {
      return `${fieldName} must be a positive number`;
    }
    return null;
  };

  // Handle URL change with validation
  const handleUrlChange = (value: string) => {
    setUrl(value);
    setUrlError(null);
    
    if (!value.trim()) {
      return;
    }

    const validation = validateLinkedInUrl(value);
    if (!validation.valid) {
      setUrlError(validation.error || 'Invalid LinkedIn URL');
    } else if (validation.normalizedUrl && validation.normalizedUrl !== value) {
      // Auto-normalize valid URLs
      setTimeout(() => {
        setUrl(validation.normalizedUrl!);
      }, 100);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      setUrlError(null);
      setFieldErrors({});
    } else {
      setUrl('');
      setUrlError(null);
      setFieldErrors({});
      setContactData({
        first_name: '',
        last_name: '',
        email: '',
        title: '',
        seniority: '',
        departments: '',
        mobile_phone: '',
        email_status: '',
      });
      setContactMetadata({
        website: '',
        city: '',
        state: '',
        country: '',
        work_direct_phone: '',
        home_phone: '',
        other_phone: '',
        stage: '',
      });
      setCompanyData({
        name: '',
        employees_count: '',
        industries: '',
        annual_revenue: '',
        total_funding: '',
        technologies: '',
        keywords: '',
        address: '',
      });
      setCompanyMetadata({
        website: '',
        city: '',
        state: '',
        country: '',
        phone_number: '',
        facebook_url: '',
        twitter_url: '',
        company_name_for_emails: '',
      });
    }
  }, [isOpen, initialUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate URL
    if (!url.trim()) {
      setUrlError('LinkedIn URL is required');
      return;
    }

    const urlValidation = validateLinkedInUrl(url);
    if (!urlValidation.valid) {
      setUrlError(urlValidation.error || 'Invalid LinkedIn URL');
      return;
    }

    // Validate all fields
    const errors: Record<string, string> = {};

    // Validate contact email
    if (contactData.email) {
      const emailError = validateEmail(contactData.email);
      if (emailError) errors['contact_email'] = emailError;
    }

    // Validate contact phones
    if (contactData.mobile_phone) {
      const phoneError = validatePhone(contactData.mobile_phone);
      if (phoneError) errors['contact_mobile_phone'] = phoneError;
    }

    // Validate contact metadata URLs and phones
    if (contactMetadata.website) {
      const urlError = validateUrl(contactMetadata.website);
      if (urlError) errors['contact_website'] = urlError;
    }
    if (contactMetadata.work_direct_phone) {
      const phoneError = validatePhone(contactMetadata.work_direct_phone);
      if (phoneError) errors['contact_work_phone'] = phoneError;
    }
    if (contactMetadata.home_phone) {
      const phoneError = validatePhone(contactMetadata.home_phone);
      if (phoneError) errors['contact_home_phone'] = phoneError;
    }
    if (contactMetadata.other_phone) {
      const phoneError = validatePhone(contactMetadata.other_phone);
      if (phoneError) errors['contact_other_phone'] = phoneError;
    }

    // Validate company numbers
    if (companyData.employees_count) {
      const numError = validateNumber(companyData.employees_count, 'Employees count');
      if (numError) errors['company_employees'] = numError;
    }
    if (companyData.annual_revenue) {
      const numError = validateNumber(companyData.annual_revenue, 'Annual revenue');
      if (numError) errors['company_revenue'] = numError;
    }
    if (companyData.total_funding) {
      const numError = validateNumber(companyData.total_funding, 'Total funding');
      if (numError) errors['company_funding'] = numError;
    }

    // Validate company metadata URLs and phone
    if (companyMetadata.website) {
      const urlError = validateUrl(companyMetadata.website);
      if (urlError) errors['company_website'] = urlError;
    }
    if (companyMetadata.phone_number) {
      const phoneError = validatePhone(companyMetadata.phone_number);
      if (phoneError) errors['company_phone'] = phoneError;
    }
    if (companyMetadata.facebook_url) {
      const urlError = validateUrl(companyMetadata.facebook_url);
      if (urlError) errors['company_facebook'] = urlError;
    }
    if (companyMetadata.twitter_url) {
      const urlError = validateUrl(companyMetadata.twitter_url);
      if (urlError) errors['company_twitter'] = urlError;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    // Prepare request data with normalized URL
    const requestData: LinkedInCreateUpdateRequest = {
      url: normalizeLinkedInUrl(url.trim()),
    };

    // Add contact data if any field is filled
    const hasContactData = Object.values(contactData).some(v => v.trim());
    const hasContactMetadata = Object.values(contactMetadata).some(v => v.trim());

    if (hasContactData || hasContactMetadata) {
      requestData.contact_data = {};
      requestData.contact_metadata = {};

      if (contactData.first_name) requestData.contact_data.first_name = contactData.first_name;
      if (contactData.last_name) requestData.contact_data.last_name = contactData.last_name;
      if (contactData.email) requestData.contact_data.email = contactData.email;
      if (contactData.title) requestData.contact_data.title = contactData.title;
      if (contactData.seniority) requestData.contact_data.seniority = contactData.seniority;
      if (contactData.departments) {
        requestData.contact_data.departments = contactData.departments
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
      if (contactData.mobile_phone) requestData.contact_data.mobile_phone = contactData.mobile_phone;
      if (contactData.email_status) requestData.contact_data.email_status = contactData.email_status;

      if (contactMetadata.website) requestData.contact_metadata!.website = contactMetadata.website;
      if (contactMetadata.city) requestData.contact_metadata!.city = contactMetadata.city;
      if (contactMetadata.state) requestData.contact_metadata!.state = contactMetadata.state;
      if (contactMetadata.country) requestData.contact_metadata!.country = contactMetadata.country;
      if (contactMetadata.work_direct_phone) requestData.contact_metadata!.work_direct_phone = contactMetadata.work_direct_phone;
      if (contactMetadata.home_phone) requestData.contact_metadata!.home_phone = contactMetadata.home_phone;
      if (contactMetadata.other_phone) requestData.contact_metadata!.other_phone = contactMetadata.other_phone;
      if (contactMetadata.stage) requestData.contact_metadata!.stage = contactMetadata.stage;
    }

    // Add company data if any field is filled
    const hasCompanyData = Object.values(companyData).some(v => v.trim());
    const hasCompanyMetadata = Object.values(companyMetadata).some(v => v.trim());

    if (hasCompanyData || hasCompanyMetadata) {
      requestData.company_data = {};
      requestData.company_metadata = {};

      if (companyData.name) requestData.company_data.name = companyData.name;
      if (companyData.employees_count) {
        requestData.company_data.employees_count = parseInt(companyData.employees_count, 10);
      }
      if (companyData.industries) {
        requestData.company_data.industries = companyData.industries
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
      if (companyData.annual_revenue) {
        requestData.company_data.annual_revenue = parseInt(companyData.annual_revenue, 10);
      }
      if (companyData.total_funding) {
        requestData.company_data.total_funding = parseInt(companyData.total_funding, 10);
      }
      if (companyData.technologies) {
        requestData.company_data.technologies = companyData.technologies
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
      if (companyData.keywords) {
        requestData.company_data.keywords = companyData.keywords
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
      if (companyData.address) requestData.company_data.address = companyData.address;

      if (companyMetadata.website) requestData.company_metadata!.website = companyMetadata.website;
      if (companyMetadata.city) requestData.company_metadata!.city = companyMetadata.city;
      if (companyMetadata.state) requestData.company_metadata!.state = companyMetadata.state;
      if (companyMetadata.country) requestData.company_metadata!.country = companyMetadata.country;
      if (companyMetadata.phone_number) requestData.company_metadata!.phone_number = companyMetadata.phone_number;
      if (companyMetadata.facebook_url) requestData.company_metadata!.facebook_url = companyMetadata.facebook_url;
      if (companyMetadata.twitter_url) requestData.company_metadata!.twitter_url = companyMetadata.twitter_url;
      if (companyMetadata.company_name_for_emails) {
        requestData.company_metadata!.company_name_for_emails = companyMetadata.company_name_for_emails;
      }
    }

    await onSubmit(requestData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create/Update by LinkedIn URL"
      size="lg"
      closeOnOverlayClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit} className="linkedin-form-modal__form">
        {/* LinkedIn URL (Required) */}
        <div className="linkedin-form-modal__section">
          <Input
            label="LinkedIn URL"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://www.linkedin.com/in/username or https://www.linkedin.com/company/company-name"
            required
            className="linkedin-form-modal__url-input"
            error={urlError || undefined}
            aria-invalid={urlError ? 'true' : 'false'}
            aria-describedby={urlError ? 'url-error' : undefined}
          />
          {urlError && (
            <p id="url-error" className="linkedin-form-modal__error-text" role="alert">
              {urlError}
            </p>
          )}
          <p className="linkedin-form-modal__help-text">
            Enter a LinkedIn profile URL (e.g., /in/username) or company URL (e.g., /company/company-name). 
            The linkedin_url will be automatically set in metadata.
          </p>
        </div>

        {/* Tabs for Contact/Company */}
        <Tabs
          tabs={[
            {
              id: 'contact',
              label: 'Contact',
              icon: <UserIcon className="linkedin-form-modal__tab-icon" />,
              content: (
                <>
                  {/* Contact Tab */}
            <div className="linkedin-form-modal__section">
              <h3 className="linkedin-form-modal__section-title">Contact Information</h3>
              <div className="linkedin-form-modal__section-grid">
                <Input
                  label="First Name"
                  value={contactData.first_name}
                  onChange={(e) => setContactData({ ...contactData, first_name: e.target.value })}
                  placeholder="John"
                />
                <Input
                  label="Last Name"
                  value={contactData.last_name}
                  onChange={(e) => setContactData({ ...contactData, last_name: e.target.value })}
                  placeholder="Doe"
                />
                <Input
                  label="Email"
                  type="email"
                  value={contactData.email}
                  onChange={(e) => {
                    setContactData({ ...contactData, email: e.target.value });
                    if (fieldErrors['contact_email']) {
                      const newErrors = { ...fieldErrors };
                      delete newErrors['contact_email'];
                      setFieldErrors(newErrors);
                    }
                  }}
                  placeholder="john.doe@example.com"
                  error={fieldErrors['contact_email'] || undefined}
                  helperText="Optional. Valid email address format required."
                />
                <Input
                  label="Title"
                  value={contactData.title}
                  onChange={(e) => setContactData({ ...contactData, title: e.target.value })}
                  placeholder="Software Engineer"
                />
                <Input
                  label="Seniority"
                  value={contactData.seniority}
                  onChange={(e) => setContactData({ ...contactData, seniority: e.target.value })}
                  placeholder="individual_contributor"
                  helperText="Optional. Examples: individual_contributor, manager, director, executive"
                />
                <Input
                  label="Departments (comma-separated)"
                  value={contactData.departments}
                  onChange={(e) => setContactData({ ...contactData, departments: e.target.value })}
                  placeholder="Engineering, Product"
                  helperText="Optional. Separate multiple departments with commas."
                />
                <Input
                  label="Mobile Phone"
                  value={contactData.mobile_phone}
                  onChange={(e) => {
                    setContactData({ ...contactData, mobile_phone: e.target.value });
                    if (fieldErrors['contact_mobile_phone']) {
                      const newErrors = { ...fieldErrors };
                      delete newErrors['contact_mobile_phone'];
                      setFieldErrors(newErrors);
                    }
                  }}
                  placeholder="+1234567890"
                  error={fieldErrors['contact_mobile_phone'] || undefined}
                  helperText="Optional. Include country code (e.g., +1 for US)."
                />
                <Input
                  label="Email Status"
                  value={contactData.email_status}
                  onChange={(e) => setContactData({ ...contactData, email_status: e.target.value })}
                  placeholder="verified"
                  helperText="Optional. Email verification status (e.g., verified, unverified)."
                />
              </div>
            </div>

            <div className="linkedin-form-modal__section">
              <h3 className="linkedin-form-modal__section-title">Contact Metadata</h3>
              <div className="linkedin-form-modal__section-grid">
                <Input
                  label="Website"
                  value={contactMetadata.website}
                  onChange={(e) => {
                    setContactMetadata({ ...contactMetadata, website: e.target.value });
                    if (fieldErrors['contact_website']) {
                      const newErrors = { ...fieldErrors };
                      delete newErrors['contact_website'];
                      setFieldErrors(newErrors);
                    }
                  }}
                  placeholder="https://example.com"
                  error={fieldErrors['contact_website'] || undefined}
                  helperText="Optional. Must be a valid URL format."
                />
                <Input
                  label="City"
                  value={contactMetadata.city}
                  onChange={(e) => setContactMetadata({ ...contactMetadata, city: e.target.value })}
                  placeholder="San Francisco"
                />
                <Input
                  label="State"
                  value={contactMetadata.state}
                  onChange={(e) => setContactMetadata({ ...contactMetadata, state: e.target.value })}
                  placeholder="CA"
                />
                <Input
                  label="Country"
                  value={contactMetadata.country}
                  onChange={(e) => setContactMetadata({ ...contactMetadata, country: e.target.value })}
                  placeholder="US"
                />
                <Input
                  label="Work Direct Phone"
                  value={contactMetadata.work_direct_phone}
                  onChange={(e) => {
                    setContactMetadata({ ...contactMetadata, work_direct_phone: e.target.value });
                    if (fieldErrors['contact_work_phone']) {
                      const newErrors = { ...fieldErrors };
                      delete newErrors['contact_work_phone'];
                      setFieldErrors(newErrors);
                    }
                  }}
                  placeholder="+1234567890"
                  error={fieldErrors['contact_work_phone'] || undefined}
                  helperText="Optional. Work direct phone number."
                />
                <Input
                  label="Home Phone"
                  value={contactMetadata.home_phone}
                  onChange={(e) => {
                    setContactMetadata({ ...contactMetadata, home_phone: e.target.value });
                    if (fieldErrors['contact_home_phone']) {
                      const newErrors = { ...fieldErrors };
                      delete newErrors['contact_home_phone'];
                      setFieldErrors(newErrors);
                    }
                  }}
                  placeholder="+1234567890"
                  error={fieldErrors['contact_home_phone'] || undefined}
                  helperText="Optional. Home phone number."
                />
                <Input
                  label="Other Phone"
                  value={contactMetadata.other_phone}
                  onChange={(e) => {
                    setContactMetadata({ ...contactMetadata, other_phone: e.target.value });
                    if (fieldErrors['contact_other_phone']) {
                      const newErrors = { ...fieldErrors };
                      delete newErrors['contact_other_phone'];
                      setFieldErrors(newErrors);
                    }
                  }}
                  placeholder="+1234567890"
                  error={fieldErrors['contact_other_phone'] || undefined}
                  helperText="Optional. Other phone number."
                />
                <Input
                  label="Stage"
                  value={contactMetadata.stage}
                  onChange={(e) => setContactMetadata({ ...contactMetadata, stage: e.target.value })}
                  placeholder="active"
                />
              </div>
            </div>
                </>
              ),
            },
            {
              id: 'company',
              label: 'Company',
              icon: <BuildingIcon className="linkedin-form-modal__tab-icon" />,
              content: (
                <>
                  {/* Company Tab */}
            <div className="linkedin-form-modal__section">
              <h3 className="linkedin-form-modal__section-title">Company Information</h3>
              <div className="linkedin-form-modal__section-grid">
                <Input
                  label="Company Name"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  placeholder="Tech Corp"
                />
                <Input
                  label="Employees Count"
                  type="number"
                  value={companyData.employees_count}
                  onChange={(e) => {
                    setCompanyData({ ...companyData, employees_count: e.target.value });
                    if (fieldErrors['company_employees']) {
                      const newErrors = { ...fieldErrors };
                      delete newErrors['company_employees'];
                      setFieldErrors(newErrors);
                    }
                  }}
                  placeholder="500"
                  error={fieldErrors['company_employees'] || undefined}
                  helperText="Optional. Total number of employees (positive integer)."
                />
                <Input
                  label="Industries (comma-separated)"
                  value={companyData.industries}
                  onChange={(e) => setCompanyData({ ...companyData, industries: e.target.value })}
                  placeholder="Technology, Software"
                  helperText="Optional. Separate multiple industries with commas."
                />
                <Input
                  label="Annual Revenue ($)"
                  type="number"
                  value={companyData.annual_revenue}
                  onChange={(e) => {
                    setCompanyData({ ...companyData, annual_revenue: e.target.value });
                    if (fieldErrors['company_revenue']) {
                      const newErrors = { ...fieldErrors };
                      delete newErrors['company_revenue'];
                      setFieldErrors(newErrors);
                    }
                  }}
                  placeholder="10000000"
                  error={fieldErrors['company_revenue'] || undefined}
                  helperText="Optional. Annual revenue in USD (positive integer)."
                />
                <Input
                  label="Total Funding ($)"
                  type="number"
                  value={companyData.total_funding}
                  onChange={(e) => {
                    setCompanyData({ ...companyData, total_funding: e.target.value });
                    if (fieldErrors['company_funding']) {
                      const newErrors = { ...fieldErrors };
                      delete newErrors['company_funding'];
                      setFieldErrors(newErrors);
                    }
                  }}
                  placeholder="5000000"
                  error={fieldErrors['company_funding'] || undefined}
                  helperText="Optional. Total funding raised in USD (positive integer)."
                />
                <Input
                  label="Technologies (comma-separated)"
                  value={companyData.technologies}
                  onChange={(e) => setCompanyData({ ...companyData, technologies: e.target.value })}
                  placeholder="Python, JavaScript"
                  helperText="Optional. Technologies used by the company, separated by commas."
                />
                <Input
                  label="Keywords (comma-separated)"
                  value={companyData.keywords}
                  onChange={(e) => setCompanyData({ ...companyData, keywords: e.target.value })}
                  placeholder="AI, Machine Learning"
                  helperText="Optional. Keywords related to the company, separated by commas."
                />
                <Textarea
                  label="Address"
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                  placeholder="123 Main St, San Francisco, CA 94105"
                  rows={3}
                />
              </div>
            </div>

            <div className="linkedin-form-modal__section">
              <h3 className="linkedin-form-modal__section-title">Company Metadata</h3>
              <div className="linkedin-form-modal__section-grid">
                <Input
                  label="Website"
                  value={companyMetadata.website}
                  onChange={(e) => {
                    setCompanyMetadata({ ...companyMetadata, website: e.target.value });
                    if (fieldErrors['company_website']) {
                      const newErrors = { ...fieldErrors };
                      delete newErrors['company_website'];
                      setFieldErrors(newErrors);
                    }
                  }}
                  placeholder="https://techcorp.com"
                  error={fieldErrors['company_website'] || undefined}
                  helperText="Optional. Company website URL (must be valid URL format)."
                />
                <Input
                  label="City"
                  value={companyMetadata.city}
                  onChange={(e) => setCompanyMetadata({ ...companyMetadata, city: e.target.value })}
                  placeholder="San Francisco"
                />
                <Input
                  label="State"
                  value={companyMetadata.state}
                  onChange={(e) => setCompanyMetadata({ ...companyMetadata, state: e.target.value })}
                  placeholder="CA"
                />
                <Input
                  label="Country"
                  value={companyMetadata.country}
                  onChange={(e) => setCompanyMetadata({ ...companyMetadata, country: e.target.value })}
                  placeholder="US"
                />
                <Input
                  label="Phone Number"
                  value={companyMetadata.phone_number}
                  onChange={(e) => {
                    setCompanyMetadata({ ...companyMetadata, phone_number: e.target.value });
                    if (fieldErrors['company_phone']) {
                      const newErrors = { ...fieldErrors };
                      delete newErrors['company_phone'];
                      setFieldErrors(newErrors);
                    }
                  }}
                  placeholder="+1234567890"
                  error={fieldErrors['company_phone'] || undefined}
                  helperText="Optional. Company phone number."
                />
                <Input
                  label="Facebook URL"
                  value={companyMetadata.facebook_url}
                  onChange={(e) => {
                    setCompanyMetadata({ ...companyMetadata, facebook_url: e.target.value });
                    if (fieldErrors['company_facebook']) {
                      const newErrors = { ...fieldErrors };
                      delete newErrors['company_facebook'];
                      setFieldErrors(newErrors);
                    }
                  }}
                  placeholder="https://facebook.com/techcorp"
                  error={fieldErrors['company_facebook'] || undefined}
                  helperText="Optional. Company Facebook page URL."
                />
                <Input
                  label="Twitter URL"
                  value={companyMetadata.twitter_url}
                  onChange={(e) => {
                    setCompanyMetadata({ ...companyMetadata, twitter_url: e.target.value });
                    if (fieldErrors['company_twitter']) {
                      const newErrors = { ...fieldErrors };
                      delete newErrors['company_twitter'];
                      setFieldErrors(newErrors);
                    }
                  }}
                  placeholder="https://twitter.com/techcorp"
                  error={fieldErrors['company_twitter'] || undefined}
                  helperText="Optional. Company Twitter/X profile URL."
                />
                <Input
                  label="Company Name for Emails"
                  value={companyMetadata.company_name_for_emails}
                  onChange={(e) => setCompanyMetadata({ ...companyMetadata, company_name_for_emails: e.target.value })}
                  placeholder="Tech Corp"
                />
              </div>
            </div>
                </>
              ),
            },
          ]}
          defaultTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as 'contact' | 'company')}
          className="linkedin-form-modal__tabs"
        />

        {/* Form Actions */}
        <div className="linkedin-form-modal__actions">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            leftIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!url.trim() || isSubmitting || !!urlError}
            leftIcon={<SaveIcon />}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

