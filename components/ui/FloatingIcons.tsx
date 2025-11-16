'use client';

import React from 'react';
import { SparklesIcon, ZapIcon, HeartIcon, StarFilledIcon, RocketIcon, LayersIcon } from '@components/icons/IconComponents';

interface FloatingIcon {
  Icon: React.ComponentType<{ className?: string }>;
  size: string;
  top: string;
  left: string;
  animationDelay: string;
  animationDuration: string;
  opacity: string;
}

export interface FloatingIconsProps {
  className?: string;
  iconCount?: number;
  variant?: 'default' | 'colorful' | 'subtle';
}

export const FloatingIcons: React.FC<FloatingIconsProps> = ({
  className,
  iconCount = 8,
  variant = 'default',
}) => {
  const iconComponents = [SparklesIcon, ZapIcon, HeartIcon, StarFilledIcon, RocketIcon, LayersIcon];
  
  const generateFloatingIcons = (): FloatingIcon[] => {
    const icons: FloatingIcon[] = [];
    for (let i = 0; i < iconCount; i++) {
      icons.push({
        Icon: iconComponents[i % iconComponents.length],
        size: `${24 + Math.random() * 32}px`,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${6 + Math.random() * 4}s`,
        opacity: variant === 'subtle' ? '0.05' : variant === 'colorful' ? '0.15' : '0.1',
      });
    }
    return icons;
  };

  const floatingIcons = React.useMemo(() => generateFloatingIcons(), [iconCount, variant]);

  const getColorClass = (index: number) => {
    if (variant === 'colorful') {
      const colorClasses = [
        'floating-icons__icon--colorful-primary',
        'floating-icons__icon--colorful-purple',
        'floating-icons__icon--colorful-pink',
        'floating-icons__icon--colorful-yellow',
        'floating-icons__icon--colorful-green',
        'floating-icons__icon--colorful-blue',
      ];
      return colorClasses[index % colorClasses.length];
    }
    return 'floating-icons__icon--muted';
  };

  const containerClassName = `floating-icons${className ? ' ' + className : ''}`;
  
  return (
    <div className={containerClassName}>
      {floatingIcons.map((item, index) => {
        const { Icon, size, top, left, animationDelay, animationDuration, opacity } = item;
        const iconClassName = `floating-icons__icon float-gentle${getColorClass(index) ? ' ' + getColorClass(index) : ''}`;
        return (
          <div
            key={index}
            className={iconClassName}
            style={{
              width: size,
              height: size,
              top,
              left,
              animationDelay,
              animationDuration,
              opacity,
            }}
          >
            <Icon />
          </div>
        );
      })}
    </div>
  );
};

FloatingIcons.displayName = 'FloatingIcons';

