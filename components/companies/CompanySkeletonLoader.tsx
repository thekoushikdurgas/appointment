/**
 * CompanySkeletonLoader Component
 * 
 * Animated skeleton loader for company cards and table rows
 * with shimmer effect for better perceived performance.
 */

'use client';

import React from 'react';

interface CompanySkeletonLoaderProps {
  count?: number;
  variant?: 'card' | 'table';
  className?: string;
}

export const CompanySkeletonLoader: React.FC<CompanySkeletonLoaderProps> = ({
  count = 3,
  variant = 'card',
  className,
}) => {
  if (variant === 'table') {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <tr key={index} className="company-skeleton-loader__table-row">
            <td className="company-skeleton-loader__table-cell">
              <div className="company-skeleton company-skeleton-text" style={{ width: '75%' }} />
            </td>
            <td className="company-skeleton-loader__table-cell">
              <div className="company-skeleton company-skeleton-text" style={{ width: '50%' }} />
            </td>
            <td className="company-skeleton-loader__table-cell">
              <div className="company-skeleton company-skeleton-text" style={{ width: '66.666667%' }} />
            </td>
            <td className="company-skeleton-loader__table-cell">
              <div className="company-skeleton company-skeleton-text" style={{ width: '33.333333%' }} />
            </td>
            <td className="company-skeleton-loader__table-cell">
              <div className="company-skeleton company-skeleton-text" style={{ width: '50%' }} />
            </td>
            <td className="company-skeleton-loader__table-cell">
              <div className="company-skeleton-loader__table-actions">
                <div className="company-skeleton company-skeleton-loader__table-action" />
                <div className="company-skeleton company-skeleton-loader__table-action" />
              </div>
            </td>
          </tr>
        ))}
      </>
    );
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`company-card-glass company-skeleton-loader${className ? ' ' + className : ''}`}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Header */}
          <div className="company-skeleton-loader__header">
            <div className="company-skeleton-loader__header-content">
              <div className="company-skeleton-loader__header-row">
                <div className="company-skeleton company-skeleton-avatar" />
                <div className="company-skeleton-loader__header-text">
                  <div className="company-skeleton company-skeleton-title" style={{ marginBottom: '0.5rem' }} />
                  <div className="company-skeleton company-skeleton-text" style={{ width: '33.333333%' }} />
                </div>
              </div>
              <div className="company-skeleton-loader__badges">
                <div className="company-skeleton company-skeleton-loader__badge" />
                <div className="company-skeleton company-skeleton-loader__badge" style={{ width: '5rem' }} />
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="company-skeleton-loader__metrics">
            <div className="company-skeleton company-skeleton-loader__metric" />
            <div className="company-skeleton company-skeleton-loader__metric" />
          </div>

          {/* Location */}
          <div className="company-skeleton company-skeleton-loader__location" />

          {/* Technologies */}
          <div className="company-skeleton-loader__technologies">
            <div className="company-skeleton company-skeleton-loader__technologies-label" />
            <div className="company-skeleton-loader__technologies-list">
              <div className="company-skeleton company-skeleton-loader__tech-badge" />
              <div className="company-skeleton company-skeleton-loader__tech-badge" style={{ width: '5rem' }} />
              <div className="company-skeleton company-skeleton-loader__tech-badge" style={{ width: '3.5rem' }} />
            </div>
          </div>

          {/* Footer */}
          <div className="company-skeleton-loader__footer">
            <div className="company-skeleton company-skeleton-loader__footer-item" />
            <div className="company-skeleton company-skeleton-loader__footer-item" />
            <div className="company-skeleton company-skeleton-loader__footer-item--auto" />
          </div>
        </div>
      ))}
    </>
  );
};

// Skeleton for stats cards
export const CompanyStatsSkeletonLoader: React.FC = () => {
  return (
    <div className="company-stats-skeleton-loader">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="company-stats-skeleton-loader__card">
          <div className="company-stats-skeleton-loader__header">
            <div className="company-skeleton company-stats-skeleton-loader__icon" />
            <div className="company-skeleton company-stats-skeleton-loader__badge" />
          </div>
          <div className="company-skeleton company-stats-skeleton-loader__title" />
          <div className="company-skeleton company-stats-skeleton-loader__text" />
        </div>
      ))}
    </div>
  );
};

// Skeleton for detail modal
export const CompanyDetailSkeletonLoader: React.FC = () => {
  return (
    <div className="company-detail-skeleton-loader">
      {/* Header */}
      <div className="company-detail-skeleton-loader__header">
        <div className="company-skeleton company-detail-skeleton-loader__header-icon" />
        <div className="company-detail-skeleton-loader__header-text">
          <div className="company-skeleton company-detail-skeleton-loader__header-title" />
          <div className="company-skeleton company-detail-skeleton-loader__header-text-line" />
        </div>
      </div>

      {/* Metrics */}
      <div className="company-detail-skeleton-loader__metrics">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="company-skeleton company-detail-skeleton-loader__metric" />
        ))}
      </div>

      {/* Sections */}
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="company-detail-skeleton-loader__section">
          <div className="company-skeleton company-detail-skeleton-loader__section-label" />
          <div className="company-skeleton company-detail-skeleton-loader__section-content" />
        </div>
      ))}
    </div>
  );
};

