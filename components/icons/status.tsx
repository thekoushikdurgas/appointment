/**
 * Status Icons
 * 
 * Icons for status indicators, alerts, and notifications
 */

import React from 'react';
import {
  Check,
  X,
  Info,
  CheckCircle,
  XCircle,
  Circle,
  Bell,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Star,
} from 'lucide-react';
import { createIcon, iconProps } from './utils';

// Status Icons
export const CheckIcon = createIcon(Check);
export const XIcon = createIcon(X);
export const InfoIcon = createIcon(Info);
export const SuccessIcon = createIcon(CheckCircle);
export const ErrorIcon = createIcon(XCircle);

// Status Indicators
export const NotificationBellIcon: React.FC<{className?: string; hasBadge?: boolean}> = ({ className, hasBadge = false }) => (
  <div className="relative inline-block">
    <Bell className={className} strokeWidth={iconProps.strokeWidth} />
    {hasBadge && (
      <span className="icon-badge" />
    )}
  </div>
);

export const StatusOnlineIcon: React.FC<{className?: string}> = ({ className }) => (
  <Circle className={className} fill="currentColor" strokeWidth={0} />
);

export const StatusBusyIcon: React.FC<{className?: string}> = ({ className }) => (
  <Circle className={className} fill="currentColor" strokeWidth={0} />
);

export const StatusAwayIcon: React.FC<{className?: string}> = ({ className }) => (
  <Circle className={className} fill="currentColor" strokeWidth={0} />
);

// Alert/Notification Icons (for Toast, Forms, etc.)
export const CheckCircle2Icon = createIcon(CheckCircle2, "w-5 h-5");
export const AlertCircleIcon = createIcon(AlertCircle, "w-5 h-5");
export const InfoCircleIcon = createIcon(Info, "w-5 h-5");
export const XCircleIcon = createIcon(XCircle, "w-5 h-5");
export const WarningIcon = createIcon(AlertTriangle, "w-5 h-5");

// Small variants for form error/helper text
export const ErrorIconSmall = createIcon(XCircle, "w-4 h-4");
export const InfoIconSmall = createIcon(Info, "w-4 h-4");

// Star variants
export const StarFilledIcon: React.FC<{className?: string; [key: string]: any}> = ({ className = "w-5 h-5", ...props }) => (
  <Star className={className} fill="currentColor" strokeWidth={iconProps.strokeWidth} {...props} />
);

