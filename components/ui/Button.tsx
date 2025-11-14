'use client';

import React, { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'glass' | 'glass-primary' | 'glass-success' | 'glass-heavy' | 'glass-ultra';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconOnly?: boolean;
  fullWidth?: boolean;
  asChild?: boolean;
  disableRipple?: boolean;
  glow?: boolean;
  animate?: boolean;
  magnetic?: boolean;
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
      glow = false,
      animate = false,
      magnetic = false,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = useState<RippleEffect[]>([]);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const rippleKeyRef = useRef(0);
    const buttonRef = useRef<HTMLButtonElement>(null);
    
    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (magnetic && buttonRef.current) {
        const button = buttonRef.current;
        const rect = button.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) * 0.15;
        const deltaY = (e.clientY - centerY) * 0.15;
        setMousePosition({ x: deltaX, y: deltaY });
      }
    };

    const handleMouseLeave = () => {
      if (magnetic) {
        setMousePosition({ x: 0, y: 0 });
      }
    };

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
    
    const variantClass = variant === 'glass' ? 'btn bg-glass border-glass text-foreground backdrop-blur-lg' :
                         variant === 'glass-primary' ? 'btn bg-glass-primary border-glass-glow text-primary backdrop-blur-lg' :
                         variant === 'glass-success' ? 'btn bg-glass-success border-glass-glow-success text-success backdrop-blur-lg' :
                         variant === 'glass-heavy' ? 'btn glass-heavy text-foreground' :
                         variant === 'glass-ultra' ? 'btn glass-ultra text-foreground' :
                         variant === 'secondary' ? 'btn btn-secondary' :
                         variant === 'outline' ? 'btn btn-outline' :
                         variant === 'ghost' ? 'btn btn-ghost' :
                         variant === 'destructive' ? 'btn btn-destructive' :
                         'btn btn-primary';
    
    const sizeClass = iconOnly ? (size === 'sm' ? 'btn-sm btn-icon-only' : size === 'lg' ? 'btn-lg btn-icon-only' : 'btn-md btn-icon-only') :
                     (size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : 'btn-md');
    
    let buttonClassName = `${variantClass} ${sizeClass}`;
    if (fullWidth) buttonClassName += ' btn-full-width';
    if (glow) buttonClassName += ' glass-glow-animated';
    if (animate) buttonClassName += ' button-animate-hover';
    if (magnetic) buttonClassName += ' magnetic-hover';
    if (className) buttonClassName += ' ' + className;
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: buttonClassName,
        ...props,
      });
    }
    
    return (
      <button
        ref={(node) => {
          buttonRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={buttonClassName}
        style={
          magnetic
            ? {
                transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }
            : undefined
        }
        disabled={disabled || isLoading}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
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
            <Loader2 className="button-loading-icon animate-spin" />
            {!iconOnly && <span>Loading...</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="button-icon-container">{leftIcon}</span>}
            {iconOnly ? (
              <span className="button-icon-container button-icon-center">{children}</span>
            ) : (
              children && <span className="button-content-wrapper">{children}</span>
            )}
            {rightIcon && <span className="button-icon-container">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

