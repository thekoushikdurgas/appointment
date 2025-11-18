'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@hooks/useAuth';
import { updateUserProfile } from '@services/user';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { BellIcon, AlertTriangleIcon, SuccessIcon } from '@components/icons';

const NotificationsSettings: React.FC = () => {
    const { user, refreshUserProfile } = useAuth();
    const [prefs, setPrefs] = useState(user?.notifications || { weeklyReports: true, newLeadAlerts: true });
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (user?.notifications) {
            setPrefs(user.notifications);
        }
    }, [user]);
    
    const handleToggle = (key: 'weeklyReports' | 'newLeadAlerts') => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };
    
    const handleSaveChanges = async () => {
        if (!user) return;
        
        setErrorMessage(null);
        setSuccessMessage(null);
        setIsSaving(true);
        
        try {
            const result = await updateUserProfile({
                notifications: prefs,
            });
    
            if (!result.success) {
                setErrorMessage(result.message || 'Failed to save notification settings.');
            } else {
                setSuccessMessage('Settings saved!');
                await refreshUserProfile();
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="settings-notifications-page">
            <div className="settings-notifications-header">
                <div className="settings-notifications-header-icon-wrapper">
                    <BellIcon className="settings-notifications-header-icon" />
                </div>
                <div>
                    <h2 className="settings-notifications-title">Notifications</h2>
                    <p className="settings-notifications-description">Manage how you receive notifications from NexusCRM</p>
                </div>
            </div>

            {errorMessage && (
                <Card className="settings-notifications-error-card">
                    <CardContent className="settings-notifications-error-card-content">
                        <AlertTriangleIcon className="settings-notifications-error-card-icon" />
                        <p className="settings-notifications-error-card-message">{errorMessage}</p>
                    </CardContent>
                </Card>
            )}
            
            {successMessage && (
                <Card className="settings-notifications-success-card">
                    <CardContent className="settings-notifications-success-card-content">
                        <SuccessIcon className="settings-notifications-success-card-icon" />
                        <p className="settings-notifications-success-card-message">{successMessage}</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Choose which notifications you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="settings-notifications-preferences">
                    <div className="settings-notifications-preference-item">
                        <div className="settings-notifications-preference-info">
                            <p className="settings-notifications-preference-title">Weekly Reports</p>
                            <p className="settings-notifications-preference-description">Receive a summary of your contact activity every week</p>
                        </div>
                        <button 
                            onClick={() => handleToggle('weeklyReports')}
                            className={`settings-notifications-toggle ${prefs.weeklyReports ? 'settings-notifications-toggle--active' : ''}`}
                            aria-label={prefs.weeklyReports ? 'Disable weekly reports' : 'Enable weekly reports'}
                            aria-pressed={prefs.weeklyReports}
                            title={prefs.weeklyReports ? 'Disable weekly reports' : 'Enable weekly reports'}
                        >
                            <span className={`settings-notifications-toggle-thumb ${prefs.weeklyReports ? 'settings-notifications-toggle-thumb--active' : ''}`}/>
                        </button>
                    </div>
                    
                    <div className="settings-notifications-preference-item">
                        <div className="settings-notifications-preference-info">
                            <p className="settings-notifications-preference-title">New Lead Alerts</p>
                            <p className="settings-notifications-preference-description">Get notified immediately when a new lead is added</p>
                        </div>
                        <button 
                            onClick={() => handleToggle('newLeadAlerts')}
                            className={`settings-notifications-toggle ${prefs.newLeadAlerts ? 'settings-notifications-toggle--active' : ''}`}
                            aria-label={prefs.newLeadAlerts ? 'Disable new lead alerts' : 'Enable new lead alerts'}
                            aria-pressed={prefs.newLeadAlerts}
                            title={prefs.newLeadAlerts ? 'Disable new lead alerts' : 'Enable new lead alerts'}
                        >
                            <span className={`settings-notifications-toggle-thumb ${prefs.newLeadAlerts ? 'settings-notifications-toggle-thumb--active' : ''}`}/>
                        </button>
                    </div>
                </CardContent>
            </Card>
            
            <div className="settings-notifications-actions">
                <Button 
                    onClick={handleSaveChanges} 
                    disabled={isSaving}
                    isLoading={isSaving}
                    className="settings-notifications-save-btn"
                >
                    Save Preferences
                </Button>
            </div>
        </div>
    );
};

export default NotificationsSettings;
