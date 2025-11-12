"use client"

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/index';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getSession, ServiceResponse } from '../services/auth';
import { getUserProfile } from '../services/user';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<ServiceResponse>;
  register: (name: string, email: string, pass: string) => Promise<ServiceResponse>;
  logout: () => void;
  isLoading: boolean;
  isLoggingOut: boolean;
  refreshUserProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  // isLoading is true only during the initial session check on app load.
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchUserProfile = async (sessionUser: any) => {
    console.log(`[AUTH] Fetching profile for user ID: ${sessionUser.id}`);
    try {
      const profile = await getUserProfile(sessionUser);
      
      if (profile) {
        console.log('[AUTH] User profile fetched successfully:', profile);
        setUser(profile);
        console.log('[AUTH] User state successfully set with profile data.');
      } else {
        // No profile found - this shouldn't happen if registration creates profile
        console.error(`[AUTH] CRITICAL: No profile found for user ID: ${sessionUser.id}. Signing out to prevent an inconsistent state.`);
        await apiLogout();
        setUser(null);
      }
    } catch (e: any) {
      console.error("[AUTH] A critical error occurred during profile fetch:", e);
      console.log('[AUTH] Signing out due to profile fetch error.');
      await apiLogout();
      setUser(null);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    console.log('[AUTH] AuthProvider mounted. Checking for initial session.');

    // Check the current session once on load (silent mode to suppress error notifications)
    getSession(true).then(async (sessionData) => {
      console.log(`[AUTH] Initial session fetch complete.`);
      
      if (sessionData?.user) {
        console.log('[AUTH] Active session found. Fetching user profile...');
        await fetchUserProfile(sessionData.user);
      } else {
        console.log('[AUTH] No active session found.');
        setUser(null);
      }
      // Once the initial check is done, we are no longer in the initial loading state.
      setIsLoading(false);
      console.log('[AUTH] Initial auth loading finished.');
    }).catch((error) => {
      console.error('[AUTH] Error fetching initial session:', error);
      setIsLoading(false);
      setUser(null);
    });
  }, []); // Only run once on mount

  // Set up polling to check session periodically (replaces onAuthStateChange pattern)
  // This effect runs separately to avoid re-creating the interval when user changes
  useEffect(() => {
    let isMounted = true;
    
    const sessionCheckInterval = setInterval(async () => {
      if (!isMounted) return;
      
      try {
        // Use silent mode for background checks to suppress error notifications
        const sessionData = await getSession(true);
        // Use a ref-like pattern by checking user state via a closure
        // We'll check the current state by calling setUser with a function
        setUser((currentUser) => {
          if (!sessionData && currentUser) {
            console.log('[AUTH] Session expired. Clearing user state.');
            return null;
          } else if (sessionData && !currentUser) {
            console.log('[AUTH] Session found. Fetching profile.');
            // Fetch profile asynchronously - it will call setUser internally
            fetchUserProfile(sessionData.user).catch((error) => {
              console.error('[AUTH] Error fetching profile during session check:', error);
            });
          }
          return currentUser; // Return current user if no state change needed
        });
      } catch (error) {
        console.error('[AUTH] Error checking session:', error);
      }
    }, 60000); // Check every minute

    return () => {
      isMounted = false;
      console.log('[AUTH] AuthProvider unmounting. Clearing session check interval.');
      clearInterval(sessionCheckInterval);
    };
  }, []); // Only set up interval once on mount

  const refreshUserProfile = async () => {
    console.log('[AUTH] Manual profile refresh triggered.');
    try {
      const sessionData = await getSession();
      if (sessionData?.user) {
        await fetchUserProfile(sessionData.user);
        console.log('[AUTH] Profile refresh complete.');
      } else {
        console.log('[AUTH] No session found during manual refresh.');
        setUser(null);
      }
    } catch (error) {
      console.error('[AUTH] Error during manual profile refresh:', error);
      // Don't clear user on error - might be temporary network issue
    }
  };

  const login = async (email: string, pass: string): Promise<ServiceResponse> => {
    console.log(`[AUTH] Attempting login for: ${email}`);
    const result = await apiLogin(email, pass);
    
    if (!result.success) {
      console.error(`[AUTH] Login failed for ${email}:`, result.message);
      return result; // Return full ServiceResponse with fieldErrors and nonFieldErrors
    }
    
    console.log(`[AUTH] Login successful for ${email}. Fetching profile...`);
    
    // Fetch session and profile after successful login
    try {
      const sessionData = await getSession();
      if (sessionData?.user) {
        await fetchUserProfile(sessionData.user);
      } else {
        console.warn('[AUTH] Login succeeded but no session data available. Profile will be fetched on next session check.');
      }
    } catch (error) {
      console.error('[AUTH] Error fetching profile after login:', error);
      // Don't fail login if profile fetch fails - tokens are stored, profile can be fetched later
      // Return success but log the error
    }
    
    return result; // Return full ServiceResponse
  };

  const register = async (name: string, email: string, pass: string): Promise<ServiceResponse> => {
    console.log(`[AUTH] Attempting registration for: ${email}`);
    const result = await apiRegister(name, email, pass);

    if (!result.success) {
      console.error(`[AUTH] Registration failed for ${email}:`, result.message);
      return result; // Return full ServiceResponse with fieldErrors and nonFieldErrors
    }
    
    console.log('[AUTH] Registration successful. User profile should be created automatically.');
    
    // If registration automatically logs in, fetch profile
    try {
      const sessionData = await getSession();
      if (sessionData?.user) {
        await fetchUserProfile(sessionData.user);
      } else {
        console.log('[AUTH] Registration succeeded but no session data available. This is normal if email verification is required.');
      }
    } catch (error) {
      console.error('[AUTH] Error fetching profile after registration:', error);
      // Don't fail registration if profile fetch fails - registration was successful
    }
    
    return result; // Return full ServiceResponse
  };

  const logout = () => {
    console.log('[AUTH] User initiated logout.');
    setIsLoggingOut(true);

    apiLogout().then(() => {
      console.log('[AUTH] Logout complete. Clearing user state.');
      setUser(null);
      // Delay turning off the loading screen to make the transition smooth.
      setTimeout(() => {
        console.log('[AUTH] Logout transition complete.');
        setIsLoggingOut(false);
      }, 1500);
    }).catch((error) => {
      console.error('[AUTH] Error during sign out:', error);
      setUser(null);
      setIsLoggingOut(false);
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, isLoggingOut, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
