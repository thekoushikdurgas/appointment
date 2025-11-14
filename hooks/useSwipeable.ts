import { useRef, useCallback, TouchEvent, MouseEvent } from 'react';

export interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export interface SwipeConfig {
  threshold?: number; // Minimum distance for a swipe (in pixels)
  preventDefaultTouchmoveEvent?: boolean;
  trackMouse?: boolean;
}

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
  isSwiping: boolean;
}

const DEFAULT_THRESHOLD = 50;
const MAX_SWIPE_TIME = 500; // Maximum time for a swipe gesture (in ms)

export const useSwipeable = (
  callbacks: SwipeCallbacks,
  config: SwipeConfig = {}
) => {
  const {
    threshold = DEFAULT_THRESHOLD,
    preventDefaultTouchmoveEvent = false,
    trackMouse = false,
  } = config;

  const swipeState = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isSwiping: false,
  });

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      swipeState.current = {
        startX: clientX,
        startY: clientY,
        startTime: Date.now(),
        isSwiping: true,
      };
      callbacks.onSwipeStart?.();
    },
    [callbacks]
  );

  const handleEnd = useCallback(
    (clientX: number, clientY: number) => {
      if (!swipeState.current.isSwiping) return;

      const deltaX = clientX - swipeState.current.startX;
      const deltaY = clientY - swipeState.current.startY;
      const deltaTime = Date.now() - swipeState.current.startTime;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Check if swipe was fast enough and exceeded threshold
      if (deltaTime <= MAX_SWIPE_TIME) {
        // Horizontal swipe
        if (absDeltaX > absDeltaY && absDeltaX > threshold) {
          if (deltaX > 0) {
            callbacks.onSwipeRight?.();
          } else {
            callbacks.onSwipeLeft?.();
          }
        }
        // Vertical swipe
        else if (absDeltaY > absDeltaX && absDeltaY > threshold) {
          if (deltaY > 0) {
            callbacks.onSwipeDown?.();
          } else {
            callbacks.onSwipeUp?.();
          }
        }
      }

      swipeState.current.isSwiping = false;
      callbacks.onSwipeEnd?.();
    },
    [callbacks, threshold]
  );

  // Touch handlers
  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    },
    [handleStart]
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (preventDefaultTouchmoveEvent && swipeState.current.isSwiping) {
        e.preventDefault();
      }
    },
    [preventDefaultTouchmoveEvent]
  );

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      handleEnd(touch.clientX, touch.clientY);
    },
    [handleEnd]
  );

  // Mouse handlers (optional)
  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      if (trackMouse) {
        handleStart(e.clientX, e.clientY);
      }
    },
    [handleStart, trackMouse]
  );

  const onMouseUp = useCallback(
    (e: MouseEvent) => {
      if (trackMouse) {
        handleEnd(e.clientX, e.clientY);
      }
    },
    [handleEnd, trackMouse]
  );

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    ...(trackMouse && {
      onMouseDown,
      onMouseUp,
    }),
  };
};

export default useSwipeable;

