'use client';

import React, { useEffect } from 'react';
import { CloseButtonIcon } from '@components/icons/IconComponents';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'glass' | 'glass-frosted' | 'glass-heavy' | 'glass-ultra';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  swipeToDismiss?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  variant = 'glass',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  swipeToDismiss = true,
  footer,
  className,
}) => {
  const [swipeY, setSwipeY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const startY = React.useRef(0);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (swipeToDismiss) {
      startY.current = e.touches[0].clientY;
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeToDismiss && isDragging) {
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY.current;
      if (deltaY > 0) {
        setSwipeY(deltaY);
      }
    }
  };

  const handleTouchEnd = () => {
    if (swipeToDismiss && isDragging) {
      if (swipeY > 100) {
        onClose();
      }
      setSwipeY(0);
      setIsDragging(false);
    }
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalClassName = `modal-content modal-content--${size} modal-content--${variant}${isDragging ? ' modal-content--dragging' : ''}${className ? ' ' + className : ''}`;

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      {/* Backdrop */}
      <div className="modal-backdrop" />

      {/* Modal Content */}
      <div
        className={modalClassName}
        style={{
          transform: swipeY > 0 ? `translateY(${swipeY}px)` : undefined,
          opacity: swipeY > 0 ? Math.max(0.5, 1 - swipeY / 300) : 1,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="modal-header">
            <div className="modal-header-content">
              {title && (
                <h2
                  id="modal-title"
                  className="modal-title"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="modal-description"
                >
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="modal-close-btn"
                aria-label="Close modal"
              >
                <CloseButtonIcon className="modal-close-icon" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="modal-body">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

Modal.displayName = 'Modal';

