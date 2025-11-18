'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2Icon, WarningIcon, XCircleIcon, InfoCircleIcon, CloseButtonIcon } from '@components/icons';

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'glass';
  duration?: number;
  onClose?: (id: string) => void;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  variant = 'default',
  duration = 5000,
  onClose,
  icon,
  action,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.(id);
    }, 300);
  };

  if (!isVisible) return null;

  const variantIcons = {
    success: <CheckCircle2Icon />,
    warning: <WarningIcon />,
    error: <XCircleIcon />,
    info: <InfoCircleIcon />,
  };

  const toastClassName = `toast toast--${variant}${isExiting ? ' toast--exiting' : ' toast--entering'}`;
  
  return (
    <div
      className={toastClassName}
      role="alert"
      aria-live="polite"
    >
      <div className="toast__content">
        {/* Icon */}
        {(icon || variantIcons[variant as keyof typeof variantIcons]) && (
          <div className="toast__icon">
            {icon || variantIcons[variant as keyof typeof variantIcons]}
          </div>
        )}

        {/* Content */}
        <div className="toast__body">
          {title && (
            <p className="toast__title">{title}</p>
          )}
          {description && (
            <p className="toast__description">{description}</p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="toast__action"
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="toast__close"
          aria-label="Close notification"
        >
          <CloseButtonIcon className="toast__close-icon" />
        </button>
      </div>
    </div>
  );
};

Toast.displayName = 'Toast';

// Toast Container Component
export interface ToastContainerProps {
  toasts: ToastProps[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  position = 'top-right',
}) => {
  const containerClassName = `toast-container toast-container--${position}`;

  return (
    <div className={containerClassName}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
};

ToastContainer.displayName = 'ToastContainer';

