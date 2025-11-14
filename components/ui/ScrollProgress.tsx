'use client';

import React, { useState, useEffect, useCallback } from 'react';

export interface ScrollProgressProps {
  /**
   * Target element to track scroll progress. Defaults to window.
   */
  target?: HTMLElement | null;
  /**
   * Position of the progress bar
   */
  position?: 'top' | 'bottom';
  /**
   * Height of the progress bar in pixels
   */
  height?: number;
  /**
   * Color variant of the progress bar
   */
  variant?: 'primary' | 'success' | 'warning' | 'gradient';
  /**
   * Callback when scroll progress changes (0-100)
   */
  onProgressChange?: (progress: number) => void;
  /**
   * Callback when scroll threshold is reached
   */
  onThresholdReached?: (threshold: number) => void;
  /**
   * Thresholds to trigger callbacks (0-100)
   */
  thresholds?: number[];
  /**
   * Show percentage text
   */
  showPercentage?: boolean;
  /**
   * Additional className
   */
  className?: string;
}

export const ScrollProgress: React.FC<ScrollProgressProps> = ({
  target,
  position = 'top',
  height = 3,
  variant = 'primary',
  onProgressChange,
  onThresholdReached,
  thresholds = [25, 50, 75, 100],
  showPercentage = false,
  className,
}) => {
  const [progress, setProgress] = useState(0);
  const [reachedThresholds, setReachedThresholds] = useState<Set<number>>(new Set());

  const calculateProgress = useCallback(() => {
    let scrollTop: number;
    let scrollHeight: number;
    let clientHeight: number;

    if (target) {
      scrollTop = target.scrollTop;
      scrollHeight = target.scrollHeight;
      clientHeight = target.clientHeight;
    } else {
      scrollTop = window.scrollY || document.documentElement.scrollTop;
      scrollHeight = document.documentElement.scrollHeight;
      clientHeight = document.documentElement.clientHeight;
    }

    const totalHeight = scrollHeight - clientHeight;
    const scrollProgress = totalHeight > 0 ? (scrollTop / totalHeight) * 100 : 0;

    return Math.min(Math.max(scrollProgress, 0), 100);
  }, [target]);

  const handleScroll = useCallback(() => {
    const currentProgress = calculateProgress();
    setProgress(currentProgress);
    onProgressChange?.(currentProgress);

    // Check thresholds
    thresholds.forEach(threshold => {
      if (currentProgress >= threshold && !reachedThresholds.has(threshold)) {
        setReachedThresholds(prev => new Set(prev).add(threshold));
        onThresholdReached?.(threshold);
      }
    });
  }, [calculateProgress, onProgressChange, onThresholdReached, thresholds, reachedThresholds]);

  useEffect(() => {
    const scrollElement = target || window;
    
    // Initial calculation
    handleScroll();

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [target, handleScroll]);

  const variantClassMap = {
    primary: 'scroll-progress__bar--primary',
    success: 'scroll-progress__bar--success',
    warning: 'scroll-progress__bar--warning',
    gradient: 'scroll-progress__bar--gradient',
  };

  const positionClassMap = {
    top: 'scroll-progress--top',
    bottom: 'scroll-progress--bottom',
  };

  const barContainerClassName = `scroll-progress${positionClassMap[position] ? ' ' + positionClassMap[position] : ''}${className ? ' ' + className : ''}`;
  const barClassName = `scroll-progress__bar${variantClassMap[variant] ? ' ' + variantClassMap[variant] : ''}`;
  const percentageClassName = `scroll-progress__percentage glass-frosted-heavy${position === 'top' ? ' scroll-progress__percentage--top' : ' scroll-progress__percentage--bottom'}`;
  
  return (
    <>
      {/* Progress Bar */}
      <div
        className={barContainerClassName}
        style={{ height: `${height}px` }}
      >
        <div
          className={barClassName}
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      {/* Percentage Indicator */}
      {showPercentage && progress > 0 && (
        <div className={percentageClassName}>
          {Math.round(progress)}%
        </div>
      )}
    </>
  );
};

ScrollProgress.displayName = 'ScrollProgress';

/**
 * Hook to get current scroll progress
 */
export const useScrollProgress = (target?: HTMLElement | null) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateProgress = () => {
      let scrollTop: number;
      let scrollHeight: number;
      let clientHeight: number;

      if (target) {
        scrollTop = target.scrollTop;
        scrollHeight = target.scrollHeight;
        clientHeight = target.clientHeight;
      } else {
        scrollTop = window.scrollY || document.documentElement.scrollTop;
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = document.documentElement.clientHeight;
      }

      const totalHeight = scrollHeight - clientHeight;
      const scrollProgress = totalHeight > 0 ? (scrollTop / totalHeight) * 100 : 0;

      return Math.min(Math.max(scrollProgress, 0), 100);
    };

    const handleScroll = () => {
      setProgress(calculateProgress());
    };

    const scrollElement = target || window;
    
    handleScroll();

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [target]);

  return progress;
};

