/**
 * NavSection Component
 * 
 * Navigation section component that groups related nav items
 */

"use client";

import React from "react";
import type { NavItem as NavItemType } from "./types";
import { NavItem } from "./NavItem";

interface NavSectionProps {
  title: string;
  icon: React.ReactElement<{ className?: string }>;
  items: NavItemType[];
  isActive: (path: string) => boolean;
  isCollapsed: boolean;
  isHovering: boolean;
}

export const NavSection: React.FC<NavSectionProps> = ({
  title,
  icon,
  items,
  isActive,
  isCollapsed,
  isHovering,
}) => {
  const showText = !isCollapsed || isHovering;
  return (
    <div className="nav-section">
      <div className="nav-section-divider">
        <div className="nav-section-divider-line"></div>
      </div>
      {/* {showText && (
        <div className="nav-section-header">
          <span className="nav-section-header-icon">
            {React.cloneElement(icon, { className: "nav-section-icon" })}
          </span>
          <span>{title}</span>
        </div>
      )} */}

      <ul className="sidebar-nav-list">
        {items.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            isActive={isActive(item.path)}
            isCollapsed={isCollapsed}
            isHovering={isHovering}
          />
        ))}
      </ul>
    </div>
  );
};

