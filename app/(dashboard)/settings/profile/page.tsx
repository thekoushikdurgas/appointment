'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '../../../../hooks/useAuth';
import { updateUserProfile, uploadUserAvatar, promoteToAdmin } from '../../../../services/user';
import { User } from '../../../../types/index';
import { Input } from '../../../../components/ui/Input';
import { Textarea } from '../../../../components/ui/Textarea';
import { Select } from '../../../../components/ui/Select';
import { Button } from '../../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { UploadIcon, UsersIcon, IdentificationIcon, GlobeAltIcon, SaveIcon, AlertTriangleIcon, SuccessIcon, MailIcon, BriefcaseIcon, ShieldCheckIcon } from '../../../../components/icons/IconComponents';
import { cn } from '../../../../utils/cn';

const RoleBadge: React.FC<{ role: User['role'] }> = ({ role }) => {
  const roleConfig = {
    Admin: {
      className: "bg-error/20 text-error border-error/30",
    },
    Manager: {
      className: "bg-warning/20 text-warning border-warning/30",
    },
    Member: {
      className: "bg-info/20 text-info border-info/30",
    },
  };
  
  const config = roleConfig[role];
  
  const badgeClasses = {
    Admin: "badge badge-error",
    Manager: "badge badge-warning",
    Member: "badge badge-primary",
  };
  
  return (
    <span className={cn("badge inline-block border", badgeClasses[role])}>
      {role}
    </span>
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
    return <div>Loading user profile...</div>;
  }

  const isAdmin = user.role === 'Admin';

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
                <IdentificationIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
                <h2 className="text-3xl font-bold text-foreground">Profile</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage your personal information and preferences</p>
            </div>
        </div>
        
        {errors.general && (
          <Card className="border-error/20 bg-error/5">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangleIcon className="w-5 h-5 text-error flex-shrink-0" />
              <p className="text-sm text-error">{errors.general}</p>
            </CardContent>
          </Card>
        )}
        
        {errors.avatar && (
          <Card className="border-error/20 bg-error/5">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangleIcon className="w-5 h-5 text-error flex-shrink-0" />
              <p className="text-sm text-error">Avatar: {errors.avatar}</p>
            </CardContent>
          </Card>
        )}
        
        {successMessage && (
          <Card className="border-success/20 bg-success/5">
            <CardContent className="flex items-center gap-3 p-4">
              <SuccessIcon className="w-5 h-5 text-success flex-shrink-0" />
              <p className="text-sm text-success">{successMessage}</p>
            </CardContent>
          </Card>
        )}

        {promoteError && (
          <Card className="border-error/20 bg-error/5">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangleIcon className="w-5 h-5 text-error flex-shrink-0" />
              <p className="text-sm text-error">{promoteError}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
                <CardContent className="p-6 text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4 group">
                        <Image 
                            src={avatarPreview || user.avatarUrl} 
                            alt="User Avatar" 
                            className="w-full h-full rounded-full object-cover border-4 border-border" 
                            width={128}
                            height={128}
                        />
                        <label 
                            htmlFor="avatar-upload" 
                            className="absolute inset-0 bg-backdrop rounded-full flex items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <div className="flex flex-col items-center gap-1">
                                <UploadIcon className="w-6 h-6" />
                                <span className="text-xs font-medium">Change</span>
                            </div>
                        </label>
                        <input 
                            type="file" 
                            id="avatar-upload" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleAvatarChange} 
                        />
                    </div>
                    <h3 className="text-2xl font-bold text-card-foreground mb-1">{user.name}</h3>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <MailIcon className="w-4 h-4 text-muted-foreground" />
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="mt-3">
                        <RoleBadge role={user.role} />
                    </div>
                </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
                {!isAdmin && (
                    <Card className="border-warning/20 bg-warning/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheckIcon className="w-5 h-5 text-warning" />
                                Upgrade to Admin
                            </CardTitle>
                            <CardDescription>
                                Promote yourself to Admin role to access additional features and permissions
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {showPromoteConfirm ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-background rounded-lg border border-warning/30">
                                        <p className="text-sm text-foreground mb-2">
                                            <strong>Are you sure you want to promote yourself to Admin?</strong>
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            This action will grant you administrative privileges. The operation is logged for audit purposes.
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="primary"
                                            onClick={handlePromoteToAdmin}
                                            isLoading={isPromoting}
                                            disabled={isPromoting}
                                            leftIcon={<ShieldCheckIcon className="w-4 h-4" />}
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
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={handlePromoteToAdmin}
                                    leftIcon={<ShieldCheckIcon className="w-4 h-4" />}
                                    className="w-full sm:w-auto"
                                >
                                    Promote to Admin
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your profile details and preferences</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
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
                                leftIcon={<UsersIcon className="w-4 h-4" />}
                                fullWidth
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
                                leftIcon={<BriefcaseIcon className="w-4 h-4" />}
                                fullWidth
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
                            />
                            
                            <Input
                                label="Email"
                                id="email"
                                type="email"
                                value={user.email}
                                disabled
                                leftIcon={<MailIcon className="w-4 h-4" />}
                                fullWidth
                            />
                            
                            <div className="flex justify-end gap-3 pt-4">
                                <Button 
                                    type="submit" 
                                    disabled={isUpdatingProfile || isUploading}
                                    isLoading={isUpdatingProfile || isUploading}
                                    leftIcon={<SaveIcon className="w-4 h-4" />}
                                >
                                    {isUploading ? 'Uploading...' : isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
};

export default ProfileSettings;
