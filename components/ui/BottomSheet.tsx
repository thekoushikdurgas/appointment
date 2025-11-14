'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '../icons/IconComponents';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  closeOnOverlayClick?: boolean;
  closeOnSwipeDown?: boolean;
  swipeThreshold?: number;
  maxHeight?: string;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  closeOnOverlayClick = true,
  closeOnSwipeDown = true,
  swipeThreshold = 100,
  maxHeight = '90vh',
  className,
}) => {
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragY, setDragY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

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
      setDragY(0);
    }, 300);
  }, [onClose]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      handleClose();
    }
  }, [closeOnOverlayClick, handleClose]);

  // Touch handlers for swipe-down to close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!closeOnSwipeDown) return;
    
    const touch = e.touches[0];
    startY.current = touch.clientY;
    currentY.current = touch.clientY;
    isDragging.current = true;
  }, [closeOnSwipeDown]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !closeOnSwipeDown) return;

    const touch = e.touches[0];
    currentY.current = touch.clientY;
    const deltaY = currentY.current - startY.current;

    // Only allow dragging down
    if (deltaY > 0) {
      setDragY(deltaY);
      
      // Add resistance as user drags further
      if (deltaY > swipeThreshold) {
        e.preventDefault();
      }
    }
  }, [closeOnSwipeDown, swipeThreshold]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || !closeOnSwipeDown) return;

    const deltaY = currentY.current - startY.current;

    if (deltaY > swipeThreshold) {
      handleClose();
    } else {
      setDragY(0);
    }

    isDragging.current = false;
  }, [closeOnSwipeDown, swipeThreshold, handleClose]);

  // Mouse handlers for desktop testing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!closeOnSwipeDown) return;
    
    startY.current = e.clientY;
    currentY.current = e.clientY;
    isDragging.current = true;
  }, [closeOnSwipeDown]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !closeOnSwipeDown) return;

    currentY.current = e.clientY;
    const deltaY = currentY.current - startY.current;

    if (deltaY > 0) {
      setDragY(deltaY);
    }
  }, [closeOnSwipeDown]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current || !closeOnSwipeDown) return;

    const deltaY = currentY.current - startY.current;

    if (deltaY > swipeThreshold) {
      handleClose();
    } else {
      setDragY(0);
    }

    isDragging.current = false;
  }, [closeOnSwipeDown, swipeThreshold, handleClose]);

  // Keyboard support
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleClose]);

  if (!mounted || !isOpen) return null;

  const overlayClassName = `bottom-sheet-overlay${isAnimating ? ' animate-fade-in' : ''}`;
  const sheetClassName = `bottom-sheet glass-frosted-xl${isAnimating ? ' bottom-sheet--animating' : ' bottom-sheet--closing'}${className ? ' ' + className : ''}`;

  const sheetContent = (
    <div
      className={overlayClassName}
      onClick={handleOverlayClick}
    >
      {/* Backdrop */}
      <div className="bottom-sheet-backdrop" />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={sheetClassName}
        style={{
          maxHeight,
          transform: `translateY(${dragY}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.3s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Drag Handle */}
        <div className="bottom-sheet__handle">
          <div className="bottom-sheet__handle-bar" />
        </div>

        {/* Header */}
        {(title || description) && (
          <div className="bottom-sheet__header">
            <div className="bottom-sheet__header-content">
              <div className="bottom-sheet__header-text">
                {title && (
                  <h2 className="bottom-sheet__title">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="bottom-sheet__description">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="bottom-sheet__close-btn"
                aria-label="Close"
              >
                <XMarkIcon className="bottom-sheet__close-icon" />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bottom-sheet__content" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(sheetContent, document.body);
};

BottomSheet.displayName = 'BottomSheet';

