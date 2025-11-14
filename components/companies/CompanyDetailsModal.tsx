/**
 * CompanyDetailsModal Component
 * 
 * Modal for displaying detailed company information.
 */

'use client';

import React from 'react';
import { Company } from '../../types/company';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  BuildingIcon,
  UsersIcon,
  DollarIcon,
  MapPinIcon,
  GlobeAltIcon,
  LinkedInIcon,
  FacebookIcon,
  TwitterIcon,
  PhoneIcon,
  CalendarIcon,
  EditIcon,
  DeleteIcon,
} from '../icons/IconComponents';

interface CompanyDetailsModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (company: Company) => void;
  onDelete?: (company: Company) => void;
}

export const CompanyDetailsModal: React.FC<CompanyDetailsModalProps> = ({
  company,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!company) return null;

  const formatCurrency = (amount?: number): string => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num?: number): string => {
    if (!num) return 'N/A';
    return num.toLocaleString();
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={company.name || 'Company Details'}
      size="lg"
      footer={
        <>
          {onEdit && (
            <Button
              variant="secondary"
              onClick={() => onEdit(company)}
              leftIcon={<EditIcon />}
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              onClick={() => onDelete(company)}
              leftIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <div className="company-details-modal__content">
        {/* Industries */}
        {company.industries && company.industries.length > 0 && (
          <div className="company-details-modal__section">
            <h3 className="company-details-modal__section-title">
              Industries
            </h3>
            <div className="company-details-modal__badges">
              {company.industries.map((industry, idx) => (
                <Badge key={idx} variant="default">
                  {industry}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="company-details-modal__metrics">
          <div className="company-details-modal__metric">
            <div className="company-details-modal__metric-header">
              <UsersIcon className="company-details-modal__metric-icon" />
              <span className="company-details-modal__metric-label">Employees</span>
            </div>
            <p className="company-details-modal__metric-value">
              {formatNumber(company.employeesCount)}
            </p>
          </div>

          <div className="company-details-modal__metric">
            <div className="company-details-modal__metric-header">
              <DollarIcon className="company-details-modal__metric-icon" />
              <span className="company-details-modal__metric-label">
                Annual Revenue
              </span>
            </div>
            <p className="company-details-modal__metric-value">
              {formatCurrency(company.annualRevenue)}
            </p>
          </div>

          <div className="company-details-modal__metric">
            <div className="company-details-modal__metric-header">
              <DollarIcon className="company-details-modal__metric-icon" />
              <span className="company-details-modal__metric-label">
                Total Funding
              </span>
            </div>
            <p className="company-details-modal__metric-value">
              {formatCurrency(company.totalFunding)}
            </p>
          </div>
        </div>

        {/* Location */}
        {company.metadata && (
          <div className="company-details-modal__section">
            <h3 className="company-details-modal__section-title">
              Location
            </h3>
            <div className="company-details-modal__info-list">
              {company.address && (
                <div className="company-details-modal__info-item">
                  <MapPinIcon className="company-details-modal__info-icon" />
                  <span className="company-details-modal__info-text">{company.address}</span>
                </div>
              )}
              {(company.metadata.city ||
                company.metadata.state ||
                company.metadata.country) && (
                <div className="company-details-modal__info-item">
                  <MapPinIcon className="company-details-modal__info-icon" />
                  <span className="company-details-modal__info-text">
                    {[
                      company.metadata.city,
                      company.metadata.state,
                      company.metadata.country,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Information */}
        {company.metadata && (
          <div className="company-details-modal__section">
            <h3 className="company-details-modal__section-title">
              Contact Information
            </h3>
            <div className="company-details-modal__info-list">
              {company.metadata.phone_number && (
                <div className="company-details-modal__info-item">
                  <PhoneIcon className="company-details-modal__info-icon" />
                  <span className="company-details-modal__info-text">{company.metadata.phone_number}</span>
                </div>
              )}
              {company.metadata.website && (
                <div className="company-details-modal__info-item">
                  <GlobeAltIcon className="company-details-modal__info-icon" />
                  <a
                    href={company.metadata.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="company-details-modal__link"
                  >
                    {company.metadata.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Social Links */}
        {company.metadata &&
          (company.metadata.linkedin_url ||
            company.metadata.facebook_url ||
            company.metadata.twitter_url) && (
            <div className="company-details-modal__section">
              <h3 className="company-details-modal__section-title">
                Social Media
              </h3>
              <div className="company-details-modal__social-links">
                {company.metadata.linkedin_url && (
                  <a
                    href={company.metadata.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="company-details-modal__social-link"
                  >
                    <LinkedInIcon className="company-details-modal__social-icon" />
                    <span className="company-details-modal__social-text">LinkedIn</span>
                  </a>
                )}
                {company.metadata.facebook_url && (
                  <a
                    href={company.metadata.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="company-details-modal__social-link"
                  >
                    <FacebookIcon className="company-details-modal__social-icon" />
                    <span className="company-details-modal__social-text">Facebook</span>
                  </a>
                )}
                {company.metadata.twitter_url && (
                  <a
                    href={company.metadata.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="company-details-modal__social-link"
                  >
                    <TwitterIcon className="company-details-modal__social-icon" />
                    <span className="company-details-modal__social-text">Twitter</span>
                  </a>
                )}
              </div>
            </div>
          )}

        {/* Technologies */}
        {company.technologies && company.technologies.length > 0 && (
          <div className="company-details-modal__section">
            <h3 className="company-details-modal__section-title">
              Technologies
            </h3>
            <div className="company-details-modal__badges">
              {company.technologies.map((tech, idx) => (
                <Badge key={idx} variant="info">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Keywords */}
        {company.keywords && company.keywords.length > 0 && (
          <div className="company-details-modal__section">
            <h3 className="company-details-modal__section-title">
              Keywords
            </h3>
            <div className="company-details-modal__badges">
              {company.keywords.map((keyword, idx) => (
                <Badge key={idx} variant="default">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="company-details-modal__metadata">
          <div className="company-details-modal__metadata-grid">
            <div className="company-details-modal__metadata-item">
              <span className="company-details-modal__metadata-label">Created:</span>
              <p className="company-details-modal__metadata-value">{formatDate(company.createdAt)}</p>
            </div>
            <div className="company-details-modal__metadata-item">
              <span className="company-details-modal__metadata-label">Updated:</span>
              <p className="company-details-modal__metadata-value">{formatDate(company.updatedAt)}</p>
            </div>
            <div className="company-details-modal__metadata-item company-details-modal__metadata-item--full">
              <span className="company-details-modal__metadata-label">UUID:</span>
              <p className="company-details-modal__uuid">{company.uuid}</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

