'use client';

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'glass' | 'glass-primary' | 'glass-success';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  glow?: boolean;
  animate?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      dot = false,
      glow = false,
      animate = false,
      children,
      ...props
    },
    ref
  ) => {
    const variantClass = variant === 'glass' ? 'badge-glass' : 
                         variant === 'glass-primary' ? 'badge-glass-primary' :
                         variant === 'glass-success' ? 'badge-glass-success' :
                         variant === 'primary' ? 'badge-primary' :
                         variant === 'success' ? 'badge-success' :
                         variant === 'warning' ? 'badge-warning' :
                         variant === 'error' ? 'badge-error' :
                         variant === 'info' ? 'badge badge-muted' :
                         'badge badge-muted';

    const sizeClass = size === 'sm' ? 'badge-sm' : size === 'lg' ? 'badge-lg' : 'badge-md';
    
    let badgeClassName = `badge ${variantClass} ${sizeClass}`;
    if (glow) badgeClassName += ' glow-primary-sm';
    if (animate) badgeClassName += ' animate-pulse';
    if (className) badgeClassName += ' ' + className;

    const dotVariantMap = {
      success: 'badge__dot--success',
      warning: 'badge__dot--warning',
      error: 'badge__dot--error',
      info: 'badge__dot--info',
      primary: 'badge__dot--primary',
      default: 'badge__dot--default',
    };
    
    const dotClassName = `badge__dot${dotVariantMap[variant as keyof typeof dotVariantMap] ? ' ' + dotVariantMap[variant as keyof typeof dotVariantMap] : ' badge__dot--foreground'}${animate ? ' animate-ping' : ''}`;

    return (
      <span
        ref={ref}
        className={badgeClassName}
        {...props}
      >
        {dot && <span className={dotClassName} />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

