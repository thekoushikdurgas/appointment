import React, { useState, useEffect } from 'react';
import { Contact } from '../../types';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { XMarkIcon, CheckIcon } from '../icons/IconComponents';

interface ContactEditFormProps {
  contact: Contact;
  onSave: (updatedContact: Partial<Contact>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ContactEditForm: React.FC<ContactEditFormProps> = ({
  contact,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Contact>>({
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    title: contact.title || '',
    company: contact.company,
    companyPhone: contact.companyPhone || '',
    website: contact.website || '',
    industry: contact.industry || '',
    seniority: contact.seniority || '',
    departments: contact.departments || '',
    city: contact.city || '',
    state: contact.state || '',
    country: contact.country || '',
    postalCode: contact.postalCode || '',
    companyCity: contact.companyCity || '',
    companyState: contact.companyState || '',
    companyCountry: contact.companyCountry || '',
    companyAddress: contact.companyAddress || '',
    personLinkedinUrl: contact.personLinkedinUrl || '',
    companyLinkedinUrl: contact.companyLinkedinUrl || '',
    facebookUrl: contact.facebookUrl || '',
    twitterUrl: contact.twitterUrl || '',
    keywords: contact.keywords || '',
    technologies: contact.technologies || '',
    notes: contact.notes || '',
    status: contact.status,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof Contact, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.company?.trim()) {
      newErrors.company = 'Company is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="contact-edit-form">
      <div className="contact-edit-form-header">
        <h2 className="contact-edit-form-header__title">Edit Contact</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Cancel editing"
        >
          <XMarkIcon className="contact-edit-form-header__close-icon" />
        </Button>
      </div>

      <div className="contact-edit-form-body">
        {/* Personal Information Section */}
        <section className="contact-edit-form__section">
          <h3 className="contact-edit-form__section-title">Personal Information</h3>
          <div className="contact-edit-form__field-group">
            <div className="contact-edit-form__field">
              <label htmlFor="name" className="contact-edit-form__label">
                Full Name <span className="contact-edit-form__label-required">*</span>
              </label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="John Doe"
                error={errors.name}
                disabled={isLoading}
                required
              />
            </div>

            <div className="contact-edit-form__field">
              <label htmlFor="email" className="contact-edit-form__label">
                Email <span className="contact-edit-form__label-required">*</span>
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="john@example.com"
                error={errors.email}
                disabled={isLoading}
                required
              />
            </div>

            <div className="contact-edit-form__field">
              <label htmlFor="phone" className="contact-edit-form__label">Phone</label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={isLoading}
              />
            </div>

            <div className="contact-edit-form__field">
              <label htmlFor="title" className="contact-edit-form__label">Job Title</label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="CEO"
                disabled={isLoading}
              />
            </div>

            <div className="contact-edit-form__field">
              <label htmlFor="seniority" className="contact-edit-form__label">Seniority</label>
              <Input
                id="seniority"
                value={formData.seniority || ''}
                onChange={(e) => handleChange('seniority', e.target.value)}
                placeholder="Executive"
                disabled={isLoading}
              />
            </div>

            <div className="contact-edit-form__field">
              <label htmlFor="departments" className="contact-edit-form__label">Department</label>
              <Input
                id="departments"
                value={formData.departments || ''}
                onChange={(e) => handleChange('departments', e.target.value)}
                placeholder="Engineering"
                disabled={isLoading}
              />
            </div>

            <div className="contact-edit-form__field">
              <label htmlFor="status" className="contact-edit-form__label">Status</label>
              <Select
                id="status"
                value={formData.status || 'Lead'}
                onChange={(e) => handleChange('status', e.target.value as Contact['status'])}
                disabled={isLoading}
                options={[
                  { value: 'Lead', label: 'Lead' },
                  { value: 'Customer', label: 'Customer' },
                  { value: 'Archived', label: 'Archived' }
                ]}
              />
            </div>
          </div>
        </section>

        {/* Company Information Section */}
        <section className="contact-edit-form__section">
          <h3 className="contact-edit-form__section-title">Company Information</h3>
          <div className="contact-edit-form__field-group">
            <div className="contact-edit-form__field">
              <label htmlFor="company" className="contact-edit-form__label">
                Company <span className="contact-edit-form__label-required">*</span>
              </label>
              <Input
                id="company"
                value={formData.company || ''}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="Acme Corp"
                error={errors.company}
                disabled={isLoading}
                required
              />
            </div>

            <div className="contact-edit-form__field">
              <label htmlFor="website" className="contact-edit-form__label">Website</label>
              <Input
                id="website"
                type="url"
                value={formData.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://example.com"
                disabled={isLoading}
              />
            </div>

            <div className="contact-edit-form__field">
              <label htmlFor="industry" className="contact-edit-form__label">Industry</label>
              <Input
                id="industry"
                value={formData.industry || ''}
                onChange={(e) => handleChange('industry', e.target.value)}
                placeholder="Technology"
                disabled={isLoading}
              />
            </div>

            <div className="contact-edit-form__field">
              <label htmlFor="companyPhone" className="contact-edit-form__label">Company Phone</label>
              <Input
                id="companyPhone"
                type="tel"
                value={formData.companyPhone || ''}
                onChange={(e) => handleChange('companyPhone', e.target.value)}
                placeholder="+1 (555) 987-6543"
                disabled={isLoading}
              />
            </div>
          </div>
        </section>

        {/* Location Information Section */}
        <section className="contact-edit-form__section">
          <h3 className="contact-edit-form__section-title">Personal Location</h3>
          <div className="contact-edit-form__field-group">
            <div className="contact-edit-form__field">
              <label htmlFor="city" className="contact-edit-form__label">City</label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="San Francisco"
                disabled={isLoading}
              />
            </div>

            <div className="contact-edit-form__field">
              <label htmlFor="state" className="contact-edit-form__label">State/Province</label>
              <Input
                id="state"
                value={formData.state || ''}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="CA"
                disabled={isLoading}
              />
            </div>

            <div className="contact-edit-form__field">
              <label htmlFor="country" className="contact-edit-form__label">Country</label>
              <Input
                id="country"
                value={formData.country || ''}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="United States"
                disabled={isLoading}
              />
            </div>

            <div className="contact-edit-form__field">
              <label htmlFor="postalCode" className="contact-edit-form__label">Postal Code</label>
              <Input
                id="postalCode"
                value={formData.postalCode || ''}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                placeholder="94105"
                disabled={isLoading}
              />
            </div>
          </div>
        </section>

        {/* Company Location Section */}
        <section className="contact-edit-form__section">
          <h3 className="contact-edit-form__section-title">Company Location</h3>
          <div className="contact-edit-form__field-group">
            <div className="contact-edit-form__field contact-edit-form__field-group--full">
              <label htmlFor="companyAddress" className="contact-edit-form__label">Address</label>
              <Input
                id="companyAddress"
                value={formData.companyAddress || ''}
                onChange={(e) => handleChange('companyAddress', e.target.value)}
                placeholder="123 Main St"
                disabled={isLoading}
              />
            </div>

            <div className="contact-edit-form__field">
              <label htmlFor="companyCity" className="contact-edit-form__label">City</label>
              <Input
                id="companyCity"
                value={formData.companyCity || ''}
                onChange={(e) => handleChange('companyCity', e.target.value)}
                placeholder="San Francisco"
                disabled={isLoading}
              />
            </div>

            <div className="contact-edit-form__field">
              <label htmlFor="companyState" className="contact-edit-form__label">State/Province</label>
              <Input
                id="companyState"
                value={formData.companyState || ''}
                onChange={(e) => handleChange('companyState', e.target.value)}
                placeholder="CA"
                disabled={isLoading}
              />
            </div>

            <div className="contact-edit-form__field">
              <label htmlFor="companyCountry" className="contact-edit-form__label">Country</label>
              <Input
                id="companyCountry"
                value={formData.companyCountry || ''}
                onChange={(e) => handleChange('companyCountry', e.target.value)}
                placeholder="United States"
                disabled={isLoading}
              />
            </div>
          </div>
        </section>

        {/* Social Links Section */}
        <section className="contact-edit-form__section">
          <h3 className="contact-edit-form__section-title">Social Links</h3>
          <div className="contact-edit-form__field-group">
            <div className="contact-edit-form__field contact-edit-form__field-group--full">
              <label htmlFor="personLinkedinUrl" className="contact-edit-form__label">LinkedIn Profile</label>
              <Input
                id="personLinkedinUrl"
                type="url"
                value={formData.personLinkedinUrl || ''}
                onChange={(e) => handleChange('personLinkedinUrl', e.target.value)}
                placeholder="https://linkedin.com/in/johndoe"
                disabled={isLoading}
              />
            </div>

            <div className="contact-edit-form__field contact-edit-form__field-group--full">
              <label htmlFor="companyLinkedinUrl" className="contact-edit-form__label">Company LinkedIn</label>
              <Input
                id="companyLinkedinUrl"
                type="url"
                value={formData.companyLinkedinUrl || ''}
                onChange={(e) => handleChange('companyLinkedinUrl', e.target.value)}
                placeholder="https://linkedin.com/company/acme"
                disabled={isLoading}
              />
            </div>

            <div className="contact-edit-form__field">
              <label htmlFor="facebookUrl" className="contact-edit-form__label">Facebook</label>
              <Input
                id="facebookUrl"
                type="url"
                value={formData.facebookUrl || ''}
                onChange={(e) => handleChange('facebookUrl', e.target.value)}
                placeholder="https://facebook.com/johndoe"
                disabled={isLoading}
              />
            </div>

            <div className="contact-edit-form__field">
              <label htmlFor="twitterUrl" className="contact-edit-form__label">Twitter</label>
              <Input
                id="twitterUrl"
                type="url"
                value={formData.twitterUrl || ''}
                onChange={(e) => handleChange('twitterUrl', e.target.value)}
                placeholder="https://twitter.com/johndoe"
                disabled={isLoading}
              />
            </div>
          </div>
        </section>

        {/* Additional Information Section */}
        <section className="contact-edit-form__section">
          <h3 className="contact-edit-form__section-title">Additional Information</h3>
          <div className="contact-edit-form__field-group">
            <div className="contact-edit-form__field contact-edit-form__field-group--full">
              <label htmlFor="keywords" className="contact-edit-form__label">Keywords</label>
              <Input
                id="keywords"
                value={formData.keywords || ''}
                onChange={(e) => handleChange('keywords', e.target.value)}
                placeholder="enterprise, saas, cloud"
                disabled={isLoading}
              />
            </div>

            <div className="contact-edit-form__field contact-edit-form__field-group--full">
              <label htmlFor="technologies" className="contact-edit-form__label">Technologies</label>
              <Input
                id="technologies"
                value={formData.technologies || ''}
                onChange={(e) => handleChange('technologies', e.target.value)}
                placeholder="Python, Django, PostgreSQL"
                disabled={isLoading}
              />
            </div>

            <div className="contact-edit-form__field contact-edit-form__field-group--full">
              <label htmlFor="notes" className="contact-edit-form__label">Notes</label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional notes about this contact..."
                rows={4}
                disabled={isLoading}
              />
            </div>
          </div>
        </section>
      </div>

      <div className="contact-edit-form-footer">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="contact-edit-form__save-btn"
        >
          {isLoading ? (
            'Saving...'
          ) : (
            <>
              <CheckIcon className="contact-edit-form__save-icon" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

