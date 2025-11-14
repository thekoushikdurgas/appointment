import React from 'react';
import {
  X,
  Globe,
  Building2,
  Tag,
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
  Search,
  Bell,
  Menu,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Upload,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Plus,
  Filter,
  MessageCircle,
  Home,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  Save,
  XCircle,
  RefreshCw,
  Download,
  Check,
  Info,
  CheckCircle,
  Table,
  List,
  Grid3x3,
  BarChart3,
  Calendar,
  Mail,
  Phone,
  MessageSquare,
  Send,
  Reply,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Star,
  Heart,
  Briefcase,
  DollarSign,
  TrendingUp,
  TrendingDown,
  MapPin,
  Layers,
  Folder,
  Activity,
  Pin,
  Maximize,
  Minimize,
  ArrowUpDown,
  Share2,
  Bookmark,
  Archive,
  Play,
  Circle,
  Linkedin,
  Facebook,
  Twitter,
  Copy,
  RotateCcw,
  Paperclip,
  Smile,
  Mic,
  FileDown,
  Eraser,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Zap,
  Rocket,
} from 'lucide-react';
import { FaGoogle, FaGithub, FaApple } from 'react-icons/fa';

// Common icon props
const iconProps = {
  strokeWidth: 1.5,
};

// Helper to create icon wrapper with className support
const createIcon = (LucideIcon: React.ComponentType<any>, defaultClass?: string) => {
  const IconComponent: React.FC<{className?: string}> = ({ className }) => (
    <LucideIcon className={className || defaultClass} strokeWidth={iconProps.strokeWidth} />
  );
  return IconComponent;
};

// Basic Icons
export const XMarkIcon = createIcon(X);
export const GlobeAltIcon = createIcon(Globe);
export const OfficeBuildingIcon = createIcon(Building2);
export const TagIcon = createIcon(Tag);

// Social Media Icons (using lucide-react social icons)
export const LinkedInIcon: React.FC<{className?: string}> = ({ className }) => (
  <Linkedin className={className} fill="currentColor" strokeWidth={0} />
);

export const FacebookIcon: React.FC<{className?: string}> = ({ className }) => (
  <Facebook className={className} fill="currentColor" strokeWidth={0} />
);

export const TwitterIcon: React.FC<{className?: string}> = ({ className }) => (
  <Twitter className={className} fill="currentColor" strokeWidth={0} />
);

// Navigation Icons
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
export const LogoIcon: React.FC<{className?: string}> = ({ className }) => (
  <Play className={className || "w-8 h-8"} fill="currentColor" strokeWidth={0} />
);

// UI Icons
export const SearchIcon = createIcon(Search, "w-5 h-5");
export const BellIcon = createIcon(Bell, "w-6 h-6");
export const MenuIcon = createIcon(Menu);
export const ChevronUpIcon = createIcon(ChevronUp, "w-5 h-5");
export const ChevronDownIcon = createIcon(ChevronDown, "w-5 h-5");
export const ChevronUpDownIcon = createIcon(ChevronsUpDown, "w-5 h-5");
export const ChevronLeftIcon = createIcon(ChevronLeft, "w-5 h-5");
export const ChevronRightIcon = createIcon(ChevronRight, "w-5 h-5");
export const SunIcon = createIcon(Sun, "w-6 h-6");
export const MoonIcon = createIcon(Moon, "w-6 h-6");
export const UploadIcon = createIcon(Upload);
export const ShieldCheckIcon = createIcon(ShieldCheck);
export const AlertTriangleIcon = createIcon(AlertTriangle);
export const ArrowRightIcon = createIcon(ArrowRight);
export const PlusIcon = createIcon(Plus);
export const FilterIcon = createIcon(Filter);
export const ChatBubbleIcon = createIcon(MessageCircle);

// Navigation Icons
export const HomeIcon = createIcon(Home);
export const ArrowLeftIcon = createIcon(ArrowLeft);
export const ArrowUpIcon = createIcon(ArrowUp);
export const ArrowDownIcon = createIcon(ArrowDown);

// Action Icons
export const EditIcon = createIcon(Edit);
export const DeleteIcon = createIcon(Trash2);
export const SaveIcon = createIcon(Save);
export const CancelIcon = createIcon(XCircle);
export const RefreshIcon = createIcon(RefreshCw);
export const DownloadIcon = createIcon(Download);

// Status Icons
export const CheckIcon = createIcon(Check);
export const XIcon = createIcon(X);
export const InfoIcon = createIcon(Info);
export const SuccessIcon = createIcon(CheckCircle);
export const ErrorIcon = createIcon(XCircle);

// Data Icons
export const TableIcon = createIcon(Table);
export const ListIcon = createIcon(List);
export const GridIcon = createIcon(Grid3x3);
export const ChartIcon = createIcon(BarChart3);
export const CalendarIcon = createIcon(Calendar);
export const ClockIcon = createIcon(Clock);

// Communication Icons
export const MailIcon = createIcon(Mail);
export const PhoneIcon = createIcon(Phone);
export const MessageIcon = createIcon(MessageSquare);
export const SendIcon = createIcon(Send);
export const ReplyIcon = createIcon(Reply);

// UI Icons
export const EyeIcon = createIcon(Eye);
export const EyeOffIcon = createIcon(EyeOff);
export const LockIcon = createIcon(Lock);
export const UnlockIcon = createIcon(Unlock);
export const StarIcon = createIcon(Star);
export const HeartIcon = createIcon(Heart);

// Business Icons
export const BuildingIcon = createIcon(Building2);
export const BriefcaseIcon = createIcon(Briefcase);
export const DollarIcon = createIcon(DollarSign);
export const TrendingUpIcon = createIcon(TrendingUp);
export const TrendingDownIcon = createIcon(TrendingDown);
export const MapPinIcon = createIcon(MapPin);

// Category Icons for Nav Grouping
export const LayersIcon = createIcon(Layers);
export const FolderIcon = createIcon(Folder);
export const ActivityIcon = createIcon(Activity);

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

// Action Icons
export const PinIcon = createIcon(Pin);
export const CustomizeIcon = createIcon(Settings);
export const MaximizeIcon = createIcon(Maximize);
export const MinimizeIcon = createIcon(Minimize);

// Additional Utility Icons
export const SortIcon = createIcon(ArrowUpDown);
export const ShareIcon = createIcon(Share2);
export const BookmarkIcon = createIcon(Bookmark);
export const ArchiveIcon = createIcon(Archive);
export const TrashIcon = createIcon(Trash2);
export const CheckCircleIcon = createIcon(CheckCircle);

// AI Chat Page Icons
export const CopyIcon = createIcon(Copy, "w-4 h-4");
export const RegenerateIcon = createIcon(RotateCcw, "w-4 h-4");
export const AttachIcon = createIcon(Paperclip, "w-5 h-5");
export const EmojiIcon = createIcon(Smile, "w-5 h-5");
export const MicrophoneIcon = createIcon(Mic, "w-5 h-5");
export const ExportIcon = createIcon(FileDown, "w-5 h-5");
export const ClearIcon = createIcon(Eraser, "w-5 h-5");

// Icon props type
interface IconProps {
  className?: string;
  [key: string]: any;
}

// Social Login Icons
export const GoogleIcon: React.FC<IconProps> = ({ className = "w-5 h-5", ...props }) => (
  <FaGoogle className={className} {...props} />
);

export const GithubIcon: React.FC<IconProps> = ({ className = "w-5 h-5", ...props }) => (
  <FaGithub className={className} {...props} />
);

export const AppleIcon: React.FC<IconProps> = ({ className = "w-5 h-5", ...props }) => (
  <FaApple className={className} {...props} />
);

// Decorative Icons
export const ZapIcon = createIcon(Zap, "w-5 h-5");

export const StarFilledIcon: React.FC<IconProps> = ({ className = "w-5 h-5", ...props }) => (
  <Star className={className} fill="currentColor" strokeWidth={iconProps.strokeWidth} {...props} />
);

export const RocketIcon = createIcon(Rocket, "w-5 h-5");

export const GlobeIcon = createIcon(Globe, "w-5 h-5");

// Additional missing icon aliases
export const ChartBarIcon = ChartIcon;
export const CurrencyDollarIcon = DollarIcon;
export const UserIcon = createIcon(Users);
export const ExclamationTriangleIcon = AlertTriangleIcon;

// ============================================================================
// ALERT/NOTIFICATION ICONS
// ============================================================================

// Alert/Notification Icons (for Toast, Forms, etc.)
export const CheckCircle2Icon = createIcon(CheckCircle2, "w-5 h-5");
export const AlertCircleIcon = createIcon(AlertCircle, "w-5 h-5");
export const InfoCircleIcon = createIcon(Info, "w-5 h-5");
export const XCircleIcon = createIcon(XCircle, "w-5 h-5");
export const WarningIcon = createIcon(AlertTriangle, "w-5 h-5");

// Small variants for form error/helper text
export const ErrorIconSmall = createIcon(XCircle, "w-4 h-4");
export const InfoIconSmall = createIcon(Info, "w-4 h-4");

// ============================================================================
// REUSABLE ICON COMPONENTS
// ============================================================================

/**
 * LoadingSpinner - Animated loading indicator
 * Replaces inline SVG spinners throughout the app
 */
export const LoadingSpinner: React.FC<{
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ className, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
  };
  
  return (
    <Loader2 
      className={className || `${sizeClasses[size]} animate-spin`}
      strokeWidth={2}
    />
  );
};

/**
 * TrendIndicator - Reusable trend arrow with direction
 * Replaces trend SVGs in StatCard and other components
 */
export const TrendIndicator: React.FC<{
  direction: 'up' | 'down';
  className?: string;
  size?: string;
}> = ({ direction, className, size = 'w-4 h-4' }) => {
  const Icon = direction === 'up' ? TrendingUp : TrendingDown;
  return (
    <Icon 
      className={className || `${size} ${direction === 'up' ? 'text-success' : 'text-destructive'}`}
      strokeWidth={2}
    />
  );
};

/**
 * SortIndicator - Reusable sort icon with state
 * Replaces sort SVGs in DataTable and other sortable components
 */
export const SortIndicator: React.FC<{
  direction?: 'asc' | 'desc' | 'none';
  className?: string;
}> = ({ direction = 'none', className }) => {
  if (direction === 'none') {
    return (
      <ChevronsUpDown 
        className={className || 'w-4 h-4 opacity-30'}
        strokeWidth={2}
      />
    );
  }
  
  const Icon = direction === 'asc' ? ChevronUp : ChevronDown;
  return (
    <Icon 
      className={className || 'w-4 h-4'}
      strokeWidth={2}
    />
  );
};

/**
 * CloseButton - Reusable close/dismiss icon
 * Replaces close button SVGs in modals, toasts, etc.
 */
export const CloseButtonIcon: React.FC<{
  className?: string;
}> = ({ className }) => (
  <X 
    className={className || 'w-5 h-5'}
    strokeWidth={2}
  />
);

/**
 * Toast notification icons with consistent styling
 */
export const ToastIcons = {
  success: CheckCircle2Icon,
  warning: WarningIcon,
  error: XCircleIcon,
  info: InfoCircleIcon,
};