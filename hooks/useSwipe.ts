import { useEffect, useRef, useState, RefObject } from 'react';

export interface SwipeConfig {
  threshold?: number; // Minimum distance for swipe (default: 50px)
  velocityThreshold?: number; // Minimum velocity (default: 0.3)
  preventDefaultTouchmoveEvent?: boolean;
  trackMouse?: boolean; // Track mouse events as well
  trackTouch?: boolean; // Track touch events (default: true)
}

export interface SwipeEventData {
  dir: 'Left' | 'Right' | 'Up' | 'Down';
  velocity: number;
  distance: number;
  deltaX: number;
  deltaY: number;
}

export interface SwipeCallbacks {
  onSwipeLeft?: (data: SwipeEventData) => void;
  onSwipeRight?: (data: SwipeEventData) => void;
  onSwipeUp?: (data: SwipeEventData) => void;
  onSwipeDown?: (data: SwipeEventData) => void;
  onSwiping?: (data: Partial<SwipeEventData>) => void;
  onSwiped?: (data: SwipeEventData) => void;
  onTap?: () => void;
}

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  currentY: number;
  isSwiping: boolean;
}

const defaultConfig: Required<SwipeConfig> = {
  threshold: 50,
  velocityThreshold: 0.3,
  preventDefaultTouchmoveEvent: false,
  trackMouse: false,
  trackTouch: true,
};

/**
 * Custom hook for detecting swipe gestures on touch and mouse events
 * @param callbacks - Callback functions for different swipe directions
 * @param config - Configuration options for swipe detection
 * @returns RefObject to attach to the element you want to track swipes on
 */
export function useSwipe<T extends HTMLElement = HTMLElement>(
  callbacks: SwipeCallbacks,
  config: SwipeConfig = {}
): RefObject<T | null> {
  const elementRef = useRef<T | null>(null);
  const touchDataRef = useRef<TouchData>({
    startX: 0,
    startY: 0,
    startTime: 0,
    currentX: 0,
    currentY: 0,
    isSwiping: false,
  });

  const mergedConfig = { ...defaultConfig, ...config };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleStart = (clientX: number, clientY: number) => {
      touchDataRef.current = {
        startX: clientX,
        startY: clientY,
        startTime: Date.now(),
        currentX: clientX,
        currentY: clientY,
        isSwiping: false,
      };
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!touchDataRef.current.startTime) return;

      touchDataRef.current.currentX = clientX;
      touchDataRef.current.currentY = clientY;

      const deltaX = clientX - touchDataRef.current.startX;
      const deltaY = clientY - touchDataRef.current.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Mark as swiping if moved beyond a small threshold
      if (distance > 10 && !touchDataRef.current.isSwiping) {
        touchDataRef.current.isSwiping = true;
      }

      if (touchDataRef.current.isSwiping && callbacks.onSwiping) {
        callbacks.onSwiping({
          deltaX,
          deltaY,
          distance,
        });
      }
    };

    const handleEnd = () => {
      if (!touchDataRef.current.startTime) return;

      const deltaX = touchDataRef.current.currentX - touchDataRef.current.startX;
      const deltaY = touchDataRef.current.currentY - touchDataRef.current.startY;
      const deltaTime = Date.now() - touchDataRef.current.startTime;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / deltaTime;

      // Check if it's a tap (very small movement)
      if (distance < 10 && deltaTime < 300 && callbacks.onTap) {
        callbacks.onTap();
        touchDataRef.current.startTime = 0;
        return;
      }

      // Check if swipe meets threshold requirements
      if (
        distance >= mergedConfig.threshold &&
        velocity >= mergedConfig.velocityThreshold
      ) {
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        let dir: 'Left' | 'Right' | 'Up' | 'Down';

        // Determine swipe direction
        if (absDeltaX > absDeltaY) {
          dir = deltaX > 0 ? 'Right' : 'Left';
        } else {
          dir = deltaY > 0 ? 'Down' : 'Up';
        }

        const eventData: SwipeEventData = {
          dir,
          velocity,
          distance,
          deltaX,
          deltaY,
        };

        // Call the appropriate callback
        if (callbacks.onSwiped) {
          callbacks.onSwiped(eventData);
        }

        if (dir === 'Left' && callbacks.onSwipeLeft) {
          callbacks.onSwipeLeft(eventData);
        } else if (dir === 'Right' && callbacks.onSwipeRight) {
          callbacks.onSwipeRight(eventData);
        } else if (dir === 'Up' && callbacks.onSwipeUp) {
          callbacks.onSwipeUp(eventData);
        } else if (dir === 'Down' && callbacks.onSwipeDown) {
          callbacks.onSwipeDown(eventData);
        }
      }

      // Reset touch data
      touchDataRef.current.startTime = 0;
      touchDataRef.current.isSwiping = false;
    };

    // Touch event handlers
    const handleTouchStart = (e: TouchEvent) => {
      if (!mergedConfig.trackTouch) return;
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!mergedConfig.trackTouch) return;
      if (mergedConfig.preventDefaultTouchmoveEvent) {
        e.preventDefault();
      }
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
      if (!mergedConfig.trackTouch) return;
      handleEnd();
    };

    // Mouse event handlers
    const handleMouseDown = (e: MouseEvent) => {
      if (!mergedConfig.trackMouse) return;
      handleStart(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!mergedConfig.trackMouse || !touchDataRef.current.startTime) return;
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      if (!mergedConfig.trackMouse) return;
      handleEnd();
    };

    // Add event listeners
    if (mergedConfig.trackTouch) {
      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchmove', handleTouchMove, {
        passive: !mergedConfig.preventDefaultTouchmoveEvent,
      });
      element.addEventListener('touchend', handleTouchEnd, { passive: true });
      element.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    }

    if (mergedConfig.trackMouse) {
      element.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    // Cleanup
    return () => {
      if (mergedConfig.trackTouch) {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
        element.removeEventListener('touchcancel', handleTouchEnd);
      }

      if (mergedConfig.trackMouse) {
        element.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [callbacks, mergedConfig]);

  return elementRef;
}

/**
 * Hook for detecting pull-to-refresh gesture
 * @param onRefresh - Callback function when pull-to-refresh is triggered
 * @param threshold - Distance to pull before triggering refresh (default: 80px)
 */
export function usePullToRefresh<T extends HTMLElement = HTMLElement>(
  onRefresh: () => void | Promise<void>,
  threshold: number = 80
): RefObject<T | null> {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const swipeRef = useSwipe<T>(
    {
      onSwiping: (data) => {
        // Only trigger on downward swipe from top of page
        if (window.scrollY === 0 && data.deltaY && data.deltaY > 0) {
          setIsPulling(true);
          setPullDistance(Math.min(data.deltaY, threshold * 1.5));
        }
      },
      onSwipeDown: async (data) => {
        if (window.scrollY === 0 && data.distance >= threshold) {
          await onRefresh();
        }
        setIsPulling(false);
        setPullDistance(0);
      },
    },
    {
      threshold: threshold,
      trackTouch: true,
      trackMouse: false,
    }
  );

  return swipeRef;
}

export default useSwipe;

