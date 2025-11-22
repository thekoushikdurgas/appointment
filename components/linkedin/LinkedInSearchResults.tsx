/**
 * LinkedInSearchResults Component
 * 
 * Display search results for contacts and companies from LinkedIn search.
 */

'use client';

import React from 'react';
import { LinkedInSearchResponse } from '@/types/linkedin';
import { LinkedInContactCard } from './LinkedInContactCard';
import { LinkedInCompanyCard } from './LinkedInCompanyCard';
import { LinkedInEmptyState } from './LinkedInEmptyState';
import { Badge } from '@components/ui/Badge';
import { UsersIcon, BuildingIcon } from '@components/icons';

interface LinkedInSearchResultsProps {
  results: LinkedInSearchResponse | null;
  loading?: boolean;
  searchUrl?: string;
  className?: string;
}

export const LinkedInSearchResults: React.FC<LinkedInSearchResultsProps> = ({
  results,
  loading = false,
  searchUrl,
  className,
}) => {
  if (loading) {
    return (
      <div className={`linkedin-search-results${className ? ' ' + className : ''}`}>
        <div className="linkedin-search-results__loading">
          <p>Searching...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className={`linkedin-search-results${className ? ' ' + className : ''}`}>
        <LinkedInEmptyState
          variant="no-search"
          actionLabel="Start Searching"
        />
      </div>
    );
  }

  // Check for results using totals if available, otherwise fall back to array lengths
  const contactsCount = results.total_contacts !== undefined 
    ? results.total_contacts 
    : (results.contacts?.length || 0);
  const companiesCount = results.total_companies !== undefined 
    ? results.total_companies 
    : (results.companies?.length || 0);
  const hasResults = contactsCount > 0 || companiesCount > 0;

  if (!hasResults) {
    return (
      <div className={`linkedin-search-results${className ? ' ' + className : ''}`}>
        <LinkedInEmptyState
          variant="no-results"
          actionLabel="Try Another URL"
        />
      </div>
    );
  }

  return (
    <div className={`linkedin-search-results${className ? ' ' + className : ''}`}>
      {/* Results Summary */}
      <div className="linkedin-search-results__summary" role="status" aria-live="polite">
        <div className="linkedin-search-results__summary-item">
          <UsersIcon className="linkedin-search-results__summary-icon" aria-hidden="true" />
          <span className="linkedin-search-results__summary-label">Contacts:</span>
          <Badge variant="glass-primary" size="sm" aria-label={`${contactsCount} contact${contactsCount !== 1 ? 's' : ''}`}>
            {contactsCount}
          </Badge>
        </div>
        <div className="linkedin-search-results__summary-item">
          <BuildingIcon className="linkedin-search-results__summary-icon" aria-hidden="true" />
          <span className="linkedin-search-results__summary-label">Companies:</span>
          <Badge variant="glass-primary" size="sm" aria-label={`${companiesCount} compan${companiesCount !== 1 ? 'ies' : 'y'}`}>
            {companiesCount}
          </Badge>
        </div>
      </div>

      {/* Contacts Section */}
      {results.contacts && results.contacts.length > 0 && (
        <div className="linkedin-search-results__section">
          <h3 className="linkedin-search-results__section-title">
            <UsersIcon className="linkedin-search-results__section-icon" />
            Contacts ({results.contacts.length})
          </h3>
          <div className="linkedin-search-results__grid">
            {results.contacts.map((contact, index) => (
              <LinkedInContactCard
                key={contact.contact.uuid || `contact-${index}`}
                contact={contact}
                index={index}
                onClick={() => {
                  if (contact.contact.uuid) {
                    window.open(`/contacts/${contact.contact.uuid}`, '_blank', 'noopener,noreferrer');
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Companies Section */}
      {results.companies && results.companies.length > 0 && (
        <div className="linkedin-search-results__section">
          <h3 className="linkedin-search-results__section-title">
            <BuildingIcon className="linkedin-search-results__section-icon" />
            Companies ({results.companies.length})
          </h3>
          <div className="linkedin-search-results__grid">
            {results.companies.map((company, index) => (
              <LinkedInCompanyCard
                key={company.company.uuid || `company-${index}`}
                company={company}
                index={index}
                onClick={() => {
                  if (company.company.uuid) {
                    window.open(`/companies/${company.company.uuid}`, '_blank', 'noopener,noreferrer');
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

