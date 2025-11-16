/**
 * User Service
 * 
 * Provides user profile management functionality for the application.
 * 
 * **Key Functions:**
 * - `getUserProfile()` - Fetch current user profile (uses `authenticatedFetch`)
 * - `updateUserProfile()` - Update user profile information (uses `authenticatedFetch`)
 * - `uploadUserAvatar()` - Upload user avatar image (uses `authenticatedFetch`)
 * 
 * **Authentication:**
 * - All functions use `authenticatedFetch` from auth.ts
 * - Automatically handles token refresh on 401 errors
 * - Returns null or error response if authentication fails
 * 
 * **Error Handling:**
 * - All functions return ServiceResponse<T> with success, message, data, and error fields
 * - Errors are parsed and formatted using errorHandler utilities
 * - Network errors, timeout errors, and API errors are all handled consistently
 * 
 * **Usage Pattern:**
 * ```typescript
 * import { getUserProfile, updateUserProfile } from '../services/user';
 * 
 * // Get user profile
 * const profile = await getUserProfile(sessionUser);
 * if (profile) {
 *   console.log('User:', profile.name);
 * }
 * 
 * // Update profile
 * const result = await updateUserProfile({ name: 'New Name' });
 * if (result.success) {
 *   console.log('Profile updated:', result.data);
 * } else {
 *   console.error('Error:', result.message);
 * }
 * ```
 */

import { User } from '@/types/index';
import { axiosAuthenticatedRequest } from '@utils/axiosRequest';
import { API_BASE_URL } from './api';
import { parseApiError, parseExceptionError, formatErrorMessage, ParsedError } from '@utils/errorHandler';

/**
 * API user profile response interface
 */
interface ApiUserProfile {
  id: string | number;
  name: string;
  email: string;
  role?: string;
  avatar_url?: string;
  is_active?: boolean;
  job_title?: string;
  bio?: string;
  timezone?: string;
  notifications?: {
    weeklyReports: boolean;
    newLeadAlerts: boolean;
  };
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

/**
 * Avatar upload response interface
 */
interface AvatarUploadResponse {
  message?: string;
  avatar_url: string;
  profile?: ApiUserProfile;
}

/**
 * Service response interface
 */
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: ParsedError;
  fieldErrors?: Record<string, string[]>; // Field-specific errors for easier access
  nonFieldErrors?: string[]; // Non-field errors for easier access
}

/**
 * Helper function to format dates consistently
 */
const formatDateConsistently = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
  } catch {
    return 'N/A';
  }
};

/**
 * Map API user profile response to User type with validation
 */
const mapApiToUser = (apiUser: any, sessionUser?: any): User => {
  if (!apiUser || typeof apiUser !== 'object') {
    throw new Error('Invalid user data received from API');
  }

  const userId = String(apiUser.id || sessionUser?.id || '');
  if (!userId) {
    throw new Error('User ID is required');
  }

  return {
    id: userId,
    name: apiUser.name || 'Unnamed User',
    email: apiUser.email || sessionUser?.email || '',
    role: (apiUser.role || 'Member') as 'Admin' | 'Manager' | 'Member',
    avatarUrl: apiUser.avatar_url || `https://picsum.photos/seed/${userId}/40/40`,
    isActive: apiUser.is_active ?? true,
    lastLogin: sessionUser?.last_sign_in_at 
      ? formatDateConsistently(sessionUser.last_sign_in_at)
      : 'N/A',
    jobTitle: apiUser.job_title,
    bio: apiUser.bio,
    timezone: apiUser.timezone,
    notifications: apiUser.notifications || {
      weeklyReports: true,
      newLeadAlerts: true,
    },
  };
};

/**
 * Get current user profile
 */
export const getUserProfile = async (sessionUser?: any): Promise<User | null> => {
  console.log('[USER] getUserProfile called for user:', sessionUser?.id || sessionUser?.email);
  
  try {
    console.log('[USER] Making axiosAuthenticatedRequest to fetch profile');
    const response = await axiosAuthenticatedRequest(`${API_BASE_URL}/api/v2/users/profile/`, {
      method: 'GET',
      useQueue: true,
      useCache: true,
    });

    console.log('[USER] getUserProfile response received:', {
      ok: response.ok,
      status: response.status,
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('[USER] getUserProfile got 401, returning null');
        return null;
      }
      const error = await parseApiError(response, 'Failed to fetch user profile');
      console.error('[USER] Get user profile error:', error);
      return null;
    }

    console.log('[USER] getUserProfile parsing JSON response');
    const data: ApiUserProfile = await response.json();
    console.log('[USER] getUserProfile data received:', {
      id: data.id,
      name: data.name,
      email: data.email,
    });
    
    const mappedUser = mapApiToUser(data, sessionUser);
    console.log('[USER] getUserProfile successfully mapped user');
    return mappedUser;
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to fetch user profile');
    console.error('[USER] Get user profile error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return null;
  }
};

/**
 * Update current user profile
 */
export const updateUserProfile = async (profileData: Partial<User>): Promise<ServiceResponse<User>> => {
  try {
    // Map User type to API format
    const apiData: Partial<ApiUserProfile> = {};
    if (profileData.name !== undefined) apiData.name = profileData.name;
    if (profileData.jobTitle !== undefined) apiData.job_title = profileData.jobTitle;
    if (profileData.bio !== undefined) apiData.bio = profileData.bio;
    if (profileData.timezone !== undefined) apiData.timezone = profileData.timezone;
    if (profileData.notifications !== undefined) apiData.notifications = profileData.notifications;
    if (profileData.avatarUrl !== undefined) apiData.avatar_url = profileData.avatarUrl;
    if (profileData.role !== undefined) apiData.role = profileData.role;

    const response = await axiosAuthenticatedRequest(`${API_BASE_URL}/api/v2/users/profile/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      data: apiData,
      useQueue: true,
      useCache: false,
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to update profile');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to update profile'),
        error,
        fieldErrors: error.fieldErrors,
        nonFieldErrors: error.nonFieldErrors,
      };
    }

    const data: ApiUserProfile = await response.json();
    return {
      success: true,
      message: 'Profile updated successfully',
      data: mapApiToUser(data),
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to update profile');
    console.error('[USER] Update user profile error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to update profile'),
      error: parsedError,
      fieldErrors: parsedError.fieldErrors,
      nonFieldErrors: parsedError.nonFieldErrors,
    };
  }
};

/**
 * Upload user avatar with improved error handling
 */
export const uploadUserAvatar = async (file: File): Promise<ServiceResponse<{ user?: User; avatarUrl?: string }>> => {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return {
        success: false,
        message: 'Invalid file type. Allowed types: .jpg, .jpeg, .png, .gif, .webp',
        error: {
          message: 'Invalid file type',
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return {
        success: false,
        message: 'Image file too large. Maximum size is 5.0MB',
        error: {
          message: 'File too large',
          isNetworkError: false,
          isTimeoutError: false,
        },
      };
    }

    // Create FormData
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await axiosAuthenticatedRequest(`${API_BASE_URL}/api/v2/users/profile/avatar/`, {
      method: 'POST',
      data: formData,
      headers: {
        // Don't set Content-Type for FormData, let Axios handle it
      },
      useQueue: true,
      useCache: false,
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to upload avatar');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to upload avatar'),
        error,
        fieldErrors: error.fieldErrors,
        nonFieldErrors: error.nonFieldErrors,
      };
    }

    const data: AvatarUploadResponse = await response.json();
    return {
      success: true,
      message: data.message || 'Avatar uploaded successfully',
      data: {
        avatarUrl: data.avatar_url,
        user: data.profile ? mapApiToUser(data.profile) : undefined,
      },
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to upload avatar');
    console.error('[USER] Upload user avatar error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to upload avatar'),
      error: parsedError,
      fieldErrors: parsedError.fieldErrors,
      nonFieldErrors: parsedError.nonFieldErrors,
    };
  }
};

/**
 * Promote current user to admin role
 * 
 * This endpoint allows authenticated users to self-promote to admin role.
 * The operation is logged for audit purposes.
 */
export const promoteToAdmin = async (): Promise<ServiceResponse<User>> => {
  try {
    const response = await axiosAuthenticatedRequest(`${API_BASE_URL}/api/v2/users/promote-to-admin/`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      useQueue: true,
      useCache: false,
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to promote user to admin');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to promote user to admin'),
        error,
        fieldErrors: error.fieldErrors,
        nonFieldErrors: error.nonFieldErrors,
      };
    }

    const data: ApiUserProfile = await response.json();
    return {
      success: true,
      message: 'User promoted to admin successfully',
      data: mapApiToUser(data),
    };
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to promote user to admin');
    console.error('[USER] Promote to admin error:', {
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      isNetworkError: parsedError.isNetworkError,
      isTimeoutError: parsedError.isTimeoutError,
    });
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to promote user to admin'),
      error: parsedError,
      fieldErrors: parsedError.fieldErrors,
      nonFieldErrors: parsedError.nonFieldErrors,
    };
  }
};
