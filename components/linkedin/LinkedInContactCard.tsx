/**
 * LinkedInContactCard Component
 * 
 * Card component for displaying contact results from LinkedIn search.
 */

'use client';

import React from 'react';
import { ContactWithRelations } from '@/types/linkedin';
import { Card, CardContent } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import {
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  MapPinIcon,
  LinkedInIcon,
  UserIcon,
  GlobeAltIcon,
} from '@components/icons';

interface LinkedInContactCardProps {
  contact: ContactWithRelations;
  onClick?: () => void;
  className?: string;
  index?: number;
}

export const LinkedInContactCard: React.FC<LinkedInContactCardProps> = ({
  contact,
  onClick,
  className,
  index = 0,
}) => {
  const fullName = [
    contact.contact.first_name,
    contact.contact.last_name,
  ]
    .filter(Boolean)
    .join(' ') || 'Unnamed Contact';

  const location = [
    contact.metadata?.city,
    contact.metadata?.state,
    contact.metadata?.country,
  ]
    .filter(Boolean)
    .join(', ') || null;

  const handleClick = () => {
    if (contact.contact.uuid && onClick) {
      onClick();
    } else if (contact.contact.uuid) {
      window.open(`/contacts/${contact.contact.uuid}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`linkedin-contact-card linkedin-card-hover linkedin-fade-in-up${className ? ' ' + className : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={handleClick}
    >
      <Card className="linkedin-contact-card__card">
        <CardContent className="linkedin-contact-card__content">
          {/* Header */}
          <div className="linkedin-contact-card__header">
            <div className="linkedin-contact-card__icon-wrapper">
              <UserIcon className="linkedin-contact-card__icon" />
            </div>
            <div className="linkedin-contact-card__title-wrapper">
              <h3 className="linkedin-contact-card__title">{fullName}</h3>
              {contact.contact.title && (
                <p className="linkedin-contact-card__subtitle">{contact.contact.title}</p>
              )}
            </div>
          </div>

          {/* Company Info */}
          {contact.company && (
            <div className="linkedin-contact-card__company">
              <BuildingIcon className="linkedin-contact-card__company-icon" />
              <span className="linkedin-contact-card__company-name">
                {contact.company.name || 'Unknown Company'}
              </span>
            </div>
          )}

          {/* Contact Information */}
          <div className="linkedin-contact-card__info">
            {contact.contact.email && (
              <div className="linkedin-contact-card__info-item">
                <MailIcon className="linkedin-contact-card__info-icon" />
                <span className="linkedin-contact-card__info-text">{contact.contact.email}</span>
                {contact.contact.email_status && (
                  <Badge variant="glass" size="sm" className="linkedin-contact-card__badge">
                    {contact.contact.email_status}
                  </Badge>
                )}
              </div>
            )}

            {(contact.contact.mobile_phone || contact.metadata?.work_direct_phone) && (
              <div className="linkedin-contact-card__info-item">
                <PhoneIcon className="linkedin-contact-card__info-icon" />
                <span className="linkedin-contact-card__info-text">
                  {contact.contact.mobile_phone || contact.metadata?.work_direct_phone}
                </span>
              </div>
            )}

            {location && (
              <div className="linkedin-contact-card__info-item">
                <MapPinIcon className="linkedin-contact-card__info-icon" />
                <span className="linkedin-contact-card__info-text">{location}</span>
              </div>
            )}

            {contact.metadata?.linkedin_url && (
              <div className="linkedin-contact-card__info-item">
                <LinkedInIcon className="linkedin-contact-card__info-icon" />
                <a
                  href={contact.metadata.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="linkedin-contact-card__link"
                  onClick={(e) => e.stopPropagation()}
                >
                  View LinkedIn Profile
                </a>
              </div>
            )}

            {contact.metadata?.website && (
              <div className="linkedin-contact-card__info-item">
                <GlobeAltIcon className="linkedin-contact-card__info-icon" />
                <a
                  href={contact.metadata.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="linkedin-contact-card__link"
                  onClick={(e) => e.stopPropagation()}
                >
                  {contact.metadata.website}
                </a>
              </div>
            )}
          </div>

          {/* Metadata Badges */}
          <div className="linkedin-contact-card__badges">
            {contact.contact.seniority && (
              <Badge variant="glass-primary" size="sm">
                {contact.contact.seniority}
              </Badge>
            )}
            {contact.contact.departments && contact.contact.departments.length > 0 && (
              <Badge variant="glass" size="sm">
                {contact.contact.departments[0]}
              </Badge>
            )}
            {contact.metadata?.stage && (
              <Badge variant="glass-success" size="sm">
                {contact.metadata.stage}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

