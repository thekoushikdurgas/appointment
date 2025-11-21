/**
 * LinkedIn URL Validation Utilities
 * 
 * Utility functions for validating LinkedIn URLs for both person profiles
 * and company pages. Supports various LinkedIn URL formats.
 * 
 * Based on API documentation at docs/api/linkdin.md
 */

/**
 * LinkedIn URL validation result
 */
export interface LinkedInUrlValidationResult {
  valid: boolean;
  error?: string;
  type?: 'person' | 'company' | 'unknown';
  normalizedUrl?: string;
}

/**
 * Valid LinkedIn URL patterns
 * 
 * Person URLs:
 * - https://www.linkedin.com/in/username
 * - https://linkedin.com/in/username
 * - http://www.linkedin.com/in/username
 * - www.linkedin.com/in/username
 * - linkedin.com/in/username
 * 
 * Company URLs:
 * - https://www.linkedin.com/company/company-name
 * - https://linkedin.com/company/company-name
 * - http://www.linkedin.com/company/company-name
 * - www.linkedin.com/company/company-name
 * - linkedin.com/company/company-name
 */
const LINKEDIN_PERSON_PATTERN = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_]+\/?(\?.*)?(#.*)?$/i;
const LINKEDIN_COMPANY_PATTERN = /^(https?:\/\/)?(www\.)?linkedin\.com\/company\/[a-zA-Z0-9\-_]+\/?(\?.*)?(#.*)?$/i;

/**
 * Validate LinkedIn URL
 * 
 * Validates if a URL is a valid LinkedIn profile or company URL.
 * Supports various formats including with/without protocol and www prefix.
 * 
 * @param url - URL string to validate
 * @returns Validation result with type and normalized URL
 * 
 * @example
 * ```typescript
 * const result = validateLinkedInUrl('https://www.linkedin.com/in/john-doe');
 * if (result.valid) {
 *   console.log('Type:', result.type); // 'person'
 *   console.log('Normalized:', result.normalizedUrl);
 * }
 * ```
 */
export function validateLinkedInUrl(url: string): LinkedInUrlValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      valid: false,
      error: 'URL is required and must be a string',
    };
  }

  const trimmedUrl = url.trim();

  if (trimmedUrl === '') {
    return {
      valid: false,
      error: 'URL cannot be empty',
    };
  }

  // Check if it contains linkedin.com (case-insensitive)
  if (!trimmedUrl.toLowerCase().includes('linkedin.com')) {
    return {
      valid: false,
      error: 'URL must be from linkedin.com domain',
    };
  }

  // Test against person pattern
  if (LINKEDIN_PERSON_PATTERN.test(trimmedUrl)) {
    const normalizedUrl = normalizeLinkedInUrl(trimmedUrl);
    return {
      valid: true,
      type: 'person',
      normalizedUrl,
    };
  }

  // Test against company pattern
  if (LINKEDIN_COMPANY_PATTERN.test(trimmedUrl)) {
    const normalizedUrl = normalizeLinkedInUrl(trimmedUrl);
    return {
      valid: true,
      type: 'company',
      normalizedUrl,
    };
  }

  // If it contains linkedin.com but doesn't match patterns, provide helpful error
  if (trimmedUrl.toLowerCase().includes('linkedin.com')) {
    return {
      valid: false,
      error: 'Invalid LinkedIn URL format. Must be /in/username for person profiles or /company/company-name for companies',
    };
  }

  return {
    valid: false,
    error: 'Invalid URL format',
  };
}

/**
 * Normalize LinkedIn URL
 * 
 * Normalizes a LinkedIn URL to a standard format:
 * - Adds https:// protocol if missing
 * - Adds www. prefix if missing
 * - Removes trailing slashes
 * - Removes query parameters and fragments
 * 
 * @param url - LinkedIn URL to normalize
 * @returns Normalized URL string
 * 
 * @example
 * ```typescript
 * normalizeLinkedInUrl('linkedin.com/in/john-doe')
 * // Returns: 'https://www.linkedin.com/in/john-doe'
 * ```
 */
export function normalizeLinkedInUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return url;
  }

  let normalized = url.trim();

  // Remove query parameters and fragments
  normalized = normalized.split('?')[0].split('#')[0];

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');

  // Add protocol if missing
  if (!normalized.match(/^https?:\/\//i)) {
    normalized = 'https://' + normalized;
  }

  // Add www. if missing (but preserve the protocol)
  if (!normalized.includes('www.')) {
    normalized = normalized.replace(/^(https?:\/\/)(linkedin\.com)/i, '$1www.$2');
  }

  return normalized;
}

/**
 * Validate multiple LinkedIn URLs
 * 
 * Validates an array of LinkedIn URLs and returns results for each.
 * 
 * @param urls - Array of URL strings to validate
 * @returns Array of validation results
 * 
 * @example
 * ```typescript
 * const results = validateLinkedInUrls([
 *   'https://www.linkedin.com/in/john-doe',
 *   'invalid-url',
 *   'https://www.linkedin.com/company/tech-corp'
 * ]);
 * 
 * results.forEach((result, index) => {
 *   if (!result.valid) {
 *     console.error(`URL ${index + 1} is invalid:`, result.error);
 *   }
 * });
 * ```
 */
export function validateLinkedInUrls(urls: string[]): LinkedInUrlValidationResult[] {
  if (!Array.isArray(urls)) {
    return [{
      valid: false,
      error: 'URLs must be an array',
    }];
  }

  return urls.map(url => validateLinkedInUrl(url));
}

/**
 * Extract valid LinkedIn URLs from text
 * 
 * Parses a text string (with newlines or commas) and extracts valid LinkedIn URLs.
 * 
 * @param text - Text containing LinkedIn URLs (comma or newline separated)
 * @returns Array of valid LinkedIn URLs with their validation results
 * 
 * @example
 * ```typescript
 * const text = `
 *   https://www.linkedin.com/in/john-doe
 *   https://www.linkedin.com/company/tech-corp
 *   invalid-url
 * `;
 * 
 * const validUrls = extractValidLinkedInUrls(text);
 * // Returns array of valid URLs only
 * ```
 */
export function extractValidLinkedInUrls(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Split by newlines, commas, or both
  const urls = text
    .split(/[\n,]+/)
    .map(url => url.trim())
    .filter(url => url.length > 0);

  // Validate each URL and return only valid ones
  return urls
    .map(url => validateLinkedInUrl(url))
    .filter(result => result.valid && result.normalizedUrl)
    .map(result => result.normalizedUrl!);
}

/**
 * Check if URL is a LinkedIn person profile
 * 
 * @param url - URL to check
 * @returns True if URL is a valid LinkedIn person profile
 */
export function isLinkedInPersonUrl(url: string): boolean {
  const result = validateLinkedInUrl(url);
  return result.valid && result.type === 'person';
}

/**
 * Check if URL is a LinkedIn company page
 * 
 * @param url - URL to check
 * @returns True if URL is a valid LinkedIn company page
 */
export function isLinkedInCompanyUrl(url: string): boolean {
  const result = validateLinkedInUrl(url);
  return result.valid && result.type === 'company';
}

