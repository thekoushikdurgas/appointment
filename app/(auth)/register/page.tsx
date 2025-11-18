'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@hooks/useAuth';
import { useAuthSwipe } from '@hooks/useAuthSwipe';
import { LogoIcon, AlertTriangleIcon, ShieldCheckIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon, UsersIcon, SuccessIcon } from '@components/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { GlassCard } from '@components/ui/GlassCard';
import { SocialLoginButtons } from '@components/auth/SocialLoginButtons';
import { PasswordStrengthIndicator } from '@components/auth/PasswordStrengthIndicator';
import { FloatingIcons } from '@components/ui/FloatingIcons';
import { ParticleEffect } from '@components/ui/ParticleEffect';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  general?: string;
}

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [touched, setTouched] = useState<{ name: boolean; email: boolean; password: boolean }>({
    name: false,
    email: false,
    password: false,
  });
  const { register, user, isLoading } = useAuth();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const errorAnnouncementRef = useRef<HTMLDivElement>(null);
  const successAnnouncementRef = useRef<HTMLDivElement>(null);

  // Swipe gesture support
  const { containerRef, isPulling, pullProgress } = useAuthSwipe({
    onSwipeLeft: () => {
      router.push('/login');
    },
    onPullDown: () => {
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setErrors({});
      setSuccessMessage('');
      setTouched({ name: false, email: false, password: false });
    },
    enabled: !isRegistering && !successMessage,
  });

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (errors.general && errorAnnouncementRef.current) {
      errorAnnouncementRef.current.focus();
    }
  }, [errors.general]);

  useEffect(() => {
    if (successMessage && successAnnouncementRef.current) {
      successAnnouncementRef.current.focus();
    }
  }, [successMessage]);

  const validateName = (nameValue: string): string | undefined => {
    if (!nameValue.trim()) {
      return 'Full name is required';
    }
    if (nameValue.trim().length < 2) {
      return 'Name must be at least 2 characters long';
    }
    return undefined;
  };

  const validateEmail = (emailValue: string): string | undefined => {
    if (!emailValue.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  const validatePassword = (passwordValue: string): string | undefined => {
    if (!passwordValue) {
      return 'Password is required';
    }
    if (passwordValue.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    const nameError = validateName(name);
    if (nameError) {
      newErrors.name = nameError;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      newErrors.email = emailError;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: 'name' | 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    if (field === 'name') {
      const nameError = validateName(name);
      setErrors((prev) => ({ ...prev, name: nameError }));
    } else if (field === 'email') {
      const emailError = validateEmail(email);
      setErrors((prev) => ({ ...prev, email: emailError }));
    } else if (field === 'password') {
      const passwordError = validatePassword(password);
      setErrors((prev) => ({ ...prev, password: passwordError }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setErrors({});
    setSuccessMessage('');
    setTouched({ name: true, email: true, password: true });

    if (!validateForm()) {
      return;
    }

    setIsRegistering(true);

    try {
      const result = await register(name.trim(), email.trim(), password);
      
      if (!result.success) {
        const newErrors: FormErrors = {};
        
        if (result.fieldErrors) {
          if (result.fieldErrors.name && result.fieldErrors.name.length > 0) {
            newErrors.name = result.fieldErrors.name[0];
          }
          if (result.fieldErrors.email && result.fieldErrors.email.length > 0) {
            newErrors.email = result.fieldErrors.email[0];
          }
          if (result.fieldErrors.password && result.fieldErrors.password.length > 0) {
            newErrors.password = result.fieldErrors.password.join('. ');
          }
        }
        
        if (result.nonFieldErrors && result.nonFieldErrors.length > 0) {
          newErrors.general = result.nonFieldErrors[0];
        } else if (!newErrors.name && !newErrors.email && !newErrors.password) {
          newErrors.general = result.message;
        }
        
        setErrors(newErrors);
      } else {
        setSuccessMessage(result.message);
        setShowSuccess(true);
        setName('');
        setEmail('');
        setPassword('');
        setErrors({});
        setTouched({ name: false, email: false, password: false });
      }
    } catch (error) {
      console.error('[REGISTER] Unexpected error:', error);
      setErrors({
        general: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (user) {
    return null;
  }

  return (
    <div ref={containerRef} className="auth-page">
      <FloatingIcons variant="colorful" iconCount={8} />
      
      {/* Pull to refresh indicator */}
      {isPulling && (
        <div
          className="auth-pull-refresh"
          style={{ opacity: pullProgress }}
        >
          <p className="auth-pull-refresh-text">Release to reset form</p>
        </div>
      )}

      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-header-logo-wrapper">
            <div className="auth-header-logo">
              <LogoIcon className="auth-header-logo-icon" />
            </div>
          </div>
          <h1 className="auth-title">
            Create Your Account
          </h1>
          <p className="auth-description">
            Start managing your contacts efficiently
          </p>
          <p className="auth-swipe-hint">
            ← Swipe left to login
          </p>
        </div>

        <GlassCard
          variant="heavy"
          padding="lg"
          hoverLift
          animate
          className="auth-card"
          style={{ animationDelay: '0.4s' }}
        >
          {successMessage ? (
            <div className="auth-success-message">
              <div
                ref={successAnnouncementRef}
                role="alert"
                aria-live="polite"
                className="sr-only"
                tabIndex={-1}
              >
                {successMessage}
              </div>
              <div className="auth-success-icon-wrapper">
                <div className="auth-success-icon-bg">
                  <SuccessIcon className="auth-success-icon" aria-hidden="true" />
                </div>
              </div>
              <h3 className="auth-success-title">Registration Successful!</h3>
              <p className="auth-success-text">{successMessage}</p>
              <Link href="/login">
                <Button
                  variant="glass-heavy"
                  size="lg"
                  fullWidth
                  className="auth-success-btn"
                  glow
                  animate
                >
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <form ref={formRef} className="auth-form" onSubmit={handleSubmit} noValidate>
                <div
                  ref={errorAnnouncementRef}
                  role="alert"
                  aria-live="assertive"
                  className="sr-only"
                  tabIndex={-1}
                >
                  {errors.general && errors.general}
                </div>

                {errors.general && (
                  <div 
                    className="auth-error-message"
                    role="alert"
                  >
                    <AlertTriangleIcon className="auth-error-message-icon" aria-hidden="true" />
                    <p>{errors.general}</p>
                  </div>
                )}

                <div className="form-field-cascade">
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    label="Full Name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name && touched.name) {
                        setErrors((prev) => ({ ...prev, name: undefined }));
                      }
                    }}
                    onBlur={() => handleBlur('name')}
                    error={touched.name ? errors.name : undefined}
                    placeholder="Jane Doe"
                    disabled={isRegistering}
                    leftIcon={<UsersIcon className="auth-form-icon" />}
                    variant="glass-heavy"
                    animate
                  />
                </div>

                <div className="form-field-cascade">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    label="Email address"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email && touched.email) {
                        setErrors((prev) => ({ ...prev, email: undefined }));
                      }
                    }}
                    onBlur={() => handleBlur('email')}
                    error={touched.email ? errors.email : undefined}
                    placeholder="jane.doe@example.com"
                    disabled={isRegistering}
                    leftIcon={<MailIcon className="auth-form-icon" />}
                    variant="glass-heavy"
                    animate
                  />
                </div>

                <div className="form-field-cascade">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password && touched.password) {
                        setErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    onBlur={() => handleBlur('password')}
                    error={touched.password ? errors.password : undefined}
                    placeholder="8+ characters required"
                    disabled={isRegistering}
                    leftIcon={<LockIcon className="auth-form-icon" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="auth-password-toggle"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOffIcon className="auth-password-toggle-icon" />
                        ) : (
                          <EyeIcon className="auth-password-toggle-icon" />
                        )}
                      </button>
                    }
                    variant="glass-heavy"
                    animate
                  />
                </div>

                <div className="form-field-cascade">
                  <PasswordStrengthIndicator password={password} showRequirements />
                </div>

                <div className="form-field-cascade">
                  <Button
                    type="submit"
                    variant="glass-heavy"
                    size="lg"
                    fullWidth
                    isLoading={isRegistering}
                    disabled={isRegistering}
                    className="auth-submit-btn"
                    glow
                    animate
                  >
                    Sign Up
                  </Button>
                </div>
              </form>
              
              <div className="form-field-cascade">
                <SocialLoginButtons variant="glass" layout="grid" />
              </div>

              <p className="auth-footer form-field-cascade">
                Already have an account?{' '}
                <Link href="/login" className="auth-link">
                  Sign In
                </Link>
              </p>
            </>
          )}
        </GlassCard>
      </div>

      <ParticleEffect trigger={showSuccess} particleCount={40} />
    </div>
  );
};

export default RegisterPage;
