'use client';

import React, { useState } from 'react';
import { authenticatedFetch } from '../../../../services/auth';
import { API_BASE_URL } from '../../../../services/api';

const SecuritySettings: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (password !== confirmPassword) {
          setErrorMessage("Passwords do not match.");
          return;
        }
        if (password.length < 6) {
          setErrorMessage("Password must be at least 6 characters long.");
          return;
        }
        
        setIsUpdatingPassword(true);
        
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/auth/change-password/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                setErrorMessage(errorData.detail || errorData.message || 'Failed to update password');
            } else {
                setSuccessMessage("Password updated successfully.");
                setPassword('');
                setConfirmPassword('');
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-card-foreground mb-6">Security</h2>
            
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

            <div className="space-y-8">
                <form onSubmit={handlePasswordUpdate}>
                    <h3 className="text-xl font-semibold mb-4 text-card-foreground">Change Password</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="new-password"className="text-sm font-medium text-muted-foreground">New Password</label>
                            <input
                                id="new-password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full max-w-sm px-3 py-2 mt-1 border bg-background border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="6+ characters"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-password"className="text-sm font-medium text-muted-foreground">Confirm New Password</label>
                            <input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full max-w-sm px-3 py-2 mt-1 border bg-background border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                    <div className="mt-6">
                        <button type="submit" disabled={isUpdatingPassword} className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-primary-400">
                            {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>

                <div>
                     <h3 className="text-xl font-semibold mb-4 text-card-foreground">Two-Factor Authentication (2FA)</h3>
                     <div className="p-4 border border-border rounded-lg bg-secondary flex items-center justify-between">
                        <div>
                            <p className="font-medium text-card-foreground">2FA is currently disabled.</p>
                            <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
                        </div>
                        <button className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors">
                            Enable 2FA
                        </button>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;
