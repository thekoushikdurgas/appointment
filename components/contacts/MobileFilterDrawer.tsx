'use client';

import React, { useEffect, useRef } from 'react';
import { useSwipeGesture } from '@hooks/useSwipeGesture';
import { XMarkIcon, FilterIcon } from '@components/icons';
import { Button } from '@components/ui/Button';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  activeFilterCount?: number;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  isOpen,
  onClose,
  children,
  title = 'Filters',
  activeFilterCount = 0,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = React.useState(0);

  const { handlers } = useSwipeGesture({
    onSwipeDown: () => {
      if (dragOffset > 100) {
        onClose();
      }
    },
    threshold: 50,
    onSwipeStart: () => {
      setDragOffset(0);
    },
  });

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="mobile-filter-drawer__overlay"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="mobile-filter-drawer__backdrop glass-overlay" />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="mobile-filter-drawer__panel"
        style={{
          transform: `translateY(${Math.max(0, dragOffset)}px)`,
        }}
      >
        {/* Drag Handle */}
        <div
          {...handlers}
          className="mobile-filter-drawer__handle"
        >
          <div className="mobile-filter-drawer__handle-bar" />
        </div>

        {/* Header */}
        <div className="mobile-filter-drawer__header">
          <div className="mobile-filter-drawer__header-left">
            <FilterIcon className="mobile-filter-drawer__header-icon" />
            <h2 className="mobile-filter-drawer__header-title">{title}</h2>
            {activeFilterCount > 0 && (
              <span className="mobile-filter-drawer__header-badge">
                {activeFilterCount}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            iconOnly
            aria-label="Close filters"
          >
            <XMarkIcon className="mobile-filter-drawer__header-close-icon" />
          </Button>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="mobile-filter-drawer__body"
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

