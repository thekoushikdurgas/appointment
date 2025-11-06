'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { LogoIcon, AlertTriangleIcon } from '../../../components/icons/IconComponents';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.message);
      setIsLoggingIn(false);
    } else {
      // Redirect will happen via useEffect when user state updates
      router.push('/dashboard');
    }
  };

  if (isLoading) {
    return null;
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-2xl shadow-2xl border border-border">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <LogoIcon className="w-16 h-16 text-primary-500" />
          </div>
          <h1 className="text-3xl font-bold text-card-foreground">Welcome Back</h1>
          <p className="mt-2 text-muted-foreground">Sign in to continue to NexusCRM.</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-start p-3 space-x-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangleIcon className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          <div>
            <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border bg-background border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="admin@nexuscrm.com"
            />
          </div>
          <div>
            <label htmlFor="password"className="text-sm font-medium text-muted-foreground">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border bg-background border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="any password for demo"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-border rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <button type="button" onClick={() => alert('Forgot password functionality is not yet implemented.')} className="font-medium text-primary-500 hover:underline">
                Forgot your password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="flex items-center justify-center w-full py-3 font-semibold text-white transition-colors duration-200 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <>
                <svg className="w-5 h-5 mr-2 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing In...</span>
              </>
            ) : 'Sign In'}
          </button>
        </form>
         <p className="text-sm text-center text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-primary-500 hover:underline">
                Sign Up
            </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;


