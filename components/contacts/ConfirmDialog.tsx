import React, { useEffect, useRef } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@components/icons';
import { Button } from '@components/ui/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isOpen && !isLoading) {
        onConfirm();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleEnter);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleEnter);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, onConfirm, isLoading]);

  if (!isOpen) return null;

  const variantIconClass = {
    danger: 'confirm-dialog-header__icon--danger',
    warning: 'confirm-dialog-header__icon--warning',
    info: 'confirm-dialog-header__icon--info',
  };

  const iconClassName = variantIconClass[variant];

  return (
    <div 
      className="confirm-dialog-overlay" 
      onClick={!isLoading ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div
        ref={dialogRef}
        className="confirm-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="confirm-dialog-header">
          <div className="confirm-dialog-header__left">
            <ExclamationTriangleIcon className={`confirm-dialog-header__icon ${iconClassName}`} />
            <h2 id="confirm-dialog-title" className="confirm-dialog-header__title">
              {title}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
          >
            <XMarkIcon className="confirm-dialog-header__close-icon" />
          </Button>
        </header>

        <div className="confirm-dialog-body">
          <p id="confirm-dialog-message" className="confirm-dialog-body__message">
            {message}
          </p>
        </div>

        <footer className="confirm-dialog-footer">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="confirm-dialog-footer__btn"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'primary'}
            onClick={onConfirm}
            disabled={isLoading}
            className="confirm-dialog-footer__btn"
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </footer>
      </div>
    </div>
  );
};

