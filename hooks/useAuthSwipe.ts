'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  isSwiping: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

interface UseAuthSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onPullDown?: () => void;
  threshold?: number;
  pullThreshold?: number;
  enabled?: boolean;
}

export const useAuthSwipe = (options: UseAuthSwipeOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onPullDown,
    threshold = 50,
    pullThreshold = 100,
    enabled = true,
  } = options;

  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    isSwiping: false,
    direction: null,
  });

  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    setSwipeState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      isSwiping: true,
      direction: null,
    });
  }, [enabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !swipeState.isSwiping) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    const deltaY = touch.clientY - swipeState.startY;

    // Determine direction
    let direction: 'left' | 'right' | 'up' | 'down' | null = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    setSwipeState((prev) => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX,
      deltaY,
      direction,
    }));

    // Handle pull-to-refresh
    if (direction === 'down' && deltaY > 0 && window.scrollY === 0) {
      e.preventDefault();
      setIsPulling(true);
      setPullDistance(Math.min(deltaY, pullThreshold * 1.5));
    }
  }, [enabled, swipeState.isSwiping, swipeState.startX, swipeState.startY, pullThreshold]);

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !swipeState.isSwiping) return;

    const { deltaX, deltaY, direction } = swipeState;

    // Handle horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > threshold) {
        if (direction === 'left' && onSwipeLeft) {
          onSwipeLeft();
        } else if (direction === 'right' && onSwipeRight) {
          onSwipeRight();
        }
      }
    }

    // Handle pull-to-refresh
    if (isPulling && pullDistance >= pullThreshold && onPullDown) {
      onPullDown();
    }

    // Reset state
    setSwipeState({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      deltaX: 0,
      deltaY: 0,
      isSwiping: false,
      direction: null,
    });
    setIsPulling(false);
    setPullDistance(0);
  }, [
    enabled,
    swipeState,
    threshold,
    isPulling,
    pullDistance,
    pullThreshold,
    onSwipeLeft,
    onSwipeRight,
    onPullDown,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const getSwipeProgress = () => {
    if (!swipeState.isSwiping) return 0;
    const { deltaX, deltaY, direction } = swipeState;
    
    if (direction === 'left' || direction === 'right') {
      return Math.min(Math.abs(deltaX) / threshold, 1);
    }
    return 0;
  };

  const getPullProgress = () => {
    return Math.min(pullDistance / pullThreshold, 1);
  };

  return {
    containerRef,
    swipeState,
    isPulling,
    pullDistance,
    pullProgress: getPullProgress(),
    swipeProgress: getSwipeProgress(),
  };
};

