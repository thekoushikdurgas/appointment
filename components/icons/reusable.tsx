/**
 * Reusable Icon Components
 * 
 * Complex icon components that can be reused throughout the application
 */

import React from 'react';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
} from 'lucide-react';
import { CheckCircle2Icon, WarningIcon, XCircleIcon, InfoCircleIcon } from './status';

/**
 * LoadingSpinner - Animated loading indicator
 * Replaces inline SVG spinners throughout the app
 */
export const LoadingSpinner: React.FC<{
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ className, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
  };
  
  return (
    <Loader2 
      className={className || `${sizeClasses[size]} animate-spin`}
      strokeWidth={2}
    />
  );
};

/**
 * TrendIndicator - Reusable trend arrow with direction
 * Replaces trend SVGs in StatCard and other components
 */
export const TrendIndicator: React.FC<{
  direction: 'up' | 'down';
  className?: string;
  size?: string;
}> = ({ direction, className, size = 'w-4 h-4' }) => {
  const Icon = direction === 'up' ? TrendingUp : TrendingDown;
  return (
    <Icon 
      className={className || `${size} ${direction === 'up' ? 'text-success' : 'text-destructive'}`}
      strokeWidth={2}
    />
  );
};

/**
 * SortIndicator - Reusable sort icon with state
 * Replaces sort SVGs in DataTable and other sortable components
 */
export const SortIndicator: React.FC<{
  direction?: 'asc' | 'desc' | 'none';
  className?: string;
}> = ({ direction = 'none', className }) => {
  if (direction === 'none') {
    return (
      <ChevronsUpDown 
        className={className || 'w-4 h-4 opacity-30'}
        strokeWidth={2}
      />
    );
  }
  
  const Icon = direction === 'asc' ? ChevronUp : ChevronDown;
  return (
    <Icon 
      className={className || 'w-4 h-4'}
      strokeWidth={2}
    />
  );
};

/**
 * CloseButton - Reusable close/dismiss icon
 * Replaces close button SVGs in modals, toasts, etc.
 */
export const CloseButtonIcon: React.FC<{
  className?: string;
}> = ({ className }) => (
  <X 
    className={className || 'w-5 h-5'}
    strokeWidth={2}
  />
);

/**
 * Toast notification icons with consistent styling
 */
export const ToastIcons = {
  success: CheckCircle2Icon,
  warning: WarningIcon,
  error: XCircleIcon,
  info: InfoCircleIcon,
};

