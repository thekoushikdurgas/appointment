/**
 * UserMenu Component
 * 
 * User menu popup component displayed when clicking on user avatar
 */

"use client";

import React from "react";
import ReactDOM from "react-dom";
import Link from "next/link";
import {
  MoonIcon,
  SunIcon,
  LogoutIcon,
  IdentificationIcon,
  StatusOnlineIcon,
} from "@components/icons";

interface UserMenuProps {
  isOpen: boolean;
  user: { name?: string; email?: string } | null;
  theme: string;
  toggleTheme: () => void;
  onLogout: () => void;
  onClose: () => void;
  popupStyle: React.CSSProperties;
  popupRef: React.RefObject<HTMLDivElement | null>;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  isOpen,
  user,
  theme,
  toggleTheme,
  onLogout,
  onClose,
  popupStyle,
  popupRef,
}) => {
  if (!isOpen || typeof window === "undefined") {
    return null;
  }

  return ReactDOM.createPortal(
    <div ref={popupRef} className="user-menu-popup" style={popupStyle}>
      {/* Status section */}
      <div className="user-menu-section">
        <p className="user-menu-section-title">Status</p>
        <div className="user-menu-status">
          <StatusOnlineIcon className="user-menu-status-icon" />
          <span className="user-menu-status-text">Online</span>
        </div>
      </div>
      <hr className="user-menu-divider" />
      <Link
        href="/settings/profile"
        className="user-menu-item icon-hover-scale"
        onClick={onClose}
      >
        <IdentificationIcon className="user-menu-item-icon" /> Profile
      </Link>
      <button
        onClick={() => {
          toggleTheme();
          onClose();
        }}
        className="user-menu-item icon-hover-scale"
      >
        {theme === "dark" ? (
          <SunIcon className="user-menu-item-icon" />
        ) : (
          <MoonIcon className="user-menu-item-icon" />
        )}
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </button>
      <hr className="user-menu-divider" />
      <button
        onClick={() => {
          onLogout();
          onClose();
        }}
        className="user-menu-item user-menu-item--destructive icon-hover-scale"
      >
        <LogoutIcon className="user-menu-item-icon" /> Sign Out
      </button>
    </div>,
    document.body
  );
};

