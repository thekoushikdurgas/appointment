import { useEffect, useRef, useState, useCallback } from 'react';

export interface PullToRefreshConfig {
  onRefresh: () => Promise<void>;
  threshold?: number; // Minimum pull distance to trigger refresh (default: 80px)
  maxPullDistance?: number; // Maximum pull distance (default: 120px)
  resistance?: number; // Pull resistance factor (default: 2.5)
  enabled?: boolean; // Enable/disable pull to refresh (default: true)
}

export const usePullToRefresh = (config: PullToRefreshConfig) => {
  const {
    onRefresh,
    threshold = 80,
    maxPullDistance = 120,
    resistance = 2.5,
    enabled = true,
  } = config;

  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const containerRef = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing) return;

    // Only allow pull to refresh when scrolled to top
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [enabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || !enabled || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;

    // Only pull down
    if (distance > 0) {
      // Apply resistance
      const resistedDistance = Math.min(
        distance / resistance,
        maxPullDistance
      );
      setPullDistance(resistedDistance);

      // Prevent default scroll when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, enabled, isRefreshing, resistance, maxPullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || isRefreshing) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    setIsPulling(false);

    // Trigger refresh if pulled past threshold
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull to refresh error:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Reset if not pulled far enough
      setPullDistance(0);
    }
  }, [enabled, isRefreshing, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min((pullDistance / threshold) * 100, 100);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    progress,
    containerRef,
  };
};

