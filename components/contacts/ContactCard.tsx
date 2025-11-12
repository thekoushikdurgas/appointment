'use client';

import React from 'react';
import Image from 'next/image';
import { Contact } from '../../types/index';
import { 
  MailIcon, 
  PhoneIcon, 
  BuildingIcon, 
  MapPinIcon,
  LinkedInIcon,
  GlobeAltIcon,
  EditIcon,
  EyeIcon
} from '../icons/IconComponents';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { cn } from '../../utils/cn';

interface ContactCardProps {
  contact: Contact;
  searchTerm?: string;
  onViewDetails: (contact: Contact) => void;
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
          <mark key={i} className="bg-primary/20 text-primary rounded px-1 py-0.5">
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

  return (
    <div
      className={cn(
        'glass-card rounded-lg p-4 transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-1',
        'border border-glass-light',
        'animate-slide-up-fade',
        className
      )}
    >
      {/* Header with Avatar and Basic Info */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative flex-shrink-0">
          <Image
            src={contact.avatarUrl}
            alt={contact.name}
            width={56}
            height={56}
            className="rounded-full ring-2 ring-border"
          />
          <div className="absolute -bottom-1 -right-1">
            <StatusBadge status={contact.status} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground truncate mb-1">
            <Highlight text={contact.name} highlight={searchTerm} />
          </h3>
          {contact.title && (
            <p className="text-sm text-muted-foreground truncate mb-1">
              <Highlight text={contact.title} highlight={searchTerm} />
            </p>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <BuildingIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              <Highlight text={contact.company} highlight={searchTerm} />
            </span>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-2 mb-3">
        {contact.email && (
          <div className="flex items-center gap-2 text-sm">
            <MailIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate text-foreground">{contact.email}</span>
            {contact.emailStatus && <EmailStatusBadge status={contact.emailStatus} />}
          </div>
        )}
        
        {contact.phone && (
          <div className="flex items-center gap-2 text-sm">
            <PhoneIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-foreground">{contact.phone}</span>
          </div>
        )}

        {location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPinIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate text-muted-foreground">{location}</span>
          </div>
        )}
      </div>

      {/* Social Links */}
      {(contact.personLinkedinUrl || contact.website) && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
          {contact.personLinkedinUrl && (
            <Tooltip content="LinkedIn Profile">
              <a
                href={contact.personLinkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-secondary transition-colors icon-hover-scale"
                aria-label="LinkedIn Profile"
              >
                <LinkedInIcon className="w-4 h-4 text-muted-foreground hover:text-primary" />
              </a>
            </Tooltip>
          )}
          {contact.website && (
            <Tooltip content="Website">
              <a
                href={contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-secondary transition-colors icon-hover-scale"
                aria-label="Website"
              >
                <GlobeAltIcon className="w-4 h-4 text-muted-foreground hover:text-primary" />
              </a>
            </Tooltip>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Tooltip content="View full details">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(contact)}
            className="flex-1"
            leftIcon={<EyeIcon className="w-4 h-4" />}
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
              className="flex-shrink-0"
            >
              <EditIcon className="w-4 h-4" />
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

