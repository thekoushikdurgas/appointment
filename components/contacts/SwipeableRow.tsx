'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSwipeGesture } from '@hooks/useSwipeGesture';
import { EditIcon, TrashIcon, ArchiveIcon, CheckCircleIcon } from '@components/icons/IconComponents';
import { Tooltip } from '@components/ui/Tooltip';

interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

interface SwipeableRowProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  className,
  disabled = false,
}) => {
  const [offset, setOffset] = useState(0);
  const [isRevealed, setIsRevealed] = useState<'left' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const maxSwipeDistance = 120; // Maximum pixels to swipe

  const resetPosition = () => {
    setOffset(0);
    setIsRevealed(null);
  };

  const handleSwipeLeftComplete = () => {
    if (rightActions.length > 0) {
      setOffset(-maxSwipeDistance);
      setIsRevealed('right');
    }
    onSwipeLeft?.();
  };

  const handleSwipeRightComplete = () => {
    if (leftActions.length > 0) {
      setOffset(maxSwipeDistance);
      setIsRevealed('left');
    }
    onSwipeRight?.();
  };

  const { handlers, getSwipeState } = useSwipeGesture({
    onSwipeLeft: handleSwipeLeftComplete,
    onSwipeRight: handleSwipeRightComplete,
    threshold,
    trackMouse: true,
    onSwipeStart: () => {
      if (disabled) return;
    },
    onSwipeEnd: () => {
      if (disabled) return;
      const state = getSwipeState();
      
      // If not swiped far enough, reset
      if (Math.abs(state.deltaX) < threshold) {
        resetPosition();
      }
    },
  });

  // Update offset during swipe
  useEffect(() => {
    if (disabled) return;

    const handleMove = () => {
      const state = getSwipeState();
      if (state.isSwiping) {
        const clampedDelta = Math.max(
          -maxSwipeDistance,
          Math.min(maxSwipeDistance, state.deltaX)
        );
        setOffset(clampedDelta);
      }
    };

    const interval = setInterval(handleMove, 16); // ~60fps
    return () => clearInterval(interval);
  }, [disabled, getSwipeState]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        isRevealed
      ) {
        resetPosition();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isRevealed]);

  const getActionColor = (color?: string) => {
    switch (color) {
      case 'primary':
        return 'swipeable-row__action-btn--primary';
      case 'success':
        return 'swipeable-row__action-btn--success';
      case 'warning':
        return 'swipeable-row__action-btn--warning';
      case 'destructive':
        return 'swipeable-row__action-btn--destructive';
      default:
        return 'swipeable-row__action-btn--default';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`swipeable-row${className ? ' ' + className : ''}`}
    >
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <div
          className="swipeable-row__left-actions"
          style={{
            width: maxSwipeDistance,
            transform: `translateX(${Math.min(0, offset - maxSwipeDistance)}px)`,
          }}
        >
          {leftActions.map((action, index) => (
            <Tooltip key={`left-action-${action.label || index}`} content={action.label}>
              <button
                onClick={() => {
                  action.onClick();
                  resetPosition();
                }}
                className={`swipeable-row__action-btn ${getActionColor(action.color)}${action.className ? ' ' + action.className : ''}`}
                aria-label={action.label}
              >
                {action.icon}
              </button>
            </Tooltip>
          ))}
        </div>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <div
          className="swipeable-row__right-actions"
          style={{
            width: maxSwipeDistance,
            transform: `translateX(${Math.max(0, offset + maxSwipeDistance)}px)`,
          }}
        >
          {rightActions.map((action, index) => (
            <Tooltip key={`right-action-${action.label || index}`} content={action.label}>
              <button
                onClick={() => {
                  action.onClick();
                  resetPosition();
                }}
                className={`swipeable-row__action-btn ${getActionColor(action.color)}${action.className ? ' ' + action.className : ''}`}
                aria-label={action.label}
              >
                {action.icon}
              </button>
            </Tooltip>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div
        ref={contentRef}
        {...(disabled ? {} : handlers)}
        className="swipeable-row__content"
        style={{
          transform: `translateX(${offset}px)`,
          touchAction: 'pan-y', // Allow vertical scrolling
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Pre-configured action components for common use cases
export const EditAction: SwipeAction = {
  icon: <EditIcon className="swipeable-row__action-icon" />,
  label: 'Edit',
  onClick: () => {},
  color: 'primary',
};

export const DeleteAction: SwipeAction = {
  icon: <TrashIcon className="swipeable-row__action-icon" />,
  label: 'Delete',
  onClick: () => {},
  color: 'destructive',
};

export const ArchiveAction: SwipeAction = {
  icon: <ArchiveIcon className="swipeable-row__action-icon" />,
  label: 'Archive',
  onClick: () => {},
  color: 'warning',
};

export const CompleteAction: SwipeAction = {
  icon: <CheckCircleIcon className="swipeable-row__action-icon" />,
  label: 'Mark as Complete',
  onClick: () => {},
  color: 'success',
};

