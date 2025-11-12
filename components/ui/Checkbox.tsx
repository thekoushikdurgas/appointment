'use client';

import React from 'react';
import { cn } from '../../utils/cn';
import { CheckIcon } from '../icons/IconComponents';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
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
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    
    return (
      <div className={cn('checkbox-wrapper', fullWidth && 'w-full')}>
        <div className="checkbox-container">
          <div className="relative flex items-center">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              checked={checked}
              className={cn(
                'checkbox-input',
                hasError && 'error',
                className
              )}
              aria-invalid={hasError ? 'true' : 'false'}
              aria-describedby={
                error ? `${checkboxId}-error` : helperText ? `${checkboxId}-helper` : undefined
              }
              {...props}
            />
            <div className="checkbox-box">
              {checked && (
                <CheckIcon className="checkbox-icon" />
              )}
            </div>
          </div>
          {label && (
            <label
              htmlFor={checkboxId}
              className="checkbox-label"
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p
            id={`${checkboxId}-error`}
            className="form-error-text ml-7"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${checkboxId}-helper`}
            className="form-helper-text ml-7"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

