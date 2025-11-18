'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@hooks/useAuth';
import { useAuthSwipe } from '@hooks/useAuthSwipe';
import { LogoIcon, AlertTriangleIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon } from '@components/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Checkbox } from '@components/ui/Checkbox';
import { GlassCard } from '@components/ui/GlassCard';
import { SocialLoginButtons } from '@components/auth/SocialLoginButtons';
import { FloatingIcons } from '@components/ui/FloatingIcons';
import { ParticleEffect } from '@components/ui/ParticleEffect';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const errorAnnouncementRef = useRef<HTMLDivElement>(null);

  // Swipe gesture support
  const { containerRef, isPulling, pullProgress } = useAuthSwipe({
    onSwipeRight: () => {
      router.push('/register');
    },
    onPullDown: () => {
      // Reset form
      setEmail('');
      setPassword('');
      setErrors({});
      setTouched({ email: false, password: false });
    },
    enabled: !isLoggingIn,
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
    if (passwordValue.length < 1) {
      return 'Password cannot be empty';
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
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

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    if (field === 'email') {
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
    setTouched({ email: true, password: true });

    if (!validateForm()) {
      return;
    }

    setIsLoggingIn(true);

    try {
      const result = await login(email.trim(), password);
      
      if (!result.success) {
        const newErrors: FormErrors = {};
        
        if (result.fieldErrors) {
          if (result.fieldErrors.email && result.fieldErrors.email.length > 0) {
            newErrors.email = result.fieldErrors.email[0];
          }
          if (result.fieldErrors.password && result.fieldErrors.password.length > 0) {
            newErrors.password = result.fieldErrors.password[0];
          }
        }
        
        if (result.nonFieldErrors && result.nonFieldErrors.length > 0) {
          newErrors.general = result.nonFieldErrors[0];
        } else if (!newErrors.email && !newErrors.password) {
          newErrors.general = result.message;
        }
        
        setErrors(newErrors);
      } else {
        setShowSuccess(true);
        setEmail('');
        setPassword('');
        setErrors({});
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    } catch (error) {
      console.error('[LOGIN] Unexpected error:', error);
      setErrors({
        general: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoggingIn(false);
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
      <FloatingIcons variant="subtle" iconCount={6} />
      
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
            Welcome Back
          </h1>
          <p className="auth-description">
            Sign in to continue to NexusCRM
          </p>
          <p className="auth-swipe-hint">
            Swipe right to register →
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
                placeholder="admin@nexuscrm.com"
                disabled={isLoggingIn}
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
                autoComplete="current-password"
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
                placeholder="Enter your password"
                disabled={isLoggingIn}
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

            <div className="auth-form-options">
              <Checkbox
                id="remember-me"
                label="Remember me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoggingIn}
              />

              <button 
                type="button" 
                onClick={() => alert('Forgot password functionality is not yet implemented.')} 
                className="auth-forgot-password"
                disabled={isLoggingIn}
              >
                Forgot password?
              </button>
            </div>

            <div className="form-field-cascade">
              <Button
                type="submit"
                variant="glass-heavy"
                size="lg"
                fullWidth
                isLoading={isLoggingIn}
                disabled={isLoggingIn}
                className="auth-submit-btn"
                glow
                animate
              >
                Sign In
              </Button>
            </div>
          </form>
          
          <div className="form-field-cascade">
            <SocialLoginButtons variant="glass" layout="grid" />
          </div>

          <p className="auth-footer form-field-cascade">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="auth-link">
              Sign Up
            </Link>
          </p>
        </GlassCard>
      </div>

      <ParticleEffect trigger={showSuccess} particleCount={30} />
    </div>
  );
};

export default LoginPage;
