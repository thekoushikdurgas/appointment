/**
 * CompanyCard Component
 * 
 * Enhanced mobile-friendly card view with glassmorphism effects,
 * animations, and modern visual design.
 */

'use client';

import React, { useState } from 'react';
import { Company } from '../../types/company';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  BuildingIcon,
  UsersIcon,
  DollarIcon,
  MapPinIcon,
  GlobeAltIcon,
  LinkedInIcon,
  CalendarIcon,
  EditIcon,
  EyeIcon,
} from '../icons/IconComponents';

interface CompanyCardProps {
  company: Company;
  onClick?: () => void;
  onEdit?: () => void;
  className?: string;
  index?: number;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  onClick,
  onEdit,
  className,
  index = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const formatCurrency = (amount?: number): string => {
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

  const formatNumber = (num?: number): string => {
    if (!num) return 'N/A';
    return num.toLocaleString();
  };

  const getLocationString = (): string => {
    const parts = [];
    if (company.metadata?.city) parts.push(company.metadata.city);
    if (company.metadata?.state) parts.push(company.metadata.state);
    if (company.metadata?.country) parts.push(company.metadata.country);
    return parts.join(', ') || 'N/A';
  };

  const getSizeCategory = (): string => {
    const count = company.employeesCount || 0;
    if (count >= 10000) return 'Enterprise';
    if (count >= 1000) return 'Large';
    if (count >= 100) return 'Medium';
    if (count >= 10) return 'Small';
    return 'Startup';
  };

  const cardClassName = `company-card-glass company-card-hover company-card-glow company-fade-in-up${className ? ' ' + className : ''}`;
  
  return (
    <div
      className={cardClassName}
      style={{ animationDelay: `${index * 50}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Quick Actions - Visible on Hover */}
      {isHovered && (
        <div className="company-card__quick-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className="company-card__action-btn"
            aria-label="View details"
          >
            <EyeIcon className="company-card__action-icon" />
          </button>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="company-card__action-btn"
              aria-label="Edit company"
            >
              <EditIcon className="company-card__action-icon" />
            </button>
          )}
        </div>
      )}

      <div className="company-card__content">
        {/* Header */}
        <div className="company-card__header">
          <div className="company-card__header-left">
            <div className="company-card__title-row">
              <div className="company-metric-icon">
                <BuildingIcon className="company-card__title-icon" />
              </div>
              <div className="company-card__title-wrapper">
                <h3 className="company-card__title">
                  {company.name || 'Unnamed Company'}
                </h3>
                <span className="company-size-badge">
                  {getSizeCategory()}
                </span>
              </div>
            </div>
            {company.industries && company.industries.length > 0 && (
              <div className="company-card__industries">
                {company.industries.slice(0, 2).map((industry, idx) => (
                  <span key={idx} className="company-industry-badge">
                    {industry}
                  </span>
                ))}
                {company.industries.length > 2 && (
                  <Badge variant="glass" size="sm">
                    +{company.industries.length - 2} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="company-card__metrics-grid">
          {/* Employees */}
          <div className="company-metric-card">
            <div className="company-metric-card__header">
              <UsersIcon className="company-metric-card__icon company-metric-card__icon--primary" />
              <span className="company-metric-card__label">Employees</span>
            </div>
            <p className="company-metric-card__value">
              {formatNumber(company.employeesCount)}
            </p>
          </div>

          {/* Revenue */}
          <div className="company-metric-card">
            <div className="company-metric-card__header">
              <DollarIcon className="company-metric-card__icon company-metric-card__icon--success" />
              <span className="company-metric-card__label">Revenue</span>
            </div>
            <p className="company-metric-card__value">
              {formatCurrency(company.annualRevenue)}
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="company-card__location">
          <MapPinIcon className="company-card__location-icon" />
          <div className="company-card__location-content">
            <p className="company-card__location-label">Location</p>
            <p className="company-card__location-value">
              {getLocationString()}
            </p>
          </div>
        </div>

        {/* Funding */}
        {company.totalFunding && company.totalFunding > 0 && (
          <div className="company-funding-badge">
            <div className="company-funding-badge__content">
              <DollarIcon className="company-funding-badge__icon" />
              <span className="company-funding-badge__label">Total Funding</span>
            </div>
            <span className="company-funding-badge__value">
              {formatCurrency(company.totalFunding)}
            </span>
          </div>
        )}

        {/* Technologies */}
        {company.technologies && company.technologies.length > 0 && (
          <div className="company-card__technologies">
            <p className="company-card__technologies-label">Technologies</p>
            <div className="company-card__technologies-list">
              {company.technologies.slice(0, 3).map((tech, idx) => (
                <span key={idx} className="company-tech-badge">
                  {tech}
                </span>
              ))}
              {company.technologies.length > 3 && (
                <Badge variant="glass-primary" size="sm">
                  +{company.technologies.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Footer - Links */}
        <div className="company-card__footer">
          {company.metadata?.website && (
            <a
              href={company.metadata.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="company-card__link company-scale-hover"
            >
              <GlobeAltIcon className="company-card__link-icon" />
              Website
            </a>
          )}
          {company.metadata?.linkedin_url && (
            <a
              href={company.metadata.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="company-card__link company-scale-hover"
            >
              <LinkedInIcon className="company-card__link-icon" />
              LinkedIn
            </a>
          )}
          {company.createdAt && (
            <div className="company-card__date">
              <CalendarIcon className="company-card__date-icon" />
              {new Date(company.createdAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

