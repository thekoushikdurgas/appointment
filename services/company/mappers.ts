/**
 * Company Service Mappers
 * 
 * Functions for mapping API responses to frontend types.
 */

import {
  Company,
  ApiCompany,
  CompanyContact,
  ApiCompanyContact,
} from '@/types/company';

/**
 * Maps snake_case API response to camelCase Company type
 * 
 * Converts the API response format (snake_case) to the frontend Company type (camelCase).
 * Handles all fields from the API documentation including optional fields.
 * 
 * @param apiCompany - The company object from the API response
 * @returns Company object in camelCase format
 * @throws Error if company data is invalid
 */
export const mapApiToCompany = (apiCompany: ApiCompany | any): Company => {
  if (!apiCompany || typeof apiCompany !== 'object') {
    throw new Error('Invalid company data received from API');
  }

  return {
    uuid: apiCompany.uuid,
    name: apiCompany.name || '',
    employeesCount: apiCompany.employees_count,
    annualRevenue: apiCompany.annual_revenue,
    totalFunding: apiCompany.total_funding,
    industries: apiCompany.industries,
    keywords: apiCompany.keywords,
    technologies: apiCompany.technologies,
    address: apiCompany.address,
    textSearch: apiCompany.text_search,
    metadata: apiCompany.metadata,
    createdAt: apiCompany.created_at,
    updatedAt: apiCompany.updated_at,
  };
};

/**
 * Maps snake_case API response to camelCase CompanyContact type
 * 
 * Converts the API response format (snake_case) to the frontend CompanyContact type (camelCase).
 * Handles all fields from the API documentation including optional fields.
 * 
 * @param apiContact - The contact object from the API response
 * @returns CompanyContact object in camelCase format
 * @throws Error if contact data is invalid
 */
export const mapApiToCompanyContact = (apiContact: ApiCompanyContact | any): CompanyContact => {
  if (!apiContact || typeof apiContact !== 'object') {
    throw new Error('Invalid contact data received from API');
  }

  return {
    uuid: apiContact.uuid,
    firstName: apiContact.first_name,
    lastName: apiContact.last_name,
    email: apiContact.email,
    title: apiContact.title,
    seniority: apiContact.seniority,
    departments: apiContact.departments,
    emailStatus: apiContact.email_status,
    mobilePhone: apiContact.mobile_phone,
    company: apiContact.company,
    metadata: apiContact.metadata,
    createdAt: apiContact.created_at,
    updatedAt: apiContact.updated_at,
  };
};

