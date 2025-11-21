/**
 * LinkedInCompanyCard Component
 * 
 * Card component for displaying company results from LinkedIn search.
 */

'use client';

import React from 'react';
import { CompanyWithRelations } from '@/types/linkedin';
import { Card, CardContent } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import {
  BuildingIcon,
  UsersIcon,
  DollarIcon,
  MapPinIcon,
  LinkedInIcon,
  GlobeAltIcon,
  PhoneIcon,
} from '@components/icons';

interface LinkedInCompanyCardProps {
  company: CompanyWithRelations;
  onClick?: () => void;
  className?: string;
  index?: number;
}

export const LinkedInCompanyCard: React.FC<LinkedInCompanyCardProps> = ({
  company,
  onClick,
  className,
  index = 0,
}) => {
  const formatCurrency = (amount?: number | null): string => {
    if (!amount) return 'N/A';
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`;
    }
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
  };

  const formatNumber = (num?: number | null): string => {
    if (!num) return 'N/A';
    return num.toLocaleString();
  };

  const location = [
    company.metadata?.city,
    company.metadata?.state,
    company.metadata?.country,
  ]
    .filter(Boolean)
    .join(', ') || null;

  const handleClick = () => {
    if (company.company.uuid && onClick) {
      onClick();
    } else if (company.company.uuid) {
      window.open(`/companies/${company.company.uuid}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`linkedin-company-card linkedin-card-hover linkedin-fade-in-up${className ? ' ' + className : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={handleClick}
    >
      <Card className="linkedin-company-card__card">
        <CardContent className="linkedin-company-card__content">
          {/* Header */}
          <div className="linkedin-company-card__header">
            <div className="linkedin-company-card__icon-wrapper">
              <BuildingIcon className="linkedin-company-card__icon" />
            </div>
            <div className="linkedin-company-card__title-wrapper">
              <h3 className="linkedin-company-card__title">
                {company.company.name || 'Unnamed Company'}
              </h3>
              {company.company.industries && company.company.industries.length > 0 && (
                <div className="linkedin-company-card__industries">
                  {company.company.industries.slice(0, 2).map((industry, idx) => (
                    <Badge key={`${company.company.uuid}-industry-${idx}`} variant="glass" size="sm">
                      {industry}
                    </Badge>
                  ))}
                  {company.company.industries.length > 2 && (
                    <Badge variant="glass" size="sm">
                      +{company.company.industries.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="linkedin-company-card__metrics">
            {company.company.employees_count !== null && company.company.employees_count !== undefined && (
              <div className="linkedin-company-card__metric">
                <UsersIcon className="linkedin-company-card__metric-icon" />
                <div className="linkedin-company-card__metric-content">
                  <span className="linkedin-company-card__metric-value">
                    {formatNumber(company.company.employees_count)}
                  </span>
                  <span className="linkedin-company-card__metric-label">Employees</span>
                </div>
              </div>
            )}

            {company.company.annual_revenue !== null && company.company.annual_revenue !== undefined && (
              <div className="linkedin-company-card__metric">
                <DollarIcon className="linkedin-company-card__metric-icon" />
                <div className="linkedin-company-card__metric-content">
                  <span className="linkedin-company-card__metric-value">
                    {formatCurrency(company.company.annual_revenue)}
                  </span>
                  <span className="linkedin-company-card__metric-label">Revenue</span>
                </div>
              </div>
            )}

            {company.company.total_funding !== null && company.company.total_funding !== undefined && (
              <div className="linkedin-company-card__metric">
                <DollarIcon className="linkedin-company-card__metric-icon" />
                <div className="linkedin-company-card__metric-content">
                  <span className="linkedin-company-card__metric-value">
                    {formatCurrency(company.company.total_funding)}
                  </span>
                  <span className="linkedin-company-card__metric-label">Funding</span>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="linkedin-company-card__info">
            {location && (
              <div className="linkedin-company-card__info-item">
                <MapPinIcon className="linkedin-company-card__info-icon" />
                <span className="linkedin-company-card__info-text">{location}</span>
              </div>
            )}

            {company.metadata?.phone_number && (
              <div className="linkedin-company-card__info-item">
                <PhoneIcon className="linkedin-company-card__info-icon" />
                <span className="linkedin-company-card__info-text">{company.metadata.phone_number}</span>
              </div>
            )}

            {company.metadata?.linkedin_url && (
              <div className="linkedin-company-card__info-item">
                <LinkedInIcon className="linkedin-company-card__info-icon" />
                <a
                  href={company.metadata.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="linkedin-company-card__link"
                  onClick={(e) => e.stopPropagation()}
                >
                  View LinkedIn Page
                </a>
              </div>
            )}

            {company.metadata?.website && (
              <div className="linkedin-company-card__info-item">
                <GlobeAltIcon className="linkedin-company-card__info-icon" />
                <a
                  href={company.metadata.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="linkedin-company-card__link"
                  onClick={(e) => e.stopPropagation()}
                >
                  {company.metadata.website}
                </a>
              </div>
            )}
          </div>

          {/* Contacts Count */}
          {company.contacts && company.contacts.length > 0 && (
            <div className="linkedin-company-card__contacts">
              <Badge variant="glass-primary" size="sm">
                {company.contacts.length} contact{company.contacts.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

