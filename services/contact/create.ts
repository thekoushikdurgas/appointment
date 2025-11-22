/**
 * Contact Service Create Operations
 * 
 * Functions for creating contacts.
 */

import { Contact, ContactCreate } from '@/types/index';
import { API_BASE_URL } from '../api';
import { axiosAuthenticatedRequest } from '@utils/request';
import { parseApiError, parseExceptionError, formatErrorMessage, ParsedError } from '@utils/error';
import { NEXT_PUBLIC_CONTACTS_WRITE_KEY } from '@utils/config';
import { ServiceResponse } from './types';
import { ApiContact } from './types';
import { mapApiToContact } from './mappers';

/**
 * Get the contacts write key (hard-coded)
 */
const getContactsWriteKey = (): string | null => {
  return NEXT_PUBLIC_CONTACTS_WRITE_KEY;
};

/**
 * Create a new contact
 * 
 * Creates a new contact record using the ContactCreate schema. All body fields are optional.
 * Requires admin authentication and the X-Contacts-Write-Key header.
 * 
 * **Field Requirements:**
 * All fields are optional:
 * - uuid (string, optional): Contact UUID. If not provided, one will be generated.
 * - first_name (string, optional): Contact's first name.
 * - last_name (string, optional): Contact's last name.
 * - company_id (string, optional): UUID of the related company.
 * - email (string, optional): Contact's email address.
 * - title (string, optional): Contact's job title.
 * - departments (array[string], optional): List of department names.
 * - mobile_phone (string, optional): Contact's mobile phone number.
 * - email_status (string, optional): Email verification status.
 * - text_search (string, optional): Free-form search text, e.g., location information.
 * - seniority (string, optional): Contact's seniority level.
 * 
 * **Authentication:**
 * - Requires admin authentication (Bearer token)
 * - Requires X-Contacts-Write-Key header matching the configured CONTACTS_WRITE_KEY value
 * 
 * **Response Codes:**
 * - 201 Created: Contact created successfully
 * - 400 Bad Request: Invalid request data
 * - 401 Unauthorized: Authentication required
 * - 403 Forbidden: Admin access required or invalid write key
 * 
 * @param contactData - ContactCreate data with contact information
 * @param requestId - Optional X-Request-Id header value for request tracking
 * @returns Promise resolving to ServiceResponse<Contact> with created contact
 * 
 * @example
 * ```typescript
 * const result = await createContact({
 *   first_name: 'John',
 *   last_name: 'Doe',
 *   email: 'john@example.com',
 *   title: 'CEO',
 *   departments: ['executive'],
 *   mobile_phone: '+1234567890',
 *   email_status: 'valid',
 *   text_search: 'San Francisco, CA',
 *   seniority: 'c-level'
 * });
 * 
 * if (result.success && result.data) {
 *   console.log('Contact created:', result.data.id);
 * } else {
 *   console.error('Error:', result.message);
 * }
 * ```
 */
export const createContact = async (
  contactData: ContactCreate,
  requestId?: string
): Promise<ServiceResponse<Contact>> => {
  try {
    // Get write key from environment
    const writeKey = getContactsWriteKey();
    if (!writeKey) {
      return {
        success: false,
        message: 'Contacts write key not configured. Please set NEXT_PUBLIC_CONTACTS_WRITE_KEY environment variable.',
        error: {
          message: 'Write key not configured',
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Contacts-Write-Key': writeKey,
    };
    if (requestId) {
      headers['X-Request-Id'] = requestId;
    }

    // Prepare request body (only include defined fields)
    const requestBody: ContactCreate = {};
    if (contactData.uuid !== undefined) requestBody.uuid = contactData.uuid;
    if (contactData.first_name !== undefined) requestBody.first_name = contactData.first_name;
    if (contactData.last_name !== undefined) requestBody.last_name = contactData.last_name;
    if (contactData.company_id !== undefined) requestBody.company_id = contactData.company_id;
    if (contactData.email !== undefined) requestBody.email = contactData.email;
    if (contactData.title !== undefined) requestBody.title = contactData.title;
    if (contactData.departments !== undefined) requestBody.departments = contactData.departments;
    if (contactData.mobile_phone !== undefined) requestBody.mobile_phone = contactData.mobile_phone;
    if (contactData.email_status !== undefined) requestBody.email_status = contactData.email_status;
    if (contactData.text_search !== undefined) requestBody.text_search = contactData.text_search;
    if (contactData.seniority !== undefined) requestBody.seniority = contactData.seniority;

    const response = await axiosAuthenticatedRequest(`${API_BASE_URL}/api/v1/contacts/`, {
      method: 'POST',
      headers,
      data: requestBody,
      useCache: false,
    });

    if (!response.ok) {
      if (response.status === 401) {
        const error = await parseApiError(response, 'Authentication required');
        return {
          success: false,
          message: 'Authentication required. Please log in again.',
          error,
          fieldErrors: error.fieldErrors,
          nonFieldErrors: error.nonFieldErrors,
        };
      }
      if (response.status === 403) {
        const error = await parseApiError(response, 'Access forbidden');
        return {
          success: false,
          message: 'Admin access required or invalid write key. Please check your X-Contacts-Write-Key header.',
          error,
          fieldErrors: error.fieldErrors,
          nonFieldErrors: error.nonFieldErrors,
        };
      }
      const error = await parseApiError(response, 'Failed to create contact');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to create contact'),
        error,
        fieldErrors: error.fieldErrors,
        nonFieldErrors: error.nonFieldErrors,
      };
    }

    // Handle 201 Created response
    const data: ApiContact = await response.json();
    const contact = mapApiToContact(data);

    return {
      success: true,
      message: 'Contact created successfully',
      data: contact,
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to create contact');
    console.error('[CONTACT] Create contact error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to create contact'),
      error: parsedError,
      fieldErrors: parsedError.fieldErrors,
      nonFieldErrors: parsedError.nonFieldErrors,
    };
  }
};

