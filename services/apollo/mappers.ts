/**
 * Apollo Service Mappers
 * 
 * Functions for mapping API responses to frontend Contact types.
 */

import { Contact } from '@/types/index';
import { ApiContact } from './types';

/**
 * Maps snake_case API response to camelCase Contact type
 */
export const mapApiToContact = (apiContact: ApiContact): Contact => {
  if (!apiContact || typeof apiContact !== 'object') {
    throw new Error('Invalid contact data received from API');
  }

  const firstName = apiContact.first_name || '';
  const lastName = apiContact.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'N/A';

  const phone = apiContact.work_direct_phone ||
    apiContact.mobile_phone ||
    apiContact.home_phone ||
    apiContact.corporate_phone ||
    apiContact.other_phone ||
    '';

  return {
    uuid: apiContact.uuid,
    name: fullName,
    email: apiContact.email || '',
    company: apiContact.company || '',
    phone: phone,
    status: (apiContact.stage || 'Lead') as Contact['status'],
    avatarUrl: apiContact.photo_url || `https://picsum.photos/seed/${apiContact.uuid}/40/40`,
    title: apiContact.title,
    industry: apiContact.industry,
    companySize: apiContact.company_size,
    companyAddress: apiContact.company_address,
    website: apiContact.website,
    employeesCount: apiContact.employees,
    annualRevenue: apiContact.annual_revenue,
    totalFunding: apiContact.total_funding,
    latestFundingAmount: apiContact.latest_funding_amount,
    latestFunding: apiContact.latest_funding,
    lastRaisedAt: apiContact.last_raised_at,
    seniority: apiContact.seniority,
    departments: apiContact.departments,
    keywords: apiContact.keywords,
    technologies: apiContact.technologies,
    emailStatus: apiContact.email_status,
    primaryEmailCatchAllStatus: apiContact.primary_email_catch_all_status,
    stage: apiContact.stage,
    city: apiContact.city,
    state: apiContact.state,
    country: apiContact.country,
    postalCode: apiContact.postal_code,
    companyCity: apiContact.company_city,
    companyState: apiContact.company_state,
    companyCountry: apiContact.company_country,
    companyPhone: apiContact.company_phone,
    companyNameForEmails: apiContact.company_name_for_emails,
    personLinkedinUrl: apiContact.person_linkedin_url,
    companyLinkedinUrl: apiContact.company_linkedin_url,
    facebookUrl: apiContact.facebook_url,
    twitterUrl: apiContact.twitter_url,
    notes: apiContact.notes,
    tags: apiContact.keywords,
    isActive: apiContact.is_active ?? true,
    createdAt: apiContact.created_at,
    updatedAt: apiContact.updated_at,
    userId: apiContact.user_id,
  };
};

