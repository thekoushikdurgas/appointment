/**
 * LinkedInSkeletonLoader Component
 * 
 * Loading skeleton for LinkedIn search results and cards.
 */

'use client';

import React from 'react';

interface LinkedInSkeletonLoaderProps {
  count?: number;
  variant?: 'card' | 'list' | 'table';
  className?: string;
}

export const LinkedInSkeletonLoader: React.FC<LinkedInSkeletonLoaderProps> = ({
  count = 3,
  variant = 'card',
  className,
}) => {
  if (variant === 'card') {
    return (
      <div className={`linkedin-skeleton-loader linkedin-skeleton-loader--card${className ? ' ' + className : ''}`}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="linkedin-skeleton-card"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="linkedin-skeleton-card__header">
              <div className="linkedin-skeleton-card__icon linkedin-skeleton-shimmer" />
              <div className="linkedin-skeleton-card__title-wrapper">
                <div className="linkedin-skeleton-card__title linkedin-skeleton-shimmer" />
                <div className="linkedin-skeleton-card__subtitle linkedin-skeleton-shimmer" />
              </div>
            </div>
            <div className="linkedin-skeleton-card__content">
              <div className="linkedin-skeleton-card__line linkedin-skeleton-shimmer" />
              <div className="linkedin-skeleton-card__line linkedin-skeleton-shimmer" />
              <div className="linkedin-skeleton-card__line linkedin-skeleton-shimmer linkedin-skeleton-card__line--short" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`linkedin-skeleton-loader linkedin-skeleton-loader--list${className ? ' ' + className : ''}`}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="linkedin-skeleton-list-item"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="linkedin-skeleton-list-item__icon linkedin-skeleton-shimmer" />
            <div className="linkedin-skeleton-list-item__content">
              <div className="linkedin-skeleton-list-item__title linkedin-skeleton-shimmer" />
              <div className="linkedin-skeleton-list-item__subtitle linkedin-skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`linkedin-skeleton-loader linkedin-skeleton-loader--table${className ? ' ' + className : ''}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="linkedin-skeleton-table-row"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="linkedin-skeleton-table-cell linkedin-skeleton-shimmer" />
          <div className="linkedin-skeleton-table-cell linkedin-skeleton-shimmer" />
          <div className="linkedin-skeleton-table-cell linkedin-skeleton-shimmer" />
          <div className="linkedin-skeleton-table-cell linkedin-skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
};

