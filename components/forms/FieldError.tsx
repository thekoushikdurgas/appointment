'use client';

import React from 'react';
import { AlertTriangleIcon } from '../icons/IconComponents';
import { cn } from '../../utils/cn';

interface FieldErrorProps {
  error?: string;
  id?: string;
  className?: string;
}

/**
 * Reusable component for displaying field-specific errors
 * Provides consistent styling and accessibility across all forms
 */
export const FieldError: React.FC<FieldErrorProps> = ({ error, id, className = '' }) => {
  if (!error) return null;

  return (
    <p
      id={id}
      role="alert"
      className={cn(
        "form-error-text flex items-center gap-1.5",
        className
      )}
    >
      <AlertTriangleIcon className="w-4 h-4 flex-shrink-0" />
      <span>{error}</span>
    </p>
  );
};

/**
 * Helper function to get ARIA attributes for form fields with errors
 */
export const getFieldAriaAttributes = (hasError: boolean, errorId?: string) => {
  if (!hasError) return {};
  
  return {
    'aria-invalid': 'true' as const,
    'aria-describedby': errorId,
  };
};

