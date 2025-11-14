'use client';

import React from 'react';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  max?: number;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  animate?: boolean;
  striped?: boolean;
  glow?: boolean;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value,
      max = 100,
      variant = 'primary',
      size = 'md',
      showLabel = false,
      label,
      animate = true,
      striped = false,
      glow = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const containerClassName = `progress-container${className ? ' ' + className : ''}`;
    const trackClassName = `progress-track progress-track--${size}`;
    const fillClassName = `progress-fill progress-fill--${variant}${glow ? ` progress-fill--glow-${variant}` : ''}${striped ? ' progress-fill--striped' : ''}`;
    
    return (
      <div ref={ref} className={containerClassName} {...props}>
        {(showLabel || label) && (
          <div className="progress-header">
            <span className="progress-label">
              {label || 'Progress'}
            </span>
            <span className="progress-percentage">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div
          className={trackClassName}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div
            className={fillClassName}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

