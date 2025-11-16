/**
 * Company Contacts Skeleton Loader Component
 * 
 * Loading skeleton for the company contacts section.
 * Provides visual feedback while contacts are being fetched.
 */

'use client';

import React from 'react';

interface CompanyContactsSkeletonLoaderProps {
  count?: number;
  variant?: 'table' | 'card';
  className?: string;
}

/**
 * Shimmer animation component
 */
const Shimmer: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => {
  // Convert style object to CSS custom properties if needed
  const customStyle = style ? Object.entries(style).reduce((acc, [key, value]) => {
    if (key === 'height') {
      acc['--shimmer-height' as keyof React.CSSProperties] = value;
    } else if (key === 'width') {
      acc['--shimmer-width' as keyof React.CSSProperties] = value;
    } else {
      acc[key as keyof React.CSSProperties] = value;
    }
    return acc;
  }, {} as React.CSSProperties) : undefined;
  
  return (
    <div className={`company-contacts-skeleton-shimmer company-skeleton${className ? ' ' + className : ''}`} style={customStyle} />
  );
};

/**
 * Table Row Skeleton
 */
const TableRowSkeleton: React.FC = () => (
  <tr className="company-contacts-skeleton-loader__table-row">
    <td className="company-contacts-skeleton-loader__table-cell">
      <div className="company-contacts-skeleton-loader__table-cell-content">
        <Shimmer className="company-contacts-skeleton-loader__table-cell-avatar" />
        <div className="company-contacts-skeleton-loader__table-cell-text">
          <Shimmer style={{ height: '1rem', width: '8rem' }} />
          <Shimmer style={{ height: '0.75rem', width: '12rem' }} />
        </div>
      </div>
    </td>
    <td className="company-contacts-skeleton-loader__table-cell">
      <Shimmer style={{ height: '1rem', width: '10rem' }} />
    </td>
    <td className="company-contacts-skeleton-loader__table-cell">
      <div className="company-contacts-skeleton-loader__table-cell-badges">
        <Shimmer className="company-contacts-skeleton-loader__table-cell-badge" style={{ width: '5rem' }} />
        <Shimmer className="company-contacts-skeleton-loader__table-cell-badge" style={{ width: '4rem' }} />
      </div>
    </td>
    <td className="company-contacts-skeleton-loader__table-cell">
      <Shimmer style={{ height: '1rem', width: '12rem' }} />
    </td>
    <td className="company-contacts-skeleton-loader__table-cell">
      <Shimmer className="company-contacts-skeleton-loader__table-cell-badge" style={{ width: '4rem' }} />
    </td>
    <td className="company-contacts-skeleton-loader__table-cell">
      <Shimmer className="company-contacts-skeleton-loader__table-cell-action" />
    </td>
  </tr>
);

/**
 * Card Skeleton
 */
const CardSkeleton: React.FC = () => (
  <div className="company-contacts-skeleton-loader__card">
    {/* Header */}
    <div className="company-contacts-skeleton-loader__card-header">
      <div className="company-contacts-skeleton-loader__card-header-content">
        <Shimmer className="company-contacts-skeleton-loader__card-avatar" />
        <div className="company-contacts-skeleton-loader__card-header-text">
          <Shimmer style={{ height: '1.25rem', width: '8rem' }} />
          <Shimmer style={{ height: '1rem', width: '12rem' }} />
        </div>
      </div>
      <Shimmer className="company-contacts-skeleton-loader__card-action" />
    </div>

    {/* Contact Info */}
    <div className="company-contacts-skeleton-loader__card-contact-info">
      <div className="company-contacts-skeleton-loader__card-contact-item">
        <Shimmer className="company-contacts-skeleton-loader__card-contact-icon" />
        <Shimmer style={{ height: '1rem', width: '14rem' }} />
      </div>
      <div className="company-contacts-skeleton-loader__card-contact-item">
        <Shimmer className="company-contacts-skeleton-loader__card-contact-icon" />
        <Shimmer style={{ height: '1rem', width: '10rem' }} />
      </div>
      <div className="company-contacts-skeleton-loader__card-contact-item">
        <Shimmer className="company-contacts-skeleton-loader__card-contact-icon" />
        <Shimmer style={{ height: '1rem', width: '11rem' }} />
      </div>
    </div>

    {/* Badges */}
    <div className="company-contacts-skeleton-loader__card-badges">
      <Shimmer className="company-contacts-skeleton-loader__card-badge" style={{ width: '4rem' }} />
      <Shimmer className="company-contacts-skeleton-loader__card-badge" style={{ width: '5rem' }} />
      <Shimmer className="company-contacts-skeleton-loader__card-badge" style={{ width: '6rem' }} />
    </div>

    {/* Location */}
    <Shimmer className="company-contacts-skeleton-loader__card-location" style={{ width: '9rem' }} />
  </div>
);

/**
 * Main Skeleton Loader Component
 */
export const CompanyContactsSkeletonLoader: React.FC<CompanyContactsSkeletonLoaderProps> = ({
  count = 5,
  variant = 'table',
  className,
}) => {
  if (variant === 'card') {
    return (
      <div className={`company-contacts-skeleton-loader${className ? ' ' + className : ''}`}>
        {Array.from({ length: count }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Table variant
  return (
    <div className={`company-contacts-skeleton-loader__table-wrapper${className ? ' ' + className : ''}`}>
      <table className="company-contacts-skeleton-loader__table">
        <thead className="company-contacts-skeleton-loader__table-header">
          <tr className="company-contacts-skeleton-loader__table-header-row">
            <th className="company-contacts-skeleton-loader__table-header-cell">
              <Shimmer style={{ height: '1rem', width: '6rem' }} />
            </th>
            <th className="company-contacts-skeleton-loader__table-header-cell">
              <Shimmer style={{ height: '1rem', width: '5rem' }} />
            </th>
            <th className="company-contacts-skeleton-loader__table-header-cell">
              <Shimmer style={{ height: '1rem', width: '7rem' }} />
            </th>
            <th className="company-contacts-skeleton-loader__table-header-cell">
              <Shimmer style={{ height: '1rem', width: '6rem' }} />
            </th>
            <th className="company-contacts-skeleton-loader__table-header-cell">
              <Shimmer style={{ height: '1rem', width: '5rem' }} />
            </th>
            <th className="company-contacts-skeleton-loader__table-header-cell">
              <Shimmer style={{ height: '1rem', width: '5rem' }} />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: count }).map((_, index) => (
            <TableRowSkeleton key={index} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Section Header Skeleton
 */
export const CompanyContactsSectionHeaderSkeleton: React.FC = () => (
  <div className="company-contacts-skeleton-loader__section-header">
    <div className="company-contacts-skeleton-loader__section-header-content">
      <div className="company-contacts-skeleton-loader__section-header-left">
        <Shimmer className="company-contacts-skeleton-loader__section-header-icon" />
        <Shimmer className="company-contacts-skeleton-loader__section-header-title" style={{ width: '16rem' }} />
      </div>
      <Shimmer className="company-contacts-skeleton-loader__section-header-button" />
    </div>

    {/* Search Bar */}
    <Shimmer className="company-contacts-skeleton-loader__section-search" />

    {/* Results Info */}
    <div className="company-contacts-skeleton-loader__section-results">
      <Shimmer className="company-contacts-skeleton-loader__section-results-text" />
    </div>
  </div>
);

/**
 * Full Section Skeleton (includes header + content)
 */
export const CompanyContactsFullSkeleton: React.FC<{ variant?: 'table' | 'card' }> = ({ 
  variant = 'table' 
}) => (
  <div className="company-contacts-skeleton-loader__full-section">
    <CompanyContactsSectionHeaderSkeleton />
    <div className="company-contacts-skeleton-loader__full-section-content">
      <CompanyContactsSkeletonLoader variant={variant} count={5} />
      
      {/* Pagination Skeleton */}
      <div className="company-contacts-skeleton-loader__full-section-pagination">
        <Shimmer className="company-contacts-skeleton-loader__full-section-pagination-button" />
        <Shimmer className="company-contacts-skeleton-loader__full-section-pagination-text" />
        <Shimmer className="company-contacts-skeleton-loader__full-section-pagination-button" />
      </div>
    </div>
  </div>
);

