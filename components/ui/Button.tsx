'use client';

import React, { useState, useRef } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconOnly?: boolean;
  fullWidth?: boolean;
  asChild?: boolean;
  disableRipple?: boolean;
}

interface RippleEffect {
  x: number;
  y: number;
  size: number;
  key: number;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      iconOnly = false,
      fullWidth = false,
      disabled,
      asChild = false,
      disableRipple = false,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = useState<RippleEffect[]>([]);
    const rippleKeyRef = useRef(0);
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disableRipple && !disabled && !isLoading) {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        const newRipple: RippleEffect = {
          x,
          y,
          size,
          key: rippleKeyRef.current++,
        };
        
        setRipples((prevRipples) => [...prevRipples, newRipple]);
        
        setTimeout(() => {
          setRipples((prevRipples) => prevRipples.filter((r) => r.key !== newRipple.key));
        }, 600);
      }
      
      if (onClick) {
        onClick(e);
      }
    };
    
    const baseClasses = 'btn inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all relative overflow-hidden';
    
    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
      ghost: 'btn-ghost',
      destructive: 'btn-destructive',
    };
    
    const sizeClasses = {
      sm: iconOnly ? 'btn-sm btn-icon-only' : 'btn-sm',
      md: iconOnly ? 'btn-md btn-icon-only' : 'btn-md',
      lg: iconOnly ? 'btn-lg btn-icon-only' : 'btn-lg',
    };
    
    const widthClass = fullWidth ? 'btn-full-width' : '';
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          widthClass,
          className
        ),
        ...props,
      });
    }
    
    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          widthClass,
          className
        )}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effects */}
        {!disableRipple && ripples.map((ripple) => (
          <span
            key={ripple.key}
            className="ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}
        
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {!iconOnly && <span>Loading...</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {iconOnly ? (
              <span className="flex-shrink-0 flex-center">{children}</span>
            ) : (
              children && <span className="relative z-10">{children}</span>
            )}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

