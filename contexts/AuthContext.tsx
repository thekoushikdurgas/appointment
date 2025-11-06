"use client"

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/index';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getSession } from '../services/auth';
import { getUserProfile } from '../services/user';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<{success: boolean, message: string}>;
  register: (name: string, email: string, pass: string) => Promise<{success: boolean, message: string}>;
  logout: () => void;
  isLoading: boolean;
  isLoggingOut: boolean;
  refreshUserProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

    // Check the current session once on load.
    getSession().then(async (sessionData) => {
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

    // Set up polling to check session periodically (replaces Supabase's onAuthStateChange)
    const sessionCheckInterval = setInterval(async () => {
      try {
        const sessionData = await getSession();
        if (!sessionData && user) {
          console.log('[AUTH] Session expired. Clearing user state.');
          setUser(null);
        } else if (sessionData && !user) {
          console.log('[AUTH] Session found. Fetching profile.');
          await fetchUserProfile(sessionData.user);
        }
      } catch (error) {
        console.error('[AUTH] Error checking session:', error);
      }
    }, 60000); // Check every minute

    return () => {
      console.log('[AUTH] AuthProvider unmounting. Clearing session check interval.');
      clearInterval(sessionCheckInterval);
    };
  }, [user]); // Include user in dependencies to re-check when user changes

  const refreshUserProfile = async () => {
    console.log('[AUTH] Manual profile refresh triggered.');
    const sessionData = await getSession();
    if (sessionData?.user) {
      await fetchUserProfile(sessionData.user);
      console.log('[AUTH] Profile refresh complete.');
    } else {
      console.log('[AUTH] No session found during manual refresh.');
      setUser(null);
    }
  };

  const login = async (email: string, pass: string): Promise<{success: boolean, message: string}> => {
    console.log(`[AUTH] Attempting login for: ${email}`);
    const result = await apiLogin(email, pass);
    
    if (!result.success) {
      console.error(`[AUTH] Login failed for ${email}:`, result.message);
      return { success: false, message: result.message };
    }
    
    console.log(`[AUTH] Login successful for ${email}. Fetching profile...`);
    
    // Fetch session and profile after successful login
    try {
      const sessionData = await getSession();
      if (sessionData?.user) {
        await fetchUserProfile(sessionData.user);
      }
    } catch (error) {
      console.error('[AUTH] Error fetching profile after login:', error);
    }
    
    return { success: true, message: '' };
  };

  const register = async (name: string, email: string, pass: string): Promise<{success: boolean, message: string}> => {
    console.log(`[AUTH] Attempting registration for: ${email}`);
    const result = await apiRegister(name, email, pass);

    if (!result.success) {
      console.error(`[AUTH] Registration failed for ${email}:`, result.message);
      return { success: false, message: result.message };
    }
    
    console.log('[AUTH] Registration successful. User profile should be created automatically.');
    
    // If registration automatically logs in, fetch profile
    try {
      const sessionData = await getSession();
      if (sessionData?.user) {
        await fetchUserProfile(sessionData.user);
      }
    } catch (error) {
      console.error('[AUTH] Error fetching profile after registration:', error);
    }
    
    return { success: true, message: result.message || 'Registration successful! Please check your email to verify your account.' };
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
