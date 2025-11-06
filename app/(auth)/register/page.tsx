'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { LogoIcon, AlertTriangleIcon, ShieldCheckIcon } from '../../../components/icons/IconComponents';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const { register, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }
    setError('');
    setSuccessMessage('');
    setIsRegistering(true);
    const result = await register(name, email, password);
    if (!result.success) {
      setError(result.message);
    } else {
      setSuccessMessage(result.message);
    }
    setIsRegistering(false);
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
          <h1 className="text-3xl font-bold text-card-foreground">Create Your Account</h1>
          <p className="mt-2 text-muted-foreground">Start managing your contacts efficiently.</p>
        </div>

        {successMessage ? (
            <div className="text-center space-y-4 p-4 bg-secondary rounded-lg border border-border">
                <div className="flex justify-center">
                    <ShieldCheckIcon className="w-12 h-12 text-green-500"/>
                </div>
                <h3 className="text-xl font-bold text-card-foreground">Registration Successful!</h3>
                <p className="text-muted-foreground">{successMessage}</p>
                <Link
                    href="/login"
                    className="block w-full py-3 font-semibold text-white text-center transition-colors duration-200 rounded-lg bg-primary-600 hover:bg-primary-700"
                >
                    Back to Sign In
                </Link>
            </div>
        ) : (
          <>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-start p-3 space-x-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertTriangleIcon className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              <div>
                <label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border bg-background border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Jane Doe"
                />
              </div>
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
                  placeholder="jane.doe@example.com"
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border bg-background border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="6+ characters required"
                />
              </div>
              <button
                type="submit"
                disabled={isRegistering}
                className="flex items-center justify-center w-full py-3 font-semibold text-white transition-colors duration-200 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed"
              >
                {isRegistering ? (
                  <svg className="w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Sign Up'}
              </button>
            </form>
            <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary-500 hover:underline">
                    Sign In
                </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;


