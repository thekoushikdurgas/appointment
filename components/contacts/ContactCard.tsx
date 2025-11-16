'use client';

import React from 'react';
import Image from 'next/image';
import { Contact } from '@/types/index';
import { 
  MailIcon, 
  PhoneIcon, 
  BuildingIcon, 
  MapPinIcon,
  LinkedInIcon,
  GlobeAltIcon,
  EditIcon,
  EyeIcon
} from '@components/icons/IconComponents';
import { Button } from '@components/ui/Button';
import { Tooltip } from '@components/ui/Tooltip';

interface ContactCardProps {
  contact: Contact;
  searchTerm?: string;
  onViewDetails?: (contact: Contact) => void;
  onEdit?: (contact: Contact) => void;
  className?: string;
}

const StatusBadge: React.FC<{ status: Contact['status'] }> = ({ status }) => {
  const statusClasses = {
    Lead: "badge badge-status-lead",
    Customer: "badge badge-status-customer",
    Archived: "badge badge-status-archived",
  };
  return <span className={statusClasses[status]}>{status}</span>;
};

const EmailStatusBadge: React.FC<{ status: string | undefined }> = ({ status }) => {
  if (!status) return null;
  
  const statusClasses: { [key: string]: string } = {
    valid: "badge badge-email-valid",
    unknown: "badge badge-email-unknown",
    invalid: "badge badge-email-invalid",
  };
  
  const statusClass = statusClasses[status] || "badge badge-primary";
  const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
  
  return <span className={statusClass}>{formattedStatus}</span>;
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
          <mark key={i} className="contact-card__highlight">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  searchTerm = '',
  onViewDetails,
  onEdit,
  className,
}) => {
  const location = [contact.city, contact.state, contact.country]
    .filter(Boolean)
    .join(', ');

  const handleViewDetails = () => {
    if (contact.uuid) {
      // Open in new tab
      window.open(`/contacts/${contact.uuid}`, '_blank', 'noopener,noreferrer');
    } else if (onViewDetails) {
      // Fallback to callback if no UUID
      onViewDetails(contact);
    }
  };

  return (
    <div className={`contact-card${className ? ' ' + className : ''}`}>
      {/* Header with Avatar and Basic Info */}
      <div className="contact-card__header">
        <div className="contact-card__avatar-wrapper">
          <Image
            src={contact.avatarUrl}
            alt={contact.name}
            width={56}
            height={56}
            className="contact-card__avatar"
          />
          <div className="contact-card__status-badge">
            <StatusBadge status={contact.status} />
          </div>
        </div>

        <div className="contact-card__info">
          <h3 className="contact-card__name">
            <Highlight text={contact.name} highlight={searchTerm} />
          </h3>
          {contact.title && (
            <p className="contact-card__title">
              <Highlight text={contact.title} highlight={searchTerm} />
            </p>
          )}
          <div className="contact-card__company">
            <BuildingIcon className="contact-card__company-icon" />
            <span className="contact-card__company-name">
              <Highlight text={contact.company} highlight={searchTerm} />
            </span>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="contact-card__contact-info">
        {contact.email && (
          <div className="contact-card__contact-item">
            <MailIcon className="contact-card__contact-icon" />
            <span className="contact-card__contact-text">{contact.email}</span>
            {contact.emailStatus && <EmailStatusBadge status={contact.emailStatus} />}
          </div>
        )}
        
        {contact.phone && (
          <div className="contact-card__contact-item">
            <PhoneIcon className="contact-card__contact-icon" />
            <span className="contact-card__contact-text">{contact.phone}</span>
          </div>
        )}

        {location && (
          <div className="contact-card__contact-item">
            <MapPinIcon className="contact-card__contact-icon" />
            <span className="contact-card__contact-text contact-card__contact-text--muted">{location}</span>
          </div>
        )}
      </div>

      {/* Social Links */}
      {(contact.personLinkedinUrl || contact.website) && (
        <div className="contact-card__social-links">
          {contact.personLinkedinUrl && (
            <Tooltip content="LinkedIn Profile">
              <a
                href={contact.personLinkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-card__social-link icon-hover-scale"
                aria-label="LinkedIn Profile"
              >
                <LinkedInIcon className="contact-card__social-icon" />
              </a>
            </Tooltip>
          )}
          {contact.website && (
            <Tooltip content="Website">
              <a
                href={contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-card__social-link icon-hover-scale"
                aria-label="Website"
              >
                <GlobeAltIcon className="contact-card__social-icon" />
              </a>
            </Tooltip>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="contact-card__actions">
        <Tooltip content="View full details in new tab">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewDetails}
            className="contact-card__action-button"
            leftIcon={<EyeIcon className="contact-card__action-icon" />}
          >
            View
          </Button>
        </Tooltip>
        {onEdit && (
          <Tooltip content="Edit contact">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(contact)}
              iconOnly
              className="contact-card__action-button contact-card__action-button--icon-only"
            >
              <EditIcon className="contact-card__action-icon" />
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

