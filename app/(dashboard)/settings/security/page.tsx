'use client';

import React, { useState } from 'react';
import { authenticatedFetch } from '../../../../services/auth';
import { API_BASE_URL } from '../../../../services/api';
import { parseApiError, formatErrorMessage } from '../../../../utils/errorHandler';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { ShieldCheckIcon, LockIcon, AlertTriangleIcon, SuccessIcon } from '../../../../components/icons/IconComponents';

interface FormErrors {
  password?: string;
  general?: string;
}

const SecuritySettings: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setSuccessMessage(null);

        // Client-side validation
        if (password !== confirmPassword) {
          setErrors({ password: "Passwords do not match." });
          return;
        }
        if (password.length < 8) {
          setErrors({ password: "Password must be at least 8 characters long." });
          return;
        }
        
        setIsUpdatingPassword(true);
        
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/v2/auth/change-password/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });
            
            if (!response.ok) {
                const error = await parseApiError(response, 'Failed to update password');
                const newErrors: FormErrors = {};
                
                // Extract field-specific errors from API response
                if (error.fieldErrors) {
                  if (error.fieldErrors.password && error.fieldErrors.password.length > 0) {
                    newErrors.password = error.fieldErrors.password[0];
                  }
                }
                
                // Handle non-field errors
                if (error.nonFieldErrors && error.nonFieldErrors.length > 0) {
                  newErrors.general = error.nonFieldErrors[0];
                } else if (!newErrors.password) {
                  // Only set general error if no field-specific errors exist
                  newErrors.general = formatErrorMessage(error, 'Failed to update password');
                }
                
                setErrors(newErrors);
            } else {
                setSuccessMessage("Password updated successfully.");
                setPassword('');
                setConfirmPassword('');
                setErrors({});
            }
        } catch (error) {
            setErrors({
                general: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-full">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                    <ShieldCheckIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-foreground">Security</h2>
                    <p className="text-sm text-muted-foreground mt-1">Manage your account security settings</p>
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
            
            {successMessage && (
                <Card className="border-success/20 bg-success/5">
                    <CardContent className="flex items-center gap-3 p-4">
                        <SuccessIcon className="w-5 h-5 text-success flex-shrink-0" />
                        <p className="text-sm text-success">{successMessage}</p>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                        <CardDescription>Update your password to keep your account secure</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordUpdate} className="space-y-4">
                            <Input
                                label="New Password"
                                id="new-password"
                                type="password"
                                value={password}
                                onChange={(e) => {
                                  setPassword(e.target.value);
                                  if (errors.password) {
                                    setErrors((prev) => ({ ...prev, password: undefined }));
                                  }
                                }}
                                error={errors.password}
                                placeholder="8+ characters"
                                leftIcon={<LockIcon className="w-4 h-4" />}
                                fullWidth
                            />
                            
                            <Input
                                label="Confirm New Password"
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter your password"
                                leftIcon={<LockIcon className="w-4 h-4" />}
                                fullWidth
                            />
                            
                            <div className="flex justify-end pt-2">
                                <Button 
                                    type="submit" 
                                    disabled={isUpdatingPassword}
                                    isLoading={isUpdatingPassword}
                                >
                                    Update Password
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
                        <CardDescription>Add an extra layer of security to your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/50">
                            <div className="flex-1">
                                <p className="font-medium text-foreground mb-1">2FA is currently disabled</p>
                                <p className="text-sm text-muted-foreground">
                                    Enable two-factor authentication to protect your account from unauthorized access
                                </p>
                            </div>
                            <Button variant="outline" className="ml-4">
                                Enable 2FA
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SecuritySettings;
