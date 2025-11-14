/**
 * CompanyDetailSkeleton Component
 * 
 * Loading skeleton for company detail page with glassmorphism styling.
 * Matches the actual page layout for better perceived performance.
 */

'use client';

import React from 'react';

export const CompanyDetailSkeletonLoader: React.FC = () => {
  return (
    <div className="company-detail-skeleton">
      {/* Header Skeleton */}
      <div className="company-detail-skeleton__header">
        <div className="company-detail-skeleton__header-content">
          <div className="company-detail-skeleton__header-left">
            <div className="company-skeleton company-detail-skeleton__header-icon" />
            <div className="company-detail-skeleton__header-text">
              <div className="company-skeleton company-detail-skeleton__header-title" />
              <div className="company-skeleton company-detail-skeleton__header-subtitle" />
            </div>
          </div>
          <div className="company-detail-skeleton__header-actions">
            <div className="company-skeleton company-detail-skeleton__header-button" />
          </div>
        </div>
      </div>

      {/* Overview Section Skeleton */}
      <div className="company-detail-skeleton__overview">
        <div className="company-detail-skeleton__overview-header">
          <div className="company-skeleton company-detail-skeleton__overview-avatar" />
          <div className="company-detail-skeleton__overview-text">
            <div className="company-skeleton company-detail-skeleton__overview-title" />
            <div className="company-detail-skeleton__overview-badges">
              <div className="company-skeleton company-detail-skeleton__overview-badge" />
              <div className="company-skeleton company-detail-skeleton__overview-badge" style={{ width: '8rem' }} />
              <div className="company-skeleton company-detail-skeleton__overview-badge" style={{ width: '7rem' }} />
            </div>
            <div className="company-detail-skeleton__overview-badges-secondary">
              <div className="company-skeleton company-detail-skeleton__overview-badge" style={{ width: '5rem' }} />
              <div className="company-skeleton company-detail-skeleton__overview-badge" style={{ width: '6rem' }} />
            </div>
          </div>
        </div>

        {/* Metrics Skeleton */}
        <div className="company-detail-skeleton__overview-metrics">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="company-detail-skeleton__overview-metric">
              <div className="company-detail-skeleton__overview-metric-header">
                <div className="company-skeleton company-detail-skeleton__overview-metric-icon" />
                <div className="company-skeleton company-detail-skeleton__overview-metric-badge" />
              </div>
              <div className="company-skeleton company-detail-skeleton__overview-metric-title" />
              <div className="company-skeleton company-detail-skeleton__overview-metric-text" />
            </div>
          ))}
        </div>
      </div>

      {/* Details Grid Skeleton */}
      <div className="company-detail-skeleton__details">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="company-detail-skeleton__detail-card">
            <div className="company-detail-skeleton__detail-card-header">
              <div className="company-skeleton company-detail-skeleton__detail-card-icon" />
              <div className="company-skeleton company-detail-skeleton__detail-card-title" />
            </div>
            <div className="company-detail-skeleton__detail-card-content">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="company-detail-skeleton__detail-card-item">
                  <div className="company-skeleton company-detail-skeleton__detail-card-item-icon" />
                  <div className="company-detail-skeleton__detail-card-item-content">
                    <div className="company-skeleton company-detail-skeleton__detail-card-item-label" />
                    <div className="company-skeleton company-detail-skeleton__detail-card-item-value" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

