/**
 * LinkedInEmptyState Component
 * 
 * Illustrated empty state with helpful messaging and call-to-action
 * for when no LinkedIn results are found.
 */

'use client';

import React from 'react';
import { LinkedInIcon, SearchIcon, PlusIcon, DownloadIcon } from '@components/icons';
import { Button } from '@components/ui/Button';

interface LinkedInEmptyStateProps {
  variant?: 'no-data' | 'no-results' | 'no-search';
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export const LinkedInEmptyState: React.FC<LinkedInEmptyStateProps> = ({
  variant = 'no-data',
  onAction,
  actionLabel,
  className,
}) => {
  const getContent = () => {
    switch (variant) {
      case 'no-results':
        return {
          icon: SearchIcon,
          title: 'No Results Found',
          description: 'We couldn\'t find any contacts or companies matching this LinkedIn URL. The URL may be incorrect or the profile may not exist in our database.',
          action: actionLabel || 'Try Another URL',
          showIcon: true,
        };
      case 'no-search':
        return {
          icon: LinkedInIcon,
          title: 'Search by LinkedIn URL',
          description: 'Enter a LinkedIn profile or company URL to search for contacts and companies in the database.',
          action: actionLabel || 'Start Searching',
          showIcon: true,
        };
      case 'no-data':
      default:
        return {
          icon: LinkedInIcon,
          title: 'No LinkedIn Data',
          description: 'Get started by searching for contacts and companies using their LinkedIn URLs, or create new records.',
          action: actionLabel || 'Search LinkedIn',
          showIcon: true,
        };
    }
  };

  const content = getContent();
  const IconComponent = content.icon;

  return (
    <div className={`linkedin-empty-state${className ? ' ' + className : ''}`}>
      {/* Animated Icon */}
      <div className="linkedin-empty-state__icon-wrapper">
        <div className="linkedin-empty-state-icon linkedin-glow-pulse">
          <IconComponent className="linkedin-empty-state__icon" />
        </div>
        {variant === 'no-data' && (
          <div className="linkedin-empty-state__icon-badge">
            <PlusIcon className="linkedin-empty-state__icon-badge-icon" />
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="linkedin-empty-state-title">
        {content.title}
      </h3>

      {/* Description */}
      <p className="linkedin-empty-state-description">
        {content.description}
      </p>

      {/* Action Button */}
      {onAction && (
        <Button
          onClick={onAction}
          variant="primary"
          size="lg"
          className="linkedin-empty-state__action animate-scale-in"
        >
          {variant === 'no-data' && <PlusIcon className="linkedin-empty-state__action-icon" />}
          {content.action}
        </Button>
      )}

      {/* Helpful Tips */}
      {variant === 'no-results' && (
        <div className="linkedin-empty-state__tips">
          <p className="linkedin-empty-state__tips-title">Search Tips:</p>
          <ul className="linkedin-empty-state__tips-list">
            <li>Check the LinkedIn URL format</li>
            <li>Ensure the URL is complete and valid</li>
            <li>Try searching for the person or company name instead</li>
            <li>Create a new record if it doesn't exist</li>
          </ul>
        </div>
      )}
    </div>
  );
};

