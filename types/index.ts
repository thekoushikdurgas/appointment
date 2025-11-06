
export type View = 'Dashboard' | 'Contacts' | 'Plans' | 'Settings' | 'History' | 'Orders' | 'AI Assistant';
export type AuthView = 'welcome' | 'login' | 'register';
export type SettingsTab = 'Profile' | 'Appearance' | 'Billing' | 'Team' | 'Security' | 'Notifications';

export interface Contact {
  id: number;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: 'Lead' | 'Customer' | 'Archived';
  avatarUrl: string;
  title?: string;
  industry?: string;
  companySize?: string;
  companyAddress?: string;
  website?: string;
  employeesCount?: number;
  annualRevenue?: number;
  totalFunding?: number;
  latestFundingAmount?: number;
  seniority?: string;
  departments?: string;
  keywords?: string;
  technologies?: string;
  emailStatus?: string;
  stage?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  companyCity?: string;
  companyState?: string;
  companyCountry?: string;
  companyPhone?: string;
  companyNameForEmails?: string;
  personLinkedinUrl?: string;
  companyLinkedinUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  notes?: string;
  tags?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Member';
  lastLogin: string;
  avatarUrl: string;
  isActive: boolean;
  jobTitle?: string;
  bio?: string;
  timezone?: string;
  notifications?: {
      weeklyReports: boolean;
      newLeadAlerts: boolean;
  };
}

export interface Plan {
  name: string;
  price: string;
  features: string[];
  isCurrent: boolean;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface ExportHistory {
  id: number;
  fileName: string;
  exportDate: string;
  records: number;
  status: 'Completed' | 'Processing' | 'Failed';
  downloadUrl: string;
}

export interface Order {
  id: string;
  customerName: string;
  productName: string;
  orderDate: string;
  amount: number;
  status: 'Completed' | 'Processing' | 'Cancelled';
}


