import { useCallback, useRef, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface SettingsTab {
  id: string;
  label: string;
  path: string;
}

export interface UseSettingsSwipeConfig {
  tabs: SettingsTab[];
  onRefresh?: () => Promise<void>;
  swipeThreshold?: number;
  pullThreshold?: number;
  enableTabNavigation?: boolean;
  enablePullToRefresh?: boolean;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export interface SwipeState {
  isSwiping: boolean;
  isPulling: boolean;
  isRefreshing: boolean;
  deltaX: number;
  deltaY: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

export const useSettingsSwipe = (config: UseSettingsSwipeConfig) => {
  const {
    tabs,
    onRefresh,
    swipeThreshold = 80,
    pullThreshold = 100,
    enableTabNavigation = true,
    enablePullToRefresh = true,
    onSwipeStart,
    onSwipeEnd,
  } = config;

  const router = useRouter();
  const pathname = usePathname();
  
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    isPulling: false,
    isRefreshing: false,
    deltaX: 0,
    deltaY: 0,
    direction: null,
  });

  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const startTime = useRef<number>(0);
  const currentDeltaX = useRef<number>(0);
  const currentDeltaY = useRef<number>(0);
  const scrollTop = useRef<number>(0);
  const isFormInteraction = useRef<boolean>(false);

  // Get current tab index
  const getCurrentTabIndex = useCallback(() => {
    return tabs.findIndex(tab => pathname === tab.path);
  }, [tabs, pathname]);

  // Check if we're at the edge (first or last tab)
  const isAtEdge = useCallback((direction: 'left' | 'right') => {
    const currentIndex = getCurrentTabIndex();
    if (direction === 'left') {
      return currentIndex >= tabs.length - 1;
    }
    return currentIndex <= 0;
  }, [getCurrentTabIndex, tabs.length]);

  // Navigate to adjacent tab
  const navigateToTab = useCallback((direction: 'left' | 'right') => {
    if (!enableTabNavigation) return;
    
    const currentIndex = getCurrentTabIndex();
    let targetIndex = currentIndex;

    if (direction === 'left' && currentIndex < tabs.length - 1) {
      targetIndex = currentIndex + 1;
    } else if (direction === 'right' && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    }

    if (targetIndex !== currentIndex && tabs[targetIndex]) {
      // Haptic-style feedback simulation
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
      router.push(tabs[targetIndex].path);
    }
  }, [enableTabNavigation, getCurrentTabIndex, tabs, router]);

  // Handle pull to refresh
  const handlePullToRefresh = useCallback(async () => {
    if (!enablePullToRefresh || !onRefresh) return;

    setSwipeState(prev => ({ ...prev, isRefreshing: true }));

    try {
      await onRefresh();
      // Haptic feedback on success
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([10, 50, 10]);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setTimeout(() => {
        setSwipeState(prev => ({
          ...prev,
          isRefreshing: false,
          isPulling: false,
          deltaY: 0,
        }));
      }, 300);
    }
  }, [enablePullToRefresh, onRefresh]);

  // Check if touch started on a form element
  const checkFormInteraction = useCallback((target: EventTarget | null) => {
    if (!target || !(target instanceof Element)) return false;
    
    const formElements = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'];
    const isFormElement = formElements.includes(target.tagName);
    const isScrollable = target.scrollHeight > target.clientHeight;
    
    return isFormElement || isScrollable;
  }, []);

  // Touch start handler
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    startTime.current = Date.now();
    currentDeltaX.current = 0;
    currentDeltaY.current = 0;
    
    // Check if we're at the top of the page for pull-to-refresh
    scrollTop.current = window.scrollY || document.documentElement.scrollTop;
    
    // Check if interaction started on a form element
    isFormInteraction.current = checkFormInteraction(e.target);
    
    if (!isFormInteraction.current) {
      setSwipeState(prev => ({ ...prev, isSwiping: true }));
      onSwipeStart?.();
    }
  }, [checkFormInteraction, onSwipeStart]);

  // Touch move handler
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (isFormInteraction.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;
    
    currentDeltaX.current = deltaX;
    currentDeltaY.current = deltaY;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Determine primary direction
    if (absX > absY) {
      // Horizontal swipe for tab navigation
      const direction = deltaX > 0 ? 'right' : 'left';
      
      // Don't allow swipe if at edge
      if (!isAtEdge(direction)) {
        setSwipeState(prev => ({
          ...prev,
          deltaX,
          deltaY: 0,
          direction,
        }));
        
        // Prevent default scrolling during horizontal swipe
        if (absX > 10) {
          e.preventDefault();
        }
      }
    } else if (absY > absX && deltaY > 0 && scrollTop.current === 0) {
      // Vertical pull down for refresh (only at top of page)
      if (enablePullToRefresh) {
        const pullDistance = Math.min(deltaY, pullThreshold * 1.5);
        setSwipeState(prev => ({
          ...prev,
          isPulling: true,
          deltaY: pullDistance,
          deltaX: 0,
          direction: 'down',
        }));
        
        // Prevent default scrolling during pull
        if (deltaY > 10) {
          e.preventDefault();
        }
      }
    }
  }, [enablePullToRefresh, isAtEdge, pullThreshold]);

  // Touch end handler
  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (isFormInteraction.current) {
      isFormInteraction.current = false;
      return;
    }

    const deltaX = currentDeltaX.current;
    const deltaY = currentDeltaY.current;
    const deltaTime = Date.now() - startTime.current;
    const velocityX = Math.abs(deltaX) / deltaTime;
    const velocityY = Math.abs(deltaY) / deltaTime;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Horizontal swipe for tab navigation
    if (absX > absY && absX > swipeThreshold && velocityX > 0.3) {
      const direction = deltaX > 0 ? 'right' : 'left';
      navigateToTab(direction);
    }
    
    // Vertical pull for refresh
    else if (absY > absX && deltaY > pullThreshold && scrollTop.current === 0) {
      handlePullToRefresh();
    }

    // Reset state
    if (!swipeState.isRefreshing) {
      setSwipeState({
        isSwiping: false,
        isPulling: false,
        isRefreshing: false,
        deltaX: 0,
        deltaY: 0,
        direction: null,
      });
    }

    onSwipeEnd?.();
  }, [swipeThreshold, pullThreshold, navigateToTab, handlePullToRefresh, swipeState.isRefreshing, onSwipeEnd]);

  // Mouse handlers for desktop testing
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    startX.current = e.clientX;
    startY.current = e.clientY;
    startTime.current = Date.now();
    currentDeltaX.current = 0;
    currentDeltaY.current = 0;
    scrollTop.current = window.scrollY || document.documentElement.scrollTop;
    isFormInteraction.current = checkFormInteraction(e.target);
    
    if (!isFormInteraction.current) {
      setSwipeState(prev => ({ ...prev, isSwiping: true }));
      onSwipeStart?.();
    }
  }, [checkFormInteraction, onSwipeStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!swipeState.isSwiping || isFormInteraction.current) return;

    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;
    
    currentDeltaX.current = deltaX;
    currentDeltaY.current = deltaY;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY) {
      const direction = deltaX > 0 ? 'right' : 'left';
      if (!isAtEdge(direction)) {
        setSwipeState(prev => ({
          ...prev,
          deltaX,
          deltaY: 0,
          direction,
        }));
      }
    }
  }, [swipeState.isSwiping, isAtEdge]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isFormInteraction.current) {
      isFormInteraction.current = false;
      return;
    }

    const deltaX = currentDeltaX.current;
    const absX = Math.abs(deltaX);

    if (absX > swipeThreshold) {
      const direction = deltaX > 0 ? 'right' : 'left';
      navigateToTab(direction);
    }

    setSwipeState({
      isSwiping: false,
      isPulling: false,
      isRefreshing: false,
      deltaX: 0,
      deltaY: 0,
      direction: null,
    });

    onSwipeEnd?.();
  }, [swipeThreshold, navigateToTab, onSwipeEnd]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + Arrow keys for tab navigation
      if (e.altKey && enableTabNavigation) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          navigateToTab('right');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          navigateToTab('left');
        }
      }
      
      // Ctrl/Cmd + R for refresh
      if ((e.ctrlKey || e.metaKey) && e.key === 'r' && enablePullToRefresh) {
        e.preventDefault();
        handlePullToRefresh();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableTabNavigation, enablePullToRefresh, navigateToTab, handlePullToRefresh]);

  return {
    swipeState,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
    },
    getCurrentTabIndex,
    canSwipeLeft: !isAtEdge('left'),
    canSwipeRight: !isAtEdge('right'),
  };
};

