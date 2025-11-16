'use client';

import React from 'react';
import { Card } from '@components/ui/Card';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'glass-hover';
  actions?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  variant = 'glass',
  actions,
  loading = false,
  className,
}) => {
  const cardClassName = `chart-card${className ? ' ' + className : ''}`;
  
  return (
    <Card
      variant={variant}
      padding="lg"
      animate
      className={cardClassName}
    >
      {/* Header */}
      <div className="chart-card__header">
        <div className="chart-card__header-content">
          <h3 className="chart-card__title">{title}</h3>
          {subtitle && (
            <p className="chart-card__subtitle">{subtitle}</p>
          )}
        </div>
        {actions && <div className="chart-card__actions">{actions}</div>}
      </div>

      {/* Chart Content */}
      <div className="chart-card__content">
        {loading ? (
          <div className="chart-card__loading">
            <div className="chart-card__loading-content">
              <div className="chart-card__spinner" />
              <p className="chart-card__loading-text">Loading chart...</p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
};

ChartCard.displayName = 'ChartCard';

