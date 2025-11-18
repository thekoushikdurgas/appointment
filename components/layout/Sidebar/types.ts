/**
 * Sidebar Types
 * 
 * Type definitions for Sidebar component and related components
 */

import type React from 'react';

export interface SidebarProps {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setCollapsed: (isCollapsed: boolean) => void;
}

export interface NavItem {
  path: string;
  icon: React.ReactElement<{ className?: string }>;
  label: string;
}

export interface NavSection {
  title: string;
  icon: React.ReactElement<{ className?: string }>;
  items: NavItem[];
}

