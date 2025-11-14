'use client';

import React from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'heavy' | 'ultra';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glow?: boolean;
  shimmer?: boolean;
  hoverLift?: boolean;
  animate?: boolean;
  children: React.ReactNode;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant = 'heavy',
      padding = 'md',
      glow = false,
      shimmer = false,
      hoverLift = false,
      animate = true,
      children,
      ...props
    },
    ref
  ) => {
    const variantClassMap = {
      default: 'glass-frosted',
      heavy: 'glass-heavy',
      ultra: 'glass-ultra',
    };
    
    const paddingClassMap = {
      none: 'glass-card--padding-none',
      sm: 'glass-card--padding-sm',
      md: 'glass-card--padding-md',
      lg: 'glass-card--padding-lg',
    };
    
    const cardClassName = `glass-card${variantClassMap[variant] ? ' ' + variantClassMap[variant] : ''}${paddingClassMap[padding] ? ' ' + paddingClassMap[padding] : ''}${glow ? ' glass-glow-animated' : ''}${shimmer ? ' glass-shimmer' : ''}${hoverLift ? ' glass-hover-lift' : ''}${animate ? ' glass-morph-in' : ''}${className ? ' ' + className : ''}`;
    
    return (
      <div
        ref={ref}
        className={cardClassName}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

