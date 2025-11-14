'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive' | 'glass' | 'glass-hover' | 'glass-frosted';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glow?: boolean;
  animate?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      glow = false,
      animate = false,
      children,
      ...props
    },
    ref
  ) => {
    const variantClass = variant === 'glass' ? 'glass-card card-rounded-xl border-glass card-transition-smooth' :
                         variant === 'glass-hover' ? 'glass-card-hover card-rounded-xl border-glass card-transition-smooth' :
                         variant === 'glass-frosted' ? 'glass-frosted card-rounded-xl card-transition-smooth' :
                         variant === 'elevated' ? 'card card-elevated' :
                         variant === 'outlined' ? 'card card-outlined' :
                         variant === 'interactive' ? 'card card-interactive' :
                         'card';
    
    const paddingClass = padding === 'none' ? 'card-padding-none' :
                        padding === 'sm' ? 'card-padding-sm' :
                        padding === 'lg' ? 'card-padding-lg' :
                        'card-padding-md';
    
    let cardClassName = `${variantClass} ${paddingClass}`;
    if (glow) cardClassName += ' card-hover-glow-primary';
    if (animate) cardClassName += ' glass-slide-in';
    if (className) cardClassName += ' ' + className;
    
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

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`card-header${className ? ' ' + className : ''}`}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={`card-title${className ? ' ' + className : ''}`}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={`card-description${className ? ' ' + className : ''}`}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`card-body${className ? ' ' + className : ''}`}
      {...props}
    />
  )
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`card-footer${className ? ' ' + className : ''}`}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

