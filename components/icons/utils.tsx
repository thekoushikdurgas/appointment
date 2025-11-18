/**
 * Icon Utilities
 * 
 * Shared utilities for creating icon components
 */

import React from 'react';

// Common icon props
export const iconProps = {
  strokeWidth: 1.5,
};

// Helper to create icon wrapper with className support
export const createIcon = (LucideIcon: React.ComponentType<any>, defaultClass?: string) => {
  const IconComponent: React.FC<{className?: string}> = ({ className }) => (
    <LucideIcon className={className || defaultClass} strokeWidth={iconProps.strokeWidth} />
  );
  return IconComponent;
};

