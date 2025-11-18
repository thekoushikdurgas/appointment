/**
 * UI Icons
 * 
 * Icons used for UI elements, controls, and interactions
 */

import React from 'react';
import {
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
  Edit,
  Trash2,
  Save,
  XCircle,
  RefreshCw,
  Download,
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
  Pin,
  Maximize,
  Minimize,
  ArrowUpDown,
  Share2,
  Bookmark,
  Archive,
  Copy,
  RotateCcw,
  Paperclip,
  Smile,
  Mic,
  FileDown,
  Eraser,
  Zap,
  Rocket,
  CheckCircle,
  Users,
  Globe,
  Clock,
  Settings,
} from 'lucide-react';
import { createIcon } from './utils';

// UI Control Icons
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

// Action Icons
export const EditIcon = createIcon(Edit);
export const DeleteIcon = createIcon(Trash2);
export const SaveIcon = createIcon(Save);
export const CancelIcon = createIcon(XCircle);
export const RefreshIcon = createIcon(RefreshCw);
export const DownloadIcon = createIcon(Download);

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

// UI State Icons
export const EyeIcon = createIcon(Eye);
export const EyeOffIcon = createIcon(EyeOff);
export const LockIcon = createIcon(Lock);
export const UnlockIcon = createIcon(Unlock);
export const StarIcon = createIcon(Star);
export const HeartIcon = createIcon(Heart);

// Business Icons
export const BriefcaseIcon = createIcon(Briefcase);
export const DollarIcon = createIcon(DollarSign);
export const TrendingUpIcon = createIcon(TrendingUp);
export const TrendingDownIcon = createIcon(TrendingDown);
export const MapPinIcon = createIcon(MapPin);

// Additional Utility Icons
export const PinIcon = createIcon(Pin);
export const CustomizeIcon = createIcon(Settings);
export const MaximizeIcon = createIcon(Maximize);
export const MinimizeIcon = createIcon(Minimize);
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

// Decorative Icons
export const ZapIcon = createIcon(Zap, "w-5 h-5");
export const RocketIcon = createIcon(Rocket, "w-5 h-5");
export const GlobeIcon = createIcon(Globe, "w-5 h-5");

// Additional missing icon aliases
export const ChartBarIcon = ChartIcon;
export const CurrencyDollarIcon = DollarIcon;
export const UserIcon = createIcon(Users);
export const ExclamationTriangleIcon = AlertTriangleIcon;

