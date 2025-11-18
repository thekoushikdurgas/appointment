import { axiosAuthenticatedRequest } from '@utils/request';
import { API_BASE_URL } from './api';
import { parseApiError } from '@utils/error';
import { Contact } from '@/types';

export interface AnalyticsStats {
  totalContacts: number;
  newContactsThisMonth: number;
  activeCustomers: number;
  revenueThisMonth: number;
  growthRate: number;
}

export interface ContactsByEmailVerification {
  status: string;  // "Verified" or "Unverified"
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
    const totalResponse = await axiosAuthenticatedRequest(`${API_BASE_URL}/api/v1/contacts/count/`, {
      method: 'GET',
      useQueue: true,
      useCache: true,
    });
    
    if (!totalResponse.ok) {
      const error = await parseApiError(totalResponse, 'Failed to fetch total contacts');
      throw new Error(error.message);
    }
    
    const totalData = await totalResponse.json();
    const totalContacts = totalData.count || 0;

    // Calculate date for this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayISO = firstDayOfMonth.toISOString().split('T')[0];

    // Fetch new contacts this month
    const monthResponse = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/contacts/count/?created_at__gte=${firstDayISO}`,
      { 
        method: 'GET',
        useQueue: true,
        useCache: true,
      }
    );
    
    if (!monthResponse.ok) {
      const error = await parseApiError(monthResponse, 'Failed to fetch monthly contacts');
      throw new Error(error.message);
    }
    
    const monthData = await monthResponse.json();
    const newContactsThisMonth = monthData.count || 0;

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
 * Fetch contacts grouped by email verification status
 */
export async function fetchContactsByEmailVerification(): Promise<ContactsByEmailVerification[]> {
  const cacheKey = 'contacts-by-email-verification';
  const cached = getCachedData<ContactsByEmailVerification[]>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch total contacts
    const totalResponse = await axiosAuthenticatedRequest(`${API_BASE_URL}/api/v1/contacts/count/`, {
      method: 'GET',
      useQueue: true,
      useCache: true,
    });
    
    if (!totalResponse.ok) {
      const error = await parseApiError(totalResponse, 'Failed to fetch total contacts');
      throw new Error(error.message);
    }
    
    const totalData = await totalResponse.json();
    const total = totalData.count || 1;

    // Fetch verified count
    const verifiedResponse = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/contacts/count/?email_status=Verified`,
      { 
        method: 'GET',
        useQueue: true,
        useCache: true,
      }
    );
    
    if (!verifiedResponse.ok) {
      console.warn('Failed to fetch verified email count');
    }
    
    const verifiedData = await verifiedResponse.json();
    const verifiedCount = verifiedData.count || 0;

    // Fetch unverified count
    const unverifiedResponse = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/contacts/count/?email_status=unverified`,
      { 
        method: 'GET',
        useQueue: true,
        useCache: true,
      }
    );
    
    if (!unverifiedResponse.ok) {
      console.warn('Failed to fetch unverified email count');
    }
    
    const unverifiedData = await unverifiedResponse.json();
    const unverifiedCount = unverifiedData.count || 0;

    const emailVerificationData = [
      {
        status: 'Verified',
        count: verifiedCount,
        percentage: parseFloat(((verifiedCount / total) * 100).toFixed(2)),
      },
      {
        status: 'Unverified',
        count: unverifiedCount,
        percentage: parseFloat(((unverifiedCount / total) * 100).toFixed(2)),
      },
    ];

    setCachedData(cacheKey, emailVerificationData);
    return emailVerificationData;
  } catch (error) {
    console.error('Error fetching contacts by email verification:', error);
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
    const industryResponse = await axiosAuthenticatedRequest(`${API_BASE_URL}/api/v1/contacts/industry/?limit=1000&offset=0`, {
      method: 'GET',
      useQueue: true,
      useCache: true,
    });
    
    if (!industryResponse.ok) {
      const error = await parseApiError(industryResponse, 'Failed to fetch industries');
      throw new Error(error.message);
    }
    
    const industryResponseData = await industryResponse.json();
    // Handle different possible response structures
    let industries: string[] = [];
    if (Array.isArray(industryResponseData.values)) {
      industries = industryResponseData.values;
    } else if (Array.isArray(industryResponseData.results)) {
      industries = industryResponseData.results;
    } else if (Array.isArray(industryResponseData)) {
      industries = industryResponseData;
    } else if (industryResponseData.values && typeof industryResponseData.values === 'object') {
      // If values is an object, try to extract array from it
      industries = Object.values(industryResponseData.values).filter((v): v is string => typeof v === 'string');
    }

    // Ensure industries is an array before proceeding
    if (!Array.isArray(industries)) {
      console.warn('Industries data is not an array:', industryResponseData);
      industries = [];
    }

    // Fetch count for each industry
    const industryData = await Promise.all(
      industries.slice(0, limit).map(async (industry: string) => {
        const countResponse = await axiosAuthenticatedRequest(
          `${API_BASE_URL}/api/v1/contacts/count/?industry=${encodeURIComponent(industry)}`,
          { 
            method: 'GET',
            useQueue: true,
            useCache: true,
          }
        );
        
        if (!countResponse.ok) {
          console.warn(`Failed to fetch count for industry ${industry}`);
          return {
            industry,
            count: 0,
          };
        }
        
        const countData = await countResponse.json();
        return {
          industry,
          count: countData.count || 0,
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
      const countResponse = await axiosAuthenticatedRequest(
        `${API_BASE_URL}/api/v1/contacts/count/?created_at__lte=${dateStr}`,
        { 
          method: 'GET',
          useQueue: true,
          useCache: true,
        }
      );

      if (!countResponse.ok) {
        console.warn(`Failed to fetch count for date ${dateStr}`);
        growthData.push({
          date: dateStr,
          count: 0,
        });
        continue;
      }

      const countData = await countResponse.json();
      growthData.push({
        date: dateStr,
        count: countData.count || 0,
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
    const response = await axiosAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/contacts/?ordering=-employees&limit=${limit}&fields=company,employees`,
      { 
        method: 'GET',
        useQueue: true,
        useCache: true,
      }
    );

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to fetch top companies');
      throw new Error(error.message);
    }

    const data = await response.json();
    const contacts = data.results || [];

    // Group by company and aggregate
    const companyMap = new Map<string, TopCompany>();

    contacts.forEach((contact: any) => {
      const company = contact.company || 'Unknown';
      const employeeCount = contact.employees || 0;

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

