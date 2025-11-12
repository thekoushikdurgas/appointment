'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { LogoIcon, AlertTriangleIcon, ShieldCheckIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon, UsersIcon, SuccessIcon } from '../../../components/icons/IconComponents';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';

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

  // Announce success to screen readers
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
    
    // Clear previous errors and success message
    setErrors({});
    setSuccessMessage('');
    setTouched({ name: true, email: true, password: true });

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsRegistering(true);

    try {
      const result = await register(name.trim(), email.trim(), password);
      
      if (!result.success) {
        const newErrors: FormErrors = {};
        
        // Extract field-specific errors from API response
        if (result.fieldErrors) {
          if (result.fieldErrors.name && result.fieldErrors.name.length > 0) {
            newErrors.name = result.fieldErrors.name[0]; // Show first error for name
          }
          if (result.fieldErrors.email && result.fieldErrors.email.length > 0) {
            newErrors.email = result.fieldErrors.email[0]; // Show first error for email
          }
          if (result.fieldErrors.password && result.fieldErrors.password.length > 0) {
            // Show all password errors (they might be multiple validation issues)
            newErrors.password = result.fieldErrors.password.join('. ');
          }
        }
        
        // Handle non-field errors (e.g., "Must include 'email' and 'password'")
        if (result.nonFieldErrors && result.nonFieldErrors.length > 0) {
          newErrors.general = result.nonFieldErrors[0];
        } else if (!newErrors.name && !newErrors.email && !newErrors.password) {
          // Only set general error if no field-specific errors exist
          newErrors.general = result.message;
        }
        
        setErrors(newErrors);
      } else {
        // Success - show success message
        setSuccessMessage(result.message);
        // Clear form
        setName('');
        setEmail('');
        setPassword('');
        setErrors({});
        setTouched({ name: false, email: false, password: false });
      }
    } catch (error) {
      // Handle unexpected errors
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
          <h1 className="auth-title">Create Your Account</h1>
          <p className="auth-description">
            Start managing your contacts efficiently
          </p>
        </div>
        <Card className="w-full max-w-md shadow-xl animate-fade-in">
          <CardContent>
            {successMessage ? (
              <div className="text-center flex flex-col gap-6 p-6 bg-success/10 rounded-lg border border-success/20 animate-fade-in">
                {/* Screen reader success announcement */}
                <div
                  ref={successAnnouncementRef}
                  role="alert"
                  aria-live="polite"
                  className="visually-hidden"
                  tabIndex={-1}
                >
                  {successMessage}
                </div>
                <div className="flex-center">
                  <div className="p-3 bg-success/20 rounded-full">
                    <SuccessIcon className="w-12 h-12 text-success" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground">Registration Successful!</h3>
                <p className="text-muted-foreground">{successMessage}</p>
                <Link href="/login">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="mt-4"
                  >
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <>
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

                {/* Name field */}
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
                  leftIcon={<UsersIcon className="w-5 h-5" />}
                />

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
                  placeholder="jane.doe@example.com"
                  disabled={isRegistering}
                  leftIcon={<MailIcon className="w-5 h-5" />}
                />

                {/* Password field */}
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
                  helperText="Password must be at least 8 characters long"
                  disabled={isRegistering}
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

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isRegistering}
                  disabled={isRegistering}
                  className="mt-6"
                >
                  Sign Up
                </Button>
              </form>
              
              <p className="auth-footer">
                Already have an account?{' '}
                <Link href="/login" className="auth-link">
                  Sign In
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default RegisterPage;


