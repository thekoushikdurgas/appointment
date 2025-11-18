/**
 * Company Contact Card Component
 * 
 * Card component for displaying individual contacts in mobile view.
 * Features glassmorphism styling, badges, and click-to-view functionality.
 */

'use client';

import React from 'react';
import { CompanyContact } from '@/types/company';
import { 
  MailIcon, 
  PhoneIcon, 
  UserIcon,
  BriefcaseIcon,
  EyeIcon
} from '@components/icons';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Tooltip } from '@components/ui/Tooltip';

interface CompanyContactCardProps {
  contact: CompanyContact;
  searchTerm?: string;
  onClick?: () => void;
  className?: string;
}

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
          <mark key={i} className="company-contact-card__highlight">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

/**
 * Email Status Badge Component
 */
const EmailStatusBadge: React.FC<{ status: string | undefined }> = ({ status }) => {
  if (!status) return null;
  
  const statusClasses: { [key: string]: string } = {
    verified: "badge badge-email-valid",
    unverified: "badge badge-email-unknown",
    bounced: "badge badge-email-invalid",
    catch_all: "badge badge-email-unknown",
    valid: "badge badge-email-valid",
    unknown: "badge badge-email-unknown",
    invalid: "badge badge-email-invalid",
  };
  
  const statusClass = statusClasses[status.toLowerCase()] || "badge badge-primary";
  const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  
  return <span className={statusClass}>{formattedStatus}</span>;
};

/**
 * Seniority Badge Component
 */
const SeniorityBadge: React.FC<{ seniority: string | undefined }> = ({ seniority }) => {
  if (!seniority) return null;
  
  const seniorityClasses: { [key: string]: string } = {
    junior: "badge badge-status-lead",
    mid: "badge badge-primary",
    senior: "badge badge-status-customer",
    executive: "badge badge-glass-success",
  };
  
  const badgeClass = seniorityClasses[seniority.toLowerCase()] || "badge badge-primary";
  const formattedSeniority = seniority.charAt(0).toUpperCase() + seniority.slice(1);
  
  return <span className={badgeClass}>{formattedSeniority}</span>;
};

export const CompanyContactCard: React.FC<CompanyContactCardProps> = ({
  contact,
  searchTerm = '',
  onClick,
  className,
}) => {
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Unnamed Contact';
  const location = [contact.metadata?.city, contact.metadata?.state, contact.metadata?.country]
    .filter(Boolean)
    .join(', ');

  const handleViewDetails = () => {
    if (contact.uuid) {
      // Open contact detail page in new tab
      window.open(`/contacts/${contact.uuid}`, '_blank', 'noopener,noreferrer');
    } else if (onClick) {
      onClick();
    }
  };

  const cardClassName = `company-contact-card${className ? ' ' + className : ''}`;

  return (
    <div
      className={cardClassName}
      data-interactive="true"
      onClick={handleViewDetails}
    >
      {/* Header with Name and Actions */}
      <div className="company-contact-card__header">
        <div className="company-contact-card__avatar-wrapper">
          {/* Avatar */}
          <div className="company-contact-card__avatar">
            <UserIcon className="company-contact-card__avatar-icon" />
          </div>
          
          {/* Name and Title */}
          <div className="company-contact-card__info">
            <h3 className="company-contact-card__name">
              <Highlight text={fullName} highlight={searchTerm} />
            </h3>
            {contact.title && (
              <p className="company-contact-card__title">
                <Highlight text={contact.title} highlight={searchTerm} />
              </p>
            )}
          </div>
        </div>

        {/* View Button */}
        <Tooltip content="View details">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
            aria-label="View contact details"
          >
            <EyeIcon className="company-contact-card__action-icon" />
          </Button>
        </Tooltip>
      </div>

      {/* Contact Information */}
      <div className="company-contact-card__contact-info">
        {contact.email && (
          <div className="company-contact-card__contact-item">
            <MailIcon className="company-contact-card__contact-icon" />
            <span className="company-contact-card__contact-text">
              <Highlight text={contact.email} highlight={searchTerm} />
            </span>
          </div>
        )}
        
        {contact.mobilePhone && (
          <div className="company-contact-card__contact-item">
            <PhoneIcon className="company-contact-card__contact-icon" />
            <span className="company-contact-card__contact-text">
              <Highlight text={contact.mobilePhone} highlight={searchTerm} />
            </span>
          </div>
        )}

        {contact.company && (
          <div className="company-contact-card__contact-item">
            <BriefcaseIcon className="company-contact-card__contact-icon" />
            <span className="company-contact-card__contact-text">
              {contact.company.name}
            </span>
          </div>
        )}
      </div>

      {/* Badges Section */}
      <div className="company-contact-card__badges">
        {contact.seniority && <SeniorityBadge seniority={contact.seniority} />}
        {contact.emailStatus && <EmailStatusBadge status={contact.emailStatus} />}
        
        {contact.departments && contact.departments.length > 0 && (
          <>
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
          </>
        )}
      </div>

      {/* Location */}
      {location && (
        <div className="company-contact-card__location">
          📍 {location}
        </div>
      )}
    </div>
  );
};

