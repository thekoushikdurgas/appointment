'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { EditIcon, TrashIcon, ArchiveIcon, CheckCircleIcon } from '../icons/IconComponents';
import { Tooltip } from '../ui/Tooltip';
import { cn } from '../../utils/cn';

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
        return 'bg-primary hover:bg-primary/90 text-primary-foreground';
      case 'success':
        return 'bg-success hover:bg-success/90 text-success-foreground';
      case 'warning':
        return 'bg-warning hover:bg-warning/90 text-warning-foreground';
      case 'destructive':
        return 'bg-destructive hover:bg-destructive/90 text-destructive-foreground';
      default:
        return 'bg-secondary hover:bg-secondary/80 text-foreground';
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
    >
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <div
          className="absolute inset-y-0 left-0 flex items-center"
          style={{
            width: maxSwipeDistance,
            transform: `translateX(${Math.min(0, offset - maxSwipeDistance)}px)`,
          }}
        >
          {leftActions.map((action, index) => (
            <Tooltip key={index} content={action.label}>
              <button
                onClick={() => {
                  action.onClick();
                  resetPosition();
                }}
                className={cn(
                  'h-full px-4 flex items-center justify-center transition-colors',
                  'icon-hover-scale',
                  getActionColor(action.color),
                  action.className
                )}
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
          className="absolute inset-y-0 right-0 flex items-center"
          style={{
            width: maxSwipeDistance,
            transform: `translateX(${Math.max(0, offset + maxSwipeDistance)}px)`,
          }}
        >
          {rightActions.map((action, index) => (
            <Tooltip key={index} content={action.label}>
              <button
                onClick={() => {
                  action.onClick();
                  resetPosition();
                }}
                className={cn(
                  'h-full px-4 flex items-center justify-center transition-colors',
                  'icon-hover-scale',
                  getActionColor(action.color),
                  action.className
                )}
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
        className="relative bg-card transition-transform duration-200 ease-out"
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
  icon: <EditIcon className="w-5 h-5" />,
  label: 'Edit',
  onClick: () => {},
  color: 'primary',
};

export const DeleteAction: SwipeAction = {
  icon: <TrashIcon className="w-5 h-5" />,
  label: 'Delete',
  onClick: () => {},
  color: 'destructive',
};

export const ArchiveAction: SwipeAction = {
  icon: <ArchiveIcon className="w-5 h-5" />,
  label: 'Archive',
  onClick: () => {},
  color: 'warning',
};

export const CompleteAction: SwipeAction = {
  icon: <CheckCircleIcon className="w-5 h-5" />,
  label: 'Mark as Complete',
  onClick: () => {},
  color: 'success',
};

