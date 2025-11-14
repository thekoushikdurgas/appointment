/**
 * Apollo Stats Cards Component
 * 
 * Displays session statistics for Apollo Tools usage.
 */

'use client';

import React from 'react';
import { 
  SearchIcon, 
  ContactsIcon, 
  ClockIcon, 
  CheckCircleIcon 
} from '../icons/IconComponents';

export interface ApolloStats {
  totalAnalyses: number;
  totalContactsFound: number;
  lastAnalysisTime: string | null;
  successRate: number;
}

export interface ApolloStatsCardsProps {
  stats: ApolloStats;
  className?: string;
}

export const ApolloStatsCards: React.FC<ApolloStatsCardsProps> = ({
  stats,
  className,
}) => {
  const cards = [
    {
      icon: <SearchIcon className="apollo-stats-card__icon" />,
      label: 'Analyses',
      value: stats.totalAnalyses.toString(),
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: <ContactsIcon className="apollo-stats-card__icon" />,
      label: 'Contacts Found',
      value: stats.totalContactsFound.toString(),
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: <ClockIcon className="apollo-stats-card__icon" />,
      label: 'Last Analysis',
      value: stats.lastAnalysisTime || 'Never',
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      icon: <CheckCircleIcon className="apollo-stats-card__icon" />,
      label: 'Success Rate',
      value: `${stats.successRate}%`,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  const iconWrapperClass = {
    Analyses: 'apollo-stats-card__icon-wrapper--primary',
    'Contacts Found': 'apollo-stats-card__icon-wrapper--success',
    'Last Analysis': 'apollo-stats-card__icon-wrapper--info',
    'Success Rate': 'apollo-stats-card__icon-wrapper--success',
  };

  const valueClass = {
    Analyses: 'apollo-stats-card__value--primary',
    'Contacts Found': 'apollo-stats-card__value--success',
    'Last Analysis': 'apollo-stats-card__value--info',
    'Success Rate': 'apollo-stats-card__value--success',
  };

  return (
    <div className={`apollo-stats${className ? ' ' + className : ''}`}>
      {cards.map((card, index) => (
        <div
          key={index}
          className="apollo-stats-card"
        >
          <div className="apollo-stats-card__header">
            <div className={`apollo-stats-card__icon-wrapper ${iconWrapperClass[card.label as keyof typeof iconWrapperClass] || ''}`}>
              <div className="apollo-stats-card__icon">
                {card.icon}
              </div>
            </div>
            {index === 0 && stats.totalAnalyses > 0 && (
              <span className="apollo-stats-card__badge">
                Session
              </span>
            )}
          </div>
          <div className={`apollo-stats-card__value ${valueClass[card.label as keyof typeof valueClass] || ''}`}>
            {card.value}
          </div>
          <div className="apollo-stats-card__label">{card.label}</div>
        </div>
      ))}
    </div>
  );
};

