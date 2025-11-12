'use client';

import React from 'react';
import { cn } from '../../utils/cn';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      fullWidth = false,
      id,
      checked,
      ...props
    },
    ref
  ) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    
    return (
      <div className={cn('radio-wrapper', fullWidth && 'w-full')}>
        <div className="radio-container">
          <div className="relative flex items-center">
            {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props */}
            <input
              ref={ref}
              type="radio"
              id={radioId}
              checked={checked}
              className={cn(
                'radio-input',
                hasError && 'error',
                className
              )}
              aria-invalid={hasError ? 'true' : 'false'}
              aria-describedby={
                error ? `${radioId}-error` : helperText ? `${radioId}-helper` : undefined
              }
              {...props}
            />
            <div className="radio-circle">
              {checked && (
                <div className={cn(
                  'radio-dot',
                  hasError && 'error'
                )} />
              )}
            </div>
          </div>
          {label && (
            <label
              htmlFor={radioId}
              className="radio-label"
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p
            id={`${radioId}-error`}
            className="form-error-text ml-7"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${radioId}-helper`}
            className="form-helper-text ml-7"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

