'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Contact } from '../../../../types';
import { getContactByUuid, deleteContact, archiveContact } from '../../../../services/contact';
import { Button } from '../../../../components/ui/Button';
import { Tooltip } from '../../../../components/ui/Tooltip';
import { ConfirmDialog } from '../../../../components/contacts/ConfirmDialog';
import { ContactEditForm } from '../../../../components/contacts/ContactEditForm';
import {
  ArrowLeftIcon,
  EditIcon,
  TrashIcon,
  ArchiveIcon,
  MailIcon,
  PhoneIcon,
  OfficeBuildingIcon,
  MapPinIcon,
  GlobeIcon,
  LinkedInIcon,
  FacebookIcon,
  TwitterIcon,
  UserIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from '../../../../components/icons/IconComponents';

const ContactDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    const fetchContact = async () => {
      if (!uuid) {
        setError('Invalid contact ID');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const fetchedContact = await getContactByUuid(uuid);
        
        if (!fetchedContact) {
          setError('Contact not found');
        } else {
          setContact(fetchedContact);
        }
      } catch (err) {
        console.error('Error fetching contact:', err);
        setError('Failed to load contact details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContact();
  }, [uuid]);

  const handleBack = () => {
    window.close(); // Close the tab
    // Fallback: navigate back if window.close() doesn't work
    setTimeout(() => {
      router.push('/contacts');
    }, 100);
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSaveEdit = async (updatedContact: Partial<Contact>) => {
    // Note: This is a placeholder since the API doesn't support updates
    console.log('Save contact:', updatedContact);
    alert('Edit functionality is not supported by the current API.');
    setIsEditMode(false);
  };

  const handleDelete = async () => {
    if (!contact) return;

    try {
      setIsDeleting(true);
      const result = await deleteContact(contact.id);
      
      if (result.success) {
        alert('Contact deleted successfully');
        handleBack();
      } else {
        alert(result.message || 'Failed to delete contact');
      }
    } catch (err) {
      console.error('Error deleting contact:', err);
      alert('An error occurred while deleting the contact');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleArchive = async () => {
    if (!contact) return;

    try {
      setIsArchiving(true);
      const result = await archiveContact(contact.id);
      
      if (result.success) {
        alert('Contact archived successfully');
        // Update local state
        setContact({ ...contact, status: 'Archived' });
      } else {
        alert(result.message || 'Failed to archive contact');
      }
    } catch (err) {
      console.error('Error archiving contact:', err);
      alert('An error occurred while archiving the contact');
    } finally {
      setIsArchiving(false);
      setIsArchiveDialogOpen(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="contact-detail-page">
        <div className="contact-detail-loading">
          <div className="contact-detail-loading-spinner"></div>
          <p className="contact-detail-loading-text">Loading contact details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !contact) {
    return (
      <div className="contact-detail-page">
        <div className="contact-detail-error">
          <h1 className="contact-detail-error-title">
            {error || 'Contact not found'}
          </h1>
          <p className="contact-detail-error-message">
            The contact you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={handleBack} variant="primary">
            <ArrowLeftIcon />
            Back to Contacts
          </Button>
        </div>
      </div>
    );
  }

  // Edit mode
  if (isEditMode) {
    return (
      <div className="contact-detail-page">
        <div className="contact-detail-container">
          <ContactEditForm
            contact={contact}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        </div>
      </div>
    );
  }

  // View mode
  const location = [contact.city, contact.state, contact.country].filter(Boolean).join(', ');
  const companyLocation = [contact.companyCity, contact.companyState, contact.companyCountry].filter(Boolean).join(', ');

  return (
    <div className="contact-detail-page">
      <div className="contact-detail-container">
        {/* Header */}
        <header className="contact-detail-header">
          <div className="contact-detail-header-top">
            <Tooltip content="Back to Contacts">
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                onClick={handleBack}
                aria-label="Back to contacts"
                className="contact-detail-header-back-btn"
              >
                <ArrowLeftIcon />
              </Button>
            </Tooltip>
            <Image
              src={contact.avatarUrl}
              alt={contact.name}
              width={64}
              height={64}
              className="contact-detail-avatar"
            />
            <div className="contact-detail-header-info">
              <h1 className="contact-detail-header-title">{contact.name}</h1>
              <p className="contact-detail-header-subtitle">{contact.title || 'N/A'} at {contact.company}</p>
            </div>
            <div className="contact-detail-status">
              <span className={`contact-detail-status-badge contact-detail-status-badge--${contact.status.toLowerCase()}`}>
                {contact.status}
              </span>
            </div>
          </div>

          <div className="contact-detail-actions">
            <Tooltip content="Edit Contact">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                aria-label="Edit contact"
                className="contact-detail-action-btn"
              >
                <EditIcon />
                Edit
              </Button>
            </Tooltip>
            <Tooltip content="Archive Contact">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsArchiveDialogOpen(true)}
                disabled={contact.status === 'Archived'}
                aria-label="Archive contact"
                className="contact-detail-action-btn"
              >
                <ArchiveIcon />
                Archive
              </Button>
            </Tooltip>
            <Tooltip content="Delete Contact">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                aria-label="Delete contact"
                className="contact-detail-action-btn"
              >
                <TrashIcon />
                Delete
              </Button>
            </Tooltip>
          </div>
        </header>

        {/* Content Grid */}
        <div className="contact-detail-grid">
          {/* Personal Information */}
          <section className="contact-detail-section">
            <h2 className="contact-detail-section-title">
              <UserIcon className="contact-detail-section-title-icon" />
              Personal Information
            </h2>
            <div className="contact-detail-info-grid">
              {contact.email && (
                <div className="contact-detail-info-item">
                  <MailIcon className="contact-detail-info-item-icon" />
                  <div className="contact-detail-info-item-content">
                    <p className="contact-detail-info-label">Email</p>
                    <a href={`mailto:${contact.email}`} className="contact-detail-info-link">
                      {contact.email}
                    </a>
                    {contact.emailStatus && (
                      <span className={`contact-detail-email-status contact-detail-email-status--${contact.emailStatus.toLowerCase()}`}>
                        {contact.emailStatus}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {contact.phone && (
                <div className="contact-detail-info-item">
                  <PhoneIcon className="contact-detail-info-item-icon" />
                  <div className="contact-detail-info-item-content">
                    <p className="contact-detail-info-label">Phone</p>
                    <a href={`tel:${contact.phone}`} className="contact-detail-info-link">
                      {contact.phone}
                    </a>
                  </div>
                </div>
              )}
              {location && (
                <div className="contact-detail-info-item">
                  <MapPinIcon className="contact-detail-info-item-icon" />
                  <div className="contact-detail-info-item-content">
                    <p className="contact-detail-info-label">Location</p>
                    <p className="contact-detail-info-value">{location}</p>
                  </div>
                </div>
              )}
              {contact.seniority && (
                <div className="contact-detail-info-item">
                  <BriefcaseIcon className="contact-detail-info-item-icon" />
                  <div className="contact-detail-info-item-content">
                    <p className="contact-detail-info-label">Seniority</p>
                    <p className="contact-detail-info-value">{contact.seniority}</p>
                  </div>
                </div>
              )}
              {contact.departments && (
                <div className="contact-detail-info-item">
                  <BriefcaseIcon className="contact-detail-info-item-icon" />
                  <div className="contact-detail-info-item-content">
                    <p className="contact-detail-info-label">Department</p>
                    <p className="contact-detail-info-value">{contact.departments}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Company Information */}
          <section className="contact-detail-section">
            <h2 className="contact-detail-section-title">
              <OfficeBuildingIcon className="contact-detail-section-title-icon" />
              Company Information
            </h2>
            <div className="contact-detail-info-grid">
              <div className="contact-detail-info-item">
                <OfficeBuildingIcon className="contact-detail-info-item-icon" />
                <div className="contact-detail-info-item-content">
                  <p className="contact-detail-info-label">Company</p>
                  <p className="contact-detail-info-value">{contact.company}</p>
                </div>
              </div>
              {contact.website && (
                <div className="contact-detail-info-item">
                  <GlobeIcon className="contact-detail-info-item-icon" />
                  <div className="contact-detail-info-item-content">
                    <p className="contact-detail-info-label">Website</p>
                    <a
                      href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-detail-info-link"
                    >
                      {contact.website}
                    </a>
                  </div>
                </div>
              )}
              {contact.industry && (
                <div className="contact-detail-info-item">
                  <ChartBarIcon className="contact-detail-info-item-icon" />
                  <div className="contact-detail-info-item-content">
                    <p className="contact-detail-info-label">Industry</p>
                    <p className="contact-detail-info-value">{contact.industry}</p>
                  </div>
                </div>
              )}
              {contact.employeesCount && (
                <div className="contact-detail-info-item">
                  <UserIcon className="contact-detail-info-item-icon" />
                  <div className="contact-detail-info-item-content">
                    <p className="contact-detail-info-label">Employees</p>
                    <p className="contact-detail-info-value">{contact.employeesCount.toLocaleString()}</p>
                  </div>
                </div>
              )}
              {contact.companyPhone && (
                <div className="contact-detail-info-item">
                  <PhoneIcon className="contact-detail-info-item-icon" />
                  <div className="contact-detail-info-item-content">
                    <p className="contact-detail-info-label">Company Phone</p>
                    <a href={`tel:${contact.companyPhone}`} className="contact-detail-info-link">
                      {contact.companyPhone}
                    </a>
                  </div>
                </div>
              )}
              {companyLocation && (
                <div className="contact-detail-info-item">
                  <MapPinIcon className="contact-detail-info-item-icon" />
                  <div className="contact-detail-info-item-content">
                    <p className="contact-detail-info-label">Company Location</p>
                    <p className="contact-detail-info-value">{companyLocation}</p>
                  </div>
                </div>
              )}
              {contact.companyAddress && (
                <div className="contact-detail-info-item contact-detail-info-item--full">
                  <MapPinIcon className="contact-detail-info-item-icon" />
                  <div className="contact-detail-info-item-content">
                    <p className="contact-detail-info-label">Address</p>
                    <p className="contact-detail-info-value">{contact.companyAddress}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Funding Information */}
          {(contact.annualRevenue || contact.totalFunding || contact.latestFunding) && (
            <section className="contact-detail-section">
              <h2 className="contact-detail-section-title">
                <CurrencyDollarIcon className="contact-detail-section-title-icon" />
                Funding & Revenue
              </h2>
              <div className="contact-detail-info-grid">
                {contact.annualRevenue && (
                  <div className="contact-detail-info-item">
                    <CurrencyDollarIcon className="contact-detail-info-item-icon" />
                    <div className="contact-detail-info-item-content">
                      <p className="contact-detail-info-label">Annual Revenue</p>
                      <p className="contact-detail-info-value">
                        ${contact.annualRevenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {contact.totalFunding && (
                  <div className="contact-detail-info-item">
                    <CurrencyDollarIcon className="contact-detail-info-item-icon" />
                    <div className="contact-detail-info-item-content">
                      <p className="contact-detail-info-label">Total Funding</p>
                      <p className="contact-detail-info-value">
                        ${contact.totalFunding.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {contact.latestFunding && (
                  <div className="contact-detail-info-item">
                    <ChartBarIcon className="contact-detail-info-item-icon" />
                    <div className="contact-detail-info-item-content">
                      <p className="contact-detail-info-label">Latest Funding</p>
                      <p className="contact-detail-info-value">{contact.latestFunding}</p>
                      {contact.latestFundingAmount && (
                        <p className="contact-detail-info-value-secondary">
                          ${contact.latestFundingAmount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {contact.lastRaisedAt && (
                  <div className="contact-detail-info-item">
                    <ChartBarIcon className="contact-detail-info-item-icon" />
                    <div className="contact-detail-info-item-content">
                      <p className="contact-detail-info-label">Last Raised</p>
                      <p className="contact-detail-info-value">
                        {new Date(contact.lastRaisedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Social Links */}
          {(contact.personLinkedinUrl || contact.companyLinkedinUrl || contact.facebookUrl || contact.twitterUrl) && (
            <section className="contact-detail-section">
              <h2 className="contact-detail-section-title">
                <GlobeIcon className="contact-detail-section-title-icon" />
                Social Links
              </h2>
              <div className="contact-detail-social-links">
                {contact.personLinkedinUrl && (
                  <a
                    href={contact.personLinkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-detail-social-link"
                  >
                    <LinkedInIcon />
                    <span>LinkedIn Profile</span>
                  </a>
                )}
                {contact.companyLinkedinUrl && (
                  <a
                    href={contact.companyLinkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-detail-social-link"
                  >
                    <LinkedInIcon />
                    <span>Company LinkedIn</span>
                  </a>
                )}
                {contact.facebookUrl && (
                  <a
                    href={contact.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-detail-social-link"
                  >
                    <FacebookIcon />
                    <span>Facebook</span>
                  </a>
                )}
                {contact.twitterUrl && (
                  <a
                    href={contact.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-detail-social-link"
                  >
                    <TwitterIcon />
                    <span>Twitter</span>
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Additional Information */}
          {(contact.keywords || contact.technologies || contact.notes) && (
            <section className="contact-detail-section contact-detail-section--full">
              <h2 className="contact-detail-section-title">
                <BriefcaseIcon className="contact-detail-section-title-icon" />
                Additional Information
              </h2>
              <div className="contact-detail-info-grid">
                {contact.keywords && (
                  <div className="contact-detail-info-item contact-detail-info-item--full">
                    <div className="contact-detail-info-item-content">
                      <p className="contact-detail-info-label">Keywords</p>
                      <p className="contact-detail-info-value">{contact.keywords}</p>
                    </div>
                  </div>
                )}
                {contact.technologies && (
                  <div className="contact-detail-info-item contact-detail-info-item--full">
                    <div className="contact-detail-info-item-content">
                      <p className="contact-detail-info-label">Technologies</p>
                      <p className="contact-detail-info-value">{contact.technologies}</p>
                    </div>
                  </div>
                )}
                {contact.notes && (
                  <div className="contact-detail-info-item contact-detail-info-item--full">
                    <div className="contact-detail-info-item-content">
                      <p className="contact-detail-info-label">Notes</p>
                      <p className="contact-detail-info-value contact-detail-info-value--notes">{contact.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Metadata */}
          <section className="contact-detail-section contact-detail-section--full">
            <h2 className="contact-detail-section-title">Metadata</h2>
            <div className="contact-detail-info-grid">
              {contact.createdAt && (
                <div className="contact-detail-info-item">
                  <div className="contact-detail-info-item-content">
                    <p className="contact-detail-info-label">Created</p>
                    <p className="contact-detail-info-value">
                      {new Date(contact.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              {contact.updatedAt && (
                <div className="contact-detail-info-item">
                  <div className="contact-detail-info-item-content">
                    <p className="contact-detail-info-label">Last Updated</p>
                    <p className="contact-detail-info-value">
                      {new Date(contact.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              <div className="contact-detail-info-item">
                <div className="contact-detail-info-item-content">
                  <p className="contact-detail-info-label">Contact ID</p>
                  <p className="contact-detail-info-value contact-detail-info-value--mono">{contact.id}</p>
                </div>
              </div>
              {contact.uuid && (
                <div className="contact-detail-info-item">
                  <div className="contact-detail-info-item-content">
                    <p className="contact-detail-info-label">UUID</p>
                    <p className="contact-detail-info-value contact-detail-info-value--mono">{contact.uuid}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Contact"
        message={`Are you sure you want to delete ${contact.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      <ConfirmDialog
        isOpen={isArchiveDialogOpen}
        onClose={() => setIsArchiveDialogOpen(false)}
        onConfirm={handleArchive}
        title="Archive Contact"
        message={`Are you sure you want to archive ${contact.name}? You can restore it later.`}
        confirmText="Archive"
        cancelText="Cancel"
        variant="warning"
        isLoading={isArchiving}
      />
    </div>
  );
};

export default ContactDetailPage;

