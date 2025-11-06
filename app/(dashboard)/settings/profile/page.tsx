'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { updateUserProfile, uploadUserAvatar } from '../../../../services/user';
import { User } from '../../../../types/index';

const RoleBadge: React.FC<{ role: User['role'] }> = ({ role }) => {
  const baseClasses = "px-3 py-1 text-xs font-medium rounded-full inline-block";
  const roleClasses = {
    Admin: "bg-red-400/20 text-red-500",
    Manager: "bg-purple-400/20 text-purple-500",
    Member: "bg-blue-400/20 text-blue-500",
  };
  return <span className={`${baseClasses} ${roleClasses[role]}`}>{role}</span>;
};

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUpdatingProfile(true);

    try {
      // Upload avatar first if a new file is selected
      let avatarUrl = user.avatarUrl;
      if (avatarFile) {
        setIsUploading(true);
        const uploadResult = await uploadUserAvatar(avatarFile);
        
        if (!uploadResult.success) {
          setErrorMessage(uploadResult.message || 'Failed to upload avatar');
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
        setErrorMessage(updateResult.message || 'Failed to update profile');
      } else {
        setSuccessMessage('Profile updated successfully!');
        await refreshUserProfile();
        setAvatarFile(null);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  if (!user) {
    return <div>Loading user profile...</div>;
  }

  return (
    <div>
        <h2 className="text-2xl font-bold text-card-foreground mb-6">Profile</h2>
        
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
            {errorMessage}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
            <div className="bg-secondary p-6 rounded-lg text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                <img src={avatarPreview || user.avatarUrl} alt="User Avatar" className="w-full h-full rounded-full object-cover" />
                <label htmlFor="avatar-upload" className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white rounded-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                    Change
                </label>
                <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </div>
                <h3 className="text-2xl font-bold text-card-foreground">{user.name}</h3>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="mt-2">
                <RoleBadge role={user.role} />
                </div>
            </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
                <form onSubmit={handleProfileUpdate}>
                    <h3 className="text-xl font-semibold mb-4 text-card-foreground">Personal Information</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-muted-foreground">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 mt-1 border bg-background border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="jobTitle" className="block text-sm font-medium text-muted-foreground">Job Title</label>
                            <input
                                id="jobTitle"
                                type="text"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                placeholder="e.g. Sales Manager"
                                className="w-full px-3 py-2 mt-1 border bg-background border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-muted-foreground">Bio</label>
                            <textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={3}
                                placeholder="Tell us a little about yourself."
                                className="w-full px-3 py-2 mt-1 border bg-background border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                         <div>
                            <label htmlFor="timezone" className="block text-sm font-medium text-muted-foreground">Timezone</label>
                            <select
                                id="timezone"
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                className="w-full px-3 py-2 mt-1 border bg-background border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                {timezones.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={user.email}
                                disabled
                                className="w-full px-3 py-2 mt-1 border bg-secondary border-border rounded-md shadow-sm text-muted-foreground cursor-not-allowed"
                            />
                        </div>
                    </div>
                    <div className="mt-6 text-right">
                        <button type="submit" disabled={isUpdatingProfile || isUploading} className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-primary-400">
                            {isUploading ? 'Uploading...' : isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
};

export default ProfileSettings;
