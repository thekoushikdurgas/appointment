// import { authenticatedFetch } from './api'; // TODO: Implement authenticatedFetch
import { Contact } from '../types';

// Temporary stub for authenticatedFetch until it's properly implemented
const authenticatedFetch = async (url: string): Promise<any> => {
  console.warn('authenticatedFetch is not implemented, returning mock data');
  return { count: 0, values: [], results: [] };
};

export interface AnalyticsStats {
  totalContacts: number;
  newContactsThisMonth: number;
  activeCustomers: number;
  revenueThisMonth: number;
  growthRate: number;
}

export interface ContactsByStatus {
  status: string;
  count: number;
  percentage: number;
}

export interface ContactsByIndustry {
  industry: string;
  count: number;
}

export interface ContactGrowthData {
  date: string;
  count: number;
}

export interface TopCompany {
  name: string;
  employeeCount: number;
  contactCount: number;
}

// In-memory cache for analytics data
const analyticsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data if available and not expired
 */
function getCachedData<T>(key: string): T | null {
  const cached = analyticsCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

/**
 * Set data in cache
 */
function setCachedData(key: string, data: any): void {
  analyticsCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch overall analytics statistics
 */
export async function fetchAnalyticsStats(): Promise<AnalyticsStats> {
  const cacheKey = 'analytics-stats';
  const cached = getCachedData<AnalyticsStats>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch total contacts
    const totalResponse = await authenticatedFetch('/api/v1/contacts/count/');
    const totalContacts = totalResponse.count || 0;

    // Calculate date for this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayISO = firstDayOfMonth.toISOString().split('T')[0];

    // Fetch new contacts this month
    const monthResponse = await authenticatedFetch(
      `/api/v1/contacts/count/?created_at__gte=${firstDayISO}`
    );
    const newContactsThisMonth = monthResponse.count || 0;

    // Calculate growth rate (mock calculation)
    const growthRate = totalContacts > 0 ? (newContactsThisMonth / totalContacts) * 100 : 0;

    // Mock data for other stats (would come from actual API endpoints)
    const stats: AnalyticsStats = {
      totalContacts,
      newContactsThisMonth,
      activeCustomers: Math.floor(totalContacts * 0.7), // Mock: 70% active
      revenueThisMonth: newContactsThisMonth * 1500, // Mock: $1500 per contact
      growthRate: parseFloat(growthRate.toFixed(2)),
    };

    setCachedData(cacheKey, stats);
    return stats;
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    // Return default values on error
    return {
      totalContacts: 0,
      newContactsThisMonth: 0,
      activeCustomers: 0,
      revenueThisMonth: 0,
      growthRate: 0,
    };
  }
}

/**
 * Fetch contacts grouped by status
 */
export async function fetchContactsByStatus(): Promise<ContactsByStatus[]> {
  const cacheKey = 'contacts-by-status';
  const cached = getCachedData<ContactsByStatus[]>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch distinct statuses
    const statusResponse = await authenticatedFetch('/api/v1/contacts/fields/status/distinct/');
    const statuses = statusResponse.values || [];

    const totalResponse = await authenticatedFetch('/api/v1/contacts/count/');
    const total = totalResponse.count || 1;

    // Fetch count for each status
    const statusData = await Promise.all(
      statuses.map(async (status: string) => {
        const countResponse = await authenticatedFetch(
          `/api/v1/contacts/count/?status=${encodeURIComponent(status)}`
        );
        const count = countResponse.count || 0;
        return {
          status,
          count,
          percentage: parseFloat(((count / total) * 100).toFixed(2)),
        };
      })
    );

    setCachedData(cacheKey, statusData);
    return statusData;
  } catch (error) {
    console.error('Error fetching contacts by status:', error);
    return [];
  }
}

/**
 * Fetch contacts grouped by industry
 */
export async function fetchContactsByIndustry(limit: number = 10): Promise<ContactsByIndustry[]> {
  const cacheKey = `contacts-by-industry-${limit}`;
  const cached = getCachedData<ContactsByIndustry[]>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch distinct industries
    const industryResponse = await authenticatedFetch('/api/v1/contacts/fields/industry/distinct/');
    const industries = industryResponse.values || [];

    // Fetch count for each industry
    const industryData = await Promise.all(
      industries.slice(0, limit).map(async (industry: string) => {
        const countResponse = await authenticatedFetch(
          `/api/v1/contacts/count/?industry=${encodeURIComponent(industry)}`
        );
        return {
          industry,
          count: countResponse.count || 0,
        };
      })
    );

    // Sort by count descending
    const sorted = industryData.sort((a, b) => b.count - a.count);

    setCachedData(cacheKey, sorted);
    return sorted;
  } catch (error) {
    console.error('Error fetching contacts by industry:', error);
    return [];
  }
}

/**
 * Fetch contact growth data over time
 */
export async function fetchContactGrowth(days: number = 30): Promise<ContactGrowthData[]> {
  const cacheKey = `contact-growth-${days}`;
  const cached = getCachedData<ContactGrowthData[]>(cacheKey);
  if (cached) return cached;

  try {
    const growthData: ContactGrowthData[] = [];
    const now = new Date();

    // Generate data for each day
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Fetch count up to this date
      const countResponse = await authenticatedFetch(
        `/api/v1/contacts/count/?created_at__lte=${dateStr}`
      );

      growthData.push({
        date: dateStr,
        count: countResponse.count || 0,
      });
    }

    setCachedData(cacheKey, growthData);
    return growthData;
  } catch (error) {
    console.error('Error fetching contact growth:', error);
    return [];
  }
}

/**
 * Fetch top companies by employee count
 */
export async function fetchTopCompanies(limit: number = 10): Promise<TopCompany[]> {
  const cacheKey = `top-companies-${limit}`;
  const cached = getCachedData<TopCompany[]>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch contacts with company and employee count, sorted by employee count
    const response = await authenticatedFetch(
      `/api/v1/contacts/?ordering=-employee_count&limit=${limit}&fields=company,employee_count`
    );

    const contacts = response.results || [];

    // Group by company and aggregate
    const companyMap = new Map<string, TopCompany>();

    contacts.forEach((contact: any) => {
      const company = contact.company || 'Unknown';
      const employeeCount = contact.employee_count || 0;

      if (companyMap.has(company)) {
        const existing = companyMap.get(company)!;
        existing.contactCount += 1;
        existing.employeeCount = Math.max(existing.employeeCount, employeeCount);
      } else {
        companyMap.set(company, {
          name: company,
          employeeCount,
          contactCount: 1,
        });
      }
    });

    const topCompanies = Array.from(companyMap.values())
      .sort((a, b) => b.employeeCount - a.employeeCount)
      .slice(0, limit);

    setCachedData(cacheKey, topCompanies);
    return topCompanies;
  } catch (error) {
    console.error('Error fetching top companies:', error);
    return [];
  }
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return;

  // Get headers from first object
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value || '');
        return stringValue.includes(',') || stringValue.includes('"')
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue;
      }).join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Clear analytics cache
 */
export function clearAnalyticsCache(): void {
  analyticsCache.clear();
}

