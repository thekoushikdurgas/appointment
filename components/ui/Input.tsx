'use client';

import React from 'react';
import { Tooltip } from './Tooltip';
import { ErrorIconSmall, InfoIconSmall } from '@components/icons';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: 'default' | 'glass' | 'glass-frosted' | 'glass-frosted-heavy' | 'glass-frosted-xl' | 'glass-heavy' | 'glass-ultra';
  animate?: boolean;
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  showTooltipOnFocus?: boolean;
  floatingLabel?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      variant = 'glass-frosted-heavy',
      animate = true,
      tooltip,
      tooltipPosition = 'top',
      showTooltipOnFocus = false,
      floatingLabel = false,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(!!props.value || !!props.defaultValue);
    
    const variantClassMap = {
      default: 'input--default',
      glass: 'input--glass',
      'glass-frosted': 'input--glass-frosted',
      'glass-frosted-heavy': 'input--glass-frosted-heavy',
      'glass-frosted-xl': 'input--glass-frosted-xl',
      'glass-heavy': 'input--glass-heavy',
      'glass-ultra': 'input--glass-ultra',
    };
    
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (props.onFocus) props.onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      if (props.onBlur) props.onBlur(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      if (props.onChange) props.onChange(e);
    };

    const fieldClassName = `form-field${fullWidth ? ' form-field--full-width' : ''}`;
    const wrapperClassName = `input__wrapper${floatingLabel ? ' input__wrapper--floating-label' : ''}`;
    const leftIconClassName = `input__icon input__icon--left${isFocused ? ' input__icon--focused' : ''}`;
    const rightIconClassName = `input__icon input__icon--right${isFocused ? ' input__icon--focused' : ''}`;
    const floatingLabelClassName = `input__floating-label${leftIcon ? ' input__floating-label--left-icon' : ' input__floating-label--no-icon'}${isFocused || hasValue ? ' input__floating-label--focused' : ' input__floating-label--default'}`;
    
    const inputClassName = `input glass-transition-smooth${leftIcon ? ' input--left-icon' : ''}${rightIcon ? ' input--right-icon' : ''}${hasError ? ' input--error error-shake' : ''}${variantClassMap[variant] ? ' ' + variantClassMap[variant] : ''}${animate ? ' input-focus-pulse' : ''}${floatingLabel && (isFocused || hasValue) ? ' input--floating-label-active' : ''}${className ? ' ' + className : ''}`;
    
    const inputElement = (
      <div className={fieldClassName}>
        {label && !floatingLabel && (
          <label
            htmlFor={inputId}
            className="form-label"
          >
            {label}
            {tooltip && !showTooltipOnFocus && (
              <Tooltip content={tooltip} side={tooltipPosition}>
                <span className="form-label__tooltip">
                  ?
                </span>
              </Tooltip>
            )}
          </label>
        )}
        <div className={wrapperClassName}>
          {leftIcon && (
            <div className={leftIconClassName}>
              {leftIcon}
            </div>
          )}
          {floatingLabel && label && (
            <label
              htmlFor={inputId}
              className={floatingLabelClassName}
            >
              {label}
            </label>
          )}
          <input
            ref={ref}
            id={inputId}
            className={inputClassName}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />
          {rightIcon && (
            <div className={rightIconClassName}>
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="form-error-text animate-balanced-fade-slide-down"
            role="alert"
          >
            <ErrorIconSmall className="form-error-text__icon" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="form-helper-text"
          >
            <InfoIconSmall className="form-helper-text__icon" />
            {helperText}
          </p>
        )}
      </div>
    );

    // Wrap with tooltip if showTooltipOnFocus is true
    if (tooltip && showTooltipOnFocus) {
      return (
        <Tooltip content={tooltip} side={tooltipPosition}>
          {inputElement}
        </Tooltip>
      );
    }

    return inputElement;
  }
);

Input.displayName = 'Input';

