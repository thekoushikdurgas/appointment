'use client';

import React, { useState, useMemo } from 'react';
import { authenticatedFetch } from '../../../../services/auth';
import { API_BASE_URL } from '../../../../services/api';
import { parseApiError, formatErrorMessage } from '../../../../utils/errorHandler';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { Tooltip } from '../../../../components/ui/Tooltip';
import { CollapsibleSection } from '../../../../components/ui/CollapsibleSection';
import { ShieldCheckIcon, LockIcon, AlertTriangleIcon, SuccessIcon, CheckCircleIcon } from '../../../../components/icons/IconComponents';

interface FormErrors {
  password?: string;
  general?: string;
}

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  glassClass: string;
}

const SecuritySettings: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Password strength calculator
    const passwordStrength = useMemo((): PasswordStrength => {
      if (!password) return { score: 0, label: '', color: '', glassClass: '' };
      
      let score = 0;
      
      // Length check
      if (password.length >= 8) score++;
      if (password.length >= 12) score++;
      
      // Character variety checks
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
      if (/\d/.test(password)) score++;
      if (/[^a-zA-Z\d]/.test(password)) score++;
      
      // Normalize to 0-4 scale
      score = Math.min(4, Math.floor(score * 0.8));
      
      const strengthMap: Record<number, PasswordStrength> = {
        0: { score: 0, label: 'Very Weak', color: '', glassClass: 'glass-error' },
        1: { score: 1, label: 'Weak', color: '', glassClass: 'glass-error' },
        2: { score: 2, label: 'Fair', color: '', glassClass: 'glass-warning' },
        3: { score: 3, label: 'Good', color: '', glassClass: 'glass-info' },
        4: { score: 4, label: 'Strong', color: '', glassClass: 'glass-success' },
      };
      
      return strengthMap[score];
    }, [password]);

    // Password requirements
    const passwordRequirements = useMemo(() => [
      { label: 'At least 8 characters', met: password.length >= 8 },
      { label: 'Contains uppercase & lowercase', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
      { label: 'Contains a number', met: /\d/.test(password) },
      { label: 'Contains a special character', met: /[^a-zA-Z\d]/.test(password) },
    ], [password]);

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
        <div className="settings-security-page">
            
            {/* Error Messages */}
            {errors.general && (
                <Card variant="glass-frosted" className="settings-security-error-card">
                    <CardContent className="settings-security-error-card-content">
                        <AlertTriangleIcon className="settings-security-error-card-icon" />
                        <p className="settings-security-error-card-message">{errors.general}</p>
                    </CardContent>
                </Card>
            )}
            
            {successMessage && (
                <Card variant="glass-frosted" className="settings-security-success-card">
                    <CardContent className="settings-security-success-card-content">
                        <SuccessIcon className="settings-security-success-card-icon" />
                        <p className="settings-security-success-card-message">{successMessage}</p>
                    </CardContent>
                </Card>
            )}

            <div className="settings-security-content">
                {/* Change Password Card - Desktop */}
                <Card variant="glass-frosted" className="settings-security-password-card settings-security-password-card--desktop">
                    <CardHeader>
                        <div className="settings-security-password-header">
                          <div className="settings-security-password-icon-wrapper">
                            <LockIcon className="settings-security-password-icon" />
                          </div>
                          <div>
                            <CardTitle className="settings-security-password-title">
                              Change Password
                              <Tooltip content="Create a strong, unique password" side="top">
                                <span className="settings-security-password-info">ℹ️</span>
                              </Tooltip>
                            </CardTitle>
                            <CardDescription>Update your password to keep your account secure</CardDescription>
                          </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordUpdate} className="settings-security-password-form">
                            <div className="settings-security-password-field-group">
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
                                  placeholder="Enter a strong password"
                                  leftIcon={<LockIcon />}
                                  fullWidth
                                  variant="glass-frosted-heavy"
                                  tooltip="Use a mix of letters, numbers, and symbols"
                                  tooltipPosition="right"
                              />
                              
                              {/* Password Strength Indicator */}
                              {password && (
                                <div className="settings-security-password-strength">
                                  <div className="settings-security-password-strength-header">
                                    <span className="settings-security-password-strength-label">Password Strength:</span>
                                    <span className={`settings-security-password-strength-value settings-security-password-strength-value--${passwordStrength.score}`}>
                                      {passwordStrength.label}
                                    </span>
                                  </div>
                                  <div className="settings-security-password-strength-bars">
                                    {[...Array(4)].map((_, i) => (
                                      <div
                                        key={i}
                                        className={`settings-security-password-strength-bar ${i < passwordStrength.score ? `settings-security-password-strength-bar--${passwordStrength.score}` : 'settings-security-password-strength-bar--inactive'}`}
                                      />
                                    ))}
                                  </div>
                                  
                                  {/* Password Requirements */}
                                  <div className="settings-security-password-requirements">
                                    {passwordRequirements.map((req, i) => (
                                      <div
                                        key={i}
                                        className={`settings-security-password-requirement ${req.met ? 'settings-security-password-requirement--met' : ''}`}
                                      >
                                        <CheckCircleIcon className={`settings-security-password-requirement-icon ${req.met ? 'settings-security-password-requirement-icon--met' : ''}`} />
                                        {req.label}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <Input
                                label="Confirm New Password"
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter your password"
                                leftIcon={<LockIcon className="settings-security-password-icon-input" />}
                                fullWidth
                                variant="glass-frosted-heavy"
                                tooltip="Must match the password above"
                                tooltipPosition="right"
                            />
                            
                            <div className="settings-security-password-actions">
                                <Button 
                                    type="submit" 
                                    disabled={isUpdatingPassword || passwordStrength.score < 2}
                                    isLoading={isUpdatingPassword}
                                    className="settings-security-password-submit-btn"
                                >
                                    Update Password
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Change Password Card - Mobile (Collapsible) */}
                <div className="settings-security-password-mobile">
                  <CollapsibleSection 
                    title="Change Password" 
                    defaultOpen={true}
                    icon={<LockIcon className="settings-security-password-icon" />}
                  >
                    <form onSubmit={handlePasswordUpdate} className="settings-security-password-form settings-security-password-form--mobile">
                        <div className="settings-security-password-field-group">
                          <Input
                              label="New Password"
                              id="new-password-mobile"
                              type="password"
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (errors.password) {
                                  setErrors((prev) => ({ ...prev, password: undefined }));
                                }
                              }}
                              error={errors.password}
                              placeholder="Enter a strong password"
                              leftIcon={<LockIcon className="settings-security-password-icon-input" />}
                              fullWidth
                              variant="glass-frosted-heavy"
                              tooltip="Use a mix of letters, numbers, and symbols"
                              showTooltipOnFocus
                          />
                          
                          {/* Password Strength Indicator - Mobile */}
                          {password && (
                            <div className="settings-security-password-strength">
                              <div className="settings-security-password-strength-header">
                                <span className="settings-security-password-strength-label">Strength:</span>
                                <span className={`settings-security-password-strength-value settings-security-password-strength-value--${passwordStrength.score}`}>
                                  {passwordStrength.label}
                                </span>
                              </div>
                              <div className="settings-security-password-strength-bars">
                                {[...Array(4)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`settings-security-password-strength-bar ${i < passwordStrength.score ? `settings-security-password-strength-bar--${passwordStrength.score}` : 'settings-security-password-strength-bar--inactive'}`}
                                  />
                                ))}
                              </div>
                              
                              {/* Password Requirements - Mobile */}
                              <div className="settings-security-password-requirements">
                                {passwordRequirements.map((req, i) => (
                                  <div
                                    key={i}
                                    className={`settings-security-password-requirement ${req.met ? 'settings-security-password-requirement--met' : ''}`}
                                  >
                                    <CheckCircleIcon className={`settings-security-password-requirement-icon ${req.met ? 'settings-security-password-requirement-icon--met' : ''}`} />
                                    {req.label}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <Input
                            label="Confirm New Password"
                            id="confirm-password-mobile"
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter your password"
                            leftIcon={<LockIcon className="settings-security-password-icon-input" />}
                            fullWidth
                            variant="glass-frosted-heavy"
                            tooltip="Must match the password above"
                            showTooltipOnFocus
                        />
                        
                        <Button 
                            type="submit" 
                            disabled={isUpdatingPassword || passwordStrength.score < 2}
                            isLoading={isUpdatingPassword}
                            className="settings-security-password-submit-btn settings-security-password-submit-btn--mobile"
                        >
                            Update Password
                        </Button>
                    </form>
                  </CollapsibleSection>
                </div>

                {/* 2FA Card - Desktop */}
                <Card variant="glass-frosted" className="settings-security-2fa-card settings-security-2fa-card--desktop">
                    <CardHeader>
                        <div className="settings-security-2fa-header">
                          <div className="settings-security-2fa-icon-wrapper">
                            <ShieldCheckIcon className="settings-security-2fa-icon" />
                          </div>
                          <div>
                            <CardTitle className="settings-security-2fa-title">
                              Two-Factor Authentication (2FA)
                              <Tooltip content="Adds an extra layer of protection" side="top">
                                <span className="settings-security-2fa-info">ℹ️</span>
                              </Tooltip>
                            </CardTitle>
                            <CardDescription>Add an extra layer of security to your account</CardDescription>
                          </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="settings-security-2fa-content">
                            <div className="settings-security-2fa-info">
                                <p className="settings-security-2fa-status">
                                  <AlertTriangleIcon className="settings-security-2fa-status-icon" />
                                  2FA is currently disabled
                                </p>
                                <p className="settings-security-2fa-description">
                                    Enable two-factor authentication to protect your account from unauthorized access
                                </p>
                            </div>
                            <Tooltip content="Coming soon - Enable 2FA for enhanced security" side="top">
                              <Button variant="outline" className="settings-security-2fa-enable-btn" disabled>
                                  Enable 2FA
                              </Button>
                            </Tooltip>
                        </div>
                    </CardContent>
                </Card>

                {/* 2FA Card - Mobile (Collapsible) */}
                <div className="settings-security-2fa-mobile">
                  <CollapsibleSection 
                    title="Two-Factor Authentication" 
                    defaultOpen={false}
                    icon={<ShieldCheckIcon className="settings-security-2fa-icon" />}
                  >
                    <div className="settings-security-2fa-mobile-content">
                      <div className="settings-security-2fa-mobile-box">
                          <div className="settings-security-2fa-mobile-info">
                              <p className="settings-security-2fa-status settings-security-2fa-status--mobile">
                                <AlertTriangleIcon className="settings-security-2fa-status-icon" />
                                2FA is disabled
                              </p>
                              <p className="settings-security-2fa-description settings-security-2fa-description--mobile">
                                  Enable 2FA to protect your account from unauthorized access
                              </p>
                          </div>
                          <Button variant="outline" className="settings-security-2fa-enable-btn settings-security-2fa-enable-btn--mobile" disabled>
                              Enable 2FA (Coming Soon)
                          </Button>
                      </div>
                    </div>
                  </CollapsibleSection>
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;
