'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@hooks/useAuth';
import { updateUserProfile, uploadUserAvatar, promoteToAdmin } from '@services/user';
import { User } from '@/types/index';
import { Input } from '@components/ui/Input';
import { Textarea } from '@components/ui/Textarea';
import { Select } from '@components/ui/Select';
import { Button } from '@components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@components/ui/Card';
import { CollapsibleSection } from '@components/ui/CollapsibleSection';
import { Tooltip } from '@components/ui/Tooltip';
import { BottomSheet } from '@components/ui/BottomSheet';
import { UploadIcon, UsersIcon, IdentificationIcon, GlobeAltIcon, SaveIcon, AlertTriangleIcon, SuccessIcon, MailIcon, BriefcaseIcon, ShieldCheckIcon } from '@components/icons/IconComponents';

const RoleBadge: React.FC<{ role: User['role'] }> = ({ role }) => {
  const roleConfig = {
    Admin: {
      className: "glass-error",
      icon: "🛡️"
    },
    Manager: {
      className: "glass-warning",
      icon: "👔"
    },
    Member: {
      className: "glass-info",
      icon: "👤"
    },
  };
  
  const config = roleConfig[role];
  
  return (
    <Tooltip content={`Your role: ${role}`} side="top">
      <span className={`settings-role-badge settings-role-badge--${role.toLowerCase()}`}>
        <span className="settings-role-badge__icon">{config.icon}</span>
        {role}
      </span>
    </Tooltip>
  );
};

interface FormErrors {
  name?: string;
  jobTitle?: string;
  bio?: string;
  timezone?: string;
  avatar?: string;
  general?: string;
}

const ProfileSettings: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [bio, setBio] = useState('');
  const [timezone, setTimezone] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);

  const timezones = [
    'Etc/GMT+12', 'Pacific/Midway', 'Pacific/Honolulu', 'America/Anchorage',
    'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York',
    'America/Caracas', 'America/Halifax', 'America/Sao_Paulo', 'Atlantic/Azores',
    'Etc/GMT', 'Europe/London', 'Europe/Paris', 'Europe/Helsinki', 'Asia/Dubai',
    'Asia/Karachi', 'Asia/Dhaka', 'Asia/Bangkok', 'Asia/Tokyo', 'Australia/Sydney'
  ];

  useEffect(() => {
    if (user) {
      setName(user.name);
      setJobTitle(user.jobTitle || '');
      setBio(user.bio || '');
      setTimezone(user.timezone || 'Etc/GMT');
      setAvatarPreview(user.avatarUrl);
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setErrors({});
    setSuccessMessage(null);
    setIsUpdatingProfile(true);

    try {
      // Upload avatar first if a new file is selected
      let avatarUrl = user.avatarUrl;
      if (avatarFile) {
        setIsUploading(true);
        const uploadResult = await uploadUserAvatar(avatarFile);
        
        if (!uploadResult.success) {
          const newErrors: FormErrors = {};
          
          // Extract field-specific errors from avatar upload
          if (uploadResult.fieldErrors) {
            if (uploadResult.fieldErrors.avatar && uploadResult.fieldErrors.avatar.length > 0) {
              newErrors.avatar = uploadResult.fieldErrors.avatar[0];
            }
          }
          
          // Handle non-field errors
          if (uploadResult.nonFieldErrors && uploadResult.nonFieldErrors.length > 0) {
            newErrors.general = uploadResult.nonFieldErrors[0];
          } else if (!newErrors.avatar) {
            newErrors.general = uploadResult.message || 'Failed to upload avatar';
          }
          
          setErrors(newErrors);
          setIsUploading(false);
          setIsUpdatingProfile(false);
          return;
        }

        if (uploadResult.data?.avatarUrl) {
          avatarUrl = uploadResult.data.avatarUrl;
        }
        setIsUploading(false);
      }

      // Update profile
      const updateResult = await updateUserProfile({
        name,
        jobTitle,
        bio,
        timezone,
        avatarUrl,
      });

      if (!updateResult.success) {
        const newErrors: FormErrors = {};
        
        // Extract field-specific errors from API response
        // Map API field names (snake_case) to form field names (camelCase)
        if (updateResult.fieldErrors) {
          if (updateResult.fieldErrors.name && updateResult.fieldErrors.name.length > 0) {
            newErrors.name = updateResult.fieldErrors.name[0];
          }
          if (updateResult.fieldErrors.job_title && updateResult.fieldErrors.job_title.length > 0) {
            newErrors.jobTitle = updateResult.fieldErrors.job_title[0];
          }
          if (updateResult.fieldErrors.bio && updateResult.fieldErrors.bio.length > 0) {
            newErrors.bio = updateResult.fieldErrors.bio[0];
          }
          if (updateResult.fieldErrors.timezone && updateResult.fieldErrors.timezone.length > 0) {
            newErrors.timezone = updateResult.fieldErrors.timezone[0];
          }
          if (updateResult.fieldErrors.avatar_url && updateResult.fieldErrors.avatar_url.length > 0) {
            newErrors.avatar = updateResult.fieldErrors.avatar_url[0];
          }
        }
        
        // Handle non-field errors
        if (updateResult.nonFieldErrors && updateResult.nonFieldErrors.length > 0) {
          newErrors.general = updateResult.nonFieldErrors[0];
        } else if (Object.keys(newErrors).length === 0) {
          // Only set general error if no field-specific errors exist
          newErrors.general = updateResult.message || 'Failed to update profile';
        }
        
        setErrors(newErrors);
      } else {
        setSuccessMessage('Profile updated successfully!');
        await refreshUserProfile();
        setAvatarFile(null);
        setErrors({});
      }
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePromoteToAdmin = async () => {
    if (!user) return;

    // Show confirmation dialog
    if (!showPromoteConfirm) {
      setShowPromoteConfirm(true);
      return;
    }

    setIsPromoting(true);
    setPromoteError(null);
    setSuccessMessage(null);
    setErrors({});

    try {
      const result = await promoteToAdmin();

      if (!result.success) {
        // Extract errors from API response
        if (result.nonFieldErrors && result.nonFieldErrors.length > 0) {
          setPromoteError(result.nonFieldErrors[0]);
        } else if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
          // Handle field errors (though API shouldn't return field errors for this endpoint)
          const firstFieldError = Object.values(result.fieldErrors)[0];
          setPromoteError(Array.isArray(firstFieldError) ? firstFieldError[0] : firstFieldError);
        } else {
          setPromoteError(result.message || 'Failed to promote to admin');
        }
      } else {
        // Success - refresh profile to get updated role
        setSuccessMessage('Successfully promoted to Admin! Your role has been updated.');
        await refreshUserProfile();
        setShowPromoteConfirm(false);
      }
    } catch (error) {
      setPromoteError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsPromoting(false);
    }
  };

  if (!user) {
    return <div className="settings-profile-loading">Loading user profile...</div>;
  }

  const isAdmin = user.role === 'Admin';

  return (
    <div className="settings-profile-page">
        
        {/* Error Messages */}
        {errors.general && (
          <Card variant="glass-frosted" className="settings-profile-error-card">
            <CardContent className="settings-profile-error-card-content">
              <AlertTriangleIcon className="settings-profile-error-card-icon" />
              <p className="settings-profile-error-card-message">{errors.general}</p>
            </CardContent>
          </Card>
        )}
        
        {errors.avatar && (
          <Card variant="glass-frosted" className="settings-profile-error-card">
            <CardContent className="settings-profile-error-card-content">
              <AlertTriangleIcon className="settings-profile-error-card-icon" />
              <p className="settings-profile-error-card-message">Avatar: {errors.avatar}</p>
            </CardContent>
          </Card>
        )}
        
        {successMessage && (
          <Card variant="glass-frosted" className="settings-profile-success-card">
            <CardContent className="settings-profile-success-card-content">
              <SuccessIcon className="settings-profile-success-card-icon" />
              <p className="settings-profile-success-card-message">{successMessage}</p>
            </CardContent>
          </Card>
        )}

        {promoteError && (
          <Card variant="glass-frosted" className="settings-profile-error-card">
            <CardContent className="settings-profile-error-card-content">
              <AlertTriangleIcon className="settings-profile-error-card-icon" />
              <p className="settings-profile-error-card-message">{promoteError}</p>
            </CardContent>
          </Card>
        )}

        <div className="settings-profile-grid">
            {/* Avatar Card */}
            <Card variant="glass-frosted" className="settings-profile-avatar-card">
                <CardContent className="settings-profile-avatar-card-content">
                    <Tooltip content="Click to upload a new avatar" side="bottom">
                      <div className="settings-profile-avatar-wrapper">
                          <div className="settings-profile-avatar-overlay" />
                          <Image 
                              src={avatarPreview || user.avatarUrl} 
                              alt="User Avatar" 
                              className="settings-profile-avatar-image" 
                              width={128}
                              height={128}
                          />
                          <label 
                              htmlFor="avatar-upload" 
                              className="settings-profile-avatar-label"
                          >
                              <div className="settings-profile-avatar-label-content">
                                  <UploadIcon />
                                  <span className="settings-profile-avatar-label-text">Change</span>
                              </div>
                          </label>
                          <input 
                              type="file" 
                              id="avatar-upload" 
                              className="settings-profile-avatar-input" 
                              accept="image/*" 
                              onChange={handleAvatarChange} 
                          />
                      </div>
                    </Tooltip>
                    <h3 className="settings-profile-avatar-name">{user.name}</h3>
                    <Tooltip content={user.email} side="bottom">
                      <div className="settings-profile-avatar-email">
                          <MailIcon className="settings-profile-avatar-email-icon" />
                          <p className="settings-profile-avatar-email-text">{user.email}</p>
                      </div>
                    </Tooltip>
                    <div className="settings-profile-avatar-role">
                        <RoleBadge role={user.role} />
                    </div>
                </CardContent>
            </Card>

            <div className="settings-profile-content">
                {!isAdmin && (
                    <Card variant="glass-frosted" className="settings-profile-promote-card">
                        <CardHeader>
                            <div className="settings-profile-promote-header">
                                <div className="settings-profile-promote-icon-wrapper">
                                  <ShieldCheckIcon className="settings-profile-promote-icon" />
                                </div>
                                <div>
                                  <CardTitle className="settings-profile-promote-title">
                                    Upgrade to Admin
                                    <Tooltip content="Gain full access to all features" side="top">
                                      <span className="settings-profile-promote-info">ℹ️</span>
                                    </Tooltip>
                                  </CardTitle>
                                  <CardDescription className="settings-profile-promote-description">
                                    Promote yourself to Admin role to access additional features and permissions
                                  </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="settings-profile-promote-content">
                            {showPromoteConfirm ? (
                                <div className="settings-profile-promote-confirm">
                                    <div className="settings-profile-promote-confirm-box">
                                        <p className="settings-profile-promote-confirm-text">
                                            <strong>Are you sure you want to promote yourself to Admin?</strong>
                                        </p>
                                        <p className="settings-profile-promote-confirm-description">
                                            This action will grant you administrative privileges. The operation is logged for audit purposes.
                                        </p>
                                    </div>
                                    <div className="settings-profile-promote-confirm-actions">
                                        <Button
                                            variant="primary"
                                            onClick={handlePromoteToAdmin}
                                            isLoading={isPromoting}
                                            disabled={isPromoting}
                                            leftIcon={<ShieldCheckIcon />}
                                            className="settings-profile-promote-confirm-btn"
                                        >
                                            {isPromoting ? 'Promoting...' : 'Confirm Promotion'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowPromoteConfirm(false);
                                                setPromoteError(null);
                                            }}
                                            disabled={isPromoting}
                                            className="settings-profile-promote-cancel-btn"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={handlePromoteToAdmin}
                                    leftIcon={<ShieldCheckIcon />}
                                    className="settings-profile-promote-btn"
                                >
                                    Promote to Admin
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Personal Information Form - Desktop */}
                <Card variant="glass-frosted" className="settings-profile-form-card settings-profile-form-card--desktop">
                    <CardHeader>
                        <div className="settings-profile-form-header">
                          <div className="settings-profile-form-icon-wrapper">
                            <IdentificationIcon className="settings-profile-form-icon" />
                          </div>
                          <div>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your profile details and preferences</CardDescription>
                          </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleProfileUpdate} className="settings-profile-form">
                            <Input
                                label="Full Name"
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => {
                                  setName(e.target.value);
                                  if (errors.name) {
                                    setErrors((prev) => ({ ...prev, name: undefined }));
                                  }
                                }}
                                error={errors.name}
                                leftIcon={<UsersIcon />}
                                fullWidth
                                variant="glass-frosted-heavy"
                                tooltip="Your full name as it appears on official documents"
                                tooltipPosition="right"
                            />
                            
                            <Input
                                label="Job Title"
                                id="jobTitle"
                                type="text"
                                value={jobTitle}
                                onChange={(e) => {
                                  setJobTitle(e.target.value);
                                  if (errors.jobTitle) {
                                    setErrors((prev) => ({ ...prev, jobTitle: undefined }));
                                  }
                                }}
                                placeholder="e.g. Sales Manager"
                                error={errors.jobTitle}
                                leftIcon={<BriefcaseIcon />}
                                fullWidth
                                variant="glass-frosted-heavy"
                                tooltip="Your current position or role"
                                tooltipPosition="right"
                            />
                            
                            <Textarea
                                label="Bio"
                                id="bio"
                                value={bio}
                                onChange={(e) => {
                                  setBio(e.target.value);
                                  if (errors.bio) {
                                    setErrors((prev) => ({ ...prev, bio: undefined }));
                                  }
                                }}
                                rows={3}
                                placeholder="Tell us a little about yourself."
                                error={errors.bio}
                                fullWidth
                                variant="glass-frosted-heavy"
                                showCharacterCount
                                maxLength={500}
                                tooltip="A brief description about yourself (max 500 characters)"
                                tooltipPosition="right"
                            />
                            
                            <Select
                                label="Timezone"
                                id="timezone"
                                value={timezone}
                                onChange={(e) => {
                                  setTimezone(e.target.value);
                                  if (errors.timezone) {
                                    setErrors((prev) => ({ ...prev, timezone: undefined }));
                                  }
                                }}
                                error={errors.timezone}
                                options={timezones.map(tz => ({ value: tz, label: tz.replace(/_/g, ' ') }))}
                                fullWidth
                                leftIcon={<GlobeAltIcon />}
                                variant="glass-frosted-heavy"
                                tooltip="Your local timezone for accurate scheduling"
                                tooltipPosition="right"
                            />
                            
                            <Input
                                label="Email"
                                id="email"
                                type="email"
                                value={user.email}
                                disabled
                                leftIcon={<MailIcon />}
                                fullWidth
                                variant="glass-frosted-heavy"
                                tooltip="Your email address (cannot be changed)"
                                tooltipPosition="right"
                            />
                            
                            <div className="settings-profile-form-actions">
                                <Button 
                                    type="submit" 
                                    disabled={isUpdatingProfile || isUploading}
                                    isLoading={isUpdatingProfile || isUploading}
                                    leftIcon={<SaveIcon />}
                                    className="settings-profile-form-submit-btn"
                                >
                                    {isUploading ? 'Uploading...' : isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Personal Information Form - Mobile (Collapsible) */}
                <div className="settings-profile-form-mobile">
                  <CollapsibleSection 
                    title="Personal Information" 
                    defaultOpen={true}
                    icon={<IdentificationIcon />}
                  >
                    <form onSubmit={handleProfileUpdate} className="settings-profile-form settings-profile-form--mobile">
                        <Input
                            label="Full Name"
                            id="name-mobile"
                            type="text"
                            value={name}
                            onChange={(e) => {
                              setName(e.target.value);
                              if (errors.name) {
                                setErrors((prev) => ({ ...prev, name: undefined }));
                              }
                            }}
                            error={errors.name}
                            leftIcon={<UsersIcon />}
                            fullWidth
                            variant="glass-frosted-heavy"
                            tooltip="Your full name as it appears on official documents"
                            showTooltipOnFocus
                        />
                        
                        <Input
                            label="Job Title"
                            id="jobTitle-mobile"
                            type="text"
                            value={jobTitle}
                            onChange={(e) => {
                              setJobTitle(e.target.value);
                              if (errors.jobTitle) {
                                setErrors((prev) => ({ ...prev, jobTitle: undefined }));
                              }
                            }}
                            placeholder="e.g. Sales Manager"
                            error={errors.jobTitle}
                            leftIcon={<BriefcaseIcon />}
                            fullWidth
                            variant="glass-frosted-heavy"
                            tooltip="Your current position or role"
                            showTooltipOnFocus
                        />
                        
                        <Textarea
                            label="Bio"
                            id="bio-mobile"
                            value={bio}
                            onChange={(e) => {
                              setBio(e.target.value);
                              if (errors.bio) {
                                setErrors((prev) => ({ ...prev, bio: undefined }));
                              }
                            }}
                            rows={3}
                            placeholder="Tell us a little about yourself."
                            error={errors.bio}
                            fullWidth
                            variant="glass-frosted-heavy"
                            showCharacterCount
                            maxLength={500}
                            tooltip="A brief description about yourself (max 500 characters)"
                            showTooltipOnFocus
                        />
                        
                        <Select
                            label="Timezone"
                            id="timezone-mobile"
                            value={timezone}
                            onChange={(e) => {
                              setTimezone(e.target.value);
                              if (errors.timezone) {
                                setErrors((prev) => ({ ...prev, timezone: undefined }));
                              }
                            }}
                            error={errors.timezone}
                            options={timezones.map(tz => ({ value: tz, label: tz.replace(/_/g, ' ') }))}
                            fullWidth
                            leftIcon={<GlobeAltIcon />}
                            variant="glass-frosted-heavy"
                            tooltip="Your local timezone for accurate scheduling"
                            showTooltipOnFocus
                        />
                        
                        <Input
                            label="Email"
                            id="email-mobile"
                            type="email"
                            value={user.email}
                            disabled
                            leftIcon={<MailIcon />}
                            fullWidth
                            variant="glass-frosted-heavy"
                            tooltip="Your email address (cannot be changed)"
                            showTooltipOnFocus
                        />
                        
                        <Button 
                            type="submit" 
                            disabled={isUpdatingProfile || isUploading}
                            isLoading={isUpdatingProfile || isUploading}
                            leftIcon={<SaveIcon />}
                            className="settings-profile-form-submit-btn settings-profile-form-submit-btn--mobile"
                        >
                            {isUploading ? 'Uploading...' : isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </form>
                  </CollapsibleSection>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ProfileSettings;
