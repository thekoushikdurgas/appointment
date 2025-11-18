/**
 * Navigation Icons
 * 
 * Icons used for navigation and routing
 */

import React from 'react';
import {
  Sparkles,
  LayoutDashboard,
  Users,
  Ticket,
  Clock,
  FileText,
  Settings,
  IdCard,
  Paintbrush,
  CreditCard,
  LogOut,
  Home,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Building2,
  Layers,
  Folder,
  Activity,
} from 'lucide-react';
import { Play } from 'lucide-react';
import { createIcon, iconProps } from './utils';

export const SparklesIcon = createIcon(Sparkles);
export const DashboardIcon = createIcon(LayoutDashboard);
export const ContactsIcon = createIcon(Users);
export const UsersIcon = createIcon(Users);
export const PlansIcon = createIcon(Ticket);
export const HistoryIcon = createIcon(Clock);
export const OrdersIcon = createIcon(FileText);
export const SettingsIcon = createIcon(Settings);
export const IdentificationIcon = createIcon(IdCard);
export const PaintBrushIcon = createIcon(Paintbrush);
export const CreditCardIcon = createIcon(CreditCard);
export const LogoutIcon = createIcon(LogOut);

// Custom Logo Icon (keeping original SVG as it's custom branding)
export const LogoIcon: React.FC<{className?: string}> = ({ className }) => {
  return React.createElement(Play, {
    className: className || "w-8 h-8",
    fill: "currentColor",
    strokeWidth: 0,
  });
};

export const HomeIcon = createIcon(Home);
export const ArrowLeftIcon = createIcon(ArrowLeft);
export const ArrowUpIcon = createIcon(ArrowUp);
export const ArrowDownIcon = createIcon(ArrowDown);
export const BuildingIcon = createIcon(Building2);
export const LayersIcon = createIcon(Layers);
export const FolderIcon = createIcon(Folder);
export const ActivityIcon = createIcon(Activity);

