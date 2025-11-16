'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@components/icons/IconComponents';

export interface FullScreenOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  maxWidth?: string;
  className?: string;
  overlayClassName?: string;
}

export const FullScreenOverlay: React.FC<FullScreenOverlayProps> = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  maxWidth = '800px',
  className,
  overlayClassName,
}) => {
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      handleClose();
    }
  }, [closeOnOverlayClick, handleClose]);

  // Keyboard support
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && closeOnEscape) {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeOnEscape, handleClose]);

  if (!mounted || !isOpen) return null;

  const overlayContainerClassName = `fullscreen-overlay${isAnimating ? ' animate-fade-in' : ''}${overlayClassName ? ' ' + overlayClassName : ''}`;
  const backdropClassName = `fullscreen-overlay__backdrop${isAnimating ? ' fullscreen-overlay__backdrop--animating' : ' fullscreen-overlay__backdrop--closing'}`;
  const contentClassName = `fullscreen-overlay__content glass-frosted-xl${isAnimating ? ' fullscreen-overlay__content--animating' : ' fullscreen-overlay__content--closing'}${className ? ' ' + className : ''}`;

  const overlayContent = (
    <div
      className={overlayContainerClassName}
      onClick={handleOverlayClick}
    >
      {/* Animated Backdrop with Heavy Blur */}
      <div className={backdropClassName} />

      {/* Content Container */}
      <div
        className={contentClassName}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="fullscreen-overlay__header">
          <div className="fullscreen-overlay__header-content">
            <div className="fullscreen-overlay__header-text">
              {title && (
                <h2 className="fullscreen-overlay__title">
                  {title}
                </h2>
              )}
              {description && (
                <p className="fullscreen-overlay__description">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={handleClose}
                className="fullscreen-overlay__close-btn"
                aria-label="Close"
              >
                <XMarkIcon className="fullscreen-overlay__close-icon" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="fullscreen-overlay__body">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(overlayContent, document.body);
};

FullScreenOverlay.displayName = 'FullScreenOverlay';

