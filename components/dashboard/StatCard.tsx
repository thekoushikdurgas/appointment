'use client';

import React from 'react';
import { Card } from '@components/ui/Card';
import { TrendIndicator } from '@components/icons';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  variant?: 'default' | 'glass' | 'glass-hover';
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  variant = 'glass-hover',
  color = 'primary',
  loading = false,
  onClick,
  className,
}) => {
  const cardClassName = `stat-card${onClick ? ' stat-card--clickable' : ''}${className ? ' ' + className : ''}`;
  const iconClassName = `stat-card__icon stat-card__icon--${color}`;
  const trendClassName = `stat-card__trend-value${trend?.isPositive ? ' stat-card__trend-value--positive' : ' stat-card__trend-value--negative'}`;
  
  return (
    <Card
      variant={variant}
      padding="lg"
      glow={!!onClick}
      animate
      className={cardClassName}
      onClick={onClick}
    >
      <div className="stat-card__container">
        <div className="stat-card__content">
          <p className="stat-card__title">
            {title}
          </p>
          {loading ? (
            <div className="stat-card__value--loading" />
          ) : (
            <h3 className="stat-card__value">
              {value}
            </h3>
          )}
          {subtitle && (
            <p className="stat-card__subtitle">{subtitle}</p>
          )}
          {trend && (
            <div className="stat-card__trend">
              <span className={trendClassName}>
                <TrendIndicator 
                  direction={trend.isPositive ? 'up' : 'down'}
                  className="stat-card__trend-icon"
                />
                {Math.abs(trend.value)}%
              </span>
              <span className="stat-card__trend-label">vs last period</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={iconClassName}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

StatCard.displayName = 'StatCard';

