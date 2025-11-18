'use client';

import React from 'react';
import { CheckIcon } from '@components/icons';

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
    
    const wrapperClassName = `checkbox-wrapper${fullWidth ? ' checkbox-wrapper--full-width' : ''}`;
    const inputClassName = `checkbox-input${hasError ? ' checkbox-input--error' : ''}${className ? ' ' + className : ''}`;
    
    return (
      <div className={wrapperClassName}>
        <div className="checkbox-container">
          <div className="checkbox-input-wrapper">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              checked={checked}
              className={inputClassName}
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
            className="form-error-text checkbox-error-text"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${checkboxId}-helper`}
            className="form-helper-text checkbox-helper-text"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

