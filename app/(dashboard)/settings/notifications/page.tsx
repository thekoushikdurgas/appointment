'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { updateUserProfile } from '../../../../services/user';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { BellIcon, AlertTriangleIcon, SuccessIcon } from '../../../../components/icons/IconComponents';
import { cn } from '../../../../utils/cn';

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
        <div className="flex flex-col gap-6 w-full max-w-full">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                    <BellIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-foreground">Notifications</h2>
                    <p className="text-sm text-muted-foreground mt-1">Manage how you receive notifications from NexusCRM</p>
                </div>
            </div>

            {errorMessage && (
                <Card className="border-error/20 bg-error/5">
                    <CardContent className="flex items-center gap-3 p-4">
                        <AlertTriangleIcon className="w-5 h-5 text-error flex-shrink-0" />
                        <p className="text-sm text-error">{errorMessage}</p>
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

            <Card>
                <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Choose which notifications you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/50">
                        <div className="flex-1">
                            <p className="font-medium text-foreground mb-1">Weekly Reports</p>
                            <p className="text-sm text-muted-foreground">Receive a summary of your contact activity every week</p>
                        </div>
                        <button 
                            onClick={() => handleToggle('weeklyReports')}
                            className={cn(
                                "relative w-14 h-8 rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                prefs.weeklyReports ? 'bg-primary' : 'bg-muted'
                            )}
                            aria-label={prefs.weeklyReports ? 'Disable weekly reports' : 'Enable weekly reports'}
                            aria-pressed={prefs.weeklyReports}
                            title={prefs.weeklyReports ? 'Disable weekly reports' : 'Enable weekly reports'}
                        >
                            <span className={cn(
                                "block w-6 h-6 rounded-full bg-white transform transition-transform shadow-sm",
                                prefs.weeklyReports ? 'translate-x-6' : 'translate-x-0'
                            )}/>
                        </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/50">
                        <div className="flex-1">
                            <p className="font-medium text-foreground mb-1">New Lead Alerts</p>
                            <p className="text-sm text-muted-foreground">Get notified immediately when a new lead is added</p>
                        </div>
                        <button 
                            onClick={() => handleToggle('newLeadAlerts')}
                            className={cn(
                                "relative w-14 h-8 rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                prefs.newLeadAlerts ? 'bg-primary' : 'bg-muted'
                            )}
                            aria-label={prefs.newLeadAlerts ? 'Disable new lead alerts' : 'Enable new lead alerts'}
                            aria-pressed={prefs.newLeadAlerts}
                            title={prefs.newLeadAlerts ? 'Disable new lead alerts' : 'Enable new lead alerts'}
                        >
                            <span className={cn(
                                "block w-6 h-6 rounded-full bg-white transform transition-transform shadow-sm",
                                prefs.newLeadAlerts ? 'translate-x-6' : 'translate-x-0'
                            )}/>
                        </button>
                    </div>
                </CardContent>
            </Card>
            
            <div className="flex justify-end">
                <Button 
                    onClick={handleSaveChanges} 
                    disabled={isSaving}
                    isLoading={isSaving}
                >
                    Save Preferences
                </Button>
            </div>
        </div>
    );
};

export default NotificationsSettings;
