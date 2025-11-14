/**
 * Apollo Empty State Component
 * 
 * Illustrated empty states for Apollo Tools page with helpful tips and actions.
 */

'use client';

import React from 'react';
import { Button } from '../ui/Button';
import { SearchIcon, AlertTriangleIcon, InfoIcon, GlobeAltIcon } from '../icons/IconComponents';

export interface ApolloEmptyStateProps {
  variant: 'no-analysis' | 'no-contacts' | 'error';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const ApolloEmptyState: React.FC<ApolloEmptyStateProps> = ({
  variant,
  title,
  description,
  action,
  className,
}) => {
  const variants = {
    'no-analysis': {
      icon: <GlobeAltIcon />,
      defaultTitle: 'No Analysis Yet',
      defaultDescription: 'Enter an Apollo.io URL above to analyze its parameters and filters',
      tips: [
        'Use the example URLs above for quick testing',
        'Apollo URLs typically start with https://app.apollo.io/#/people',
        'Parameters are automatically categorized for easy understanding',
      ],
    },
    'no-contacts': {
      icon: <SearchIcon />,
      defaultTitle: 'No Contacts Found',
      defaultDescription: 'No contacts match the Apollo URL criteria in your database',
      tips: [
        'Try adjusting the filters in your Apollo URL',
        'Check the unmapped parameters above - they may affect results',
        'Some Apollo filters may not have equivalents in your database',
      ],
    },
    'error': {
      icon: <AlertTriangleIcon />,
      defaultTitle: 'Something Went Wrong',
      defaultDescription: 'An error occurred while processing your request',
      tips: [
        'Check that your URL is from apollo.io domain',
        'Verify your internet connection',
        'Try refreshing the page and attempting again',
      ],
    },
  };

  const config = variants[variant];

  const iconClassName = variant === 'error' 
    ? 'apollo-empty-state__icon--destructive' 
    : 'apollo-empty-state__icon--muted';

  return (
    <div className={`apollo-empty-state${className ? ' ' + className : ''}`}>
      {/* Icon */}
      <div className="apollo-empty-state__icon-wrapper">
        <div className="apollo-empty-state__icon-container">
          <div className={`apollo-empty-state__icon ${iconClassName}`}>
            {config.icon}
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="apollo-empty-state__title">
        {title || config.defaultTitle}
      </h3>

      {/* Description */}
      <p className="apollo-empty-state__description">
        {description || config.defaultDescription}
      </p>

      {/* Tips */}
      {config.tips && (
        <div className="apollo-empty-state__tips">
          <div className="apollo-empty-state__tips-header">
            <InfoIcon className="apollo-empty-state__tips-icon" />
            <h4 className="apollo-empty-state__tips-title">Helpful Tips</h4>
          </div>
          <ul className="apollo-empty-state__tips-list">
            {config.tips.map((tip, index) => (
              <li key={index} className="apollo-empty-state__tips-item">
                <span className="apollo-empty-state__tips-bullet">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Button */}
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
};

