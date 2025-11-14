/**
 * Apollo Skeleton Loader Components
 * 
 * Animated skeleton loaders for Apollo URL analyzer and contact search sections
 * with shimmer effect for better perceived performance.
 */

'use client';

import React from 'react';

/**
 * Skeleton loader for URL Analyzer section
 */
export const ApolloAnalyzerSkeleton: React.FC = () => {
  return (
    <div className="apollo-skeleton">
      {/* Input Section Skeleton */}
      <div className="apollo-skeleton__section">
        <div className="apollo-skeleton__title" />
        <div className="apollo-skeleton__input" />
        <div className="apollo-skeleton__button" />
      </div>

      {/* Success Message Skeleton */}
      <div className="apollo-skeleton__message">
        <div className="apollo-skeleton__message-content">
          <div className="apollo-skeleton__message-icon" />
          <div className="apollo-skeleton__message-text">
            <div className="apollo-skeleton__message-line apollo-skeleton__message-line--short" />
            <div className="apollo-skeleton__message-line apollo-skeleton__message-line--long" />
          </div>
        </div>
      </div>

      {/* URL Structure Skeleton */}
      <div>
        <div className="apollo-skeleton__title" style={{ marginBottom: '0.75rem' }} />
        <div className="apollo-skeleton__box">
          <div className="apollo-skeleton__box-content">
            <div className="apollo-skeleton__box-line apollo-skeleton__box-line--full" />
            <div className="apollo-skeleton__box-line apollo-skeleton__box-line--three-quarters" />
            <div className="apollo-skeleton__box-line apollo-skeleton__box-line--large" />
          </div>
        </div>
      </div>

      {/* Statistics Cards Skeleton */}
      <div>
        <div className="apollo-skeleton__title" style={{ marginBottom: '0.75rem', width: '6rem' }} />
        <div className="apollo-skeleton__grid apollo-skeleton__grid--stats">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="apollo-skeleton__card">
              <div className="apollo-skeleton__card-value" />
              <div className="apollo-skeleton__card-label" />
            </div>
          ))}
        </div>
      </div>

      {/* Parameter Categories Skeleton */}
      <div>
        <div className="apollo-skeleton__title" style={{ marginBottom: '0.75rem', width: '12rem' }} />
        <div className="apollo-skeleton__category-list">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="apollo-skeleton__category">
              <div className="apollo-skeleton__category-header">
                <div className="apollo-skeleton__category-content">
                  <div className="apollo-skeleton__category-icon" />
                  <div className="apollo-skeleton__category-label" />
                  <div className="apollo-skeleton__category-badge" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton loader for Contact Search section
 */
export const ApolloContactsSkeleton: React.FC = () => {
  return (
    <div className="apollo-skeleton">
      {/* Input Section Skeleton */}
      <div className="apollo-skeleton__section">
        <div className="apollo-skeleton__title" />
        <div className="apollo-skeleton__input" />
        
        {/* Advanced Options Skeleton */}
        <div className="apollo-skeleton__grid">
          <div>
            <div className="apollo-skeleton__title" style={{ width: '6rem', marginBottom: '0.5rem' }} />
            <div className="apollo-skeleton__input" style={{ height: '2.5rem' }} />
          </div>
          <div>
            <div className="apollo-skeleton__title" style={{ width: '8rem', marginBottom: '0.5rem' }} />
            <div className="apollo-skeleton__input" style={{ height: '2.5rem' }} />
          </div>
        </div>

        <div className="apollo-skeleton__button" />
      </div>

      {/* Mapping Summary Skeleton */}
      <div className="apollo-skeleton__summary">
        <div className="apollo-skeleton__summary-title" />
        <div className="apollo-skeleton__summary-grid">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="apollo-skeleton__summary-item">
              <div className="apollo-skeleton__summary-value" />
              <div className="apollo-skeleton__summary-label" />
            </div>
          ))}
        </div>
        <div className="apollo-skeleton__summary-text" />
        <div className="apollo-skeleton__summary-tags">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="apollo-skeleton__summary-tag" />
          ))}
        </div>
      </div>

      {/* Contact Cards Grid Skeleton */}
      <div>
        <div className="apollo-skeleton__header">
          <div className="apollo-skeleton__header-title" />
        </div>
        <div className="apollo-skeleton__contacts-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="apollo-skeleton__contact-card"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Header */}
              <div className="apollo-skeleton__contact-header">
                <div className="apollo-skeleton__contact-avatar" />
                <div className="apollo-skeleton__contact-info">
                  <div className="apollo-skeleton__contact-name" />
                  <div className="apollo-skeleton__contact-title" />
                </div>
              </div>

              {/* Details */}
              <div className="apollo-skeleton__contact-details">
                <div className="apollo-skeleton__contact-detail">
                  <div className="apollo-skeleton__contact-detail-icon" />
                  <div className="apollo-skeleton__contact-detail-text apollo-skeleton__contact-detail-text--short" />
                </div>
                <div className="apollo-skeleton__contact-detail">
                  <div className="apollo-skeleton__contact-detail-icon" />
                  <div className="apollo-skeleton__contact-detail-text apollo-skeleton__contact-detail-text--medium" />
                </div>
                <div className="apollo-skeleton__contact-detail">
                  <div className="apollo-skeleton__contact-detail-icon" />
                  <div className="apollo-skeleton__contact-detail-text apollo-skeleton__contact-detail-text--long" />
                </div>
              </div>

              {/* Footer */}
              <div className="apollo-skeleton__contact-footer">
                <div className="apollo-skeleton__contact-button" />
                <div className="apollo-skeleton__contact-button apollo-skeleton__contact-button--icon" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton loader for stats cards in page header
 */
export const ApolloStatsSkeletonLoader: React.FC = () => {
  return (
    <div className="apollo-skeleton__grid apollo-skeleton__grid--stats">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="apollo-skeleton__card">
          <div className="apollo-skeleton__card-header">
            <div className="apollo-skeleton__card-icon" />
            <div className="apollo-skeleton__card-badge" />
          </div>
          <div className="apollo-skeleton__card-value" />
          <div className="apollo-skeleton__card-label" />
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton loader for empty state
 */
export const ApolloEmptyStateSkeleton: React.FC = () => {
  return (
    <div className="apollo-skeleton__empty-state">
      <div className="apollo-skeleton__empty-state-icon" />
      <div className="apollo-skeleton__empty-state-title" />
      <div className="apollo-skeleton__empty-state-text" />
    </div>
  );
};

