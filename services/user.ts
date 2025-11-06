import { User } from '../types/index';
import { authenticatedFetch } from './auth';
import { API_BASE_URL } from './api';
import { parseApiError, parseExceptionError, formatErrorMessage, ParsedError } from '../utils/errorHandler';

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
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/users/profile/`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      const error = await parseApiError(response, 'Failed to fetch user profile');
      console.error('[USER] Get user profile error:', error);
      return null;
    }

    const data: ApiUserProfile = await response.json();
    return mapApiToUser(data, sessionUser);
  } catch (error) {
    const parsedError = parseExceptionError(error, 'Failed to fetch user profile');
    console.error('[USER] Get user profile error:', parsedError);
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

    const response = await authenticatedFetch(`${API_BASE_URL}/users/profile/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiData),
    });

    if (!response.ok) {
      const error = await parseApiError(response, 'Failed to update profile');
      return {
        success: false,
        message: formatErrorMessage(error, 'Failed to update profile'),
        error,
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
    console.error('[USER] Update user profile error:', parsedError);
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to update profile'),
      error: parsedError,
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

    const response = await authenticatedFetch(`${API_BASE_URL}/users/profile/avatar/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to upload avatar';
      try {
        const errorData = await response.json();
        if (errorData.avatar && Array.isArray(errorData.avatar)) {
          errorMessage = errorData.avatar[0];
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        const error = await parseApiError(response, 'Failed to upload avatar');
        return {
          success: false,
          message: formatErrorMessage(error, 'Failed to upload avatar'),
          error,
        };
      }
      
      return {
        success: false,
        message: errorMessage,
        error: {
          message: errorMessage,
          statusCode: response.status,
          isNetworkError: false,
          isTimeoutError: false,
        },
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
    console.error('[USER] Upload user avatar error:', parsedError);
    return {
      success: false,
      message: formatErrorMessage(parsedError, 'Failed to upload avatar'),
      error: parsedError,
    };
  }
};
