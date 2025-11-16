'use client';

import React from 'react';
import { ChevronDownIcon, ErrorIconSmall, InfoIconSmall } from '@components/icons/IconComponents';
import { Tooltip } from './Tooltip';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean; icon?: React.ReactNode }>;
  placeholder?: string;
  variant?: 'default' | 'glass' | 'glass-frosted' | 'glass-frosted-heavy' | 'glass-frosted-xl';
  leftIcon?: React.ReactNode;
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  showTooltipOnFocus?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      fullWidth = true,
      id,
      options,
      placeholder,
      variant = 'glass-frosted-heavy',
      leftIcon,
      tooltip,
      tooltipPosition = 'top',
      showTooltipOnFocus = false,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    
    const variantClassMap = {
      default: 'select--default',
      glass: 'select--glass',
      'glass-frosted': 'select--glass-frosted',
      'glass-frosted-heavy': 'select--glass-frosted-heavy',
      'glass-frosted-xl': 'select--glass-frosted-xl',
    };
    
    const fieldClassName = `form-field${fullWidth ? ' form-field--full-width' : ''}`;
    const selectClassName = `select glass-transition-smooth${leftIcon ? ' select--left-icon' : ''}${hasError ? ' select--error' : ''}${variantClassMap[variant] ? ' ' + variantClassMap[variant] : ''}${className ? ' ' + className : ''}`;
    
    return (
      <div className={fieldClassName}>
        {label && (
          <label
            htmlFor={selectId}
            className="form-label"
          >
            {label}
            {tooltip && (
              <Tooltip content={tooltip} side={tooltipPosition}>
                <span className="form-label__tooltip">
                  ?
                </span>
              </Tooltip>
            )}
          </label>
        )}
        <div className="select__wrapper">
          {leftIcon && (
            <div className="select__icon select__icon--left">
              {leftIcon}
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            className={selectClassName}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={
              error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="select__icon">
            <ChevronDownIcon />
          </div>
        </div>
        {error && (
          <p
            id={`${selectId}-error`}
            className="form-error-text animate-balanced-fade-slide-down"
            role="alert"
          >
            <ErrorIconSmall className="form-error-text__icon" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${selectId}-helper`}
            className="form-helper-text"
          >
            <InfoIconSmall className="form-helper-text__icon" />
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

