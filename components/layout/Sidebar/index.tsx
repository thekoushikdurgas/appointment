/**
 * Sidebar Component
 * 
 * Main sidebar component with navigation, search, and user menu
 */

"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  DashboardIcon,
  ContactsIcon,
  SearchIcon,
  SettingsIcon,
  GridIcon,
  LayersIcon,
  FolderIcon,
  StatusOnlineIcon,
  BuildingIcon,
  GlobeAltIcon,
  HistoryIcon,
  OrdersIcon,
  SparklesIcon,
} from "@components/icons";
import { useAuth } from "@hooks/useAuth";
import { useTheme } from "@hooks/useTheme";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@components/ui/Input";
import type { SidebarProps, NavSection } from "./types";
import { NavSection as NavSectionComponent } from "./NavSection";
import { UserMenu } from "./UserMenu";

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  setOpen,
  isCollapsed,
  setCollapsed,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClickExpanded, setIsClickExpanded] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const pathname = usePathname();
  const router = useRouter();
  const touchStartX = React.useRef<number>(0);
  const touchCurrentX = React.useRef<number>(0);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const sidebarRef = React.useRef<HTMLElement>(null);
  const userAvatarRef = React.useRef<HTMLDivElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);

  const navSections: NavSection[] = [
    {
      title: "Main",
      icon: <GridIcon />,
      items: [
        { path: "/dashboard", icon: <DashboardIcon />, label: "Dashboard" },
        {
          path: "/ai-assistant",
          icon: <SparklesIcon />,
          label: "AI Assistant",
        },
      ],
    },
    {
      title: "Management",
      icon: <LayersIcon />,
      items: [
        { path: "/contacts", icon: <ContactsIcon />, label: "Contacts" },
        { path: "/companies", icon: <BuildingIcon />, label: "Companies" },
        { path: "/apollo", icon: <GlobeAltIcon />, label: "Apollo Tools" },
        { path: "/apollo-websocket", icon: <StatusOnlineIcon />, label: "Apollo WebSocket" },
        { path: "/orders", icon: <OrdersIcon />, label: "Orders" },
        { path: "/history", icon: <HistoryIcon />, label: "History" },
      ],
    },
    {
      title: "Settings",
      icon: <FolderIcon />,
      items: [{ path: "/settings", icon: <SettingsIcon />, label: "Settings" }],
    },
  ];

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const isActive = (path: string) => {
    if (path === "/settings") {
      return pathname.startsWith("/settings");
    }
    return pathname === path;
  };

  // Determine if sidebar should show as expanded
  const isTemporarilyExpanded = isHovering || isClickExpanded;

  // Calculate popup position to keep it within viewport
  const calculatePopupPosition = React.useCallback(() => {
    if (!userAvatarRef.current || !popupRef.current) return;

    const avatarRect = userAvatarRef.current.getBoundingClientRect();
    const popupRect = popupRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const popupWidth = isCollapsed && !isTemporarilyExpanded ? 224 : 256; // w-56 : w-64
    const popupHeight = popupRect.height || 250; // Estimated height
    const gap = 8; // mb-2

    let top = 0;
    let left = 0;

    // Calculate top position (above the avatar)
    top = avatarRect.top - popupHeight - gap;

    // If popup would overflow top, show below instead
    if (top < gap) {
      top = avatarRect.bottom + gap;
    }

    // Calculate left position
    if (isCollapsed && !isTemporarilyExpanded) {
      // When collapsed, center popup relative to sidebar
      left = avatarRect.left + avatarRect.width / 2 - popupWidth / 2;
    } else {
      // When expanded, align with sidebar
      left = avatarRect.left;
    }

    // Ensure popup doesn't overflow right edge
    if (left + popupWidth > viewportWidth - gap) {
      left = viewportWidth - popupWidth - gap;
    }

    // Ensure popup doesn't overflow left edge
    if (left < gap) {
      left = gap;
    }

    // Add scroll offset
    top += window.scrollY;
    left += window.scrollX;

    setPopupStyle({
      position: "absolute",
      top: `${top}px`,
      left: `${left}px`,
      width: `${popupWidth}px`,
    });
  }, [isCollapsed, isTemporarilyExpanded]);

  // Update popup position when it opens or when sidebar state changes
  React.useEffect(() => {
    if (userMenuOpen) {
      calculatePopupPosition();

      window.addEventListener("resize", calculatePopupPosition);
      window.addEventListener("scroll", calculatePopupPosition, true);

      return () => {
        window.removeEventListener("resize", calculatePopupPosition);
        window.removeEventListener("scroll", calculatePopupPosition, true);
      };
    }
  }, [userMenuOpen, calculatePopupPosition]);

  // Click handler for sidebar expansion (desktop only, when collapsed)
  const handleSidebarClick = (e: React.MouseEvent) => {
    // Only on desktop and when collapsed
    if (window.innerWidth >= 1024 && isCollapsed && !isClickExpanded) {
      setIsClickExpanded(true);
    }
  };

  // Hover handlers for desktop expansion (only when collapsed)
  const handleMouseEnter = () => {
    // Only enable hover expansion on desktop and when collapsed
    if (window.innerWidth >= 1024 && isCollapsed) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovering(true);
      }, 200); // Small delay before expanding
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovering(false);
    }, 300); // Small delay before collapsing back
  };

  // Click-outside detection to collapse sidebar and close menu
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close user menu if clicking outside
      if (
        userMenuOpen &&
        popupRef.current &&
        userAvatarRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !userAvatarRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }

      // Collapse sidebar if clicking outside
      if (
        isClickExpanded &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsClickExpanded(false);
      }
    };

    if (isClickExpanded || userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isClickExpanded, userMenuOpen]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;

    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;

    // Only allow swipe left when sidebar is open
    if (isOpen && diff < 0) {
      setSwipeOffset(Math.max(diff, -256)); // 256px = 16rem sidebar width
    }
    // Allow swipe right from edge of screen when closed
    else if (!isOpen && touchStartX.current < 20 && diff > 0) {
      setSwipeOffset(Math.min(diff, 256));
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;

    const diff = touchCurrentX.current - touchStartX.current;
    const threshold = 80; // Swipe threshold

    // Swipe left to close
    if (isOpen && diff < -threshold) {
      setOpen(false);
    }
    // Swipe right to open
    else if (!isOpen && diff > threshold) {
      setOpen(true);
    }

    setSwipeOffset(0);
    setIsSwiping(false);
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay${
          isOpen ? " sidebar-overlay-visible" : " sidebar-overlay-hidden"
        }`}
        onClick={() => setOpen(false)}
      ></div>

      <aside
        ref={sidebarRef}
        className={`sidebar${isOpen ? " sidebar-open" : ""}${
          isCollapsed ? " sidebar-collapsed" : ""
        }${
          isCollapsed && isTemporarilyExpanded ? " sidebar-hover-expanded" : ""
        }`}
        onClick={handleSidebarClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={
          {
            "--sidebar-transform": isSwiping
              ? `translateX(${swipeOffset}px)`
              : undefined,
          } as React.CSSProperties
        }
      >
        {/* <div className={`flex items-center h-16 sm:h-20 px-4 border-b border-border flex-shrink-0 gap-3 ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
            <LogoIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0"/>
          </div>
          <h1 className={`text-xl sm:text-2xl font-bold text-foreground whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'md:opacity-0 md:w-0 md:invisible' : 'opacity-100'}`}>
            NexusCRM
          </h1>
        </div> */}

        <div
          className={`sidebar-search${
            isCollapsed && !isTemporarilyExpanded
              ? " sidebar-search-collapsed"
              : ""
          }`}
        >
          <Input
            type="text"
            placeholder="Search..."
            leftIcon={<SearchIcon />}
            className={
              isCollapsed && !isTemporarilyExpanded
                ? "sidebar-search-input-collapsed"
                : ""
            }
          />
        </div>

        <nav
          className={`sidebar-nav${
            isCollapsed && !isTemporarilyExpanded
              ? " sidebar-nav-collapsed"
              : ""
          }`}
        >
          {navSections.map((section, index) => (
            <NavSectionComponent
              key={section.title}
              title={section.title}
              icon={section.icon}
              items={section.items}
              isActive={isActive}
              isCollapsed={isCollapsed}
              isHovering={isTemporarilyExpanded}
            />
          ))}
        </nav>

        <div
          className={`sidebar-footer${
            isCollapsed && !isTemporarilyExpanded
              ? " sidebar-footer-collapsed"
              : ""
          }`}
        >
          <div
            ref={userAvatarRef}
            className={`sidebar-user${
              isCollapsed && !isTemporarilyExpanded
                ? " sidebar-user-collapsed"
                : ""
            }`}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="sidebar-user-avatar">
              <Image
                src={
                  user?.avatarUrl || "https://picsum.photos/seed/user1/40/40"
                }
                alt="User avatar"
                className="sidebar-user-avatar-img"
                width={40}
                height={40}
              />
              <span className="sidebar-user-status animate-badge-pulse"></span>
            </div>
            <div
              className={`sidebar-user-info${
                isCollapsed && !isTemporarilyExpanded
                  ? " sidebar-user-info-collapsed"
                  : ""
              }`}
            >
              <p className="sidebar-user-name">{user?.name || "User"}</p>
              <p className="sidebar-user-email">{user?.email || ""}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* User Menu Popup */}
      <UserMenu
        isOpen={userMenuOpen}
        user={user}
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={handleLogout}
        onClose={() => setUserMenuOpen(false)}
        popupStyle={popupStyle}
        popupRef={popupRef}
      />
    </>
  );
};

export default Sidebar;

