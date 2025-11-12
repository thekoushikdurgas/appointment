import { useRef, useEffect, useCallback, TouchEvent, MouseEvent } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  threshold?: number; // Minimum distance for swipe (default: 50px)
  velocityThreshold?: number; // Minimum velocity for swipe (default: 0.3)
  preventDefaultTouchmoveEvent?: boolean;
  trackMouse?: boolean; // Enable mouse drag support
}

export interface SwipeState {
  isSwiping: boolean;
  direction: SwipeDirection | null;
  deltaX: number;
  deltaY: number;
}

export const useSwipeGesture = (config: SwipeConfig = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipeStart,
    onSwipeEnd,
    threshold = 50,
    velocityThreshold = 0.3,
    preventDefaultTouchmoveEvent = false,
    trackMouse = false,
  } = config;

  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const startTime = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  const currentDeltaX = useRef<number>(0);
  const currentDeltaY = useRef<number>(0);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    startX.current = clientX;
    startY.current = clientY;
    startTime.current = Date.now();
    isSwiping.current = true;
    currentDeltaX.current = 0;
    currentDeltaY.current = 0;
    onSwipeStart?.();
  }, [onSwipeStart]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isSwiping.current) return;

    currentDeltaX.current = clientX - startX.current;
    currentDeltaY.current = clientY - startY.current;
  }, []);

  const handleEnd = useCallback((clientX: number, clientY: number) => {
    if (!isSwiping.current) return;

    const deltaX = clientX - startX.current;
    const deltaY = clientY - startY.current;
    const deltaTime = Date.now() - startTime.current;
    const velocityX = Math.abs(deltaX) / deltaTime;
    const velocityY = Math.abs(deltaY) / deltaTime;

    isSwiping.current = false;
    onSwipeEnd?.();

    // Determine swipe direction based on larger delta
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY) {
      // Horizontal swipe
      if (absX > threshold && velocityX > velocityThreshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (absY > threshold && velocityY > velocityThreshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    currentDeltaX.current = 0;
    currentDeltaY.current = 0;
  }, [threshold, velocityThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onSwipeEnd]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (preventDefaultTouchmoveEvent && isSwiping.current) {
      e.preventDefault();
    }
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }, [handleMove, preventDefaultTouchmoveEvent]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const touch = e.changedTouches[0];
    handleEnd(touch.clientX, touch.clientY);
  }, [handleEnd]);

  // Mouse event handlers (for desktop testing)
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!trackMouse) return;
    handleStart(e.clientX, e.clientY);
  }, [handleStart, trackMouse]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!trackMouse || !isSwiping.current) return;
    handleMove(e.clientX, e.clientY);
  }, [handleMove, trackMouse]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!trackMouse) return;
    handleEnd(e.clientX, e.clientY);
  }, [handleEnd, trackMouse]);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (!trackMouse || !isSwiping.current) return;
    handleEnd(e.clientX, e.clientY);
  }, [handleEnd, trackMouse]);

  const getSwipeState = useCallback((): SwipeState => {
    return {
      isSwiping: isSwiping.current,
      direction: null,
      deltaX: currentDeltaX.current,
      deltaY: currentDeltaY.current,
    };
  }, []);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: trackMouse ? handleMouseDown : undefined,
      onMouseMove: trackMouse ? handleMouseMove : undefined,
      onMouseUp: trackMouse ? handleMouseUp : undefined,
      onMouseLeave: trackMouse ? handleMouseLeave : undefined,
    },
    getSwipeState,
  };
};

