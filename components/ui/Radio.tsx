'use client';

import React from 'react';

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
    
    const wrapperClassName = `radio-wrapper${fullWidth ? ' radio-wrapper--full-width' : ''}`;
    const inputClassName = `radio-input${hasError ? ' radio-input--error' : ''}${className ? ' ' + className : ''}`;
    const dotClassName = `radio-dot${hasError ? ' radio-dot--error' : ''}`;
    
    return (
      <div className={wrapperClassName}>
        <div className="radio-container">
          <div className="radio-input-wrapper">
            {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props */}
            <input
              ref={ref}
              type="radio"
              id={radioId}
              checked={checked}
              className={inputClassName}
              aria-invalid={hasError ? 'true' : 'false'}
              aria-describedby={
                error ? `${radioId}-error` : helperText ? `${radioId}-helper` : undefined
              }
              {...props}
            />
            <div className="radio-circle">
              {checked && (
                <div className={dotClassName} />
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
            className="form-error-text radio-error-text"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${radioId}-helper`}
            className="form-helper-text radio-helper-text"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

