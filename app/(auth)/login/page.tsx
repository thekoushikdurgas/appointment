'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { LogoIcon, AlertTriangleIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon } from '../../../components/icons/IconComponents';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Note: rememberMe is currently not used - would need backend support for longer token expiration
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const errorAnnouncementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Announce errors to screen readers
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
    
    // Clear previous errors
    setErrors({});
    setTouched({ email: true, password: true });

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoggingIn(true);

    try {
      const result = await login(email.trim(), password);
      
      if (!result.success) {
        const newErrors: FormErrors = {};
        
        // Extract field-specific errors from API response
        if (result.fieldErrors) {
          if (result.fieldErrors.email && result.fieldErrors.email.length > 0) {
            newErrors.email = result.fieldErrors.email[0]; // Show first error for email
          }
          if (result.fieldErrors.password && result.fieldErrors.password.length > 0) {
            newErrors.password = result.fieldErrors.password[0]; // Show first error for password
          }
        }
        
        // Handle non-field errors (e.g., "Must include 'email' and 'password'")
        if (result.nonFieldErrors && result.nonFieldErrors.length > 0) {
          newErrors.general = result.nonFieldErrors[0];
        } else if (!newErrors.email && !newErrors.password) {
          // Only set general error if no field-specific errors exist
          newErrors.general = result.message;
        }
        
        setErrors(newErrors);
      } else {
        // Success - redirect will happen via useEffect when user state updates
        // Clear form
        setEmail('');
        setPassword('');
        setErrors({});
        router.push('/dashboard');
      }
    } catch (error) {
      // Handle unexpected errors
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
    return null; // Will redirect
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="flex-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <LogoIcon className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
            </div>
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-description">
            Sign in to continue to NexusCRM
          </p>
        </div>
        <Card className="w-full max-w-md shadow-xl animate-fade-in">
          <CardContent>
            <form ref={formRef} className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Screen reader error announcement */}
            <div
              ref={errorAnnouncementRef}
              role="alert"
              aria-live="assertive"
              className="visually-hidden"
              tabIndex={-1}
            >
              {errors.general && errors.general}
            </div>

            {/* General error message */}
            {errors.general && (
              <div 
                className="alert alert-error flex items-start gap-2 animate-slide-up-fade"
                role="alert"
              >
                <AlertTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p>{errors.general}</p>
              </div>
            )}

            {/* Email field */}
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
              leftIcon={<MailIcon className="w-5 h-5" />}
            />

            {/* Password field */}
            <div className="space-y-1">
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
                leftIcon={<LockIcon className="w-5 h-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                }
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
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
                className="text-sm font-medium text-primary hover:underline transition-colors"
                disabled={isLoggingIn}
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoggingIn}
              disabled={isLoggingIn}
              className="mt-6"
            >
              Sign In
            </Button>
          </form>
          
          <p className="auth-footer">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="auth-link">
              Sign Up
            </Link>
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default LoginPage;


