'use client';

import React, { useState, useEffect } from 'react';
import { Tooltip } from './Tooltip';
import { ErrorIconSmall, InfoIconSmall } from '../icons/IconComponents';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: 'default' | 'glass' | 'glass-frosted' | 'glass-frosted-heavy' | 'glass-frosted-xl';
  showCharacterCount?: boolean;
  maxLength?: number;
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  animate?: boolean;
  showTooltipOnFocus?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      fullWidth = true,
      variant = 'glass-frosted-heavy',
      showCharacterCount = false,
      maxLength,
      tooltip,
      tooltipPosition = 'top',
      animate = true,
      showTooltipOnFocus = false,
      id,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const [charCount, setCharCount] = useState(0);

    useEffect(() => {
      if (showCharacterCount) {
        const currentValue = value !== undefined ? String(value) : String(defaultValue || '');
        setCharCount(currentValue.length);
      }
    }, [value, defaultValue, showCharacterCount]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (showCharacterCount) {
        setCharCount(e.target.value.length);
      }
      onChange?.(e);
    };

    const variantClassMap = {
      default: 'textarea--default',
      glass: 'textarea--glass',
      'glass-frosted': 'textarea--glass-frosted',
      'glass-frosted-heavy': 'textarea--glass-frosted-heavy',
      'glass-frosted-xl': 'textarea--glass-frosted-xl',
    };

    const isNearLimit = maxLength && charCount >= maxLength * 0.9;
    const isAtLimit = maxLength && charCount >= maxLength;
    
    const fieldClassName = `form-field${fullWidth ? ' form-field--full-width' : ''}`;
    const textareaClassName = `textarea glass-transition-smooth${hasError ? ' textarea--error error-shake' : ''}${variantClassMap[variant] ? ' ' + variantClassMap[variant] : ''}${animate ? ' input-focus-pulse' : ''}${className ? ' ' + className : ''}`;
    const characterCountClassName = `form-label__character-count${isAtLimit ? ' form-label__character-count--at-limit' : isNearLimit ? ' form-label__character-count--near-limit' : ''}`;
    const characterCountOverlayClassName = `textarea__character-count${isAtLimit ? ' textarea__character-count--at-limit' : isNearLimit ? ' textarea__character-count--near-limit' : ''}`;
    
    return (
      <div className={fieldClassName}>
        {label && (
          <label
            htmlFor={textareaId}
            className="form-label"
          >
            <span>
              {label}
              {tooltip && (
                <Tooltip content={tooltip} side={tooltipPosition}>
                  <span className="form-label__tooltip">
                    ?
                  </span>
                </Tooltip>
              )}
            </span>
            {showCharacterCount && maxLength && (
              <span className={characterCountClassName}>
                {charCount}/{maxLength}
              </span>
            )}
          </label>
        )}
        <div className="textarea__wrapper">
          <textarea
            ref={ref}
            id={textareaId}
            className={textareaClassName}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={
              error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
            }
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            maxLength={maxLength}
            {...props}
          />
          {showCharacterCount && !maxLength && (
            <div className={characterCountOverlayClassName}>
              {charCount} characters
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${textareaId}-error`}
            className="form-error-text animate-balanced-fade-slide-down"
            role="alert"
          >
            <ErrorIconSmall className="form-error-text__icon" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${textareaId}-helper`}
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

Textarea.displayName = 'Textarea';

