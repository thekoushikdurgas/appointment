/**
 * NavItem Component
 * 
 * Individual navigation item component for the sidebar
 */

"use client";

import React from "react";
import Link from "next/link";
import { Tooltip } from "@components/ui/Tooltip";

interface NavItemProps {
  icon: React.ReactElement<{ className?: string }>;
  label: string;
  path: string;
  isActive: boolean;
  isCollapsed: boolean;
  isHovering: boolean;
}

export const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  path,
  isActive,
  isCollapsed,
  isHovering,
}) => {
  const showText = !isCollapsed || isHovering;
  const linkClassName = `sidebar-nav-link icon-hover-scale${
    isActive ? " sidebar-nav-link-active nav-active-pulse" : ""
  }${isCollapsed && !isHovering ? " sidebar-nav-link-collapsed" : ""}`;
  const iconClassName = `sidebar-nav-icon${
    isActive ? " sidebar-nav-icon--active" : ""
  }`;
  const textClassName = `sidebar-nav-text${
    !showText ? " sidebar-nav-text-collapsed" : ""
  }`;

  const linkContent = (
    <Link href={path} className={linkClassName}>
      {isActive && <span className="sidebar-nav-active-indicator"></span>}
      <span className="sidebar-nav-icon-wrapper">
        {React.cloneElement(icon, { className: iconClassName })}
      </span>
      <span className={textClassName}>{label}</span>
    </Link>
  );

  return (
    <li className="sidebar-nav-item stagger-item">
      {isCollapsed && !isHovering ? (
        <Tooltip content={label} side="right" delay={200}>
          {linkContent}
        </Tooltip>
      ) : (
        linkContent
      )}
    </li>
  );
};

